import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'picanon-db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'picanon-db.backup.json');
const SESSION_SECRET_FILE = path.join(DATA_DIR, '.session-secret');

interface ServerUser {
  id: string;
  phone: string;
  password: string;
  balance: number;
  totalIncome: number;
  totalWithdrawn: number;
  totalRecharged: number;
  vipLevel: number;
  referralCode: string;
  referredBy?: string;
  teamCountLevel1: number;
  teamCountLevel2: number;
  teamCountLevel3: number;
  teamCommission: number;
  teamCommissionLevel1?: number;
  teamCommissionLevel2?: number;
  teamCommissionLevel3?: number;
  freeSpins: number;
  lastSpinDate?: string;
  lastCheckInDate?: string;
  hasClaimedWelcomeBonus: boolean;
  isAdmin: boolean;
  isBanned?: boolean;
  createdAt: string;
  redeemedCodes: string[];
  claimedInviteMilestones?: number[];
  payoutMethod?: 'mtn' | 'airtel';
  payoutPhone?: string;
  payoutName?: string;
}

interface ServerProduct {
  id: string;
  vipLevel: number;
  nameRw: string;
  nameEn: string;
  price: number;
  dailyIncome: number;
  cycleDays: number;
  totalIncome: number;
  tasksPerDay: number;
  popular?: boolean;
  descriptionRw: string;
  descriptionEn: string;
}

interface ServerInvestment {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  vipLevel: number;
  amountInvested: number;
  amount: number;
  dailyIncome: number;
  cycleDays: number;
  daysRemaining: number;
  datePurchased: string;
  status: 'active' | 'completed';
  totalIncomeEarned: number;
  lastClaimAt?: number;
}

interface ServerTransaction {
  id: string;
  userId: string;
  requestId?: string;
  reviewedBy?: string;
  type: string;
  amount: number;
  status: 'completed' | 'pending' | 'rejected';
  timestamp: string;
  description: string;
  phone?: string;
  method?: 'mtn' | 'airtel' | 'system';
  txHash?: string;
}

interface ServerRecharge {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  paymentMethod: 'mtn' | 'airtel';
  transactionId: string;
  senderPhone: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
}

