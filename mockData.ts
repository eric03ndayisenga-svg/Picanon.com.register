import {
  VIPProduct,
  AdminSettings,
  RedemptionCode,
  UserAccount,
  RechargeRequest,
  WithdrawRequest,
} from '../types';
import {
  picanonClassicSneakers,
  picanonStreetwearCollection,
  picanonLeatherBoots,
  picanonTailoredSuit,
  picanonAthleticRunners,
  picanonVip5Tracksuit,
  picanonVip6Capsule,
  picanonVip7Atelier,
  picanonVip8Showroom,
  picanonVip9Couture,
  picanonVip10Empire,
} from '../assets/images';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
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

export const INITIAL_VIP_PRODUCTS: VIPProduct[] = [
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
    image: picanonClassicSneakers,
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
    image: picanonAthleticRunners,
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
    image: picanonStreetwearCollection,
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
    image: picanonLeatherBoots,
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
    image: picanonTailoredSuit,
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
    image: picanonVip5Tracksuit,
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
    image: picanonVip6Capsule,
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
    image: picanonVip7Atelier,
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
    image: picanonVip8Showroom,
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
    image: picanonVip9Couture,
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
    image: picanonVip10Empire,
    descriptionRw:
      "Icyiciro cy'ikirenga cy'ubufatanye bwuzuye mu nganda n'amaduka ya Picanon ku isi yose.",
    descriptionEn:
      'Apex global fashion empire partnership encompassing flagship boutiques, footwear ateliers, and worldwide retail.',
  },
];

export const INITIAL_PRODUCTS = INITIAL_VIP_PRODUCTS;

// Official company-issued redemption codes only
export const INITIAL_REDEMPTION_CODES: RedemptionCode[] = [
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
];

export const DEFAULT_REDEMPTION_CODES = INITIAL_REDEMPTION_CODES;

export const ADMIN_USER: UserAccount = {
  id: 'admin-0793002388',
  phone: '0793002388',
  password: 'eric123',
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
};

export const MOCK_USER: UserAccount = {
  id: 'user-0782203564',
  phone: '0782203564',
  password: 'user123',
  balance: 3000,
  totalIncome: 3500,
  totalWithdrawn: 0,
  totalRecharged: 3000,
  vipLevel: 1,
  referralCode: 'PIC220356',
  teamCountLevel1: 3,
  teamCountLevel2: 1,
  teamCountLevel3: 0,
  teamCommission: 1250,
  freeSpins: 0,
  hasClaimedWelcomeBonus: true,
  isAdmin: false,
  createdAt: '2026-03-10',
  redeemedCodes: [],
};

export const INITIAL_RECHARGES: RechargeRequest[] = [];

export const INITIAL_WITHDRAWALS: WithdrawRequest[] = [];
