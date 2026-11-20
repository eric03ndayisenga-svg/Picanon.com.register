export type Language = 'rw' | 'en';

export interface UserAccount {
  id: string;
  phone: string;
  password?: string;
  balance: number;
  totalIncome: number;
  totalWithdrawn: number;
  totalRecharged: number;
  vipLevel: number; // 0 to 10
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

export interface VIPProduct {
  id: string;
  vipLevel: number; // 0 to 10
  nameRw: string;
  nameEn: string;
  price: number;
  dailyIncome: number;
  cycleDays: number;
  totalIncome: number;
  tasksPerDay: number;
  popular?: boolean;
  image?: string;
  descriptionRw: string;
  descriptionEn: string;
}

export interface InvestmentRecord {
  id: string;
  userId?: string;
  productId: string;
  productName: string;
  vipLevel: number;
  amountInvested: number;
  amount?: number;
  dailyIncome: number;
  cycleDays: number;
  daysRemaining: number;
  datePurchased: string;
  status: 'active' | 'completed';
  totalIncomeEarned?: number;
  lastClaimAt?: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  requestId?: string;
  reviewedBy?: string;
  type:
    | 'deposit'
    | 'withdraw'
    | 'task_earning'
    | 'spin_bonus'
    | 'welcome_bonus'
    | 'referral_bonus'
    | 'gift_code'
    | 'product_purchase'
    | 'admin_credit';
  amount: number;
  status: 'completed' | 'pending' | 'rejected';
  timestamp: string;
  description: string;
  phone?: string;
  method?: 'mtn' | 'airtel' | 'system';
  txHash?: string;
}

export interface RechargeRequest {
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

export interface WithdrawRequest {
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

export interface RedemptionCode {
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

export interface AdminSettings {
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
  telegramChannel?: string;
  whatsappSupport: string;
}

export interface DailyTask {
  id: string;
  vipLevel: number;
  titleRw: string;
  titleEn: string;
  reward: number;
  durationSec: number;
  completed: boolean;
  videoUrl?: string;
}

export interface LiveActivityItem {
  id: string;
  type: 'deposit' | 'withdraw';
  maskedPhone: string;
  amount: number;
  method: 'mtn' | 'airtel';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  isReal?: boolean;
}

export interface TeamMemberSummary {
  id: string;
  maskedPhone: string;
  level: 1 | 2 | 3;
  vipLevel: number;
  totalInvested: number;
  hasDeposited?: boolean;
  createdAt: string;
}

