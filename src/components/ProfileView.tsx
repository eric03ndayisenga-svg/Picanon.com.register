import React, { useState, useMemo, useEffect } from 'react';
import {
  Info,
  Package,
  Landmark,
  HelpCircle,
  Gift,
  FileText,
  CalendarCheck,
  ChevronRight,
  LogOut,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Shield,
} from 'lucide-react';
import {
  UserAccount,
  Transaction,
  RechargeRequest,
  WithdrawRequest,
  Language,
} from '../types';
import { picanonProfileBanner } from '../assets/images';

interface ProfileViewProps {
  user: UserAccount;
  transactions: Transaction[];
  rechargeRequests?: RechargeRequest[];
  withdrawRequests?: WithdrawRequest[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenSupport: () => void;
  onOpenLiveChat?: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onOpenFaq?: () => void;
  onOpenGiftCode?: () => void;
  onToggleLanguage?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToTasks?: () => void;
  onDailyCheckIn?: () => Promise<boolean>;
  onSavePayoutAccount?: (method: 'mtn' | 'airtel', phone: string, name: string) => Promise<boolean>;
  onLogout: () => void;
  openRecordsSignal?: number;
  language: Language;
}

type RecordStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type RecordTypeFilter = 'all' | 'deposit' | 'withdraw' | 'other';

interface UnifiedRecordItem {
  id: string;
  kind: 'deposit' | 'withdraw' | 'other';
  title: string;
  subtitle: string;
  amount: number;
  netAmount?: number;
  fee?: number;
  method?: string;
  reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  timestamp: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  transactions,
  rechargeRequests = [],
  withdrawRequests = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSupport,
  onOpenLiveChat,
  onOpenAdmin,
  onOpenAbout,
  onOpenFaq,
  onOpenGiftCode,
  onToggleLanguage,
  onNavigateToProducts,
  onNavigateToTasks,
  onDailyCheckIn,
  onSavePayoutAccount,
  onLogout,
  openRecordsSignal = 0,
  language,
}) => {
  const isRw = language === 'rw';
  const [activeModal, setActiveModal] = useState<
    'withdraw_records' | 'recharge_records' | 'account_records' | 'bank_mgmt' | 'rules' | null
  >(null);
  const [recordFilter, setRecordFilter] = useState<RecordStatusFilter>('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState<RecordTypeFilter>('all');

  useEffect(() => {
    if (openRecordsSignal > 0) {
      setRecordTypeFilter('all');
      setRecordFilter('all');
      setActiveModal('account_records');
    }
  }, [openRecordsSignal]);

  const [checkInDone, setCheckInDone] = useState<boolean>(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<'mtn' | 'airtel'>(user.payoutMethod || 'mtn');
  const [payoutPhone, setPayoutPhone] = useState<string>(user.payoutPhone || user.phone || '');
  const [payoutName, setPayoutName] = useState<string>(user.payoutName || '');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSaving, setPayoutSaving] = useState<boolean>(false);

  const todayIso = new Date().toISOString().split('T')[0];
  const isCheckedInToday = checkInDone || user.lastCheckInDate === todayIso;

  const formattedPhone = user.phone.startsWith('0')
    ? `+250 ${user.phone.slice(1)}`
    : user.phone.startsWith('250')
      ? `+${user.phone}`
      : `+250 ${user.phone}`;

  // Handle Daily Check-in
  const handleDailyCheckIn = async () => {
    if (isCheckedInToday) {
      setCheckInMessage(
        isRw
          ? 'Wamaze gukora Daily Check-in uyu munsi!'
          : 'You already completed daily check-in today!'
      );
      setTimeout(() => setCheckInMessage(null), 3000);
      return;
    }

    if (onDailyCheckIn) {
      const ok = await onDailyCheckIn();
      setCheckInDone(true);
      setCheckInMessage(
        ok
          ? isRw
            ? "Wahawe RWF 100 y'inyongezo muri konti yawe!"
            : 'Daily check-in successful! +100 RWF added to your account.'
          : isRw
            ? 'Wamaze gukora Daily Check-in uyu munsi!'
            : 'You already completed daily check-in today!'
      );
      setTimeout(() => setCheckInMessage(null), 3500);
      return;
    }

    setCheckInDone(true);
    setCheckInMessage(
      isRw
        ? "Wahawe RWF 100 y'inyongezo muri konti yawe!"
        : 'Daily check-in successful! +100 RWF added to your account.'
    );
    setTimeout(() => setCheckInMessage(null), 4000);
  };

  const mapTxStatus = (s: Transaction['status']): 'pending' | 'approved' | 'rejected' => {
    if (s === 'completed') return 'approved';
    if (s === 'rejected') return 'rejected';
    return 'pending';
  };

  // Authoritative Deposit records (from live rechargeRequests + fallback deposit transactions)
  const depositRecords = useMemo<UnifiedRecordItem[]>(() => {
    const list: UnifiedRecordItem[] = rechargeRequests.map((r) => ({
      id: r.id,
      kind: 'deposit',
      title: isRw
        ? `Kubitsa (${r.paymentMethod.toUpperCase()}: ${r.senderPhone})`
        : `Deposit (${r.paymentMethod.toUpperCase()}: ${r.senderPhone})`,
      subtitle: `${r.paymentMethod.toUpperCase()} · ${r.senderPhone}`,
      amount: r.amount,
      method: r.paymentMethod,
      reference: r.transactionId,
      status: r.status,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      timestamp: r.timestamp,
    }));

    const reqIds = new Set(list.map((r) => r.id));
    const reqSigs = new Set(list.map((r) => `${r.amount}|${r.timestamp}|${r.status}`));
    for (const tx of transactions) {
      if (tx.type !== 'deposit') continue;
      if (tx.requestId && reqIds.has(tx.requestId)) continue;
      const mapped = mapTxStatus(tx.status);
      const sig = `${tx.amount}|${tx.timestamp}|${mapped}`;
      if (!reqSigs.has(sig)) {
        list.push({
          id: tx.id,
          kind: 'deposit',
          title: tx.description,
          subtitle: 'Deposit',
          amount: tx.amount,
          reference: tx.txHash || tx.id,
          status: mapped,
          reviewedBy: tx.reviewedBy,
          timestamp: tx.timestamp,
        });
      }
    }
    return list;
  }, [rechargeRequests, transactions, isRw]);

  // Authoritative Withdraw records (from live withdrawRequests + fallback withdraw transactions)
  const withdrawRecords = useMemo<UnifiedRecordItem[]>(() => {
    const list: UnifiedRecordItem[] = withdrawRequests.map((w) => ({
      id: w.id,
      kind: 'withdraw',
      title: isRw
        ? `Kubikuza (${w.paymentMethod.toUpperCase()}: ${w.recipientPhone})`
        : `Withdraw (${w.paymentMethod.toUpperCase()}: ${w.recipientPhone})`,
      subtitle: `${w.paymentMethod.toUpperCase()} · ${w.recipientPhone}${w.recipientName ? ` · ${w.recipientName}` : ''}`,
      amount: w.amount,
      netAmount: w.netAmount,
      fee: w.fee,
      method: w.paymentMethod,
      reference: w.id,
      status: w.status,
      reviewedBy: w.reviewedBy,
      reviewedAt: w.reviewedAt,
      timestamp: w.timestamp,
    }));

    const reqIds = new Set(list.map((w) => w.id));
    const reqSigs = new Set(list.map((w) => `${w.amount}|${w.timestamp}|${w.status}`));
    for (const tx of transactions) {
      if (tx.type !== 'withdraw') continue;
      if (tx.requestId && reqIds.has(tx.requestId)) continue;
      const mapped = mapTxStatus(tx.status);
      const sig = `${tx.amount}|${tx.timestamp}|${mapped}`;
      if (!reqSigs.has(sig)) {
        list.push({
          id: tx.id,
          kind: 'withdraw',
          title: tx.description,
          subtitle: 'Withdraw',
          amount: tx.amount,
          reference: tx.txHash || tx.id,
          status: mapped,
          reviewedBy: tx.reviewedBy,
          timestamp: tx.timestamp,
        });
      }
    }
    return list;
  }, [withdrawRequests, transactions, isRw]);

  // Unified Account Records for Mine -> Records (Ibyakozwe)
  const allAccountRecords = useMemo<UnifiedRecordItem[]>(() => {
    const otherTxs: UnifiedRecordItem[] = transactions
      .filter((tx) => tx.type !== 'deposit' && tx.type !== 'withdraw')
      .map((tx) => ({
        id: tx.id,
        kind: 'other',
        title: tx.description,
        subtitle: tx.type.replace(/_/g, ' '),
        amount: tx.amount,
        reference: tx.txHash || tx.id,
        status: mapTxStatus(tx.status),
        reviewedBy: tx.reviewedBy,
        timestamp: tx.timestamp,
      }));

    return [...depositRecords, ...withdrawRecords, ...otherTxs];
  }, [depositRecords, withdrawRecords, transactions]);

  const renderStatusMeta = (
    status: 'pending' | 'approved' | 'rejected',
    kind?: UnifiedRecordItem['kind']
  ) => {
    const isAdminDecision = kind === 'deposit' || kind === 'withdraw';
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dc2626] text-white text-xs font-black">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {isAdminDecision
              ? isRw
                ? 'Byemejwe na Admin · Approved'
                : 'Approved by Admin'
              : isRw
                ? 'Byemejwe · Approved'
                : 'Approved'}
          </span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fee2e2] border border-[#dc2626] text-[#991b1b] text-xs font-black">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>
            {isAdminDecision
              ? isRw
                ? 'Byanzwe na Admin · Rejected'
                : 'Rejected by Admin'
              : isRw
                ? 'Byanzwe · Rejected'
                : 'Rejected'}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-[#dc2626] text-[#dc2626] text-xs font-black">
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          {isAdminDecision
            ? isRw
              ? 'Bitegereje Admin · Pending'
              : 'Pending Admin'
            : isRw
              ? 'Bitegereje · Pending'
              : 'Pending'}
        </span>
      </span>
    );
  };

  const renderStatusTabs = (items: UnifiedRecordItem[]) => {
    const counts = {
      all: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      approved: items.filter((i) => i.status === 'approved').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    };
    return (
      <div className="flex items-center gap-1 p-1 bg-[#fee2e2] rounded-xl">
        {(
          [
            { key: 'all', label: isRw ? `Byose (${counts.all})` : `All (${counts.all})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'approved', label: `Approved (${counts.approved})` },
            { key: 'rejected', label: `Rejected (${counts.rejected})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setRecordFilter(tab.key)}
            className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-black transition-colors whitespace-nowrap truncate cursor-pointer tabular-nums ${
              recordFilter === tab.key
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-28 max-w-md mx-auto animate-in fade-in duration-150">
      {/* Toast Notification */}
      {checkInMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#b91c1c] border-2 border-white text-white text-sm font-black px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{checkInMessage}</span>
        </div>
      )}

      {/* 1. Top Large Photo Hero Banner: Daily check-in (Red & White) */}
      <div className="relative overflow-hidden bg-[#991b1b] text-white px-5 pt-8 pb-7 min-h-[210px] flex flex-col justify-end">
        <img
          src={picanonProfileBanner}
          alt="Picanon Daily Rewards"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#7f1d1d]/95 via-[#991b1b]/55 to-[#7f1d1d]/35" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-xs">
                {isRw ? 'Check-in ya Buri Munsi' : 'Daily check-in'}
              </h1>
              <p className="text-base font-black text-white mt-0.5">
                {isRw ? 'Ibihembo bya buri munsi (+100 Frw)' : 'Daily rewards (+100 Frw)'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-mono font-black text-white block">
                {formattedPhone}
              </span>
              <span className="inline-block mt-1 text-xs font-black uppercase px-3 py-1 rounded-full bg-white text-[#dc2626] shadow-xs">
                VIP {user.vipLevel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDailyCheckIn}
            className={`w-full py-3.5 rounded-full font-black text-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isCheckedInToday
                ? 'bg-[#fee2e2] text-[#991b1b] border-2 border-white'
                : 'bg-white text-[#dc2626] hover:bg-[#fef2f2] active:scale-[0.99]'
            }`}
          >
            <CalendarCheck className="w-6 h-6 stroke-[2.5]" />
            <span>
              {isCheckedInToday
                ? isRw
                  ? 'Wabikoze uyu munsi'
                  : 'Checked in today'
                : isRw
                  ? 'Check-in nonaha'
                  : 'Check-in now'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Dual Stat Cards: Account balance & Total income */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[26px] border-2 border-[#fecaca] p-4 shadow-[0_6px_18px_rgba(220,38,38,0.08)]">
          <span className="font-display text-2xl sm:text-3xl font-black text-[#dc2626] tabular-nums block truncate">
            {user.balance.toLocaleString()} Frw
          </span>
          <span className="text-sm sm:text-base font-black text-[#7f1d1d] block mt-1.5">
            {isRw ? 'Amafaranga ufite' : 'Account balance'}
          </span>
        </div>

        <div className="bg-white rounded-[26px] border-2 border-[#fecaca] p-4 shadow-[0_6px_18px_rgba(220,38,38,0.08)]">
          <span className="font-display text-2xl sm:text-3xl font-black text-[#b91c1c] tabular-nums block truncate">
            {user.totalIncome.toLocaleString()} Frw
          </span>
          <span className="text-sm sm:text-base font-black text-[#7f1d1d] block mt-1.5">
            {isRw ? 'Inyungu yose' : 'Total income'}
          </span>
        </div>
      </div>

      {/* 3. My Services White Card */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-[28px] border-2 border-[#fecaca] p-5 shadow-[0_6px_20px_rgba(220,38,38,0.08)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-[#7f1d1d] tracking-tight">
              {isRw ? 'Serivisi zanjye' : 'My Services'}
            </h2>
            {onToggleLanguage && (
              <button
                type="button"
                onClick={onToggleLanguage}
                className="px-3.5 py-1.5 rounded-full bg-[#dc2626] text-white text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Globe className="w-4 h-4" />
                <span>{isRw ? 'RW' : 'EN'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-y-6 gap-x-2 text-center">
            <button
              type="button"
              onClick={onOpenAbout}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <Info className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Ibyerekeye' : 'About'}
              </span>
            </button>

            <button
              type="button"
              onClick={onNavigateToProducts}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <Package className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Ibicuruzwa byanjye' : 'My Products'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPayoutMethod(user.payoutMethod || 'mtn');
                setPayoutPhone(user.payoutPhone || user.phone || '');
                setPayoutName(user.payoutName || '');
                setPayoutError(null);
                setActiveModal('bank_mgmt');
              }}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <Landmark className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Konti ya MoMo' : 'Bind Bank'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSupport || onOpenLiveChat}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <HelpCircle className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Ubufasha' : 'Help'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenGiftCode || onNavigateToTasks}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <Gift className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Kode y’Impano' : 'Redeem Code'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecordTypeFilter('all');
                setRecordFilter('all');
                setActiveModal('account_records');
              }}
              className="flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
            >
              <FileText className="w-9 h-9 text-[#dc2626] stroke-[2.3]" />
              <span className="mt-2 text-sm sm:text-base font-black text-[#7f1d1d] leading-tight">
                {isRw ? 'Ibyakozwe' : 'Records'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Finance & Records Links */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-[28px] border-2 border-[#fecaca] shadow-[0_6px_20px_rgba(220,38,38,0.08)] divide-y-2 divide-[#fee2e2] overflow-hidden">
          <button
            type="button"
            onClick={onOpenDeposit}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
          >
            <span className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Kubitsa (Recharge)' : 'Recharge'}
            </span>
            <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onOpenWithdraw}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
          >
            <span className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Kubikuza (Withdrawal)' : 'Withdrawal'}
            </span>
            <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setRecordFilter('all');
              setActiveModal('withdraw_records');
            }}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
          >
            <span className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Ibyo wabikuje' : 'Withdrawal records'}
            </span>
            <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setRecordFilter('all');
              setActiveModal('recharge_records');
            }}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
          >
            <span className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Ibyo wabikije' : 'Recharge records'}
            </span>
            <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
          </button>

          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
            >
              <span className="text-base font-black text-[#7f1d1d]">
                {isRw ? 'Ikigo cy’Imirimo' : 'Task Center'}
              </span>
              <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveModal('rules')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
          >
            <span className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Amategeko y’urubuga' : 'Platform regulation'}
            </span>
            <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
          </button>

          {onOpenFaq && (
            <button
              type="button"
              onClick={onOpenFaq}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fef2f2] transition-colors text-left cursor-pointer"
            >
              <span className="text-base font-black text-[#7f1d1d]">
                {isRw ? 'Ibibazo Bikunze Kubazwa (FAQ)' : 'Frequently Asked Questions'}
              </span>
              <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
            </button>
          )}

          {(user.isAdmin || user.phone === '0793002388') && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-full px-5 py-4 flex items-center justify-between bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors text-left cursor-pointer"
            >
              <span className="text-base font-black text-[#b91c1c] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#dc2626]" />
                <span>{isRw ? 'Ibiro by’Ubuyobozi (Admin)' : 'Admin Console'}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-[#dc2626] stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Log out button */}
      <div className="px-4 mt-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <LogOut className="w-5 h-5 stroke-[2.5]" />
          <span>{isRw ? 'Sohoka muri konti' : 'Log out'}</span>
        </button>
      </div>

      {/* MODAL: Withdrawal Records */}
      {activeModal === 'withdraw_records' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg">
                {isRw ? 'Ibyo wabikuje (Withdrawals)' : 'Withdrawal records'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setRecordFilter('all');
                }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 pt-3">{renderStatusTabs(withdrawRecords)}</div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {withdrawRecords.filter((w) => recordFilter === 'all' || w.status === recordFilter).length === 0 ? (
                <div className="py-12 text-center text-[#991b1b] text-sm font-black">
                  {isRw ? 'Nta mafaranga urabikuza muri iki cyiciro' : 'No withdrawal records in this filter'}
                </div>
              ) : (
                withdrawRecords
                  .filter((w) => recordFilter === 'all' || w.status === recordFilter)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-base text-[#7f1d1d] tabular-nums">
                          RWF {w.amount.toLocaleString()}
                        </span>
                        {renderStatusMeta(w.status, 'withdraw')}
                      </div>
                      {w.netAmount != null && (
                        <div className="text-sm font-bold text-[#991b1b] flex justify-between tabular-nums">
                          <span>
                            {isRw ? 'Ayakiriwe' : 'Net payout'}: RWF {w.netAmount.toLocaleString()}
                          </span>
                          <span>
                            {isRw ? 'Ikiguzi' : 'Fee'}: RWF {(w.fee || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-xs font-bold text-[#991b1b] flex justify-between gap-2">
                        <span className="truncate">{w.subtitle}</span>
                        <span className="shrink-0">{w.timestamp}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Recharge Records */}
      {activeModal === 'recharge_records' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg">
                {isRw ? 'Ibyo wabikije (Deposits)' : 'Recharge records'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setRecordFilter('all');
                }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 pt-3">{renderStatusTabs(depositRecords)}</div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {depositRecords.filter((r) => recordFilter === 'all' || r.status === recordFilter).length === 0 ? (
                <div className="py-12 text-center text-[#991b1b] text-sm font-black">
                  {isRw ? 'Nta mafaranga urabitsa muri iki cyiciro' : 'No recharge records in this filter'}
                </div>
              ) : (
                depositRecords
                  .filter((r) => recordFilter === 'all' || r.status === recordFilter)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-base text-[#7f1d1d] tabular-nums">
                          RWF {r.amount.toLocaleString()}
                        </span>
                        {renderStatusMeta(r.status, 'deposit')}
                      </div>
                      <div className="text-xs font-bold text-[#991b1b] flex justify-between gap-2">
                        <span className="font-mono truncate">{r.subtitle}</span>
                        <span className="shrink-0">{r.timestamp}</span>
                      </div>
                      {r.reference && (
                        <div className="text-xs font-mono font-bold text-[#b91c1c]">
                          Ref: {r.reference}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Account Records */}
      {activeModal === 'account_records' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg">
                {isRw ? 'Ibyakozwe (Records)' : 'Account records'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setRecordFilter('all');
                  setRecordTypeFilter('all');
                }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 pt-3 space-y-2">
              {/* Type filter */}
              <div className="flex items-center gap-1 p-1 bg-[#b91c1c] rounded-xl">
                {(
                  [
                    { key: 'all', label: isRw ? 'Byose' : 'All' },
                    { key: 'deposit', label: `Deposit (${depositRecords.length})` },
                    { key: 'withdraw', label: `Withdraw (${withdrawRecords.length})` },
                    {
                      key: 'other',
                      label: isRw ? 'Ibindi' : 'Other',
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRecordTypeFilter(tab.key)}
                    className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-black transition-colors whitespace-nowrap truncate cursor-pointer tabular-nums ${
                      recordTypeFilter === tab.key
                        ? 'bg-white text-[#b91c1c]'
                        : 'text-white hover:bg-white/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              {renderStatusTabs(
                allAccountRecords.filter(
                  (item) => recordTypeFilter === 'all' || item.kind === recordTypeFilter
                )
              )}
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {(() => {
                const visibleItems = allAccountRecords.filter(
                  (item) =>
                    (recordTypeFilter === 'all' || item.kind === recordTypeFilter) &&
                    (recordFilter === 'all' || item.status === recordFilter)
                );
                if (visibleItems.length === 0) {
                  return (
                    <div className="py-12 text-center text-[#991b1b] text-sm font-black">
                      {isRw ? 'Nta byakozwe biri muri iki cyiciro' : 'No records in this filter'}
                    </div>
                  );
                }
                return visibleItems.map((item) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-[#7f1d1d] truncate">
                        {item.title}
                      </span>
                      <span className="text-sm font-black font-mono shrink-0 tabular-nums text-[#dc2626]">
                        {item.kind === 'withdraw'
                          ? `-${Math.abs(item.amount).toLocaleString()}`
                          : item.amount > 0
                            ? `+${item.amount.toLocaleString()}`
                            : item.amount.toLocaleString()}{' '}
                        RWF
                      </span>
                    </div>

                    {item.kind === 'withdraw' && item.netAmount != null && (
                      <div className="text-xs font-bold text-[#991b1b] flex justify-between tabular-nums">
                        <span>
                          {isRw ? 'Ayakiriwe' : 'Net'}: RWF {item.netAmount.toLocaleString()}
                        </span>
                        <span>
                          {isRw ? 'Ikiguzi' : 'Fee'}: RWF {(item.fee || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      {renderStatusMeta(item.status, item.kind)}
                      <span className="text-xs font-bold text-[#991b1b] shrink-0">
                        {item.reviewedAt || item.timestamp}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Platform Rules */}
      {activeModal === 'rules' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg">
                {isRw ? 'Amategeko ya Picanon' : 'Platform rules'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm font-bold text-[#7f1d1d] leading-relaxed">
              <p className="font-black text-lg text-[#b91c1c]">
                Picanon Rules &amp; Guidelines
              </p>
              <div className="space-y-2.5">
                <p>1. <strong className="font-black text-[#b91c1c]">Recharge:</strong> Minimum deposit is RWF 1,000 (VIP 0 – VIP 10). Mobile Money channels are available 24/7.</p>
                <p>2. <strong className="font-black text-[#b91c1c]">Withdrawals:</strong> Withdrawals start from RWF 1,000 up to RWF 5,000,000 per day. Processing tax/fee is 10%.</p>
                <p>3. <strong className="font-black text-[#b91c1c]">Referrals:</strong> Level 1 gives 38% immediate cashback, Level 2 gives 2%, and Level 3 gives 1%.</p>
                <p>4. <strong className="font-black text-[#b91c1c]">Security:</strong> Never share your account password. Official Picanon staff will never ask for your password.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bank Account Management */}
      {activeModal === 'bank_mgmt' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg">
                {isRw ? 'Konti yo kwakiriraho amafaranga' : 'Payout Account Management'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPayoutError(null);
                let cleanPhone = payoutPhone.trim().replace(/[\s\-()]+/g, '');
                if (cleanPhone.startsWith('+250')) cleanPhone = '0' + cleanPhone.slice(4);
                else if (cleanPhone.startsWith('250') && cleanPhone.length >= 12) cleanPhone = '0' + cleanPhone.slice(3);
                else if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '0' + cleanPhone;

                if (!/^07[2389]\d{7}$/.test(cleanPhone)) {
                  setPayoutError(
                    isRw
                      ? 'Shyiramo numero ya MoMo / Airtel nyayo (urugero: 078XXXXXXX)'
                      : 'Please enter a valid 10-digit Mobile Money number (e.g. 078XXXXXXX)'
                  );
                  return;
                }
                if (payoutName.trim().length < 2) {
                  setPayoutError(
                    isRw ? 'Shyiramo amazina y’nyiri iyi numero' : 'Please enter account holder name'
                  );
                  return;
                }
                setPayoutSaving(true);
                const ok = onSavePayoutAccount
                  ? await onSavePayoutAccount(payoutMethod, cleanPhone, payoutName.trim())
                  : true;
                setPayoutSaving(false);
                if (ok) {
                  setActiveModal(null);
                  setCheckInMessage(
                    isRw
                      ? `Numero yo kwakiriraho (${cleanPhone}) yabitswe neza!`
                      : `Payout number (${cleanPhone}) saved!`
                  );
                  setTimeout(() => setCheckInMessage(null), 3500);
                } else {
                  setPayoutError(
                    isRw ? 'Ntibyakunze kubika numero. Ongera ugerageze.' : 'Failed to save payout account.'
                  );
                }
              }}
              className="p-5 overflow-y-auto space-y-4"
            >
              <div className="p-4 rounded-2xl border-2 border-[#fecaca] bg-[#fef2f2] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#991b1b] block">
                    {isRw ? 'Numero isanzwe ibitswe' : 'Saved payout account'}
                  </span>
                  <span className="text-base font-black font-mono text-[#7f1d1d]">
                    {(user.payoutMethod || 'mtn').toUpperCase()} • {user.payoutPhone || user.phone}
                  </span>
                  {user.payoutName && (
                    <span className="text-sm font-bold text-[#991b1b] block">{user.payoutName}</span>
                  )}
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#dc2626] text-white">
                  {isRw ? 'Yemewe' : 'Primary'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('mtn')}
                  className={`p-3.5 rounded-xl border-2 text-sm font-black cursor-pointer ${
                    payoutMethod === 'mtn'
                      ? 'border-[#dc2626] bg-[#dc2626] text-white'
                      : 'border-[#fecaca] bg-white text-[#991b1b]'
                  }`}
                >
                  MTN MoMo (078/079)
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('airtel')}
                  className={`p-3.5 rounded-xl border-2 text-sm font-black cursor-pointer ${
                    payoutMethod === 'airtel'
                      ? 'border-[#dc2626] bg-[#dc2626] text-white'
                      : 'border-[#fecaca] bg-white text-[#991b1b]'
                  }`}
                >
                  Airtel Money (072/073)
                </button>
              </div>

              <div>
                <label className="block text-sm font-black text-[#7f1d1d] mb-1">
                  {isRw ? 'Numero yakiriraho amafaranga' : 'Receiving phone number'}
                </label>
                <input
                  type="tel"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#fca5a5] text-base font-mono font-black text-[#7f1d1d] focus:outline-none focus:border-[#dc2626]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[#7f1d1d] mb-1">
                  {isRw ? "Amazina ya nyir'iyi numero" : 'Account holder name'}
                </label>
                <input
                  type="text"
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  placeholder={isRw ? 'Urugero: Jean Claude Mugabo' : 'e.g. Jean Claude Mugabo'}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#fca5a5] text-base font-bold text-[#7f1d1d] focus:outline-none focus:border-[#dc2626]"
                  required
                />
              </div>

              {payoutError && (
                <div className="p-3 bg-[#fef2f2] border-2 border-[#dc2626] rounded-xl text-[#b91c1c] text-sm font-black">
                  {payoutError}
                </div>
              )}

              <button
                type="submit"
                disabled={payoutSaving}
                className="w-full py-4 rounded-full bg-[#dc2626] text-white font-black text-base hover:bg-[#b91c1c] transition-colors cursor-pointer disabled:opacity-60"
              >
                {payoutSaving
                  ? isRw
                    ? 'Biri kubikwa...'
                    : 'Saving...'
                  : isRw
                    ? 'Bika numero yo kubikuzaho'
                    : 'Save payout account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
