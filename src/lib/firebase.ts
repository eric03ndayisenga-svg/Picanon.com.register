import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  UserAccount,
  RechargeRequest,
  WithdrawRequest,
  RedemptionCode,
  AdminSettings,
  InvestmentRecord,
  Transaction,
} from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationTypeValue = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationTypeValue;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationTypeValue,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export async function signInAdminWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (user.emailVerified && user.email === 'eric03ndayisenga@gmail.com') {
    const adminPath = `admins/${user.uid}`;
    try {
      const existingAdmin = await getDoc(doc(db, 'admins', user.uid));
      const existingCreatedAt = existingAdmin.exists()
        ? existingAdmin.data()?.createdAt
        : undefined;
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        phone: '0793002388',
        role: 'admin',
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, adminPath);
    }
  }
  return user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

const sanitizeDocId = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128) || `doc_${Date.now()}`;

interface ExistingDocMeta {
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  status?: string;
}

async function getExistingCollectionMeta(
  colName: string
): Promise<Map<string, ExistingDocMeta>> {
  const map = new Map<string, ExistingDocMeta>();
  try {
    const snap = await getDocs(collection(db, colName));
    for (const d of snap.docs) {
      const data = d.data();
      map.set(d.id, {
        createdAt: data.createdAt || serverTimestamp(),
        status: typeof data.status === 'string' ? data.status : undefined,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
  return map;
}

async function commitOperationsInChunks(
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>
): Promise<void> {
  const CHUNK_SIZE = 380;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) op(batch);
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        'users/investments/transactions/recharges/withdrawals/redemptionCodes/settings'
      );
    }
  }
}

