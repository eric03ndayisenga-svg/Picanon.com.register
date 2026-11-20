import React, { useState, useEffect, useCallback } from 'react';
import {
  auth,
  clearFirestoreRecordsBackup,
  syncAdminBackupToFirestore,
  type FirestoreCloudState,
} from './lib/firebase';
import {
  UserAccount,
  VIPProduct,
  RechargeRequest,
  WithdrawRequest,
  AdminSettings,
  RedemptionCode,
  Transaction,
  InvestmentRecord,
  LiveActivityItem,
  TeamMemberSummary,
  Language,
} from './types';
import {
  INITIAL_VIP_PRODUCTS,
  INITIAL_RECHARGES,
  INITIAL_WITHDRAWALS,
  DEFAULT_ADMIN_SETTINGS,
  INITIAL_REDEMPTION_CODES,
  ADMIN_USER,
} from './data/mockData';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { ProductsView } from './components/ProductsView';
import { TasksView } from './components/TasksView';
import { TeamView } from './components/TeamView';
import { ProfileView } from './components/ProfileView';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { RedemptionCodeModal } from './components/RedemptionCodeModal';
import { WelcomeBonusModal } from './components/WelcomeBonusModal';
import { NoticeAnnouncementModal } from './components/NoticeAnnouncementModal';
import { SupportModal } from './components/SupportModal';
import { LiveChatModal } from './components/LiveChatModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { AboutModal } from './components/AboutModal';
import { PicanonModal } from './components/PicanonModal';
import { extractInviteFromLocation } from './utils/inviteLink';
import {
  getSavedAccounts,
  updateSavedAccountSnapshot,
  purgeSavedAccountsOlderThan,
  normalizeRwandaPhone,
} from './utils/savedAccounts';
import { Headphones, CheckCircle2 } from 'lucide-react';

function mergeProductImages(serverProducts: VIPProduct[]): VIPProduct[] {
  const imageById = new Map(INITIAL_VIP_PRODUCTS.map((p) => [p.id, p.image]));
  return serverProducts.map((p) => ({
    ...p,
    image: p.image || imageById.get(p.id),
  }));
}

const FRESH_RESET_KEY = 'picanon_fresh_v5';