interface ServerWithdraw {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: 'mtn' | 'airtel';
  recipientPhone: string;
  recipientName: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ServerCode {
  id: string;
  code: string;
  amount: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  descriptionRw: string;
  descriptionEn: string;
  createdAt: string;
}

interface ServerSettings {
  mtnNumber: string;
  airtelNumber: string;
  mtnName: string;
  airtelName: string;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFeePercent: number;
  broadcastMessage: string;
  supportPhone: string;
  telegramGroup: string;
  telegramSupport: string;
  telegramChannel: string;
  whatsappSupport: string;
}

interface DatabaseShape {
  users: ServerUser[];
  products: ServerProduct[];
  investments: ServerInvestment[];
  transactions: ServerTransaction[];
  recharges: ServerRecharge[];
  withdrawals: ServerWithdraw[];
  redemptionCodes: ServerCode[];
  settings: ServerSettings;
  lastResetAt?: number;
}

const ADMIN_PHONE = '0793002388';
const ADMIN_PASS = 'eric123';

const INITIAL_SETTINGS: ServerSettings = {
  mtnNumber: '0793002388',
  airtelNumber: '0793002388',
  mtnName: 'Picanon (MTN MoMo Official)',
  airtelName: 'Picanon (Airtel Money Official)',
  minDeposit: 1000,
  minWithdrawal: 1000,
  withdrawalFeePercent: 10,
  broadcastMessage:
    "Murakaza neza muri Picanon · Imyambaro n'Inkweto · Tangirira kuri VIP 0 (RWF 3,000 -> +600 RWF/munsi) kugeza kuri VIP 10 · Kubikuza 24/7 kuri MTN na Airtel",
  supportPhone: '',
  telegramGroup: 'https://t.me/picanonrw1',
  telegramSupport: 'https://t.me/Picanon_support',
  telegramChannel: 'https://t.me/Picanon_channel',
  whatsappSupport: 'https://t.me/Picanon_support',
};

const INITIAL_PRODUCTS: ServerProduct[] = [
  {
    id: 'vip-0',
    vipLevel: 0,
    nameRw: 'Picanon Starter Canvas Sneakers',
    nameEn: 'Picanon Starter Canvas Sneakers',
    price: 3000,
    dailyIncome: 600,
    cycleDays: 40,
    totalIncome: 24000,
    tasksPerDay: 1,
    popular: true,
    descriptionRw:
      "Inkweto z'itangiriro za Picanon zigezweho zifasha buri wese gutangira gushora imari mu myambaro n'inkweto.",
    descriptionEn:
      'Starter Picanon classic low-top sneakers designed as an accessible entry into apparel & footwear rewards.',
  },
  {
    id: 'vip-1',
    vipLevel: 1,
    nameRw: 'Picanon Classic Leather Sneakers',
    nameEn: 'Picanon Classic Leather Sneakers',
    price: 6000,
    dailyIncome: 1200,
    cycleDays: 100,
    totalIncome: 120000,
    tasksPerDay: 1,
    popular: true,
    descriptionRw:
      "Inkweto z'uruhu rwa kijyambere za Picanon zikoze mu buhanga buhanitse kandi ziramba.",
    descriptionEn:
      'Minimalist full-grain leather low-top sneakers crafted for everyday elegance and durability.',
  },
  {
    id: 'vip-2',
    vipLevel: 2,
    nameRw: 'Picanon Urban Streetwear Set',
    nameEn: 'Picanon Urban Streetwear Set',
    price: 12500,
    dailyIncome: 3300,
    cycleDays: 50,
    totalIncome: 165000,
    tasksPerDay: 1,
    popular: true,
    descriptionRw:
      "Imyambaro ya streetwear ya Picanon (Hoodie, Jacket n'Ipantaro) ikunzwe ku rwego mpuzamahanga.",
    descriptionEn:
      'Heavyweight organic cotton hoodie paired with structured denim overshirt and tailored trousers.',
  },
  {
    id: 'vip-3',
    vipLevel: 3,
    nameRw: 'Picanon Heritage Chelsea Boots',
    nameEn: 'Picanon Heritage Chelsea Boots',
    price: 25000,
    dailyIncome: 5500,
    cycleDays: 50,
    totalIncome: 275000,
    tasksPerDay: 1,
    popular: true,
    descriptionRw:
      "Inkweto ndende z'uruhu rw'umwimerere za Picanon zikoze mu buryo bwa Goodyear welt.",
    descriptionEn:
      'Handcrafted espresso calfskin leather Chelsea boots with precision Goodyear welt construction.',
  },
  {
    id: 'vip-4',
    vipLevel: 4,
    nameRw: 'Picanon Bespoke Wool Suit',
    nameEn: 'Picanon Bespoke Wool Suit',
    price: 45000,
    dailyIncome: 10000,
    cycleDays: 50,
    totalIncome: 500000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Ikoti n'ipantaro by'akazi n'ibirori bya Picanon bidoze mu bwoya bwiza bwa kijyambere.",
    descriptionEn:
      'Tailored double-breasted charcoal wool blazer and pleated trousers cut with bespoke precision.',
  },
  {
    id: 'vip-5',
    vipLevel: 5,
    nameRw: 'Picanon Pro Athletic Runners & Jacket',
    nameEn: 'Picanon Pro Athletic Runners & Jacket',
    price: 95000,
    dailyIncome: 21500,
    cycleDays: 50,
    totalIncome: 1075000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Inkweto za siporo n'ikoti rya kijyambere bya Picanon bikoranye ubuhanga bw'ikirenga.",
    descriptionEn:
      'Sculpted knit & suede performance running sneakers paired with a sleek technical jacket.',
  },
  {
    id: 'vip-6',
    vipLevel: 6,
    nameRw: 'Picanon Flagship Boutique Capsule',
    nameEn: 'Picanon Flagship Boutique Capsule',
    price: 600000,
    dailyIncome: 150000,
    cycleDays: 50,
    totalIncome: 7500000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Icyiciro cyihariye cy'imyambaro n'inkweto bya Picanon bitangwa mu maduka makuru.",
    descriptionEn:
      'Exclusive seasonal couture outerwear and signature footwear capsule from Picanon flagship stores.',
  },
  {
    id: 'vip-7',
    vipLevel: 7,
    nameRw: 'Picanon Runway Atelier Collection',
    nameEn: 'Picanon Runway Atelier Collection',
    price: 1600000,
    dailyIncome: 700000,
    cycleDays: 50,
    totalIncome: 35000000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Imyambaro yo ku rwego rwo hejuru ya Atelier itegurwa mu nganda za Picanon.",
    descriptionEn:
      'High-fashion runway atelier collection crafted in limited quantities for global fashion houses.',
  },
  {
    id: 'vip-8',
    vipLevel: 8,
    nameRw: 'Picanon Global Fashion Distribution Hub',
    nameEn: 'Picanon Global Fashion Distribution Hub',
    price: 3000000,
    dailyIncome: 1500000,
    cycleDays: 50,
    totalIncome: 75000000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Ihuriro rikomeye ry'ubucuruzi bw'imyambaro n'inkweto bya Picanon ku isi yose.",
    descriptionEn:
      'Global wholesale garment and luxury footwear distribution partnership with Picanon.',
  },
  {
    id: 'vip-9',
    vipLevel: 9,
    nameRw: 'Picanon Couture Milan & Paris Maison',
    nameEn: 'Picanon Couture Milan & Paris Maison',
    price: 5000000,
    dailyIncome: 2600000,
    cycleDays: 50,
    totalIncome: 130000000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Inzu y'imideli n'inkweto z'ikirenga ya Picanon ikorera mu mijyi ikomeye y'imideli ku isi.",
    descriptionEn:
      'Premier luxury couture fashion & handcrafted footwear maison operating across Paris and Milan.',
  },
  {
    id: 'vip-10',
    vipLevel: 10,
    nameRw: 'Picanon Diamond Crown Global Empire',
    nameEn: 'Picanon Diamond Crown Global Empire',
    price: 10000000,
    dailyIncome: 5500000,
    cycleDays: 50,
    totalIncome: 275000000,
    tasksPerDay: 1,
    popular: false,
    descriptionRw:
      "Icyiciro cy'ikirenga cy'ubufatanye bwuzuye mu nganda n'amaduka ya Picanon ku isi yose.",
    descriptionEn:
      'Apex global fashion empire partnership encompassing flagship boutiques, footwear ateliers, and worldwide retail.',
  },
];

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function isHashedPassword(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt:') && stored.split(':').length === 3;
}

function verifyPassword(plain: string, stored: string): { valid: boolean; needsRehash: boolean } {
  if (!plain || !stored) return { valid: false, needsRehash: false };
  if (isHashedPassword(stored)) {
    const [, salt, hexHash] = stored.split(':');
    if (!salt || !hexHash) return { valid: false, needsRehash: false };
    try {
      const derived = crypto.scryptSync(plain, salt, 64);
      const storedBuf = Buffer.from(hexHash, 'hex');
      if (derived.length !== storedBuf.length) return { valid: false, needsRehash: false };
      return { valid: crypto.timingSafeEqual(derived, storedBuf), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }
  const plainBuf = Buffer.from(plain, 'utf8');
  const storedBuf = Buffer.from(stored, 'utf8');
  if (plainBuf.length !== storedBuf.length) return { valid: false, needsRehash: false };
  return { valid: crypto.timingSafeEqual(plainBuf, storedBuf), needsRehash: true };
}

function loadOrCreateSessionSecret(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const existing = fs.readFileSync(SESSION_SECRET_FILE, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const fresh = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SESSION_SECRET_FILE, fresh, { encoding: 'utf-8', mode: 0o600 });
    return fresh;
  } catch {
    return crypto.createHash('sha256').update(`${ADMIN_PHONE}:${ADMIN_PASS}:picanon-session`).digest('hex');
  }
}

const SESSION_SECRET = loadOrCreateSessionSecret();

function createSeedDatabase(): DatabaseShape {
  return {
    users: [
      {
        id: 'admin-0793002388',
        phone: ADMIN_PHONE,
        password: hashPassword(ADMIN_PASS),
        balance: 150000,
        totalIncome: 750000,
        totalWithdrawn: 50000,
        totalRecharged: 150000,
        vipLevel: 3,
        referralCode: 'PIC793002',
        teamCountLevel1: 18,
        teamCountLevel2: 35,
        teamCountLevel3: 60,
        teamCommission: 245000,
        freeSpins: 3,
        hasClaimedWelcomeBonus: true,
        isAdmin: true,
        createdAt: '2026-01-10',
        redeemedCodes: [],
      },
    ],
    products: INITIAL_PRODUCTS,
    investments: [],
    transactions: [],
    recharges: [],
    withdrawals: [],
    redemptionCodes: [
      {
        id: 'code-official-1',
        code: 'PICANON-2026',
        amount: 1500,
        maxUses: 200,
        usedCount: 0,
        isActive: true,
        descriptionRw: "Kode y'impano yemewe ya sosiyete Picanon ku banyamuryango ba mbere.",
        descriptionEn: 'Official welcome bonus voucher issued directly by Picanon management.',
        createdAt: '2026-10-10',
      },
      {
        id: 'code-official-2',
        code: 'PICANON-STYLE',
        amount: 3000,
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        descriptionRw: "Kode ya sosiyete y'abashora mu myambaro n'inkweto bya Picanon.",
        descriptionEn: 'Official Picanon Apparel & Footwear adoption voucher.',
        createdAt: '2026-10-10',
      },
    ],
    settings: INITIAL_SETTINGS,
  };
}

function loadDb(): DatabaseShape {
  const tryReadJson = (filePath: string): DatabaseShape | null => {
    try {
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (!raw.trim()) return null;
      const parsed = JSON.parse(raw) as DatabaseShape;
      if (!parsed || !Array.isArray(parsed.users)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let parsed = tryReadJson(DB_FILE) || tryReadJson(DB_BACKUP_FILE);
    if (!parsed) {
      const seed = createSeedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    let migrated = false;
    // Ensure admin exists and has hashed admin password
    const adminIdx = parsed.users.findIndex((u) => u.phone === ADMIN_PHONE);
    if (adminIdx === -1) {
      parsed.users.unshift(createSeedDatabase().users[0]);
      migrated = true;
    } else {
      const adminCheck = verifyPassword(ADMIN_PASS, parsed.users[adminIdx].password);
      if (!adminCheck.valid || adminCheck.needsRehash) {
        parsed.users[adminIdx].password = hashPassword(ADMIN_PASS);
        migrated = true;
      }
      if (!parsed.users[adminIdx].isAdmin) {
        parsed.users[adminIdx].isAdmin = true;
        migrated = true;
      }
    }
    // Migrate any legacy plain-text user passwords to scrypt hashes on boot
    for (const u of parsed.users) {
      if (u.password && !isHashedPassword(u.password)) {
        u.password = hashPassword(u.password);
        migrated = true;
      }
    }
    const isLegacyTelegram = (val?: string) => !val || /teravolt/i.test(val);
    const isOldGroupUrl = (val?: string) =>
      !val || /teravolt/i.test(val) || val.trim().toLowerCase() === 'https://t.me/picanonrw';
    if (
      !parsed.settings ||
      !parsed.settings.mtnNumber ||
      !parsed.settings.airtelNumber ||
      parsed.settings.minDeposit === 3000 ||
      parsed.settings.withdrawalFeePercent === 17 ||
      isOldGroupUrl(parsed.settings.telegramGroup) ||
      isLegacyTelegram(parsed.settings.telegramSupport) ||
      isLegacyTelegram(parsed.settings.telegramChannel) ||
      !parsed.settings.broadcastMessage ||
      /teravolt/i.test(parsed.settings.broadcastMessage)
    ) {
      parsed.settings = {
        ...INITIAL_SETTINGS,
        ...(parsed.settings || {}),
        mtnNumber: parsed.settings?.mtnNumber || INITIAL_SETTINGS.mtnNumber,
        airtelNumber: parsed.settings?.airtelNumber || INITIAL_SETTINGS.airtelNumber,
        minDeposit:
          parsed.settings?.minDeposit === 3000 || !parsed.settings?.minDeposit
            ? INITIAL_SETTINGS.minDeposit
            : parsed.settings.minDeposit,
        withdrawalFeePercent:
          parsed.settings?.withdrawalFeePercent === 17 || parsed.settings?.withdrawalFeePercent == null
            ? INITIAL_SETTINGS.withdrawalFeePercent
            : parsed.settings.withdrawalFeePercent,
        telegramGroup: isOldGroupUrl(parsed.settings?.telegramGroup)
          ? INITIAL_SETTINGS.telegramGroup
          : parsed.settings!.telegramGroup,
        telegramSupport: isLegacyTelegram(parsed.settings?.telegramSupport)
          ? INITIAL_SETTINGS.telegramSupport
          : parsed.settings!.telegramSupport,
        telegramChannel: isLegacyTelegram(parsed.settings?.telegramChannel)
          ? INITIAL_SETTINGS.telegramChannel
          : parsed.settings!.telegramChannel,
        whatsappSupport: isLegacyTelegram(parsed.settings?.whatsappSupport)
          ? INITIAL_SETTINGS.whatsappSupport
          : parsed.settings!.whatsappSupport,
        mtnName: parsed.settings?.mtnName || INITIAL_SETTINGS.mtnName,
        airtelName: parsed.settings?.airtelName || INITIAL_SETTINGS.airtelName,
        broadcastMessage:
          !parsed.settings?.broadcastMessage || /teravolt/i.test(parsed.settings.broadcastMessage)
            ? INITIAL_SETTINGS.broadcastMessage
            : parsed.settings.broadcastMessage,
      };
      migrated = true;
    }
    if (migrated) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {
        // non-fatal
      }
    }
    return parsed;
  } catch {
    const seed = createSeedDatabase();
    return seed;
  }
}

let db: DatabaseShape = loadDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const serialized = JSON.stringify(db, null, 2);
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, serialized, 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
  try {
    fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
  } catch {
    // non-fatal backup write
  }
}

const activeAdminTokens = new Set<string>();
const ADMIN_SECRET_FALLBACK = crypto.createHash('sha256').update(`${ADMIN_PHONE}:${ADMIN_PASS}:picanon-salt`).digest('hex');

function issueAdminToken(): string {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const nonce = crypto.randomBytes(12).toString('hex');
  const body = `${exp}.${nonce}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(`admin:${body}`).digest('base64url');
  const token = `adm.${body}.${sig}`;
  activeAdminTokens.add(token);
  return token;
}

function isValidAdminToken(token: string): boolean {
  if (!token) return false;
  if (activeAdminTokens.has(token) || token === ADMIN_SECRET_FALLBACK) return true;
  if (token.startsWith('adm.')) {
    const parts = token.split('.');
    if (parts.length !== 4) return false;
    const [, expStr, nonce, sig] = parts;
    const exp = Number(expStr || 0);
    if (!exp || Date.now() > exp || !nonce || !sig) return false;
    try {
      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`admin:${expStr}.${nonce}`)
        .digest('base64url');
      const sigBuf = Buffer.from(sig, 'utf8');
      const expBuf = Buffer.from(expectedSig, 'utf8');
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
  return false;
}

function verifyExportSig(exportSig: string): boolean {
  if (!exportSig || !exportSig.includes('.')) return false;
  const [expStr, sig] = exportSig.split('.');
  const exp = Number(expStr || 0);
  if (!exp || Date.now() > exp || !sig) return false;
  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`export:${expStr}`)
      .digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

interface UserTokenPayload {
  uid: string;
  phone: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

function issueUserToken(user: ServerUser): string {
  const now = Date.now();
  const payloadObj: UserTokenPayload = {
    uid: user.id,
    phone: user.phone,
    role: user.isAdmin ? 'admin' : 'user',
    iat: now,
    exp: now + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyUserToken(token: string): UserTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as UserTokenPayload;
    if (!parsed || !parsed.uid || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    if (parsed.role !== 'admin' && db.lastResetAt && parsed.iat < db.lastResetAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function extractUserTokenFromRequest(req: Request): string {
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const headerToken = String(req.headers['x-user-token'] || '').trim();
  if (headerToken) return headerToken;
  return String(req.query.token || '').trim();
}

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = String(req.headers['x-admin-token'] || '');
  if (!isValidAdminToken(token)) {
    res.status(401).json({ error: 'Admin authorization required' });
    return;
  }
  next();
}

function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userToken = extractUserTokenFromRequest(req);
  const payload = verifyUserToken(userToken);
  if (payload) {
    const requestedId = String(req.body?.userId || req.query?.userId || '');
    if (requestedId && requestedId !== payload.uid && payload.role !== 'admin') {
      res.status(403).json({ error: 'Session mismatch' });
      return;
    }
    req.authUserId = requestedId || payload.uid;
    next();
    return;
  }

  const adminToken = String(req.headers['x-admin-token'] || '');
  if (isValidAdminToken(adminToken)) {
    req.authUserId = String(req.body?.userId || req.query?.userId || 'admin-0793002388');
    next();
    return;
  }

  res.status(401).json({ error: 'Authentication required. Please log in again.' });
}

function sanitizeUser(u: ServerUser) {
  const { password: _pw, ...safe } = u;
  return safe;
}

function normalizePhone(raw: string): string {
  let clean = String(raw || '').trim().replace(/[\s\-()]+/g, '');
  if (clean.startsWith('+250')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('250') && clean.length >= 12) {
    clean = '0' + clean.slice(3);
  } else if (clean.length === 9 && clean.startsWith('7')) {
    clean = '0' + clean;
  }
  return clean;
}

function maskPhone(raw: string): string {
  const clean = normalizePhone(raw);
  if (clean.length >= 9) {
    const body = clean.startsWith('0') ? clean.slice(1) : clean;
    return `+250 ${body.slice(0, 2)}***${body.slice(-3)}`;
  }
  return '+250 78***356';
}

function findReferrerByCode(code?: string, excludeIds: string[] = []): ServerUser | undefined {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean || clean === 'PICANON' || clean === '8019JCP2') return undefined;
  const normalizedPhone = normalizePhone(clean);
  return db.users.find(
    (u) =>
      !excludeIds.includes(u.id) &&
      (u.referralCode.toUpperCase() === clean ||
        u.phone === clean ||
        (normalizedPhone.length >= 9 && u.phone === normalizedPhone))
  );
}

function linkUserReferralHierarchy(newUser: ServerUser, rawInviteCode?: string) {
  const l1 = findReferrerByCode(rawInviteCode, [newUser.id]);
  if (!l1) return;
  newUser.referredBy = l1.referralCode;
  l1.teamCountLevel1 += 1;

  const l2 = findReferrerByCode(l1.referredBy, [newUser.id, l1.id]);
  if (l2) {
    l2.teamCountLevel2 += 1;
    const l3 = findReferrerByCode(l2.referredBy, [newUser.id, l1.id, l2.id]);
    if (l3) {
      l3.teamCountLevel3 += 1;
    }
  }
}

function creditReferralCommissions(investor: ServerUser, investAmount: number, productNameRw: string) {
  const nowStr = new Date().toLocaleString('en-GB');
  const nowTs = Date.now();
  const maskedInvestor = maskPhone(investor.phone);

  const l1 = findReferrerByCode(investor.referredBy, [investor.id]);
  if (!l1) return;

  const bonus1 = Math.round(investAmount * 0.38);
  if (bonus1 > 0) {
    l1.balance += bonus1;
    l1.totalIncome += bonus1;
    l1.teamCommission += bonus1;
    l1.teamCommissionLevel1 = (l1.teamCommissionLevel1 || 0) + bonus1;
    db.transactions.unshift({
      id: `tx-ref1-${nowTs}`,
      userId: l1.id,
      type: 'referral_bonus',
      amount: bonus1,
      status: 'completed',
      timestamp: nowStr,
      description: `Komisiyo ya VIP L1 (38%) · ${maskedInvestor} yashoye muri ${productNameRw}`,
    });
  }

  const l2 = findReferrerByCode(l1.referredBy, [investor.id, l1.id]);
  if (!l2) return;

  const bonus2 = Math.round(investAmount * 0.02);
  if (bonus2 > 0) {
    l2.balance += bonus2;
    l2.totalIncome += bonus2;
    l2.teamCommission += bonus2;
    l2.teamCommissionLevel2 = (l2.teamCommissionLevel2 || 0) + bonus2;
    db.transactions.unshift({
      id: `tx-ref2-${nowTs + 1}`,
      userId: l2.id,
      type: 'referral_bonus',
      amount: bonus2,
      status: 'completed',
      timestamp: nowStr,
      description: `Komisiyo ya VIP L2 (2%) · ${maskedInvestor} yashoye muri ${productNameRw}`,
    });
  }

  const l3 = findReferrerByCode(l2.referredBy, [investor.id, l1.id, l2.id]);
  if (!l3) return;

  const bonus3 = Math.round(investAmount * 0.01);
  if (bonus3 > 0) {
    l3.balance += bonus3;
    l3.totalIncome += bonus3;
    l3.teamCommission += bonus3;
    l3.teamCommissionLevel3 = (l3.teamCommissionLevel3 || 0) + bonus3;
    db.transactions.unshift({
      id: `tx-ref3-${nowTs + 2}`,
      userId: l3.id,
      type: 'referral_bonus',
      amount: bonus3,
      status: 'completed',
      timestamp: nowStr,
      description: `Komisiyo ya VIP L3 (1%) · ${maskedInvestor} yashoye muri ${productNameRw}`,
    });
  }
}

function getTeamMembersForUser(user: ServerUser) {
  const myCode = user.referralCode.toUpperCase();
  const invTotals = new Map<string, number>();
  for (const inv of db.investments) {
    invTotals.set(inv.userId, (invTotals.get(inv.userId) || 0) + (inv.amountInvested || inv.amount || 0));
  }

  const l1Users = db.users.filter(
    (u) => u.id !== user.id && u.referredBy?.trim().toUpperCase() === myCode
  );
  const l1Codes = new Set(l1Users.map((u) => u.referralCode.toUpperCase()));
  const l1Ids = new Set(l1Users.map((u) => u.id));

  const l2Users = db.users.filter(
    (u) =>
      u.id !== user.id &&
      !l1Ids.has(u.id) &&
      u.referredBy &&
      l1Codes.has(u.referredBy.trim().toUpperCase())
  );
  const l2Codes = new Set(l2Users.map((u) => u.referralCode.toUpperCase()));
  const l2Ids = new Set(l2Users.map((u) => u.id));

  const l3Users = db.users.filter(
    (u) =>
      u.id !== user.id &&
      !l1Ids.has(u.id) &&
      !l2Ids.has(u.id) &&
      u.referredBy &&
      l2Codes.has(u.referredBy.trim().toUpperCase())
  );

  const mapMember = (u: ServerUser, level: 1 | 2 | 3) => ({
    id: u.id,
    maskedPhone: maskPhone(u.phone),
    level,
    vipLevel: u.vipLevel,
    totalInvested: invTotals.get(u.id) || 0,
    hasDeposited: u.totalRecharged > 0,
    createdAt: u.createdAt,
  });

  return [
    ...l1Users.map((u) => mapMember(u, 1)),
    ...l2Users.map((u) => mapMember(u, 2)),
    ...l3Users.map((u) => mapMember(u, 3)),
  ];
}

interface SseClient {
  res: Response;
  userId?: string;
  isAdmin: boolean;
}

const sseClients = new Set<SseClient>();

function sendSseEvent(res: Response, eventName: string, data: unknown) {
  try {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // connection closed
  }
}

function buildLiveActivityItems() {
  const realRecharges = db.recharges.map((r) => ({
    id: r.id,
    type: 'deposit' as const,
    maskedPhone: maskPhone(r.senderPhone || r.userPhone),
    amount: r.amount,
    method: r.paymentMethod,
    status: r.status,
    timestamp: r.timestamp,
    isReal: true,
  }));

  const realWithdraws = db.withdrawals.map((w) => ({
    id: w.id,
    type: 'withdraw' as const,
    maskedPhone: maskPhone(w.recipientPhone || w.userPhone),
    amount: w.amount,
    method: w.paymentMethod,
    status: w.status,
    timestamp: w.timestamp,
    isReal: true,
  }));

  return [...realWithdraws, ...realRecharges].slice(0, 12);
}

function buildUserSyncPayload(user: ServerUser) {
  return {
    user: sanitizeUser(user),
    investments: db.investments.filter((i) => i.userId === user.id),
    transactions: db.transactions.filter((t) => t.userId === user.id),
    recharges: db.recharges.filter((r) => r.userId === user.id || r.userPhone === user.phone),
    withdrawals: db.withdrawals.filter((w) => w.userId === user.id || w.userPhone === user.phone),
    teamMembers: getTeamMembersForUser(user),
    settings: db.settings,
    products: db.products,
  };
}

function buildAdminStatePayload() {
  return {
    allUsers: db.users.map(sanitizeUser),
    investments: db.investments,
    transactions: db.transactions,
    rechargeRequests: db.recharges,
    withdrawRequests: db.withdrawals,
    redemptionCodes: db.redemptionCodes,
    products: db.products,
    adminSettings: db.settings,
  };
}

function broadcastLiveActivity() {
  const payload = { items: buildLiveActivityItems() };
  for (const client of sseClients) {
    sendSseEvent(client.res, 'live_activity', payload);
  }
}

function notifyUserSync(userId: string, reason = 'state_updated') {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  const payload = { ...buildUserSyncPayload(user), reason };
  for (const client of sseClients) {
    if (client.userId === userId) {
      sendSseEvent(client.res, 'user_sync', payload);
    }
  }
}

function notifyReferrerChainSync(user: ServerUser) {
  const l1 = findReferrerByCode(user.referredBy, [user.id]);
  if (l1) {
    notifyUserSync(l1.id, 'team_updated');
    const l2 = findReferrerByCode(l1.referredBy, [user.id, l1.id]);
    if (l2) {
      notifyUserSync(l2.id, 'team_updated');
      const l3 = findReferrerByCode(l2.referredBy, [user.id, l1.id, l2.id]);
      if (l3) {
        notifyUserSync(l3.id, 'team_updated');
      }
    }
  }
}

function notifyAllUsersBootstrap(reason = 'bootstrap_updated') {
  const payload = {
    settings: db.settings,
    products: db.products,
    resetAt: db.lastResetAt || 0,
    reason,
  };
  for (const client of sseClients) {
    sendSseEvent(client.res, 'bootstrap_update', payload);
    if (client.userId) {
      const targetUser = db.users.find((u) => u.id === client.userId);
      if (targetUser) {
        sendSseEvent(client.res, 'user_sync', { ...buildUserSyncPayload(targetUser), reason });
      } else if (reason === 'users_reset') {
        sendSseEvent(client.res, 'session_reset', { resetAt: db.lastResetAt || Date.now() });
      }
    }
  }
}

function notifyAdminState(reason = 'admin_updated') {
  let hasAdminClient = false;
  for (const client of sseClients) {
    if (client.isAdmin) {
      hasAdminClient = true;
      break;
    }
  }
  if (!hasAdminClient) return;
  const payload = { ...buildAdminStatePayload(), reason };
  for (const client of sseClients) {
    if (client.isAdmin) {
      sendSseEvent(client.res, 'admin_state', payload);
    }
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Keep SSE heartbeats alive across proxies
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.res.write(': heartbeat\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 25000);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, usersCount: db.users.length });
  });

  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    res.json({
      settings: db.settings,
      products: db.products,
      resetAt: db.lastResetAt || 0,
    });
  });

  app.get('/api/events', (req: Request, res: Response) => {
    const userToken = String(req.query.token || '').trim();
    const adminToken = String(req.query.adminToken || '').trim();
    const verifiedUser = verifyUserToken(userToken);
    const isAdmin = isValidAdminToken(adminToken) || verifiedUser?.role === 'admin';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const client: SseClient = {
      res,
      userId: verifiedUser?.uid,
      isAdmin,
    };
    sseClients.add(client);

    sendSseEvent(res, 'connected', {
      ok: true,
      serverTime: Date.now(),
      authenticatedUserId: client.userId || null,
      isAdmin: client.isAdmin,
    });
    sendSseEvent(res, 'live_activity', { items: buildLiveActivityItems() });

    if (client.userId) {
      const targetUser = db.users.find((u) => u.id === client.userId);
      if (targetUser) {
        sendSseEvent(res, 'user_sync', { ...buildUserSyncPayload(targetUser), reason: 'initial' });
      }
    }
    if (client.isAdmin) {
      sendSseEvent(res, 'admin_state', { ...buildAdminStatePayload(), reason: 'initial' });
    }

    req.on('close', () => {
      sseClients.delete(client);
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const cleanPhone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password || '').trim();
    const inviteCode = String(req.body?.inviteCode || '').trim().toUpperCase();

    if (!cleanPhone || cleanPhone.length < 9) {
      res.status(400).json({ error: 'Invalid phone number' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters' });
      return;
    }
    if (cleanPhone === ADMIN_PHONE) {
      res.status(409).json({ error: 'Reserved admin phone number' });
      return;
    }

    const exists = db.users.find((u) => u.phone === cleanPhone);
    if (exists) {
      res.status(409).json({ error: 'Account with this phone already exists' });
      return;
    }

    const newUser: ServerUser = {
      id: `user-${cleanPhone}`,
      phone: cleanPhone,
      password: hashPassword(password),
      balance: 1500,
      totalIncome: 1500,
      totalWithdrawn: 0,
      totalRecharged: 0,
      vipLevel: 0,
      referralCode: `PIC${cleanPhone.slice(-6)}`,
      referredBy: undefined,
      teamCountLevel1: 0,
      teamCountLevel2: 0,
      teamCountLevel3: 0,
      teamCommission: 0,
      teamCommissionLevel1: 0,
      teamCommissionLevel2: 0,
      teamCommissionLevel3: 0,
      freeSpins: 2,
      hasClaimedWelcomeBonus: true,
      isAdmin: false,
      createdAt: new Date().toISOString().split('T')[0],
      redeemedCodes: [],
    };

    // Update referral hierarchy counts up to 3 levels safely
    linkUserReferralHierarchy(newUser, inviteCode);

    const welcomeTx: ServerTransaction = {
      id: `tx-welcome-${Date.now()}`,
      userId: newUser.id,
      type: 'welcome_bonus',
      amount: 1500,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: 'Impano yo Kwinjira (Welcome Bonus - 1,500 RWF)',
    };

    db.users.unshift(newUser);
    db.transactions.unshift(welcomeTx);
    saveDb();
    notifyReferrerChainSync(newUser);
    notifyAdminState('user_registered');

    const userToken = issueUserToken(newUser);
    res.status(201).json({
      user: sanitizeUser(newUser),
      userToken,
      investments: [],
      transactions: [welcomeTx],
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const cleanPhone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password || '').trim();

    if (!cleanPhone || cleanPhone.length < 9) {
      res.status(400).json({ error: 'Invalid phone number' });
      return;
    }

    if (cleanPhone === ADMIN_PHONE) {
      if (password !== ADMIN_PASS) {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
      }
      const adminUser = db.users.find((u) => u.phone === ADMIN_PHONE) || createSeedDatabase().users[0];
      const adminToken = issueAdminToken();
      const userToken = issueUserToken(adminUser);
      res.json({
        user: sanitizeUser(adminUser),
        userToken,
        adminToken,
        investments: db.investments.filter((i) => i.userId === adminUser.id),
        transactions: db.transactions.filter((t) => t.userId === adminUser.id),
        recharges: db.recharges.filter((r) => r.userId === adminUser.id || r.userPhone === adminUser.phone),
        withdrawals: db.withdrawals.filter((w) => w.userId === adminUser.id || w.userPhone === adminUser.phone),
      });
      return;
    }

    let matched = db.users.find((u) => u.phone === cleanPhone);
    if (!matched) {
      const savedAt = Number(req.body?.savedAt || 0);
      const snapshot = req.body?.savedSnapshot;
      const canRestore =
        snapshot &&
        typeof snapshot === 'object' &&
        (!snapshot.phone || normalizePhone(snapshot.phone) === cleanPhone) &&
        password.length >= 4 &&
        savedAt > (db.lastResetAt || 0);

      if (canRestore) {
        const restoredUser: ServerUser = {
          id: `user-${cleanPhone}`,
          phone: cleanPhone,
          password: hashPassword(password),
          balance: Math.max(0, Number(snapshot.balance ?? 1500)),
          totalIncome: Math.max(0, Number(snapshot.totalIncome ?? 1500)),
          totalWithdrawn: Math.max(0, Number(snapshot.totalWithdrawn ?? 0)),
          totalRecharged: Math.max(0, Number(snapshot.totalRecharged ?? 0)),
          vipLevel: Math.min(10, Math.max(0, Number(snapshot.vipLevel ?? 0))),
          referralCode:
            typeof snapshot.referralCode === 'string' && snapshot.referralCode.trim()
              ? snapshot.referralCode.trim().toUpperCase()
              : `PIC${cleanPhone.slice(-6)}`,
          referredBy: typeof snapshot.referredBy === 'string' ? snapshot.referredBy : undefined,
          teamCountLevel1: Math.max(0, Number(snapshot.teamCountLevel1 ?? 0)),
          teamCountLevel2: Math.max(0, Number(snapshot.teamCountLevel2 ?? 0)),
          teamCountLevel3: Math.max(0, Number(snapshot.teamCountLevel3 ?? 0)),
          teamCommission: Math.max(0, Number(snapshot.teamCommission ?? 0)),
          teamCommissionLevel1: Math.max(0, Number(snapshot.teamCommissionLevel1 ?? 0)),
          teamCommissionLevel2: Math.max(0, Number(snapshot.teamCommissionLevel2 ?? 0)),
          teamCommissionLevel3: Math.max(0, Number(snapshot.teamCommissionLevel3 ?? 0)),
          freeSpins: Math.max(0, Number(snapshot.freeSpins ?? 2)),
          lastSpinDate: typeof snapshot.lastSpinDate === 'string' ? snapshot.lastSpinDate : undefined,
          lastCheckInDate: typeof snapshot.lastCheckInDate === 'string' ? snapshot.lastCheckInDate : undefined,
          hasClaimedWelcomeBonus: Boolean(snapshot.hasClaimedWelcomeBonus ?? true),
          isAdmin: false,
          createdAt:
            typeof snapshot.createdAt === 'string' && snapshot.createdAt
              ? snapshot.createdAt
              : new Date().toISOString().split('T')[0],
          redeemedCodes: Array.isArray(snapshot.redeemedCodes) ? snapshot.redeemedCodes : [],
          claimedInviteMilestones: Array.isArray(snapshot.claimedInviteMilestones)
            ? snapshot.claimedInviteMilestones
            : [],
          payoutMethod: snapshot.payoutMethod === 'airtel' ? 'airtel' : snapshot.payoutMethod === 'mtn' ? 'mtn' : undefined,
          payoutPhone: typeof snapshot.payoutPhone === 'string' ? snapshot.payoutPhone : undefined,
          payoutName: typeof snapshot.payoutName === 'string' ? snapshot.payoutName : undefined,
        };
        db.users.unshift(restoredUser);
        saveDb();
        notifyAdminState('user_restored');
        matched = restoredUser;
      } else {
        res.status(404).json({
          error: 'Account not found. Please register first.',
          resetAt: db.lastResetAt || 0,
        });
        return;
      }
    }
    if (matched.isBanned) {
      res.status(403).json({ error: 'Account is frozen or suspended' });
      return;
    }
    const pwCheck = verifyPassword(password, matched.password);
    if (!pwCheck.valid) {
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }
    if (pwCheck.needsRehash) {
      matched.password = hashPassword(password);
      saveDb();
    }

    const userToken = issueUserToken(matched);
    res.json({
      user: sanitizeUser(matched),
      userToken,
      investments: db.investments.filter((i) => i.userId === matched.id),
      transactions: db.transactions.filter((t) => t.userId === matched.id),
      recharges: db.recharges.filter((r) => r.userId === matched.id || r.userPhone === matched.phone),
      withdrawals: db.withdrawals.filter((w) => w.userId === matched.id || w.userPhone === matched.phone),
      teamMembers: getTeamMembersForUser(matched),
    });
  });

  app.post('/api/auth/restore', (req: Request, res: Response) => {
    const cleanPhone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password || '').trim();
    const savedAt = Number(req.body?.savedAt || 0);
    const snapshot = req.body?.user;

    if (!cleanPhone || cleanPhone.length < 9 || password.length < 4) {
      res.status(400).json({ error: 'Invalid restore payload' });
      return;
    }
    if (cleanPhone === ADMIN_PHONE) {
      if (password !== ADMIN_PASS) {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
      }
      const adminUser = db.users.find((u) => u.phone === ADMIN_PHONE) || createSeedDatabase().users[0];
      res.json({
        user: sanitizeUser(adminUser),
        userToken: issueUserToken(adminUser),
        adminToken: issueAdminToken(),
        investments: db.investments.filter((i) => i.userId === adminUser.id),
        transactions: db.transactions.filter((t) => t.userId === adminUser.id),
        recharges: db.recharges.filter((r) => r.userId === adminUser.id || r.userPhone === adminUser.phone),
        withdrawals: db.withdrawals.filter((w) => w.userId === adminUser.id || w.userPhone === adminUser.phone),
        teamMembers: getTeamMembersForUser(adminUser),
      });
      return;
    }
    if (db.lastResetAt && savedAt <= db.lastResetAt) {
      res.status(410).json({ error: 'Account reset by admin', resetAt: db.lastResetAt });
      return;
    }

    const existing = db.users.find((u) => u.phone === cleanPhone);
    if (existing) {
      const pwCheck = verifyPassword(password, existing.password);
      if (!pwCheck.valid) {
        res.status(401).json({ error: 'Invalid password for restore' });
        return;
      }
      if (pwCheck.needsRehash) {
        existing.password = hashPassword(password);
        saveDb();
      }
      res.json({
        user: sanitizeUser(existing),
        userToken: issueUserToken(existing),
        investments: db.investments.filter((i) => i.userId === existing.id),
        transactions: db.transactions.filter((t) => t.userId === existing.id),
        recharges: db.recharges.filter((r) => r.userId === existing.id || r.userPhone === existing.phone),
        withdrawals: db.withdrawals.filter((w) => w.userId === existing.id || w.userPhone === existing.phone),
        teamMembers: getTeamMembersForUser(existing),
      });
      return;
    }

    const restoredUser: ServerUser = {
      id: `user-${cleanPhone}`,
      phone: cleanPhone,
      password: hashPassword(password),
      balance: Math.max(0, Number(snapshot?.balance ?? 1500)),
      totalIncome: Math.max(0, Number(snapshot?.totalIncome ?? 1500)),
      totalWithdrawn: Math.max(0, Number(snapshot?.totalWithdrawn ?? 0)),
      totalRecharged: Math.max(0, Number(snapshot?.totalRecharged ?? 0)),
      vipLevel: Math.min(10, Math.max(0, Number(snapshot?.vipLevel ?? 0))),
      referralCode:
        typeof snapshot?.referralCode === 'string' && snapshot.referralCode.trim()
          ? snapshot.referralCode.trim().toUpperCase()
          : `PIC${cleanPhone.slice(-6)}`,
      referredBy: typeof snapshot?.referredBy === 'string' ? snapshot.referredBy : undefined,
      teamCountLevel1: Math.max(0, Number(snapshot?.teamCountLevel1 ?? 0)),
      teamCountLevel2: Math.max(0, Number(snapshot?.teamCountLevel2 ?? 0)),
      teamCountLevel3: Math.max(0, Number(snapshot?.teamCountLevel3 ?? 0)),
      teamCommission: Math.max(0, Number(snapshot?.teamCommission ?? 0)),
      teamCommissionLevel1: Math.max(0, Number(snapshot?.teamCommissionLevel1 ?? 0)),
      teamCommissionLevel2: Math.max(0, Number(snapshot?.teamCommissionLevel2 ?? 0)),
      teamCommissionLevel3: Math.max(0, Number(snapshot?.teamCommissionLevel3 ?? 0)),
      freeSpins: Math.max(0, Number(snapshot?.freeSpins ?? 2)),
      lastSpinDate: typeof snapshot?.lastSpinDate === 'string' ? snapshot.lastSpinDate : undefined,
      lastCheckInDate: typeof snapshot?.lastCheckInDate === 'string' ? snapshot.lastCheckInDate : undefined,
      hasClaimedWelcomeBonus: Boolean(snapshot?.hasClaimedWelcomeBonus ?? true),
      isAdmin: false,
      createdAt:
        typeof snapshot?.createdAt === 'string' && snapshot.createdAt
          ? snapshot.createdAt
          : new Date().toISOString().split('T')[0],
      redeemedCodes: Array.isArray(snapshot?.redeemedCodes) ? snapshot.redeemedCodes : [],
      claimedInviteMilestones: Array.isArray(snapshot?.claimedInviteMilestones)
        ? snapshot.claimedInviteMilestones
        : [],
      payoutMethod: snapshot?.payoutMethod === 'airtel' ? 'airtel' : snapshot?.payoutMethod === 'mtn' ? 'mtn' : undefined,
      payoutPhone: typeof snapshot?.payoutPhone === 'string' ? snapshot.payoutPhone : undefined,
      payoutName: typeof snapshot?.payoutName === 'string' ? snapshot.payoutName : undefined,
    };

    db.users.unshift(restoredUser);
    saveDb();
    notifyAdminState('user_restored');
    res.json({
      user: sanitizeUser(restoredUser),
      userToken: issueUserToken(restoredUser),
      investments: [],
      transactions: [],
      recharges: [],
      withdrawals: [],
      teamMembers: getTeamMembersForUser(restoredUser),
    });
  });

  app.get('/api/live-activity', (_req: Request, res: Response) => {
    res.json({ items: buildLiveActivityItems() });
  });

  app.get('/api/user/sync', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.query.userId || '');
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found', resetAt: db.lastResetAt || 0 });
      return;
    }
    res.json(buildUserSyncPayload(user));
  });

  app.post('/api/user/welcome-bonus', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.hasClaimedWelcomeBonus) {
      user.balance += 1500;
      user.totalIncome += 1500;
      user.freeSpins += 2;
      user.hasClaimedWelcomeBonus = true;
      const tx: ServerTransaction = {
        id: `tx-${Date.now()}`,
        userId: user.id,
        type: 'welcome_bonus',
        amount: 1500,
        status: 'completed',
        timestamp: new Date().toLocaleString('en-GB'),
        description: 'Impano yo Kwinjira (Welcome Bonus - 1,500 RWF)',
      };
      db.transactions.unshift(tx);
      saveDb();
      notifyUserSync(user.id);
      notifyAdminState('user_updated');
    }
    res.json({
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/check-in', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (user.lastCheckInDate === today) {
      res.status(409).json({ error: 'Already checked in today' });
      return;
    }
    user.lastCheckInDate = today;
    user.balance += 100;
    user.totalIncome += 100;
    const tx: ServerTransaction = {
      id: `tx-${Date.now()}`,
      userId: user.id,
      type: 'task_earning',
      amount: 100,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: 'Daily Check-in (+100 RWF)',
    };
    db.transactions.unshift(tx);
    saveDb();
    notifyUserSync(user.id);
    notifyAdminState('user_updated');
    res.json({
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/claim-invite-milestone', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const MILESTONE_REWARDS: Record<number, number> = {
      3: 1500,
      5: 3000,
      10: 5000,
      30: 10000,
      50: 30000,
    };
    const userId = String(req.authUserId || req.body?.userId || '');
    const target = Number(req.body?.target || 0);
    const reward = MILESTONE_REWARDS[target];
    const user = db.users.find((u) => u.id === userId);
    if (!user || !reward) {
      res.status(400).json({ error: 'Invalid invite milestone' });
      return;
    }

    const claimed = Array.isArray(user.claimedInviteMilestones) ? user.claimedInviteMilestones : [];
    if (claimed.includes(target)) {
      res.status(409).json({ error: 'Milestone already claimed' });
      return;
    }

    const myCode = user.referralCode.toUpperCase();
    const depositedDirectInvites = db.users.filter(
      (u) =>
        u.id !== user.id &&
        u.referredBy?.trim().toUpperCase() === myCode &&
        u.totalRecharged > 0
    ).length;

    if (depositedDirectInvites < target) {
      res.status(400).json({
        error: `Need ${target} invited users who deposited (currently ${depositedDirectInvites}/${target})`,
      });
      return;
    }

    user.claimedInviteMilestones = [...claimed, target];
    user.balance += reward;
    user.totalIncome += reward;

    db.transactions.unshift({
      id: `tx-milestone-${target}-${Date.now()}`,
      userId: user.id,
      type: 'referral_bonus',
      amount: reward,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Invite ${target} Depositors Reward (+${reward.toLocaleString()} RWF)`,
    });

    saveDb();
    notifyUserSync(user.id);
    notifyAdminState('user_updated');
    res.json({
      reward,
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/spin', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const amount = Number(req.body?.amount || 0);
    const freeSpinsDelta = Number(req.body?.freeSpinsDelta ?? -1);
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.balance += Math.max(0, amount);
    user.totalIncome += Math.max(0, amount);
    user.freeSpins = Math.max(0, user.freeSpins + freeSpinsDelta);
    if (amount > 0) {
      db.transactions.unshift({
        id: `tx-${Date.now()}`,
        userId: user.id,
        type: 'spin_bonus',
        amount,
        status: 'completed',
        timestamp: new Date().toLocaleString('en-GB'),
        description: "Igihembo cy'Uruziga (Lucky Wheel)",
      });
    }
    saveDb();
    notifyUserSync(user.id);
    notifyAdminState('user_updated');
    res.json({
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/redeem-code', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const codeStr = String(req.body?.code || '').trim().toUpperCase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const matched = db.redemptionCodes.find((c) => c.code.toUpperCase() === codeStr);
    if (!matched) {
      res.status(404).json({ success: false, reason: 'invalid' });
      return;
    }
    if (!matched.isActive) {
      res.status(400).json({ success: false, reason: 'inactive' });
      return;
    }
    if (user.redeemedCodes.includes(matched.code)) {
      res.status(400).json({ success: false, reason: 'already_redeemed' });
      return;
    }
    if (matched.maxUses && matched.usedCount >= matched.maxUses) {
      res.status(400).json({ success: false, reason: 'limit_reached' });
      return;
    }

    user.balance += matched.amount;
    user.totalIncome += matched.amount;
    user.redeemedCodes.push(matched.code);
    matched.usedCount += 1;

    db.transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: user.id,
      type: 'gift_code',
      amount: matched.amount,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kode y'Impano (${matched.code})`,
    });

    saveDb();
    notifyUserSync(user.id);
    notifyAdminState('code_redeemed');
    res.json({
      success: true,
      amount: matched.amount,
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/invest', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const productId = String(req.body?.productId || '');
    const lang = req.body?.language === 'en' ? 'en' : 'rw';
    const user = db.users.find((u) => u.id === userId);
    const product = db.products.find((p) => p.id === productId);
    if (!user || !product) {
      res.status(404).json({ error: 'User or product not found' });
      return;
    }
    const alreadyActive = db.investments.some(
      (inv) =>
        inv.userId === user.id &&
        inv.vipLevel === product.vipLevel &&
        inv.status === 'active'
    );
    if (alreadyActive) {
      res.status(409).json({ error: `You already own an active VIP ${product.vipLevel} contract` });
      return;
    }
    if (user.balance < product.price) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    user.balance -= product.price;
    user.vipLevel = Math.max(user.vipLevel, product.vipLevel);

    const newInv: ServerInvestment = {
      id: `inv-${Date.now()}`,
      userId: user.id,
      productId: product.id,
      productName: lang === 'rw' ? product.nameRw : product.nameEn,
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

    db.investments.unshift(newInv);
    db.transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: user.id,
      type: 'product_purchase',
      amount: product.price,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Gushora muri VIP ${product.vipLevel} (${product.nameRw})`,
    });

    // Credit 38% (L1), 2% (L2), 1% (L3) referral commissions immediately to inviters
    creditReferralCommissions(user, product.price, product.nameRw);

    saveDb();
    notifyUserSync(user.id, 'investment_created');
    notifyReferrerChainSync(user);
    notifyAdminState('investment_created');
    res.json({
      user: sanitizeUser(user),
      investments: db.investments.filter((i) => i.userId === user.id),
      transactions: db.transactions.filter((t) => t.userId === user.id),
      teamMembers: getTeamMembersForUser(user),
    });
  });

  app.post('/api/user/claim-task', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const investmentId = String(req.body?.investmentId || '');
    const user = db.users.find((u) => u.id === userId);
    const inv = db.investments.find((i) => i.id === investmentId && i.userId === userId);
    if (!user || !inv || inv.status !== 'active') {
      res.status(404).json({ error: 'Active investment not found' });
      return;
    }

    const nowMs = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (inv.lastClaimAt && nowMs - inv.lastClaimAt < cooldownMs) {
      res.status(429).json({ error: '24-hour claim cooldown active' });
      return;
    }

    const reward = inv.dailyIncome;
    inv.lastClaimAt = nowMs;
    inv.daysRemaining = Math.max(0, inv.daysRemaining - 1);
    inv.totalIncomeEarned = (inv.totalIncomeEarned || 0) + reward;
    inv.status = inv.daysRemaining <= 0 ? 'completed' : 'active';

    user.balance += reward;
    user.totalIncome += reward;

    db.transactions.unshift({
      id: `tx-${nowMs}`,
      userId: user.id,
      type: 'task_earning',
      amount: reward,
      status: 'completed',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Inyungu ya VIP ${inv.vipLevel} (24h)`,
    });

    saveDb();
    notifyUserSync(user.id, 'task_claimed');
    notifyAdminState('task_claimed');
    res.json({
      user: sanitizeUser(user),
      investments: db.investments.filter((i) => i.userId === user.id),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/recharges', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const amount = Number(req.body?.amount || 0);
    const method = req.body?.method === 'airtel' ? 'airtel' : 'mtn';
    const senderPhone = normalizePhone(req.body?.senderPhone);
    const txId = String(req.body?.txId || '').trim();

    const user = db.users.find((u) => u.id === userId);
    if (!user || amount < db.settings.minDeposit) {
      res.status(400).json({ error: 'Invalid recharge request' });
      return;
    }
    if (!senderPhone || senderPhone.length < 9) {
      res.status(400).json({ error: 'Invalid sender phone number' });
      return;
    }
    if (!txId || txId.length < 5 || !/^[a-zA-Z0-9._\-]+$/.test(txId)) {
      res.status(400).json({
        error: 'Valid MoMo / Airtel Transaction ID is required (minimum 5 characters)',
      });
      return;
    }
    const duplicateTx = db.recharges.some(
      (r) =>
        r.transactionId.trim().toUpperCase() === txId.toUpperCase() &&
        r.status !== 'rejected'
    );
    if (duplicateTx) {
      res.status(409).json({
        error: 'This Transaction ID has already been submitted.',
      });
      return;
    }

    const newReq: ServerRecharge = {
      id: `req-${Date.now()}`,
      userId: user.id,
      userPhone: user.phone,
      amount,
      paymentMethod: method,
      senderPhone,
      transactionId: txId,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
    };
    db.recharges.unshift(newReq);

    db.transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: user.id,
      requestId: newReq.id,
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kubitsa (${method.toUpperCase()}: ${senderPhone} · ID: ${txId})`,
    });

    saveDb();
    notifyUserSync(user.id, 'recharge_created');
    broadcastLiveActivity();
    notifyAdminState('recharge_created');
    res.status(201).json({
      recharge: newReq,
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/user/payout-account', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const method = req.body?.method === 'airtel' ? 'airtel' : 'mtn';
    const cleanPhone = normalizePhone(req.body?.phone);
    const cleanName = String(req.body?.name || '').trim();

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 9) {
      res.status(400).json({ error: 'Invalid payout phone number' });
      return;
    }

    user.payoutMethod = method;
    user.payoutPhone = cleanPhone;
    if (cleanName) {
      user.payoutName = cleanName;
    }
    saveDb();
    notifyUserSync(user.id, 'payout_saved');
    notifyAdminState('user_updated');
    res.json({ ok: true, user: sanitizeUser(user) });
  });

  app.post('/api/withdrawals', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = String(req.authUserId || req.body?.userId || '');
    const amount = Number(req.body?.amount || 0);
    const method = req.body?.method === 'airtel' ? 'airtel' : 'mtn';
    const recipientPhone = normalizePhone(req.body?.recipientPhone);
    const recipientName = String(req.body?.recipientName || '').trim() || 'MoMo Account Holder';

    const user = db.users.find((u) => u.id === userId);
    if (!user || amount < db.settings.minWithdrawal || user.balance < amount) {
      res.status(400).json({ error: 'Invalid withdrawal request or insufficient balance' });
      return;
    }
    if (!recipientPhone || recipientPhone.length < 9) {
      res.status(400).json({ error: 'Invalid recipient phone number' });
      return;
    }

    const fee = Math.round((amount * db.settings.withdrawalFeePercent) / 100);
    const netAmount = amount - fee;

    const newWithdraw: ServerWithdraw = {
      id: `wth-${Date.now()}`,
      userId: user.id,
      userPhone: user.phone,
      amount,
      fee,
      netAmount,
      paymentMethod: method,
      recipientPhone,
      recipientName,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
    };

    user.balance -= amount;
    user.totalWithdrawn += amount;
    user.payoutMethod = method;
    user.payoutPhone = recipientPhone;
    user.payoutName = recipientName;
    db.withdrawals.unshift(newWithdraw);

    db.transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: user.id,
      requestId: newWithdraw.id,
      type: 'withdraw',
      amount,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-GB'),
      description: `Kubikuza (${method.toUpperCase()}: ${recipientPhone})`,
    });

    saveDb();
    notifyUserSync(user.id, 'withdrawal_created');
    broadcastLiveActivity();
    notifyAdminState('withdrawal_created');
    res.status(201).json({
      user: sanitizeUser(user),
      withdrawal: newWithdraw,
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  // ADMIN PROTECTED ENDPOINTS
  app.get('/api/admin/state', requireAdmin, (_req: Request, res: Response) => {
    res.json(buildAdminStatePayload());
  });

  app.post('/api/admin/import-cloud-state', requireAdmin, (req: Request, res: Response) => {
    const incomingUsers = Array.isArray(req.body?.users) ? req.body.users : [];
    const incomingInvestments = Array.isArray(req.body?.investments) ? req.body.investments : [];
    const incomingTransactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];
    const incomingRecharges = Array.isArray(req.body?.recharges) ? req.body.recharges : [];
    const incomingWithdrawals = Array.isArray(req.body?.withdrawals) ? req.body.withdrawals : [];
    const incomingCodes = Array.isArray(req.body?.redemptionCodes) ? req.body.redemptionCodes : [];
    const incomingSettings = req.body?.settings;

    let importedUsers = 0;
    for (const u of incomingUsers) {
      const cleanPhone = normalizePhone(u?.phone);
      if (!cleanPhone || cleanPhone.length < 9) continue;
      if (cleanPhone === ADMIN_PHONE) continue;
      const existing = db.users.find((x) => x.phone === cleanPhone || x.id === u.id);
      if (existing) {
        existing.balance = Number(u.balance ?? existing.balance);
        existing.totalIncome = Number(u.totalIncome ?? existing.totalIncome);
        existing.totalWithdrawn = Number(u.totalWithdrawn ?? existing.totalWithdrawn);
        existing.totalRecharged = Number(u.totalRecharged ?? existing.totalRecharged);
        existing.vipLevel = Number(u.vipLevel ?? existing.vipLevel);
        existing.teamCountLevel1 = Number(u.teamCountLevel1 ?? existing.teamCountLevel1);
        existing.teamCountLevel2 = Number(u.teamCountLevel2 ?? existing.teamCountLevel2);
        existing.teamCountLevel3 = Number(u.teamCountLevel3 ?? existing.teamCountLevel3);
        existing.teamCommission = Number(u.teamCommission ?? existing.teamCommission);
        existing.isBanned = Boolean(u.isBanned ?? existing.isBanned);
        if (u.payoutMethod) existing.payoutMethod = u.payoutMethod;
        if (u.payoutPhone) existing.payoutPhone = u.payoutPhone;
        if (u.payoutName) existing.payoutName = u.payoutName;
      } else {
        db.users.push({
          id: String(u.id || `user-${cleanPhone}`),
          phone: cleanPhone,
          password: hashPassword(String(u.password || 'picanon123')),
          balance: Number(u.balance || 0),
          totalIncome: Number(u.totalIncome || 0),
          totalWithdrawn: Number(u.totalWithdrawn || 0),
          totalRecharged: Number(u.totalRecharged || 0),
          vipLevel: Number(u.vipLevel || 0),
          referralCode: String(u.referralCode || `PIC${cleanPhone.slice(-6)}`),
          referredBy: typeof u.referredBy === 'string' ? u.referredBy : undefined,
          teamCountLevel1: Number(u.teamCountLevel1 || 0),
          teamCountLevel2: Number(u.teamCountLevel2 || 0),
          teamCountLevel3: Number(u.teamCountLevel3 || 0),
          teamCommission: Number(u.teamCommission || 0),
          freeSpins: Number(u.freeSpins ?? 2),
          hasClaimedWelcomeBonus: Boolean(u.hasClaimedWelcomeBonus ?? true),
          lastCheckInDate: typeof u.lastCheckInDate === 'string' ? u.lastCheckInDate : undefined,
          payoutMethod: u.payoutMethod === 'airtel' ? 'airtel' : u.payoutMethod === 'mtn' ? 'mtn' : undefined,
          payoutPhone: typeof u.payoutPhone === 'string' ? u.payoutPhone : undefined,
          payoutName: typeof u.payoutName === 'string' ? u.payoutName : undefined,
          isAdmin: false,
          isBanned: Boolean(u.isBanned),
          createdAt: String(u.createdAt || new Date().toISOString().split('T')[0]),
          redeemedCodes: Array.isArray(u.redeemedCodes) ? u.redeemedCodes : [],
        });
        importedUsers += 1;
      }
    }

    for (const inv of incomingInvestments) {
      if (!inv?.id || db.investments.some((x) => x.id === inv.id)) continue;
      db.investments.push(inv);
    }
    for (const tx of incomingTransactions) {
      if (!tx?.id || db.transactions.some((x) => x.id === tx.id)) continue;
      db.transactions.push(tx);
    }
    for (const r of incomingRecharges) {
      if (!r?.id || db.recharges.some((x) => x.id === r.id)) continue;
      db.recharges.push(r);
    }
    for (const w of incomingWithdrawals) {
      if (!w?.id || db.withdrawals.some((x) => x.id === w.id)) continue;
      db.withdrawals.push(w);
    }
    for (const c of incomingCodes) {
      if (!c?.id) continue;
      const existing = db.redemptionCodes.find((x) => x.id === c.id || x.code === c.code);
      if (!existing) {
        db.redemptionCodes.push(c);
      }
    }
    if (incomingSettings && typeof incomingSettings === 'object') {
      db.settings = { ...db.settings, ...incomingSettings };
    }

    saveDb();
    broadcastLiveActivity();
    notifyAllUsersBootstrap('cloud_restored');
    notifyAdminState('cloud_restored');
    res.json({
      ok: true,
      importedUsers,
      ...buildAdminStatePayload(),
    });
  });

  app.post('/api/admin/recharges/:id/approve', requireAdmin, (req: Request, res: Response) => {
    const reqItem = db.recharges.find((r) => r.id === req.params.id);
    if (!reqItem || reqItem.status !== 'pending') {
      res.status(404).json({ error: 'Pending recharge not found' });
      return;
    }
    const reviewedAt = new Date().toLocaleString('en-GB');
    reqItem.status = 'approved';
    reqItem.reviewedBy = 'Admin';
    reqItem.reviewedAt = reviewedAt;
    const user = db.users.find((u) => u.id === reqItem.userId || u.phone === reqItem.userPhone);
    if (user) {
      user.balance += reqItem.amount;
      user.totalRecharged += reqItem.amount;
    }
    const tx =
      db.transactions.find((t) => t.requestId === reqItem.id) ||
      db.transactions.find(
        (t) =>
          t.userId === reqItem.userId &&
          t.type === 'deposit' &&
          t.status === 'pending' &&
          t.amount === reqItem.amount
      );
    if (tx) {
      tx.status = 'completed';
      tx.reviewedBy = 'Admin';
    }
    saveDb();
    if (user) notifyUserSync(user.id, 'recharge_approved');
    broadcastLiveActivity();
    notifyAdminState('recharge_approved');
    res.json({ ok: true, recharge: reqItem });
  });

  app.post('/api/admin/recharges/:id/reject', requireAdmin, (req: Request, res: Response) => {
    const reqItem = db.recharges.find((r) => r.id === req.params.id);
    if (!reqItem || reqItem.status !== 'pending') {
      res.status(404).json({ error: 'Pending recharge not found' });
      return;
    }
    const reviewedAt = new Date().toLocaleString('en-GB');
    reqItem.status = 'rejected';
    reqItem.reviewedBy = 'Admin';
    reqItem.reviewedAt = reviewedAt;
    const tx =
      db.transactions.find((t) => t.requestId === reqItem.id) ||
      db.transactions.find(
        (t) =>
          t.userId === reqItem.userId &&
          t.type === 'deposit' &&
          t.status === 'pending' &&
          t.amount === reqItem.amount
      );
    if (tx) {
      tx.status = 'rejected';
      tx.reviewedBy = 'Admin';
    }
    saveDb();
    notifyUserSync(reqItem.userId, 'recharge_rejected');
    broadcastLiveActivity();
    notifyAdminState('recharge_rejected');
    res.json({ ok: true, recharge: reqItem });
  });

  app.post('/api/admin/withdrawals/:id/approve', requireAdmin, (req: Request, res: Response) => {
    const wth = db.withdrawals.find((w) => w.id === req.params.id);
    if (!wth || wth.status !== 'pending') {
      res.status(404).json({ error: 'Pending withdrawal not found' });
      return;
    }
    const reviewedAt = new Date().toLocaleString('en-GB');
    wth.status = 'approved';
    wth.reviewedBy = 'Admin';
    wth.reviewedAt = reviewedAt;
    const tx =
      db.transactions.find((t) => t.requestId === wth.id) ||
      db.transactions.find(
        (t) =>
          t.userId === wth.userId &&
          t.type === 'withdraw' &&
          t.status === 'pending' &&
          t.amount === wth.amount
      );
    if (tx) {
      tx.status = 'completed';
      tx.reviewedBy = 'Admin';
    }
    saveDb();
    notifyUserSync(wth.userId, 'withdrawal_approved');
    broadcastLiveActivity();
    notifyAdminState('withdrawal_approved');
    res.json({ ok: true, withdrawal: wth });
  });

  app.post('/api/admin/withdrawals/:id/reject', requireAdmin, (req: Request, res: Response) => {
    const wth = db.withdrawals.find((w) => w.id === req.params.id);
    if (!wth || wth.status !== 'pending') {
      res.status(404).json({ error: 'Pending withdrawal not found' });
      return;
    }
    const reviewedAt = new Date().toLocaleString('en-GB');
    wth.status = 'rejected';
    wth.reviewedBy = 'Admin';
    wth.reviewedAt = reviewedAt;
    const user = db.users.find((u) => u.id === wth.userId || u.phone === wth.userPhone);
    if (user) {
      user.balance += wth.amount;
      user.totalWithdrawn = Math.max(0, user.totalWithdrawn - wth.amount);
    }
    const tx =
      db.transactions.find((t) => t.requestId === wth.id) ||
      db.transactions.find(
        (t) =>
          t.userId === wth.userId &&
          t.type === 'withdraw' &&
          t.status === 'pending' &&
          t.amount === wth.amount
      );
    if (tx) {
      tx.status = 'rejected';
      tx.reviewedBy = 'Admin';
    }
    saveDb();
    if (user) notifyUserSync(user.id, 'withdrawal_rejected');
    broadcastLiveActivity();
    notifyAdminState('withdrawal_rejected');
    res.json({ ok: true, withdrawal: wth });
  });

  app.post('/api/admin/users/:id/credit', requireAdmin, (req: Request, res: Response) => {
    const amount = Number(req.body?.amount || 0);
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user || isNaN(amount)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.balance = Math.max(0, user.balance + amount);
    if (amount > 0) {
      db.transactions.unshift({
        id: `tx-${Date.now()}`,
        userId: user.id,
        type: 'admin_credit',
        amount,
        status: 'completed',
        timestamp: new Date().toLocaleString('en-GB'),
        description: `Ubuyobozi bwongereye konti (+${amount.toLocaleString()} RWF)`,
      });
    }
    saveDb();
    notifyUserSync(user.id, 'admin_credited');
    notifyAdminState('user_credited');
    res.json({ ok: true, user: sanitizeUser(user) });
  });

  app.post('/api/admin/users/:id/vip', requireAdmin, (req: Request, res: Response) => {
    const vipLevel = Math.min(10, Math.max(0, Number(req.body?.vipLevel ?? 0)));
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.vipLevel = vipLevel;
    saveDb();
    notifyUserSync(user.id, 'vip_updated');
    notifyAdminState('user_vip_updated');
    res.json({ ok: true, user: sanitizeUser(user) });
  });

  app.post('/api/admin/users/:id/ban', requireAdmin, (req: Request, res: Response) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user || user.isAdmin) {
      res.status(400).json({ error: 'Cannot ban this account' });
      return;
    }
    user.isBanned = !user.isBanned;
    saveDb();
    notifyUserSync(user.id, 'ban_toggled');
    notifyAdminState('user_ban_toggled');
    res.json({ ok: true, user: sanitizeUser(user) });
  });

  app.post('/api/admin/codes', requireAdmin, (req: Request, res: Response) => {
    const code = req.body as ServerCode;
    if (!code || !code.code || !code.amount) {
      res.status(400).json({ error: 'Invalid code payload' });
      return;
    }
    db.redemptionCodes.unshift(code);
    saveDb();
    notifyAdminState('codes_updated');
    res.status(201).json({ ok: true, code });
  });

  app.patch('/api/admin/codes/:id/toggle', requireAdmin, (req: Request, res: Response) => {
    const item = db.redemptionCodes.find((c) => c.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Code not found' });
      return;
    }
    item.isActive = !item.isActive;
    saveDb();
    notifyAdminState('codes_updated');
    res.json({ ok: true, code: item });
  });

  app.delete('/api/admin/codes/:id', requireAdmin, (req: Request, res: Response) => {
    db.redemptionCodes = db.redemptionCodes.filter((c) => c.id !== req.params.id);
    saveDb();
    notifyAdminState('codes_updated');
    res.json({ ok: true });
  });

  app.patch('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
    db.settings = { ...db.settings, ...req.body };
    saveDb();
    notifyAllUsersBootstrap('settings_updated');
    notifyAdminState('settings_updated');
    res.json({ ok: true, settings: db.settings });
  });

  app.post('/api/admin/clear-records', requireAdmin, (_req: Request, res: Response) => {
    db.recharges = [];
    db.withdrawals = [];
    db.transactions = [];
    saveDb();
    broadcastLiveActivity();
    notifyAllUsersBootstrap('records_cleared');
    notifyAdminState('records_cleared');
    res.json({ ok: true });
  });

  app.post('/api/admin/reset-users', requireAdmin, (_req: Request, res: Response) => {
    const cleanAdmin = createSeedDatabase().users[0];
    db.users = [cleanAdmin];
    db.investments = [];
    db.transactions = [];
    db.recharges = [];
    db.withdrawals = [];
    db.redemptionCodes = db.redemptionCodes.map((c) => ({ ...c, usedCount: 0 }));
    db.lastResetAt = Date.now();
    saveDb();
    broadcastLiveActivity();
    notifyAllUsersBootstrap('users_reset');
    notifyAdminState('users_reset');
    res.json({
      ok: true,
      resetAt: db.lastResetAt,
      allUsers: db.users.map(sanitizeUser),
    });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const newDaily = Number(req.body?.dailyIncome || 0);
    const prod = db.products.find((p) => p.id === req.params.id);
    if (!prod || newDaily <= 0) {
      res.status(400).json({ error: 'Invalid product update' });
      return;
    }
    prod.dailyIncome = newDaily;
    prod.totalIncome = newDaily * prod.cycleDays;
    saveDb();
    notifyAllUsersBootstrap('products_updated');
    notifyAdminState('products_updated');
    res.json({ ok: true, product: prod });
  });

  app.get('/api/admin/export-zip', (req: Request, res: Response) => {
    const adminTok = String(req.headers['x-admin-token'] || req.query.adminToken || '').trim();
    const userPayload = verifyUserToken(extractUserTokenFromRequest(req));
    const exportSig = String(req.query.exportSig || '').trim();
    if (!isValidAdminToken(adminTok) && userPayload?.role !== 'admin' && !verifyExportSig(exportSig)) {
      res.status(401).json({ error: 'Admin authorization required' });
      return;
    }

    const kind = String(req.query.type || 'full').trim().toLowerCase();
    const filename =
      kind === 'dist'
        ? 'dist.zip'
        : kind === 'single'
          ? 'index.html'
          : kind === 'vercel'
            ? 'picanon-vercel.zip'
            : 'picanon-business-publish.zip';
    const exportPath = path.join(__dirname, 'exports', filename);
    if (!fs.existsSync(exportPath)) {
      res.status(404).json({ error: 'Export package not found' });
      return;
    }
    res.setHeader(
      'Content-Type',
      kind === 'single' ? 'text/html; charset=utf-8' : 'application/zip'
    );
    res.download(exportPath, filename);
  });

  // Vite middleware in dev, static dist in production
  const distPath = path.join(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));
  const hasVitePackage = fs.existsSync(path.join(__dirname, 'node_modules', 'vite'));
  const isProdRuntime =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RAILWAY_ENVIRONMENT);
  if (isProdRuntime && hasBuiltDist) {
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (hasVitePackage) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (hasBuiltDist) {
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler so malformed requests never crash the server
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Picanon] Express error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Picanon server running on http://0.0.0.0:${port}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[Picanon] Uncaught exception (kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Picanon] Unhandled rejection (kept alive):', reason);
});

startServer().catch((err) => {
  console.error('[Picanon] Failed to start server:', err);
});