export async function syncAdminBackupToFirestore(payload: {
  allUsers: UserAccount[];
  investments?: InvestmentRecord[];
  transactions?: Transaction[];
  rechargeRequests: RechargeRequest[];
  withdrawRequests: WithdrawRequest[];
  redemptionCodes: RedemptionCode[];
  adminSettings: AdminSettings;
}): Promise<{ syncedUsers: number; syncedRequests: number; syncedInvestments: number }> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) {
    throw new Error('Google Admin sign-in required for Firestore cloud sync.');
  }

  const ownerUid = current.uid;

  const [
    existingUsers,
    existingInvestments,
    existingTransactions,
    existingRecharges,
    existingWithdrawals,
    existingCodes,
    existingGlobalSettings,
  ] = await Promise.all([
    getExistingCollectionMeta('users'),
    getExistingCollectionMeta('investments'),
    getExistingCollectionMeta('transactions'),
    getExistingCollectionMeta('recharges'),
    getExistingCollectionMeta('withdrawals'),
    getExistingCollectionMeta('redemptionCodes'),
    getDoc(doc(db, 'settings', 'global')).catch((error) =>
      handleFirestoreError(error, OperationType.GET, 'settings/global')
    ),
  ]);

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const u of payload.allUsers.slice(0, 300)) {
    const id = sanitizeDocId(u.id);
    const meta = existingUsers.get(id);
    ops.push((batch) => {
      batch.set(doc(db, 'users', id), {
        id,
        ownerUid,
        phone: u.phone.slice(0, 24),
        balance: Math.max(0, Number(u.balance) || 0),
        totalIncome: Math.max(0, Number(u.totalIncome) || 0),
        totalWithdrawn: Math.max(0, Number(u.totalWithdrawn) || 0),
        totalRecharged: Math.max(0, Number(u.totalRecharged) || 0),
        vipLevel: Math.min(10, Math.max(0, Math.round(Number(u.vipLevel) || 0))),
        referralCode: (u.referralCode || 'PIC000000').slice(0, 32),
        ...(u.referredBy ? { referredBy: u.referredBy.slice(0, 32) } : {}),
        isAdmin: Boolean(u.isAdmin),
        isBanned: Boolean(u.isBanned),
        teamCountLevel1: Math.max(0, Math.round(Number(u.teamCountLevel1) || 0)),
        teamCountLevel2: Math.max(0, Math.round(Number(u.teamCountLevel2) || 0)),
        teamCountLevel3: Math.max(0, Math.round(Number(u.teamCountLevel3) || 0)),
        teamCommission: Math.max(0, Number(u.teamCommission) || 0),
        freeSpins: Math.max(0, Math.round(Number(u.freeSpins) || 0)),
        hasClaimedWelcomeBonus: Boolean(u.hasClaimedWelcomeBonus),
        ...(u.lastCheckInDate ? { lastCheckInDate: u.lastCheckInDate.slice(0, 32) } : {}),
        ...(u.payoutMethod ? { payoutMethod: u.payoutMethod } : {}),
        ...(u.payoutPhone ? { payoutPhone: u.payoutPhone.slice(0, 24) } : {}),
        ...(u.payoutName ? { payoutName: u.payoutName.slice(0, 64) } : {}),
        createdAtText: (u.createdAt || new Date().toISOString().split('T')[0]).slice(0, 32),
        createdAt: meta?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  const investmentsList = payload.investments || [];
  for (const inv of investmentsList.slice(0, 300)) {
    const id = sanitizeDocId(inv.id);
    const meta = existingInvestments.get(id);
    ops.push((batch) => {
      batch.set(doc(db, 'investments', id), {
        id,
        ownerUid,
        userId: sanitizeDocId(inv.userId || 'unknown_user'),
        productId: (inv.productId || 'vip-0').slice(0, 64),
        vipLevel: Math.min(10, Math.max(0, Math.round(Number(inv.vipLevel) || 0))),
        amountInvested: Math.max(0, Number(inv.amountInvested ?? inv.amount) || 0),
        dailyIncome: Math.max(0, Number(inv.dailyIncome) || 0),
        cycleDays: Math.min(365, Math.max(1, Math.round(Number(inv.cycleDays) || 40))),
        daysRemaining: Math.min(365, Math.max(0, Math.round(Number(inv.daysRemaining) || 0))),
        status: inv.status === 'completed' ? 'completed' : 'active',
        ...(inv.productName ? { productName: inv.productName.slice(0, 128) } : {}),
        totalIncomeEarned: Math.max(0, Number(inv.totalIncomeEarned) || 0),
        ...(inv.datePurchased ? { datePurchased: inv.datePurchased.slice(0, 32) } : {}),
        ...(typeof inv.lastClaimAt === 'number'
          ? { lastClaimAt: Math.round(inv.lastClaimAt) }
          : {}),
        createdAt: meta?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  const transactionsList = payload.transactions || [];
  for (const tx of transactionsList.slice(0, 300)) {
    const id = sanitizeDocId(tx.id);
    const meta = existingTransactions.get(id);
    ops.push((batch) => {
      batch.set(doc(db, 'transactions', id), {
        id,
        ownerUid,
        userId: sanitizeDocId(tx.userId || 'unknown_user'),
        ...(tx.requestId ? { requestId: sanitizeDocId(tx.requestId) } : {}),
        type: (tx.type || 'task_earning').slice(0, 32),
        amount: Math.max(0, Number(tx.amount) || 0),
        status:
          tx.status === 'pending' || tx.status === 'rejected' ? tx.status : 'completed',
        timestampText: (tx.timestamp || '').slice(0, 64),
        description: (tx.description || 'Transaction').slice(0, 240),
        createdAt: meta?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  for (const r of payload.rechargeRequests.slice(0, 300)) {
    const id = sanitizeDocId(r.id);
    const meta = existingRecharges.get(id);
    // Respect Firestore terminal state lock: finalized docs cannot be rewritten
    if (meta && meta.status && meta.status !== 'pending') {
      continue;
    }
    if (meta && meta.status === r.status) {
      continue;
    }
    ops.push((batch) => {
      if (meta) {
        batch.update(doc(db, 'recharges', id), {
          status: r.status,
          ...(r.note ? { note: r.note.slice(0, 200) } : {}),
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(doc(db, 'recharges', id), {
          id,
          ownerUid,
          userId: sanitizeDocId(r.userId),
          userPhone: r.userPhone.slice(0, 24),
          amount: Math.max(1000, Number(r.amount) || 1000),
          paymentMethod: r.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
          transactionId: (r.transactionId || 'TXN').slice(0, 64),
          senderPhone: (r.senderPhone || r.userPhone).slice(0, 24),
          status: r.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  for (const w of payload.withdrawRequests.slice(0, 300)) {
    const id = sanitizeDocId(w.id);
    const meta = existingWithdrawals.get(id);
    if (meta && meta.status && meta.status !== 'pending') {
      continue;
    }
    if (meta && meta.status === w.status) {
      continue;
    }
    ops.push((batch) => {
      if (meta) {
        batch.update(doc(db, 'withdrawals', id), {
          status: w.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(doc(db, 'withdrawals', id), {
          id,
          ownerUid,
          userId: sanitizeDocId(w.userId),
          userPhone: w.userPhone.slice(0, 24),
          amount: Math.max(1000, Number(w.amount) || 1000),
          fee: Math.max(0, Number(w.fee) || 0),
          netAmount: Math.max(0, Number(w.netAmount) || 0),
          paymentMethod: w.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
          recipientPhone: w.recipientPhone.slice(0, 24),
          recipientName: (w.recipientName || 'Member').slice(0, 64),
          status: w.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  for (const c of payload.redemptionCodes.slice(0, 100)) {
    const id = sanitizeDocId(c.id);
    const meta = existingCodes.get(id);
    ops.push((batch) => {
      if (meta) {
        batch.update(doc(db, 'redemptionCodes', id), {
          isActive: Boolean(c.isActive),
          usedCount: Math.max(0, Math.round(Number(c.usedCount) || 0)),
          ...(c.maxUses ? { maxUses: Math.round(Number(c.maxUses)) } : {}),
          amount: Math.max(1, Number(c.amount) || 100),
          descriptionRw: (c.descriptionRw || '').slice(0, 200),
          descriptionEn: (c.descriptionEn || '').slice(0, 200),
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(doc(db, 'redemptionCodes', id), {
          id,
          code: c.code.slice(0, 32),
          amount: Math.max(1, Number(c.amount) || 100),
          ...(c.maxUses ? { maxUses: Math.round(Number(c.maxUses)) } : {}),
          usedCount: Math.max(0, Math.round(Number(c.usedCount) || 0)),
          isActive: Boolean(c.isActive),
          descriptionRw: (c.descriptionRw || '').slice(0, 200),
          descriptionEn: (c.descriptionEn || '').slice(0, 200),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  const settingsCreatedAt = existingGlobalSettings.exists()
    ? existingGlobalSettings.data()?.createdAt || serverTimestamp()
    : serverTimestamp();

  ops.push((batch) => {
    batch.set(doc(db, 'settings', 'global'), {
      mtnNumber: payload.adminSettings.mtnNumber.slice(0, 24),
      airtelNumber: payload.adminSettings.airtelNumber.slice(0, 24),
      mtnName: (payload.adminSettings.mtnName || '').slice(0, 80),
      airtelName: (payload.adminSettings.airtelName || '').slice(0, 80),
      minDeposit: Math.max(100, Number(payload.adminSettings.minDeposit) || 1000),
      minWithdrawal: Math.max(100, Number(payload.adminSettings.minWithdrawal) || 1000),
      withdrawalFeePercent: Math.min(
        100,
        Math.max(0, Number(payload.adminSettings.withdrawalFeePercent ?? 10))
      ),
      broadcastMessage: payload.adminSettings.broadcastMessage.slice(0, 500),
      telegramGroup: (payload.adminSettings.telegramGroup || '').slice(0, 160),
      telegramSupport: (payload.adminSettings.telegramSupport || '').slice(0, 160),
      telegramChannel: (payload.adminSettings.telegramChannel || '').slice(0, 160),
      whatsappSupport: (payload.adminSettings.whatsappSupport || '').slice(0, 160),
      createdAt: settingsCreatedAt,
      updatedAt: serverTimestamp(),
    });
  });

  await commitOperationsInChunks(ops);

  return {
    syncedUsers: payload.allUsers.length,
    syncedRequests: payload.rechargeRequests.length + payload.withdrawRequests.length,
    syncedInvestments: investmentsList.length,
  };
}

export interface FirestoreCloudState {
  users: UserAccount[];
  investments: InvestmentRecord[];
  transactions: Transaction[];
  recharges: RechargeRequest[];
  withdrawals: WithdrawRequest[];
  redemptionCodes: RedemptionCode[];
  settings: Partial<AdminSettings> | null;
}

export async function loadFullStateFromFirestore(): Promise<FirestoreCloudState> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) {
    throw new Error('Google Admin sign-in required to load Firebase Cloud DB.');
  }

  const readCol = async (name: string) => {
    try {
      return await getDocs(collection(db, name));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, name);
    }
  };

  const [
    usersSnap,
    invSnap,
    txSnap,
    recSnap,
    wthSnap,
    codeSnap,
    settingsSnap,
  ] = await Promise.all([
    readCol('users'),
    readCol('investments'),
    readCol('transactions'),
    readCol('recharges'),
    readCol('withdrawals'),
    readCol('redemptionCodes'),
    getDoc(doc(db, 'settings', 'global')).catch((error) =>
      handleFirestoreError(error, OperationType.GET, 'settings/global')
    ),
  ]);

  const users: UserAccount[] = usersSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      phone: String(data.phone || ''),
      balance: Number(data.balance || 0),
      totalIncome: Number(data.totalIncome || 0),
      totalWithdrawn: Number(data.totalWithdrawn || 0),
      totalRecharged: Number(data.totalRecharged || 0),
      vipLevel: Number(data.vipLevel || 0),
      referralCode: String(data.referralCode || `PIC${String(data.phone || '').slice(-6)}`),
      referredBy: typeof data.referredBy === 'string' ? data.referredBy : undefined,
      teamCountLevel1: Number(data.teamCountLevel1 || 0),
      teamCountLevel2: Number(data.teamCountLevel2 || 0),
      teamCountLevel3: Number(data.teamCountLevel3 || 0),
      teamCommission: Number(data.teamCommission || 0),
      freeSpins: Number(data.freeSpins ?? 2),
      hasClaimedWelcomeBonus: Boolean(data.hasClaimedWelcomeBonus ?? true),
      lastCheckInDate: typeof data.lastCheckInDate === 'string' ? data.lastCheckInDate : undefined,
      payoutMethod:
        data.payoutMethod === 'airtel'
          ? 'airtel'
          : data.payoutMethod === 'mtn'
            ? 'mtn'
            : undefined,
      payoutPhone: typeof data.payoutPhone === 'string' ? data.payoutPhone : undefined,
      payoutName: typeof data.payoutName === 'string' ? data.payoutName : undefined,
      isAdmin: Boolean(data.isAdmin),
      isBanned: Boolean(data.isBanned),
      createdAt:
        typeof data.createdAtText === 'string' && data.createdAtText
          ? data.createdAtText
          : new Date().toISOString().split('T')[0],
      redeemedCodes: [],
    };
  });

  const investments: InvestmentRecord[] = invSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      userId: String(data.userId || ''),
      productId: String(data.productId || 'vip-0'),
      productName: String(data.productName || `VIP ${data.vipLevel || 0}`),
      vipLevel: Number(data.vipLevel || 0),
      amount: Number(data.amountInvested || 0),
      amountInvested: Number(data.amountInvested || 0),
      dailyIncome: Number(data.dailyIncome || 0),
      cycleDays: Number(data.cycleDays || 40),
      daysRemaining: Number(data.daysRemaining || 0),
      totalIncomeEarned: Number(data.totalIncomeEarned || 0),
      datePurchased:
        typeof data.datePurchased === 'string'
          ? data.datePurchased
          : new Date().toISOString().split('T')[0],
      status: data.status === 'completed' ? 'completed' : 'active',
      lastClaimAt: typeof data.lastClaimAt === 'number' ? data.lastClaimAt : undefined,
    };
  });

  const transactions: Transaction[] = txSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      userId: String(data.userId || ''),
      requestId: typeof data.requestId === 'string' ? data.requestId : undefined,
      type: String(data.type || 'task_earning') as Transaction['type'],
      amount: Number(data.amount || 0),
      status:
        data.status === 'pending' || data.status === 'rejected'
          ? data.status
          : 'completed',
      timestamp:
        typeof data.timestampText === 'string' && data.timestampText
          ? data.timestampText
          : new Date().toLocaleString('en-GB'),
      description: String(data.description || ''),
    };
  });

  const recharges: RechargeRequest[] = recSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      userId: String(data.userId || ''),
      userPhone: String(data.userPhone || ''),
      amount: Number(data.amount || 0),
      paymentMethod: data.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
      transactionId: String(data.transactionId || ''),
      senderPhone: String(data.senderPhone || ''),
      timestamp: new Date().toLocaleString('en-GB'),
      status:
        data.status === 'approved' || data.status === 'rejected'
          ? data.status
          : 'pending',
      note: typeof data.note === 'string' ? data.note : undefined,
    };
  });

  const withdrawals: WithdrawRequest[] = wthSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      userId: String(data.userId || ''),
      userPhone: String(data.userPhone || ''),
      amount: Number(data.amount || 0),
      fee: Number(data.fee || 0),
      netAmount: Number(data.netAmount || 0),
      paymentMethod: data.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
      recipientPhone: String(data.recipientPhone || ''),
      recipientName: String(data.recipientName || ''),
      timestamp: new Date().toLocaleString('en-GB'),
      status:
        data.status === 'approved' || data.status === 'rejected'
          ? data.status
          : 'pending',
    };
  });

  const redemptionCodes: RedemptionCode[] = codeSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id || d.id),
      code: String(data.code || ''),
      amount: Number(data.amount || 0),
      maxUses: typeof data.maxUses === 'number' ? data.maxUses : undefined,
      usedCount: Number(data.usedCount || 0),
      isActive: Boolean(data.isActive),
      descriptionRw: String(data.descriptionRw || ''),
      descriptionEn: String(data.descriptionEn || ''),
      createdAt: new Date().toISOString().split('T')[0],
    };
  });

  const settings: Partial<AdminSettings> | null = settingsSnap.exists()
    ? {
        mtnNumber: String(settingsSnap.data().mtnNumber || '0793002388'),
        airtelNumber: String(settingsSnap.data().airtelNumber || '0793002388'),
        mtnName:
          typeof settingsSnap.data().mtnName === 'string'
            ? settingsSnap.data().mtnName
            : undefined,
        airtelName:
          typeof settingsSnap.data().airtelName === 'string'
            ? settingsSnap.data().airtelName
            : undefined,
        minDeposit: Number(settingsSnap.data().minDeposit || 1000),
        minWithdrawal: Number(settingsSnap.data().minWithdrawal || 1000),
        withdrawalFeePercent: Number(settingsSnap.data().withdrawalFeePercent ?? 10),
        broadcastMessage: String(settingsSnap.data().broadcastMessage || ''),
        telegramGroup:
          typeof settingsSnap.data().telegramGroup === 'string'
            ? settingsSnap.data().telegramGroup.trim().toLowerCase() === 'https://t.me/picanonrw'
              ? 'https://t.me/picanonrw1'
              : settingsSnap.data().telegramGroup
            : undefined,
        telegramSupport:
          typeof settingsSnap.data().telegramSupport === 'string'
            ? settingsSnap.data().telegramSupport
            : undefined,
        telegramChannel:
          typeof settingsSnap.data().telegramChannel === 'string'
            ? settingsSnap.data().telegramChannel
            : undefined,
        whatsappSupport:
          typeof settingsSnap.data().whatsappSupport === 'string'
            ? settingsSnap.data().whatsappSupport
            : undefined,
      }
    : null;

  return {
    users,
    investments,
    transactions,
    recharges,
    withdrawals,
    redemptionCodes,
    settings,
  };
}

export async function fetchAdminBackupCountFromFirestore(): Promise<number> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function clearFirestoreRecordsBackup(includeUsers = false): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return;

  const collectionsToClear = includeUsers
    ? ['recharges', 'withdrawals', 'investments', 'transactions', 'users']
    : ['recharges', 'withdrawals', 'transactions'];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) continue;
      const docsToDelete = snap.docs.filter(
        (docSnap) => !(colName === 'users' && docSnap.id === 'admin-0793002388')
      );
      for (let i = 0; i < docsToDelete.length; i += 380) {
        const batch = writeBatch(db);
        for (const docSnap of docsToDelete.slice(i, i + 380)) {
          batch.delete(docSnap.ref);
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, colName);
    }
  }
}