function ensureFreshBrowserState() {
  try {
    if (typeof window !== 'undefined' && !localStorage.getItem(FRESH_RESET_KEY)) {
      const keysToClear = [
        'tv_user',
        'tv_admin_token',
        'tv_all_users',
        'tv_recharges',
        'tv_withdrawals',
        'tv_investments',
        'tv_transactions',
        'tv_team_members',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(FRESH_RESET_KEY, '1');
    }
  } catch {
    // ignore storage errors
  }
}

ensureFreshBrowserState();

export function App() {
  const getStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = getStored<UserAccount | null>('tv_user', null);
    if (saved && saved.phone === '0793002388') {
      return { ...saved, ...ADMIN_USER, isAdmin: true };
    }
    return saved;
  });

  const [adminToken, setAdminToken] = useState<string>(() =>
    getStored<string>('tv_admin_token', '')
  );

  const [userToken, setUserToken] = useState<string>(() =>
    getStored<string>('tv_user_token', '')
  );

  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    const saved = getStored<UserAccount[]>('tv_all_users', [ADMIN_USER]);
    if (Array.isArray(saved)) {
      const hasAdmin = saved.some((u) => u.phone === '0793002388');
      if (!hasAdmin) {
        const withAdmin = [ADMIN_USER, ...saved];
        localStorage.setItem('tv_all_users', JSON.stringify(withAdmin));
        return withAdmin;
      }
      return saved;
    }
    return [ADMIN_USER];
  });

  const [{ code: initialInviteCode, hasExplicitInvite }] = useState(() =>
    extractInviteFromLocation()
  );

  const [initialPhone] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('account') || params.get('phone') || '';
    } catch {
      return '';
    }
  });

  const [products, setProducts] = useState<VIPProduct[]>(() => {
    const saved = getStored('tv_products', INITIAL_VIP_PRODUCTS);
    const savedVip0 = Array.isArray(saved)
      ? saved.find((p: VIPProduct) => p.vipLevel === 0)
      : undefined;
    const savedVip10 = Array.isArray(saved)
      ? saved.find((p: VIPProduct) => p.vipLevel === 10)
      : undefined;

    if (
      !Array.isArray(saved) ||
      saved.length !== INITIAL_VIP_PRODUCTS.length ||
      saved.some((p: VIPProduct) => !p.nameEn?.includes('Picanon')) ||
      !savedVip0 ||
      savedVip0.dailyIncome !== INITIAL_VIP_PRODUCTS[0].dailyIncome ||
      !savedVip10 ||
      savedVip10.image !== INITIAL_VIP_PRODUCTS[10].image
    ) {
      localStorage.setItem('tv_products', JSON.stringify(INITIAL_VIP_PRODUCTS));
      return INITIAL_VIP_PRODUCTS;
    }
    return mergeProductImages(saved);
  });

  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>(() =>
    getStored('tv_recharges', INITIAL_RECHARGES)
  );
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(() =>
    getStored('tv_withdrawals', INITIAL_WITHDRAWALS)
  );
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const saved = getStored('tv_admin_settings', DEFAULT_ADMIN_SETTINGS);
    const isLegacyLink = (v?: string) => !v || /teravolt/i.test(v);
    const isOldGroupLink = (v?: string) =>
      !v || /teravolt/i.test(v) || v.trim().toLowerCase() === 'https://t.me/picanonrw';
    if (
      isOldGroupLink(saved.telegramGroup) ||
      isLegacyLink(saved.telegramSupport) ||
      isLegacyLink(saved.telegramChannel) ||
      !saved.mtnNumber ||
      !saved.airtelNumber ||
      !saved.mtnName?.includes('Picanon') ||
      !saved.broadcastMessage ||
      /teravolt/i.test(saved.broadcastMessage) ||
      saved.minDeposit === 3000 ||
      saved.withdrawalFeePercent === 17
    ) {
      const updated = {
        ...DEFAULT_ADMIN_SETTINGS,
        ...saved,
        telegramGroup: isOldGroupLink(saved.telegramGroup)
          ? DEFAULT_ADMIN_SETTINGS.telegramGroup
          : saved.telegramGroup,
        telegramSupport: isLegacyLink(saved.telegramSupport)
          ? DEFAULT_ADMIN_SETTINGS.telegramSupport
          : saved.telegramSupport,
        telegramChannel: isLegacyLink(saved.telegramChannel)
          ? DEFAULT_ADMIN_SETTINGS.telegramChannel
          : saved.telegramChannel,
        mtnNumber: saved.mtnNumber || DEFAULT_ADMIN_SETTINGS.mtnNumber,
        airtelNumber: saved.airtelNumber || DEFAULT_ADMIN_SETTINGS.airtelNumber,
        mtnName: saved.mtnName?.includes('Picanon') ? saved.mtnName : DEFAULT_ADMIN_SETTINGS.mtnName,
        broadcastMessage:
          !saved.broadcastMessage || /teravolt/i.test(saved.broadcastMessage)
            ? DEFAULT_ADMIN_SETTINGS.broadcastMessage
            : saved.broadcastMessage,
        minDeposit:
          saved.minDeposit === 3000 || !saved.minDeposit
            ? DEFAULT_ADMIN_SETTINGS.minDeposit
            : saved.minDeposit,
        withdrawalFeePercent:
          saved.withdrawalFeePercent === 17 || saved.withdrawalFeePercent == null
            ? DEFAULT_ADMIN_SETTINGS.withdrawalFeePercent
            : saved.withdrawalFeePercent,
      };
      localStorage.setItem('tv_admin_settings', JSON.stringify(updated));
      return updated;
    }
    return saved;
  });

  const [redemptionCodes, setRedemptionCodes] = useState<RedemptionCode[]>(() => {
    const saved = getStored('tv_redemption_codes', INITIAL_REDEMPTION_CODES);
    if (Array.isArray(saved) && saved.some((c: RedemptionCode) => !c.code?.startsWith('PICANON-'))) {
      localStorage.setItem('tv_redemption_codes', JSON.stringify(INITIAL_REDEMPTION_CODES));
      return INITIAL_REDEMPTION_CODES;
    }
    return saved;
  });

  const [activeInvestments, setActiveInvestments] = useState<InvestmentRecord[]>(() =>
    getStored('tv_investments', [])
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getStored('tv_transactions', [])
  );

  const [language, setLanguage] = useState<Language>(() =>
    getStored('tv_language', 'en')
  );
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState<boolean>(false);
  const [isGiftCodeOpen, setIsGiftCodeOpen] = useState<boolean>(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);
  const [isWelcomeBonusOpen, setIsWelcomeBonusOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [profileRecordsSignal, setProfileRecordsSignal] = useState<number>(0);
  const [liveActivity, setLiveActivity] = useState<LiveActivityItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>(() =>
    getStored('tv_team_members', [])
  );
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('tv_user', JSON.stringify(currentUser));
    else localStorage.removeItem('tv_user');
  }, [currentUser]);

  useEffect(() => {
    if (adminToken) localStorage.setItem('tv_admin_token', JSON.stringify(adminToken));
    else localStorage.removeItem('tv_admin_token');
  }, [adminToken]);

  useEffect(() => {
    if (userToken) localStorage.setItem('tv_user_token', JSON.stringify(userToken));
    else localStorage.removeItem('tv_user_token');
  }, [userToken]);

  useEffect(() => {
    localStorage.setItem('tv_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('tv_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('tv_recharges', JSON.stringify(rechargeRequests));
  }, [rechargeRequests]);

  useEffect(() => {
    localStorage.setItem('tv_withdrawals', JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  useEffect(() => {
    localStorage.setItem('tv_admin_settings', JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem('tv_redemption_codes', JSON.stringify(redemptionCodes));
  }, [redemptionCodes]);

  useEffect(() => {
    localStorage.setItem('tv_investments', JSON.stringify(activeInvestments));
  }, [activeInvestments]);

  useEffect(() => {
    localStorage.setItem('tv_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('tv_language', JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem('tv_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Fetch public bootstrap settings & products from server on mount
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.settings) setAdminSettings(data.settings);
        if (Array.isArray(data.products)) {
          setProducts(mergeProductImages(data.products));
        }
      })
      .catch(() => {});
  }, []);

  const getUserAuthHeaders = useCallback(
    (includeJson = true): Record<string, string> => {
      const headers: Record<string, string> = {};
      if (includeJson) headers['Content-Type'] = 'application/json';
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
        headers['x-user-token'] = userToken;
      }
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
      }
      return headers;
    },
    [userToken, adminToken]
  );

  const fetchLiveActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/live-activity');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setLiveActivity(data.items);
      }
    } catch {
      // ignore offline
    }
  }, []);

  const applyUserSyncPayload = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') return;
      if (data.user) {
        setCurrentUser(data.user);
        updateSavedAccountSnapshot(data.user);
      }
      if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
      if (Array.isArray(data.teamMembers)) setTeamMembers(data.teamMembers);
      if (Array.isArray(data.recharges)) {
        setRechargeRequests((prev) => {
          if (!adminToken) return data.recharges as RechargeRequest[];
          const incoming = new Map((data.recharges as RechargeRequest[]).map((r) => [r.id, r]));
          const merged = prev.map((r) => incoming.get(r.id) || r);
          for (const r of data.recharges as RechargeRequest[]) {
            if (!merged.some((m) => m.id === r.id)) merged.unshift(r);
          }
          return merged;
        });
      }
      if (Array.isArray(data.withdrawals)) {
        setWithdrawRequests((prev) => {
          if (!adminToken) return data.withdrawals as WithdrawRequest[];
          const incoming = new Map((data.withdrawals as WithdrawRequest[]).map((w) => [w.id, w]));
          const merged = prev.map((w) => incoming.get(w.id) || w);
          for (const w of data.withdrawals as WithdrawRequest[]) {
            if (!merged.some((m) => m.id === w.id)) merged.unshift(w);
          }
          return merged;
        });
      }
      if (Array.isArray(data.transactions)) {
        setTransactions((prev) => {
          const prevPending = prev.filter((t) => t.status === 'pending');
          for (const oldTx of prevPending) {
            const updatedTx = (data.transactions as Transaction[]).find(
              (nt) => nt.id === oldTx.id
            );
            if (updatedTx && updatedTx.status !== 'pending') {
              const verbRw =
                updatedTx.type === 'deposit'
                  ? updatedTx.status === 'completed'
                    ? `Kubitsa kwawe kwa RWF ${updatedTx.amount.toLocaleString()} kwemejwe (Approved)!`
                    : `Kubitsa kwawe kwa RWF ${updatedTx.amount.toLocaleString()} kwanzwe (Rejected).`
                  : updatedTx.status === 'completed'
                    ? `Kubikuza kwawe kwa RWF ${updatedTx.amount.toLocaleString()} kwemejwe (Approved)!`
                    : `Kubikuza kwawe kwa RWF ${updatedTx.amount.toLocaleString()} kwanzwe (Rejected), amafaranga yasubijwe kuri konti.`;
              const verbEn =
                updatedTx.type === 'deposit'
                  ? updatedTx.status === 'completed'
                    ? `Your deposit of RWF ${updatedTx.amount.toLocaleString()} has been Approved!`
                    : `Your deposit of RWF ${updatedTx.amount.toLocaleString()} was Rejected.`
                  : updatedTx.status === 'completed'
                    ? `Your withdrawal of RWF ${updatedTx.amount.toLocaleString()} has been Approved!`
                    : `Your withdrawal of RWF ${updatedTx.amount.toLocaleString()} was Rejected and refunded.`;
              setLiveNotice(language === 'rw' ? verbRw : verbEn);
              setTimeout(() => setLiveNotice(null), 5000);
              break;
            }
          }
          return data.transactions;
        });
      }
      if (data.settings) setAdminSettings(data.settings);
      if (Array.isArray(data.products)) setProducts(mergeProductImages(data.products));
    },
    [language, adminToken]
  );

  // Sync logged-in user state from server on mount, reconnect, or manual refresh
  const syncCurrentUserFromServer = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/user/sync?userId=${encodeURIComponent(userId)}`, {
          headers: getUserAuthHeaders(false),
        });
        if (res.status === 404 || res.status === 401) {
          const payload = await res.json().catch(() => ({}));
          const resetAt = Number(payload?.resetAt || 0);
          if (resetAt > 0) {
            purgeSavedAccountsOlderThan(resetAt);
          }

          const phoneFromId = userId.startsWith('user-') ? normalizeRwandaPhone(userId.slice(5)) : '';
          const savedAcc = getSavedAccounts().find((a) => a.phone === phoneFromId);
          if (savedAcc && (!resetAt || savedAcc.savedAt > resetAt)) {
            try {
              const restoreRes = await fetch('/api/auth/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: savedAcc.phone,
                  password: savedAcc.password,
                  savedAt: savedAcc.savedAt,
                  user: savedAcc.userSnapshot,
                }),
              });
              if (restoreRes.ok) {
                const restored = await restoreRes.json();
                if (restored.userToken) setUserToken(restored.userToken);
                if (restored.adminToken) setAdminToken(restored.adminToken);
                applyUserSyncPayload(restored);
                return;
              }
            } catch {
              // keep local session if offline
              return;
            }
          }

          setCurrentUser(null);
          setUserToken('');
          setActiveInvestments([]);
          setTransactions([]);
          setTeamMembers([]);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        applyUserSyncPayload(data);
      } catch {
        // ignore offline
      }
    },
    [getUserAuthHeaders, applyUserSyncPayload]
  );

  // Fetch Admin state from server when Admin Panel is opened or refreshed
  const fetchAdminState = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride || adminToken;
      if (!token) return null;
      try {
        const res = await fetch('/api/admin/state', {
          headers: { 'x-admin-token': token },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data.allUsers)) setAllUsers(data.allUsers);
        if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.rechargeRequests)) setRechargeRequests(data.rechargeRequests);
        if (Array.isArray(data.withdrawRequests)) setWithdrawRequests(data.withdrawRequests);
        if (Array.isArray(data.redemptionCodes)) setRedemptionCodes(data.redemptionCodes);
        if (Array.isArray(data.products)) setProducts(mergeProductImages(data.products));
        if (data.adminSettings) setAdminSettings(data.adminSettings);
        return data;
      } catch {
        return null;
      }
    },
    [adminToken]
  );

  const syncLatestStateToFirestore = useCallback(
    async (snapshot?: {
      allUsers?: UserAccount[];
      investments?: InvestmentRecord[];
      transactions?: Transaction[];
      rechargeRequests?: RechargeRequest[];
      withdrawRequests?: WithdrawRequest[];
      redemptionCodes?: RedemptionCode[];
      adminSettings?: AdminSettings;
    }) => {
      try {
        const current = auth.currentUser;
        if (!current || !current.emailVerified || current.email !== 'eric03ndayisenga@gmail.com') {
          return;
        }
        const usersToSync = snapshot?.allUsers ?? allUsers;
        if (!Array.isArray(usersToSync) || usersToSync.length <= 1) {
          return;
        }
        await syncAdminBackupToFirestore({
          allUsers: usersToSync,
          investments: snapshot?.investments ?? activeInvestments,
          transactions: snapshot?.transactions ?? transactions,
          rechargeRequests: snapshot?.rechargeRequests ?? rechargeRequests,
          withdrawRequests: snapshot?.withdrawRequests ?? withdrawRequests,
          redemptionCodes: snapshot?.redemptionCodes ?? redemptionCodes,
          adminSettings: snapshot?.adminSettings ?? adminSettings,
        });
      } catch {
        // Silent background backup; manual sync button surfaces detailed messages
      }
    },
    [
      allUsers,
      activeInvestments,
      transactions,
      rechargeRequests,
      withdrawRequests,
      redemptionCodes,
      adminSettings,
    ]
  );

  const handleImportCloudState = async (
    cloud: FirestoreCloudState
  ): Promise<{ importedUsers: number }> => {
    if (!adminToken) {
      throw new Error('Admin session expired. Please log in again.');
    }
    const res = await fetch('/api/admin/import-cloud-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify(cloud),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Failed to restore cloud state.');
    }
    const data = await res.json();
    if (Array.isArray(data.allUsers)) setAllUsers(data.allUsers);
    if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (Array.isArray(data.rechargeRequests)) setRechargeRequests(data.rechargeRequests);
    if (Array.isArray(data.withdrawRequests)) setWithdrawRequests(data.withdrawRequests);
    if (Array.isArray(data.redemptionCodes)) setRedemptionCodes(data.redemptionCodes);
    if (data.adminSettings) setAdminSettings(data.adminSettings);
    void fetchLiveActivity();
    return { importedUsers: Number(data.importedUsers || data.allUsers?.length || 0) };
  };

  // Initial sync on user login/mount and when tab regains visibility
  useEffect(() => {
    if (!currentUser?.id) return;
    void syncCurrentUserFromServer(currentUser.id);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && currentUser?.id) {
        void syncCurrentUserFromServer(currentUser.id);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [currentUser?.id, syncCurrentUserFromServer]);

  useEffect(() => {
    if (!isAdminOpen || !adminToken) return;
    void fetchAdminState();
  }, [isAdminOpen, adminToken, fetchAdminState]);

  // Real-time Server-Sent Events (SSE) subscription replacing periodic polling
  useEffect(() => {
    void fetchLiveActivity();
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const params = new URLSearchParams();
    if (userToken) params.set('token', userToken);
    if (isAdminOpen && adminToken) params.set('adminToken', adminToken);
    const qs = params.toString();
    const sse = new EventSource(qs ? `/api/events?${qs}` : '/api/events');

    sse.addEventListener('live_activity', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (Array.isArray(data.items)) {
          setLiveActivity(data.items);
        }
      } catch {
        // ignore malformed event
      }
    });

    sse.addEventListener('user_sync', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        applyUserSyncPayload(data);
      } catch {
        // ignore malformed event
      }
    });

    sse.addEventListener('bootstrap_update', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (data.settings) setAdminSettings(data.settings);
        if (Array.isArray(data.products)) setProducts(mergeProductImages(data.products));
        if (Number(data.resetAt || 0) > 0) {
          purgeSavedAccountsOlderThan(Number(data.resetAt));
        }
      } catch {
        // ignore
      }
    });

    sse.addEventListener('session_reset', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        purgeSavedAccountsOlderThan(Number(data?.resetAt || Date.now()));
      } catch {
        // ignore
      }
      setCurrentUser(null);
      setUserToken('');
      setActiveInvestments([]);
      setTransactions([]);
      setTeamMembers([]);
    });

    sse.addEventListener('admin_state', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (Array.isArray(data.allUsers)) setAllUsers(data.allUsers);
        if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.rechargeRequests)) setRechargeRequests(data.rechargeRequests);
        if (Array.isArray(data.withdrawRequests)) setWithdrawRequests(data.withdrawRequests);
        if (Array.isArray(data.redemptionCodes)) setRedemptionCodes(data.redemptionCodes);
        if (Array.isArray(data.products)) setProducts(mergeProductImages(data.products));
        if (data.adminSettings) setAdminSettings(data.adminSettings);
      } catch {
        // ignore
      }
    });

    sse.onopen = () => {
      if (currentUser?.id) {
        void syncCurrentUserFromServer(currentUser.id);
      }
      if (isAdminOpen && adminToken) {
        void fetchAdminState();
      }
    };

    return () => {
      sse.close();
    };
  }, [
    userToken,
    adminToken,
    isAdminOpen,
    currentUser?.id,
    fetchLiveActivity,
    applyUserSyncPayload,
    syncCurrentUserFromServer,
    fetchAdminState,
  ]);

  // Check if welcome bonus should show, or show true MoMo & Picanon rules popup on entry
  useEffect(() => {
    if (!currentUser) return;
    if (isWelcomeBonusOpen) return;
    if (!currentUser.hasClaimedWelcomeBonus) {
      setIsWelcomeBonusOpen(true);
      return;
    }
    if (!currentUser.isAdmin && currentUser.phone !== '0793002388') {
      try {
        if (sessionStorage.getItem('picanon_entry_notice_seen') !== '1') {
          setIsNoticeOpen(true);
        }
      } catch {
        setIsNoticeOpen(true);
      }
    }
  }, [currentUser, isWelcomeBonusOpen]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'rw' ? 'en' : 'rw'));
  };

  // Deposit Submit Handler
  const handleSubmitRecharge = async (
    amount: number,
    method: 'mtn' | 'airtel',
    senderPhone: string,
    txId: string
  ): Promise<RechargeRequest | null> => {
    if (!currentUser) return null;

    try {
      const res = await fetch('/api/recharges', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          method,
          senderPhone,
          txId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recharge) setRechargeRequests((prev) => [data.recharge, ...prev]);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        void fetchLiveActivity();
        setLiveNotice(
          language === 'rw'
            ? `Kubitsa RWF ${amount.toLocaleString()} byoherejwe (Pending)!`
            : `Deposit of RWF ${amount.toLocaleString()} submitted (Pending)!`
        );
        setTimeout(() => setLiveNotice(null), 4500);
        return data.recharge || null;
      }
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || (language === 'rw' ? 'Ntibyakunze kubitsa.' : 'Deposit failed.'));
    } catch (err) {
      if (err instanceof Error && !/fetch|network|failed to fetch/i.test(err.message)) {
        throw err;
      }
      // offline fallback only on network failure
    }

    const newReq: RechargeRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.id,
      userPhone: currentUser.phone,
      amount,
      paymentMethod: method,
      senderPhone,
      transactionId: txId,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
    };
    setRechargeRequests((prev) => [newReq, ...prev]);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      requestId: newReq.id,
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kubitsa (${method.toUpperCase()}: ${senderPhone})`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newReq;
  };

  // Withdraw Submit Handler
  const handleSubmitWithdraw = async (
    amount: number,
    method: 'mtn' | 'airtel',
    recipientPhone: string,
    recipientName: string
  ): Promise<WithdrawRequest | null> => {
    if (!currentUser) return null;

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          method,
          recipientPhone,
          recipientName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (data.withdrawal) setWithdrawRequests((prev) => [data.withdrawal, ...prev]);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        void fetchLiveActivity();
        setLiveNotice(
          language === 'rw'
            ? `Kubikuza RWF ${amount.toLocaleString()} kuri ${recipientPhone} byoherejwe (Pending)!`
            : `Withdrawal of RWF ${amount.toLocaleString()} to ${recipientPhone} submitted (Pending)!`
        );
        setTimeout(() => setLiveNotice(null), 4500);
        return data.withdrawal || null;
      }
      const errData = await res.json().catch(() => null);
      throw new Error(
        errData?.error || (language === 'rw' ? 'Ntibyakunze kubikuza.' : 'Withdrawal failed.')
      );
    } catch (err) {
      if (err instanceof Error && !/fetch|network|failed to fetch/i.test(err.message)) {
        throw err;
      }
      // offline fallback only on network failure
    }

    const fee = Math.round((amount * adminSettings.withdrawalFeePercent) / 100);
    const netAmount = amount - fee;

    const newWithdraw: WithdrawRequest = {
      id: `wth-${Date.now()}`,
      userId: currentUser.id,
      userPhone: currentUser.phone,
      amount,
      fee,
      netAmount,
      paymentMethod: method,
      recipientPhone,
      recipientName,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
    };

    setWithdrawRequests((prev) => [newWithdraw, ...prev]);

    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance - amount,
      totalWithdrawn: currentUser.totalWithdrawn + amount,
      payoutMethod: method,
      payoutPhone: recipientPhone,
      payoutName: recipientName,
    };
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      requestId: newWithdraw.id,
      type: 'withdraw',
      amount,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kubikuza (${method.toUpperCase()}: ${recipientPhone})`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newWithdraw;
  };

  // Save Payout Account Handler
  const handleSavePayoutAccount = async (
    method: 'mtn' | 'airtel',
    phone: string,
    name: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/user/payout-account', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          method,
          phone,
          name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        return true;
      }
    } catch {
      // offline fallback
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      payoutMethod: method,
      payoutPhone: phone,
      payoutName: name,
    };
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    return true;
  };

  // Lucky Wheel Win Handler
  const handleSpinWin = async (amount: number, freeSpinsDelta = -1) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/user/spin', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          freeSpinsDelta,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        return;
      }
    } catch {
      // offline fallback
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance + amount,
      totalIncome: currentUser.totalIncome + amount,
      freeSpins: Math.max(0, currentUser.freeSpins + freeSpinsDelta),
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    if (amount > 0) {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        userId: currentUser.id,
        type: 'spin_bonus',
        amount,
        status: 'completed',
        timestamp: new Date().toLocaleString('en-GB'),
        description: "Igihembo cy'Uruziga (Lucky Wheel)",
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Claim Welcome Bonus
  const handleClaimWelcomeBonus = async () => {
    if (!currentUser) return;
    if (currentUser.hasClaimedWelcomeBonus) {
      setIsWelcomeBonusOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/user/welcome-bonus', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        setIsWelcomeBonusOpen(false);
        return;
      }
    } catch {
      // offline fallback
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance + 1500,
      totalIncome: currentUser.totalIncome + 1500,
      freeSpins: currentUser.freeSpins + 2,
      hasClaimedWelcomeBonus: true,
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setIsWelcomeBonusOpen(false);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: 'welcome_bonus',
      amount: 1500,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: 'Impano yo Kwinjira (Welcome Bonus - 1,500 RWF)',
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Daily Check-in
  const handleDailyCheckIn = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/user/check-in', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        return true;
      }
      if (res.status === 409) return false;
    } catch {
      // offline fallback
    }
    const todayIso = new Date().toISOString().split('T')[0];
    if (currentUser.lastCheckInDate === todayIso) return false;
    const updated: UserAccount = {
      ...currentUser,
      balance: currentUser.balance + 100,
      totalIncome: currentUser.totalIncome + 100,
      lastCheckInDate: todayIso,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        userId: currentUser.id,
        type: 'task_earning',
        amount: 100,
        status: 'completed',
        timestamp: new Date().toLocaleString('en-GB'),
        description: 'Daily Check-in (+100 RWF)',
      },
      ...prev,
    ]);
    return true;
  };

  // Redeem Company Gift Code
  const handleRedeemGiftCode = async (codeStr: string) => {
    if (!currentUser) {
      return { success: false, message: 'Banza winjire muri konti yawe.' };
    }

    try {
      const res = await fetch('/api/user/redeem-code', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id, code: codeStr }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        return {
          success: true,
          amount: data.amount,
          message:
            language === 'rw'
              ? `Byagenze neza! Konti yawe yongereweho RWF ${Number(data.amount).toLocaleString()} ako kanya.`
              : `Success! Your account has been credited with RWF ${Number(data.amount).toLocaleString()}.`,
        };
      }
      if (data.reason === 'inactive') {
        return {
          success: false,
          message:
            language === 'rw'
              ? 'Iyi kode yarahagaritswe cyangwa yararangiye.'
              : 'This voucher code is currently paused or expired.',
        };
      }
      if (data.reason === 'already_redeemed') {
        return {
          success: false,
          message:
            language === 'rw'
              ? 'Wamaze gukoresha iyi kode kuri iyi konti.'
              : 'You have already redeemed this voucher code.',
        };
      }
      if (data.reason === 'limit_reached') {
        return {
          success: false,
          message:
            language === 'rw'
              ? "Iyi kode yageze ku mubare ntarengwa w'abantu bagombaga kuyifata."
              : 'This voucher has reached its redemption limit.',
        };
      }
      return {
        success: false,
        message:
          language === 'rw'
            ? 'Iyi kode ntabwo ibaho cyangwa ntabwo yemejwe na sosiyete. Reba neza muri Telegram yacu.'
            : 'Invalid voucher code. Only official company codes can be redeemed.',
      };
    } catch {
      // offline fallback
    }

    const matched = redemptionCodes.find(
      (c) => c.code.toUpperCase() === codeStr.toUpperCase()
    );

    if (!matched) {
      return {
        success: false,
        message:
          language === 'rw'
            ? 'Iyi kode ntabwo ibaho cyangwa ntabwo yemejwe na sosiyete. Reba neza muri Telegram yacu.'
            : 'Invalid voucher code. Only official company codes can be redeemed.',
      };
    }
    if (!matched.isActive) {
      return {
        success: false,
        message:
          language === 'rw'
            ? 'Iyi kode yarahagaritswe cyangwa yararangiye.'
            : 'This voucher code is currently paused or expired.',
      };
    }
    if (currentUser.redeemedCodes && currentUser.redeemedCodes.includes(matched.code)) {
      return {
        success: false,
        message:
          language === 'rw'
            ? 'Wamaze gukoresha iyi kode kuri iyi konti.'
            : 'You have already redeemed this voucher code.',
      };
    }
    if (matched.maxUses && matched.usedCount >= matched.maxUses) {
      return {
        success: false,
        message:
          language === 'rw'
            ? "Iyi kode yageze ku mubare ntarengwa w'abantu bagombaga kuyifata."
            : 'This voucher has reached its redemption limit.',
      };
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance + matched.amount,
      totalIncome: currentUser.totalIncome + matched.amount,
      redeemedCodes: [...(currentUser.redeemedCodes || []), matched.code],
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setRedemptionCodes((prev) =>
      prev.map((c) => (c.id === matched.id ? { ...c, usedCount: c.usedCount + 1 } : c))
    );

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: 'gift_code',
      amount: matched.amount,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kode y'Impano (${matched.code})`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    return {
      success: true,
      amount: matched.amount,
      message:
        language === 'rw'
          ? `Byagenze neza! Konti yawe yongereweho RWF ${matched.amount.toLocaleString()} ako kanya.`
          : `Success! Your account has been credited with RWF ${matched.amount.toLocaleString()}.`,
    };
  };

  // Invest in Product
  const handleInvestInProduct = async (product: VIPProduct) => {
    if (!currentUser) return;
    if (currentUser.balance < product.price) {
      setLiveNotice(
        language === 'rw'
          ? `Amafaranga ntahagije kuri VIP ${product.vipLevel} (Birakenewe: RWF ${product.price.toLocaleString()}). Banza ubitse!`
          : `Insufficient balance for VIP ${product.vipLevel} (RWF ${product.price.toLocaleString()} required). Please deposit first.`
      );
      setTimeout(() => setLiveNotice(null), 4500);
      setIsDepositOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/user/invest', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          productId: product.id,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.teamMembers)) setTeamMembers(data.teamMembers);
        setLiveNotice(
          language === 'rw'
            ? `Waguze VIP ${product.vipLevel} neza! Jya muri Imirimo (Tasks) wakire +RWF ${product.dailyIncome.toLocaleString()} buri 24h.`
            : `Activated VIP ${product.vipLevel}! Claim +RWF ${product.dailyIncome.toLocaleString()} every 24h in Tasks.`
        );
        setTimeout(() => setLiveNotice(null), 5000);
        return;
      }
      const errData = await res.json().catch(() => null);
      setLiveNotice(
        errData?.error ||
          (language === 'rw'
            ? `Ntibyakunze gufungura VIP ${product.vipLevel}.`
            : `Could not activate VIP ${product.vipLevel}.`)
      );
      setTimeout(() => setLiveNotice(null), 4500);
      return;
    } catch {
      // offline fallback only when server unreachable
    }

    const newInv: InvestmentRecord = {
      id: `inv-${Date.now()}`,
      userId: currentUser.id,
      productId: product.id,
      productName: language === 'rw' ? product.nameRw : product.nameEn,
      vipLevel: product.vipLevel,
      amount: product.price,
      amountInvested: product.price,
      dailyIncome: product.dailyIncome,
      cycleDays: product.cycleDays,
      daysRemaining: product.cycleDays,
      totalIncomeEarned: 0,
      datePurchased: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    const newVip = Math.max(currentUser.vipLevel, product.vipLevel);
    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance - product.price,
      vipLevel: newVip,
    };

    // Offline fallback: also credit L1 (38%), L2 (2%), L3 (1%) referral commissions in allUsers
    const refCodeClean = updatedUser.referredBy?.trim().toUpperCase();
    const validRef = refCodeClean && refCodeClean !== 'PICANON' && refCodeClean !== '8019JCP2' ? refCodeClean : '';
    const l1 = validRef
      ? allUsers.find((u) => u.id !== updatedUser.id && (u.referralCode.toUpperCase() === validRef || u.phone === validRef))
      : undefined;
    const l2 = l1?.referredBy
      ? allUsers.find((u) => u.id !== updatedUser.id && u.id !== l1.id && (u.referralCode.toUpperCase() === l1.referredBy!.trim().toUpperCase() || u.phone === l1.referredBy))
      : undefined;
    const l3 = l2?.referredBy
      ? allUsers.find((u) => u.id !== updatedUser.id && u.id !== l1?.id && u.id !== l2.id && (u.referralCode.toUpperCase() === l2.referredBy!.trim().toUpperCase() || u.phone === l2.referredBy))
      : undefined;

    const bonus1 = l1 ? Math.round(product.price * 0.38) : 0;
    const bonus2 = l2 ? Math.round(product.price * 0.02) : 0;
    const bonus3 = l3 ? Math.round(product.price * 0.01) : 0;

    setCurrentUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === updatedUser.id) return updatedUser;
        if (l1 && u.id === l1.id && bonus1 > 0) {
          return {
            ...u,
            balance: u.balance + bonus1,
            totalIncome: u.totalIncome + bonus1,
            teamCommission: u.teamCommission + bonus1,
            teamCommissionLevel1: (u.teamCommissionLevel1 || 0) + bonus1,
          };
        }
        if (l2 && u.id === l2.id && bonus2 > 0) {
          return {
            ...u,
            balance: u.balance + bonus2,
            totalIncome: u.totalIncome + bonus2,
            teamCommission: u.teamCommission + bonus2,
            teamCommissionLevel2: (u.teamCommissionLevel2 || 0) + bonus2,
          };
        }
        if (l3 && u.id === l3.id && bonus3 > 0) {
          return {
            ...u,
            balance: u.balance + bonus3,
            totalIncome: u.totalIncome + bonus3,
            teamCommission: u.teamCommission + bonus3,
            teamCommissionLevel3: (u.teamCommissionLevel3 || 0) + bonus3,
          };
        }
        return u;
      })
    );
    setActiveInvestments((prev) => [newInv, ...prev]);

    const nowTs = Date.now();
    const nowStr = new Date().toLocaleString('en-GB');
    const newTx: Transaction = {
      id: `tx-${nowTs}`,
      userId: currentUser.id,
      type: 'product_purchase',
      amount: product.price,
      status: 'completed',
      timestamp: nowStr,
      description: `Gushora muri VIP ${product.vipLevel} (${product.nameRw})`,
    };
    const bonusTxs: Transaction[] = [];
    if (l1 && bonus1 > 0) {
      bonusTxs.push({
        id: `tx-ref1-${nowTs}`,
        userId: l1.id,
        type: 'referral_bonus',
        amount: bonus1,
        status: 'completed',
        timestamp: nowStr,
        description: `Komisiyo ya VIP L1 (38%) · ${product.nameRw}`,
      });
    }
    if (l2 && bonus2 > 0) {
      bonusTxs.push({
        id: `tx-ref2-${nowTs}`,
        userId: l2.id,
        type: 'referral_bonus',
        amount: bonus2,
        status: 'completed',
        timestamp: nowStr,
        description: `Komisiyo ya VIP L2 (2%) · ${product.nameRw}`,
      });
    }
    if (l3 && bonus3 > 0) {
      bonusTxs.push({
        id: `tx-ref3-${nowTs}`,
        userId: l3.id,
        type: 'referral_bonus',
        amount: bonus3,
        status: 'completed',
        timestamp: nowStr,
        description: `Komisiyo ya VIP L3 (1%) · ${product.nameRw}`,
      });
    }
    setTransactions((prev) => [newTx, ...bonusTxs, ...prev]);
  };

  // Complete Daily Task (Enforced once per 24 hours per VIP investment)
  const handleCompleteDailyTask = async (investmentId: string, rewardAmount: number) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/user/claim-task', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          investmentId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.investments)) setActiveInvestments(data.investments);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        setLiveNotice(
          language === 'rw'
            ? `Wakiriye inyungu ya +RWF ${rewardAmount.toLocaleString()}!`
            : `Claimed +RWF ${rewardAmount.toLocaleString()} daily dividend!`
        );
        setTimeout(() => setLiveNotice(null), 4000);
        return;
      }
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        setLiveNotice(errData.error);
        setTimeout(() => setLiveNotice(null), 4000);
      }
      return;
    } catch {
      // offline fallback
    }

    const targetInv = activeInvestments.find((inv) => inv.id === investmentId);
    if (!targetInv || targetInv.status !== 'active') return;

    const nowMs = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (targetInv.lastClaimAt && nowMs - targetInv.lastClaimAt < cooldownMs) {
      return;
    }

    const updatedInvestments: InvestmentRecord[] = activeInvestments.map((inv) => {
      if (inv.id !== investmentId) return inv;
      const nextDaysRemaining = Math.max(0, inv.daysRemaining - 1);
      return {
        ...inv,
        lastClaimAt: nowMs,
        daysRemaining: nextDaysRemaining,
        totalIncomeEarned: (inv.totalIncomeEarned || 0) + rewardAmount,
        status: nextDaysRemaining <= 0 ? 'completed' : 'active',
      };
    });

    setActiveInvestments(updatedInvestments);

    const updatedUser: UserAccount = {
      ...currentUser,
      balance: currentUser.balance + rewardAmount,
      totalIncome: currentUser.totalIncome + rewardAmount,
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    const newTx: Transaction = {
      id: `tx-${nowMs}`,
      userId: currentUser.id,
      type: 'task_earning',
      amount: rewardAmount,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Inyungu ya VIP ${targetInv.vipLevel} (24h)`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Claim Invite Deposit Milestone Reward
  const handleClaimInviteMilestone = async (
    target: number,
    reward: number
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/user/claim-invite-milestone', {
        method: 'POST',
        headers: getUserAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id, target }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setAllUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        }
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        setLiveNotice(
          language === 'rw'
            ? `Wakiriye +${reward.toLocaleString()} Frw y'ubutumire!`
            : `Claimed +${reward.toLocaleString()} Frw invite reward!`
        );
        setTimeout(() => setLiveNotice(null), 4000);
        return true;
      }
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        setLiveNotice(errData.error);
        setTimeout(() => setLiveNotice(null), 4000);
      }
      return false;
    } catch {
      return false;
    }
  };

  // Admin Actions
  const handleApproveRecharge = async (requestId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/recharges/${requestId}/approve`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          if (currentUser) void syncCurrentUserFromServer(currentUser.id);
          return;
        }
      } catch {
        // fallback
      }
    }

    const req = rechargeRequests.find((r) => r.id === requestId);
    if (!req) return;
    const reviewedAt = new Date().toLocaleString('en-GB');
    setRechargeRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'approved', reviewedBy: 'Admin', reviewedAt } : r
      )
    );
    setTransactions((prev) => {
      let updatedOne = false;
      return prev.map((t) => {
        if (
          t.requestId === requestId ||
          (!updatedOne && t.userId === req.userId && t.type === 'deposit' && t.status === 'pending' && t.amount === req.amount)
        ) {
          updatedOne = true;
          return { ...t, status: 'completed', reviewedBy: 'Admin' };
        }
        return t;
      });
    });
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === req.userId || u.phone === req.userPhone) {
          const updated = {
            ...u,
            balance: u.balance + req.amount,
            totalRecharged: u.totalRecharged + req.amount,
          };
          if (currentUser && currentUser.id === u.id) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const handleRejectRecharge = async (requestId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/recharges/${requestId}/reject`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          if (currentUser) void syncCurrentUserFromServer(currentUser.id);
          return;
        }
      } catch {
        // fallback
      }
    }
    const req = rechargeRequests.find((r) => r.id === requestId);
    const reviewedAt = new Date().toLocaleString('en-GB');
    setRechargeRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', reviewedBy: 'Admin', reviewedAt } : r
      )
    );
    if (req) {
      setTransactions((prev) => {
        let updatedOne = false;
        return prev.map((t) => {
          if (
            t.requestId === requestId ||
            (!updatedOne && t.userId === req.userId && t.type === 'deposit' && t.status === 'pending' && t.amount === req.amount)
          ) {
            updatedOne = true;
            return { ...t, status: 'rejected', reviewedBy: 'Admin' };
          }
          return t;
        });
      });
    }
  };

  const handleApproveWithdraw = async (requestId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/withdrawals/${requestId}/approve`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          if (currentUser) void syncCurrentUserFromServer(currentUser.id);
          return;
        }
      } catch {
        // fallback
      }
    }
    const wth = withdrawRequests.find((w) => w.id === requestId);
    const reviewedAt = new Date().toLocaleString('en-GB');
    setWithdrawRequests((prev) =>
      prev.map((w) =>
        w.id === requestId ? { ...w, status: 'approved', reviewedBy: 'Admin', reviewedAt } : w
      )
    );
    if (wth) {
      setTransactions((prev) => {
        let updatedOne = false;
        return prev.map((t) => {
          if (
            t.requestId === requestId ||
            (!updatedOne && t.userId === wth.userId && t.type === 'withdraw' && t.status === 'pending' && t.amount === wth.amount)
          ) {
            updatedOne = true;
            return { ...t, status: 'completed', reviewedBy: 'Admin' };
          }
          return t;
        });
      });
    }
  };

  const handleRejectWithdraw = async (requestId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/withdrawals/${requestId}/reject`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          if (currentUser) void syncCurrentUserFromServer(currentUser.id);
          return;
        }
      } catch {
        // fallback
      }
    }

    const wth = withdrawRequests.find((w) => w.id === requestId);
    if (!wth) return;
    const reviewedAt = new Date().toLocaleString('en-GB');
    setWithdrawRequests((prev) =>
      prev.map((w) =>
        w.id === requestId ? { ...w, status: 'rejected', reviewedBy: 'Admin', reviewedAt } : w
      )
    );
    setTransactions((prev) => {
      let updatedOne = false;
      return prev.map((t) => {
        if (
          t.requestId === requestId ||
          (!updatedOne && t.userId === wth.userId && t.type === 'withdraw' && t.status === 'pending' && t.amount === wth.amount)
        ) {
          updatedOne = true;
          return { ...t, status: 'rejected', reviewedBy: 'Admin' };
        }
        return t;
      });
    });
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === wth.userId || u.phone === wth.userPhone) {
          const updated = { ...u, balance: u.balance + wth.amount };
          if (currentUser && currentUser.id === u.id) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const handleManualCreditUser = async (userId: string, amount: number) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/users/${userId}/credit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ amount }),
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, balance: u.balance + amount };
          if (currentUser && currentUser.id === u.id) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const handleUpdateUserVip = async (userId: string, newVip: number) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/users/${userId}/vip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ vipLevel: newVip }),
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, vipLevel: newVip };
          if (currentUser && currentUser.id === u.id) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const handleToggleUserBan = async (userId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/users/${userId}/ban`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isBanned: !u.isBanned } : u))
    );
  };

  const handleAddRedemptionCode = async (code: RedemptionCode) => {
    if (adminToken) {
      try {
        const res = await fetch('/api/admin/codes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify(code),
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setRedemptionCodes((prev) => [code, ...prev]);
  };

  const handleToggleRedemptionCode = async (codeId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/codes/${codeId}/toggle`, {
          method: 'PATCH',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setRedemptionCodes((prev) =>
      prev.map((c) => (c.id === codeId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleDeleteRedemptionCode = async (codeId: string) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/codes/${codeId}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setRedemptionCodes((prev) => prev.filter((c) => c.id !== codeId));
  };

  const handleUpdateSettings = async (newSettings: Partial<AdminSettings>) => {
    if (adminToken) {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify(newSettings),
        });
        if (res.ok) {
          const fresh = await fetchAdminState();
          if (fresh) void syncLatestStateToFirestore(fresh);
          return;
        }
      } catch {
        // fallback
      }
    }
    setAdminSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUpdateProductDailyIncome = async (productId: string, newDaily: number) => {
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ dailyIncome: newDaily }),
        });
        if (res.ok) {
          await fetchAdminState();
          return;
        }
      } catch {
        // fallback
      }
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              dailyIncome: newDaily,
              totalIncome: newDaily * p.cycleDays,
            }
          : p
      )
    );
  };

  const handleClearAllRecords = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/clear-records', {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
      } catch {
        // continue local cleanup
      }
    }
    setRechargeRequests([]);
    setWithdrawRequests([]);
    setTransactions([]);
    setLiveActivity([]);
    void clearFirestoreRecordsBackup(false).catch(() => {});
  };

  const handleResetAllAccounts = async () => {
    if (adminToken) {
      try {
        const res = await fetch('/api/admin/reset-users', {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        if (res.ok) {
          const data = await res.json();
          const cleanUsers = Array.isArray(data.allUsers) ? data.allUsers : [ADMIN_USER];
          setAllUsers(cleanUsers);
          if (currentUser?.isAdmin && cleanUsers[0]) {
            setCurrentUser(cleanUsers[0]);
          }
          setRechargeRequests([]);
          setWithdrawRequests([]);
          setActiveInvestments([]);
          setTransactions([]);
          setTeamMembers([]);
          setLiveActivity([]);
          setRedemptionCodes((prev) => prev.map((c) => ({ ...c, usedCount: 0 })));
          purgeSavedAccountsOlderThan(Number(data.resetAt || Date.now()));
          void clearFirestoreRecordsBackup(true).catch(() => {});
          return;
        }
      } catch {
        // fallback below
      }
    }
    setAllUsers([ADMIN_USER]);
    if (currentUser?.isAdmin) setCurrentUser(ADMIN_USER);
    setRechargeRequests([]);
    setWithdrawRequests([]);
    setActiveInvestments([]);
    setTransactions([]);
    setTeamMembers([]);
    setLiveActivity([]);
    setRedemptionCodes((prev) => prev.map((c) => ({ ...c, usedCount: 0 })));
    void clearFirestoreRecordsBackup(true).catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserToken('');
    setAdminToken('');
    setTeamMembers([]);
    setIsAdminOpen(false);
    setIsNoticeOpen(false);
    try {
      sessionStorage.removeItem('picanon_entry_notice_seen');
    } catch {
      // ignore
    }
  };

  // If not logged in, render AuthView
  if (!currentUser) {
    return (
      <>
        <AuthView
          onLoginSuccess={(user, meta) => {
            setCurrentUser(user);
            if (meta?.userToken) setUserToken(meta.userToken);
            if (Array.isArray(meta?.investments)) setActiveInvestments(meta.investments);
            if (Array.isArray(meta?.transactions)) setTransactions(meta.transactions);
            if (Array.isArray(meta?.recharges) && !meta?.adminToken) setRechargeRequests(meta.recharges);
            if (Array.isArray(meta?.withdrawals) && !meta?.adminToken) setWithdrawRequests(meta.withdrawals);
            if (Array.isArray(meta?.teamMembers)) setTeamMembers(meta.teamMembers);
            else setTeamMembers([]);
            if (meta?.adminToken) {
              setAdminToken(meta.adminToken);
              void fetchAdminState(meta.adminToken);
            }
            if (user.isAdmin || user.phone === '0793002388') {
              setIsAdminOpen(true);
            } else {
              try {
                sessionStorage.removeItem('picanon_entry_notice_seen');
              } catch {
                // ignore
              }
              setIsNoticeOpen(true);
            }
          }}
          onRegisterSuccess={(user, meta) => {
            setCurrentUser(user);
            if (meta?.userToken) setUserToken(meta.userToken);
            if (Array.isArray(meta?.investments)) setActiveInvestments(meta.investments);
            if (Array.isArray(meta?.transactions)) setTransactions(meta.transactions);
            setTeamMembers(Array.isArray(meta?.teamMembers) ? meta.teamMembers : []);
            setAllUsers((prev) => {
              const updated = [user, ...prev.filter((u) => u.phone !== user.phone)];
              localStorage.setItem('tv_all_users', JSON.stringify(updated));
              return updated;
            });
            setIsWelcomeBonusOpen(true);
          }}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onOpenAbout={() => setIsAboutOpen(true)}
          adminSettings={adminSettings}
          allUsers={allUsers}
          initialInviteCode={initialInviteCode}
          hasExplicitInvite={hasExplicitInvite}
          initialPhone={initialPhone}
        />
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          adminSettings={adminSettings}
          language={language}
        />
      </>
    );
  }

  // If Admin view is open
  if (isAdminOpen && (currentUser.isAdmin || currentUser.phone === '0793002388')) {
    return (
      <AdminPanel
        adminUser={currentUser}
        adminToken={adminToken}
        userToken={userToken}
        allUsers={allUsers}
        investments={activeInvestments}
        transactions={transactions}
        rechargeRequests={rechargeRequests}
        withdrawRequests={withdrawRequests}
        products={products}
        adminSettings={adminSettings}
        redemptionCodes={redemptionCodes}
        onAddRedemptionCode={handleAddRedemptionCode}
        onToggleRedemptionCode={handleToggleRedemptionCode}
        onDeleteRedemptionCode={handleDeleteRedemptionCode}
        onApproveRecharge={handleApproveRecharge}
        onRejectRecharge={handleRejectRecharge}
        onApproveWithdraw={handleApproveWithdraw}
        onRejectWithdraw={handleRejectWithdraw}
        onManualCreditUser={handleManualCreditUser}
        onUpdateUserVip={handleUpdateUserVip}
        onToggleUserBan={handleToggleUserBan}
        onUpdateSettings={handleUpdateSettings}
        onUpdateProductDailyIncome={handleUpdateProductDailyIncome}
        onRefreshAdmin={async () => {
          await fetchAdminState();
        }}
        onImportCloudState={handleImportCloudState}
        onClearAllRecords={handleClearAllRecords}
        onResetAllAccounts={handleResetAllAccounts}
        onExitAdmin={() => setIsAdminOpen(false)}
        onLogout={handleLogout}
        language={language}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fef2f2] text-[#7f1d1d] flex flex-col font-sans font-bold selection:bg-[#dc2626] selection:text-white">
      {liveNotice && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#b91c1c] border-2 border-white text-white text-sm font-black px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 max-w-[92vw] animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="truncate">{liveNotice}</span>
        </div>
      )}

      {/* Top Header */}
      {currentTab === 'home' && (
        <Header
          user={currentUser}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onOpenSupport={() => setIsSupportOpen(true)}
          onOpenNoticeModal={() => setIsNoticeOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Area */}
      {(() => {
        const userInvestments = activeInvestments.filter((inv) => inv.userId === currentUser.id);
        const userTransactions = transactions.filter((tx) => tx.userId === currentUser.id);

        return (
          <main className="flex-1 max-w-md mx-auto w-full bg-white min-h-screen shadow-md border-x border-[#fecaca]">
            {currentTab === 'home' && (
              <HomeView
                user={currentUser}
                products={products}
                activeInvestments={userInvestments}
                broadcastMessage={adminSettings.broadcastMessage}
                onOpenDeposit={() => setIsDepositOpen(true)}
                onOpenWithdraw={() => setIsWithdrawOpen(true)}
                onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                onOpenGiftCode={() => setIsGiftCodeOpen(true)}
                onOpenNotice={() => setIsNoticeOpen(true)}
                onNavigateToProducts={() => setCurrentTab('products')}
                onNavigateToTasks={() => setCurrentTab('tasks')}
                onOpenRecords={() => {
                  setProfileRecordsSignal((n) => n + 1);
                  setCurrentTab('profile');
                }}
                onDailyCheckIn={handleDailyCheckIn}
                onOpenAbout={() => setIsAboutOpen(true)}
                onOpenSupport={() => setIsSupportOpen(true)}
                onOpenLiveChat={() => setIsLiveChatOpen(true)}
                onOpenFaq={() => setIsFaqOpen(true)}
                language={language}
              />
            )}

            {currentTab === 'products' && (
              <ProductsView
                user={currentUser}
                products={products}
                activeInvestments={userInvestments}
                onInvest={handleInvestInProduct}
                onOpenDeposit={() => setIsDepositOpen(true)}
                language={language}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                user={currentUser}
                activeInvestments={userInvestments}
                teamMembers={teamMembers}
                onCompleteDailyTask={handleCompleteDailyTask}
                onClaimInviteMilestone={handleClaimInviteMilestone}
                onNavigateToProducts={() => setCurrentTab('products')}
                onBack={() => setCurrentTab('home')}
                language={language}
              />
            )}

            {currentTab === 'team' && (
              <TeamView user={currentUser} teamMembers={teamMembers} language={language} />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                user={currentUser}
                transactions={userTransactions}
                rechargeRequests={rechargeRequests.filter(
                  (r) => r.userId === currentUser.id || r.userPhone === currentUser.phone
                )}
                withdrawRequests={withdrawRequests.filter(
                  (w) => w.userId === currentUser.id || w.userPhone === currentUser.phone
                )}
                onOpenDeposit={() => setIsDepositOpen(true)}
                onOpenWithdraw={() => setIsWithdrawOpen(true)}
                onOpenSupport={() => setIsSupportOpen(true)}
                onOpenLiveChat={() => setIsLiveChatOpen(true)}
                onOpenAdmin={() => setIsAdminOpen(true)}
                onOpenAbout={() => setIsAboutOpen(true)}
                onOpenFaq={() => setIsFaqOpen(true)}
                onOpenGiftCode={() => setIsGiftCodeOpen(true)}
                onToggleLanguage={handleToggleLanguage}
                onNavigateToProducts={() => setCurrentTab('products')}
                onNavigateToTasks={() => setCurrentTab('tasks')}
                onDailyCheckIn={handleDailyCheckIn}
                onSavePayoutAccount={handleSavePayoutAccount}
                onLogout={handleLogout}
                openRecordsSignal={profileRecordsSignal}
                language={language}
              />
            )}
          </main>
        );
      })()}

      {/* Floating Live Chat Quick Action */}
      <button
        onClick={() => setIsLiveChatOpen(true)}
        className="fixed bottom-24 right-3 z-40 px-4 py-2.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] border-2 border-white text-white font-black text-xs shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title={language === 'rw' ? 'Live Chat (Ubufasha ako kanya)' : 'Live Chat Support'}
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-white text-[#dc2626] flex items-center justify-center">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-white border border-[#dc2626]" />
        </div>
        <span className="text-white font-black tracking-tight text-xs">
          Live Chat
        </span>
      </button>

      {/* Bottom Sticky Navigation */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={(t) => setCurrentTab(t)}
        language={language}
      />

      {/* Modals */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        adminSettings={adminSettings}
        language={language}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSubmitRecharge={handleSubmitRecharge}
        onRefreshStatus={() => syncCurrentUserFromServer(currentUser.id)}
        adminSettings={adminSettings}
        language={language}
        userBalance={currentUser.balance}
        userPhone={currentUser.phone}
        rechargeRequests={rechargeRequests.filter(
          (r) => r.userId === currentUser.id || r.userPhone === currentUser.phone
        )}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSubmitWithdraw={handleSubmitWithdraw}
        user={currentUser}
        adminSettings={adminSettings}
        language={language}
      />

      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        onClose={() => setIsLuckyWheelOpen(false)}
        user={currentUser}
        hasPurchasedProduct={
          activeInvestments.some((inv) => inv.userId === currentUser.id) ||
          currentUser.vipLevel > 0 ||
          currentUser.totalRecharged >= 1000
        }
        onSpinWin={handleSpinWin}
        language={language}
        onGoToProducts={() => setCurrentTab('products')}
        onGoToTeam={() => setCurrentTab('team')}
      />

      <RedemptionCodeModal
        isOpen={isGiftCodeOpen}
        onClose={() => setIsGiftCodeOpen(false)}
        onRedeem={handleRedeemGiftCode}
        language={language}
      />

      <WelcomeBonusModal
        isOpen={isWelcomeBonusOpen}
        onClaim={() => {
          void handleClaimWelcomeBonus();
          setIsNoticeOpen(true);
        }}
        onClose={() => {
          setIsWelcomeBonusOpen(false);
          setIsNoticeOpen(true);
        }}
        language={language}
      />

      <NoticeAnnouncementModal
        isOpen={isNoticeOpen}
        onClose={() => {
          setIsNoticeOpen(false);
          try {
            sessionStorage.setItem('picanon_entry_notice_seen', '1');
          } catch {
            // ignore
          }
        }}
        message={adminSettings.broadcastMessage}
        channelUrl={adminSettings.telegramChannel || 'https://t.me/Picanon_channel'}
        groupUrl={adminSettings.telegramGroup || 'https://t.me/picanonrw1'}
        adminSettings={adminSettings}
        language={language}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        adminSettings={adminSettings}
        language={language}
        onOpenLiveChat={() => setIsLiveChatOpen(true)}
      />

      <LiveChatModal
        isOpen={isLiveChatOpen}
        onClose={() => setIsLiveChatOpen(false)}
        language={language}
        adminSettings={adminSettings}
        userPhone={currentUser.phone}
      />

      <PicanonModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        adminSettings={adminSettings}
        products={products}
        language={language}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onNavigateToProducts={() => setCurrentTab('products')}
        onOpenSupport={() => setIsSupportOpen(true)}
      />
    </div>
  );
}
export default App;
