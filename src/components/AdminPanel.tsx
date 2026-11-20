import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Layers,
  Settings,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Smartphone,
  Save,
  LogOut,
  Gift,
  RefreshCw,
  Cloud,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  auth,
  signInAdminWithGoogle,
  syncAdminBackupToFirestore,
  loadFullStateFromFirestore,
  fetchAdminBackupCountFromFirestore,
  type FirestoreCloudState,
} from '../lib/firebase';
import {
  UserAccount,
  RechargeRequest,
  WithdrawRequest,
  VIPProduct,
  AdminSettings,
  RedemptionCode,
  InvestmentRecord,
  Transaction,
  Language,
} from '../types';

interface AdminPanelProps {
  adminUser: UserAccount;
  adminToken?: string | null;
  userToken?: string | null;
  allUsers: UserAccount[];
  investments?: InvestmentRecord[];
  transactions?: Transaction[];
  rechargeRequests: RechargeRequest[];
  withdrawRequests: WithdrawRequest[];
  products: VIPProduct[];
  adminSettings: AdminSettings;
  redemptionCodes: RedemptionCode[];
  onAddRedemptionCode: (newCode: RedemptionCode) => void;
  onToggleRedemptionCode: (codeId: string) => void;
  onDeleteRedemptionCode: (codeId: string) => void;
  onApproveRecharge: (requestId: string) => void;
  onRejectRecharge: (requestId: string) => void;
  onApproveWithdraw: (requestId: string) => void;
  onRejectWithdraw: (requestId: string) => void;
  onManualCreditUser: (userId: string, amount: number) => void;
  onUpdateUserVip: (userId: string, newVip: number) => void;
  onToggleUserBan: (userId: string) => void;
  onUpdateSettings: (newSettings: Partial<AdminSettings>) => void;
  onUpdateProductDailyIncome: (productId: string, newDaily: number) => void;
  onRefreshAdmin?: () => Promise<void> | void;
  onImportCloudState?: (cloud: FirestoreCloudState) => Promise<{ importedUsers: number } | void>;
  onClearAllRecords?: () => Promise<void> | void;
  onResetAllAccounts?: () => Promise<void> | void;
  onExitAdmin: () => void;
  onLogout: () => void;
  language: Language;
}

type AdminTab =
  | 'overview'
  | 'recharges'
  | 'withdrawals'
  | 'users'
  | 'vips'
  | 'giftcodes'
  | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminUser,
  adminToken,
  userToken,
  allUsers,
  investments = [],
  transactions = [],
  rechargeRequests,
  withdrawRequests,
  products,
  adminSettings,
  redemptionCodes,
  onAddRedemptionCode,
  onToggleRedemptionCode,
  onDeleteRedemptionCode,
  onApproveRecharge,
  onRejectRecharge,
  onApproveWithdraw,
  onRejectWithdraw,
  onManualCreditUser,
  onUpdateUserVip,
  onToggleUserBan,
  onUpdateSettings,
  onUpdateProductDailyIncome,
  onRefreshAdmin,
  onImportCloudState,
  onClearAllRecords,
  onResetAllAccounts,
  onExitAdmin,
  onLogout,
  language,
}) => {
  const isRw = language === 'rw';
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [rechargeFilter, setRechargeFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [confirmClearRecords, setConfirmClearRecords] = useState<boolean>(false);
  const [isClearingRecords, setIsClearingRecords] = useState<boolean>(false);
  const [clearRecordsMsg, setClearRecordsMsg] = useState<string | null>(null);
  const [confirmResetStep, setConfirmResetStep] = useState<boolean>(false);
  const [isResettingAccounts, setIsResettingAccounts] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Gift Codes state
  const [newCodeName, setNewCodeName] = useState<string>('');
  const [newCodeAmount, setNewCodeAmount] = useState<string>('2000');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<string>('100');
  const [newCodeDescRw, setNewCodeDescRw] = useState<string>('');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Settings state (MTN & Airtel payment numbers)
  const [mtnNumberInput, setMtnNumberInput] = useState<string>(adminSettings.mtnNumber);
  const [airtelNumberInput, setAirtelNumberInput] = useState<string>(adminSettings.airtelNumber);
  const [broadcastInput, setBroadcastInput] = useState<string>(adminSettings.broadcastMessage);
  const [minDepositInput, setMinDepositInput] = useState<string>(adminSettings.minDeposit.toString());
  const [minWithdrawInput, setMinWithdrawInput] = useState<string>(adminSettings.minWithdrawal.toString());
  const [withdrawFeeInput, setWithdrawFeeInput] = useState<string>(
    String(adminSettings.withdrawalFeePercent ?? 10)
  );
  const [telegramGroupInput, setTelegramGroupInput] = useState<string>(
    adminSettings.telegramGroup || 'https://t.me/picanonrw1'
  );
  const [telegramChannelInput, setTelegramChannelInput] = useState<string>(
    adminSettings.telegramChannel || 'https://t.me/Picanon_channel'
  );
  const [telegramSupportInput, setTelegramSupportInput] = useState<string>(
    adminSettings.telegramSupport || 'https://t.me/Picanon_support'
  );
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  const [confirmClearTabRecords, setConfirmClearTabRecords] = useState<'recharges' | 'withdrawals' | null>(null);
  const [deleteCodeConfirmId, setDeleteCodeConfirmId] = useState<string | null>(null);
  const [vipDailyInputs, setVipDailyInputs] = useState<Record<string, string>>({});
  const [savedVipId, setSavedVipId] = useState<string | null>(null);

  // User search
  const [searchUser, setSearchUser] = useState<string>('');
  const [creditAmountInput, setCreditAmountInput] = useState<Record<string, string>>({});
  const [copiedZipLink, setCopiedZipLink] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    if (!onRefreshAdmin) return;
    setIsRefreshing(true);
    try {
      await onRefreshAdmin();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleCloudBackup = async () => {
    setIsCloudSyncing(true);
    setCloudStatus(null);
    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        await signInAdminWithGoogle();
      }
      // Protect against accidentally overwriting a populated Cloud DB when local server started empty
      if (allUsers.length <= 1 && onImportCloudState) {
        const existingCloudCount = await fetchAdminBackupCountFromFirestore();
        if (existingCloudCount > 1) {
          const cloud = await loadFullStateFromFirestore();
          const imported = await onImportCloudState(cloud);
          setCloudStatus(
            isRw
              ? `Amakuru yari muri Firebase Cloud yagaruwe (${cloud.users.length} abakoresha, ${imported?.importedUsers ?? 0} bashyizweho)!`
              : `Restored ${cloud.users.length} existing users from Firebase Cloud DB!`
          );
          return;
        }
      }
      const res = await syncAdminBackupToFirestore({
        allUsers,
        investments,
        transactions,
        rechargeRequests,
        withdrawRequests,
        redemptionCodes,
        adminSettings,
      });
      setCloudStatus(
        isRw
          ? `Byabitswe muri Firebase Cloud neza (${res.syncedUsers} abakoresha, ${res.syncedInvestments} VIPs)!`
          : `Synced ${res.syncedUsers} users & ${res.syncedInvestments} investments to Firebase Firestore!`
      );
    } catch (err) {
      setCloudStatus(
        err instanceof Error
          ? err.message
          : isRw
            ? 'Ntibyakunze guhuza na Google Firebase.'
            : 'Firebase cloud sync failed.'
      );
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!onImportCloudState) return;
    setIsCloudSyncing(true);
    setCloudStatus(null);
    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        await signInAdminWithGoogle();
      }
      const cloud = await loadFullStateFromFirestore();
      const imported = await onImportCloudState(cloud);
      setCloudStatus(
        isRw
          ? `Byagaruwe bivuye muri Firebase Cloud (${cloud.users.length} abakoresha, ${imported?.importedUsers ?? 0} bongeweho)!`
          : `Restored from Firebase Cloud (${cloud.users.length} users, ${imported?.importedUsers ?? 0} added)!`
      );
    } catch (err) {
      setCloudStatus(
        err instanceof Error
          ? err.message
          : isRw
            ? 'Ntibyakunze kugarura amakuru avuye muri Firebase.'
            : 'Firebase cloud restore failed.'
      );
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const pendingRecharges = rechargeRequests.filter((r) => r.status === 'pending');
  const approvedRecharges = rechargeRequests.filter((r) => r.status === 'approved');
  const rejectedRecharges = rechargeRequests.filter((r) => r.status === 'rejected');
  const visibleRecharges = (
    rechargeFilter === 'all'
      ? [...pendingRecharges, ...approvedRecharges, ...rejectedRecharges]
      : rechargeRequests.filter((r) => r.status === rechargeFilter)
  );

  const pendingWithdrawals = withdrawRequests.filter((w) => w.status === 'pending');
  const approvedWithdrawals = withdrawRequests.filter((w) => w.status === 'approved');
  const rejectedWithdrawals = withdrawRequests.filter((w) => w.status === 'rejected');
  const visibleWithdrawals = (
    withdrawFilter === 'all'
      ? [...pendingWithdrawals, ...approvedWithdrawals, ...rejectedWithdrawals]
      : withdrawRequests.filter((w) => w.status === withdrawFilter)
  );

  const totalRechargeVol = approvedRecharges.reduce((a, b) => a + b.amount, 0);

  const totalWithdrawVol = approvedWithdrawals.reduce((a, b) => a + b.amount, 0);

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCodeName.trim().toUpperCase();
    const parsedAmount = parseInt(newCodeAmount, 10);
    const parsedMaxUses = parseInt(newCodeMaxUses, 10);

    if (!cleanCode || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newCode: RedemptionCode = {
      id: `code-${Date.now()}`,
      code: cleanCode,
      amount: parsedAmount,
      maxUses: parsedMaxUses > 0 ? parsedMaxUses : undefined,
      usedCount: 0,
      isActive: true,
      descriptionRw: newCodeDescRw.trim() || "Kode y'impano y'ubuyobozi bwa Picanon",
      descriptionEn: 'Official Picanon gift code',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddRedemptionCode(newCode);
    setCodeSuccessMsg(
      isRw ? `Kode "${cleanCode}" yashyizweho neza!` : `Code "${cleanCode}" created successfully!`
    );
    setNewCodeName('');
    setTimeout(() => setCodeSuccessMsg(null), 4000);
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'PICANON-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCodeName(result);
  };

  const handleCopyCode = async (codeStr: string, id: string) => {
    try {
      await navigator.clipboard.writeText(codeStr);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = codeStr;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFee = Number(withdrawFeeInput);
    onUpdateSettings({
      mtnNumber: mtnNumberInput.trim(),
      airtelNumber: airtelNumberInput.trim(),
      broadcastMessage: broadcastInput.trim(),
      minDeposit: parseInt(minDepositInput, 10) || 1000,
      minWithdrawal: parseInt(minWithdrawInput, 10) || 1000,
      withdrawalFeePercent: !Number.isNaN(parsedFee) ? Math.min(100, Math.max(0, parsedFee)) : 10,
      telegramGroup: telegramGroupInput.trim() || 'https://t.me/picanonrw1',
      telegramChannel: telegramChannelInput.trim() || 'https://t.me/Picanon_channel',
      telegramSupport: telegramSupportInput.trim() || 'https://t.me/Picanon_support',
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const buildExportUrl = (type: 'full' | 'dist') => {
    const params = new URLSearchParams({ type });
    if (adminToken) params.set('adminToken', adminToken);
    if (userToken) params.set('token', userToken);
    return `/api/admin/export-zip?${params.toString()}`;
  };

  const handleCopyExportLink = async (type: 'full' | 'dist') => {
    const fullUrl = `${window.location.origin}${buildExportUrl(type)}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
    setCopiedZipLink(true);
    setTimeout(() => setCopiedZipLink(false), 2500);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.phone.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fff5f5] text-[#7f1d1d] pb-20 font-['Plus_Jakarta_Sans',sans-serif] font-bold">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#fecaca] px-4 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#dc2626] text-white flex items-center justify-center font-black shadow-lg shadow-red-600/20 border-2 border-[#fecaca]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-['Outfit'] font-black text-[#b91c1c] text-lg sm:text-xl leading-tight">
                Picanon Admin Console
              </h1>
              <p className="text-xs font-extrabold text-[#991b1b]">
                {isRw ? "Ibiro Bikuru by'Ubuyobozi bwa Picanon" : 'Picanon Official Management Console'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshAdmin && (
              <button
                onClick={handleManualRefresh}
                className="px-3 py-2 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] text-[#b91c1c] border-2 border-[#fecaca] text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isRw ? 'Vugurura amakuru' : 'Refresh Live Data'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRw ? 'Vugurura' : 'Refresh'}</span>
              </button>
            )}
            <button
              onClick={onExitAdmin}
              className="px-3.5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer"
            >
              {isRw ? 'Subira muri App' : 'Exit to App'}
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] border-2 border-[#fecaca] transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'overview' as AdminTab, label: isRw ? 'Inshamake' : 'Overview', icon: TrendingUp, badge: null as number | null },
            {
              id: 'recharges' as AdminTab,
              label: isRw ? 'Kubitsa (Deposits)' : 'Deposits',
              icon: ArrowDownToLine,
              badge: pendingRecharges.length > 0 ? pendingRecharges.length : null,
            },
            {
              id: 'withdrawals' as AdminTab,
              label: isRw ? 'Kubikuza (Withdrawals)' : 'Withdrawals',
              icon: ArrowUpFromLine,
              badge: pendingWithdrawals.length > 0 ? pendingWithdrawals.length : null,
            },
            { id: 'users' as AdminTab, label: isRw ? 'Abakoresha' : 'Users', icon: Users, badge: null as number | null },
            { id: 'vips' as AdminTab, label: isRw ? 'VIPs Tasks' : 'VIP Tasks', icon: Layers, badge: null as number | null },
            {
              id: 'giftcodes' as AdminTab,
              label: isRw ? "Kode z'Impano" : 'Gift Codes',
              icon: Tag,
              badge: redemptionCodes.filter((c) => c.isActive).length > 0 ? redemptionCodes.filter((c) => c.isActive).length : null,
            },
            { id: 'settings' as AdminTab, label: isRw ? 'Ibyicaro & Numero' : 'Settings', icon: Settings, badge: null as number | null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all cursor-pointer border-2 ${
                  isActive
                    ? 'bg-[#dc2626] text-white border-[#b91c1c] shadow-md shadow-red-600/20'
                    : 'bg-white text-[#991b1b] hover:bg-[#fef2f2] border-[#fecaca]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black ${
                      isActive ? 'bg-white text-[#dc2626]' : 'bg-[#dc2626] text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {adminTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-1">
                <span className="text-xs text-[#991b1b] uppercase font-black block">
                  {isRw ? 'Amafaranga Yinjiye (Deposits)' : 'Total Deposits'}
                </span>
                <span className="font-mono font-black text-xl text-[#dc2626]">
                  RWF {totalRechargeVol.toLocaleString()}
                </span>
              </div>
              <div className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-1">
                <span className="text-xs text-[#991b1b] uppercase font-black block">
                  {isRw ? 'Ayasohotse (Withdrawals)' : 'Total Withdrawals'}
                </span>
                <span className="font-mono font-black text-xl text-[#b91c1c]">
                  RWF {totalWithdrawVol.toLocaleString()}
                </span>
              </div>
              <div className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-1">
                <span className="text-xs text-[#991b1b] uppercase font-black block">
                  {isRw ? 'Abanyamuryango Bose' : 'Total Registered'}
                </span>
                <span className="font-mono font-black text-xl text-[#7f1d1d]">
                  {allUsers.length} {isRw ? 'abantu' : 'users'}
                </span>
              </div>
              <div className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-1">
                <span className="text-xs text-[#991b1b] uppercase font-black block">
                  {isRw ? 'Kode Zikora Ubu' : 'Active Gift Codes'}
                </span>
                <span className="font-mono font-black text-xl text-[#dc2626]">
                  {redemptionCodes.filter((c) => c.isActive).length} {isRw ? 'kode' : 'codes'}
                </span>
              </div>
            </div>

            {/* Active Payment Gateway Display Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white border-2 border-[#fecaca] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-xs font-black uppercase text-[#dc2626] bg-white px-3 py-1 rounded-full">
                  {isRw ? 'Numero za MoMo & Airtel Zikora Ubu' : 'Live Deposit Gateway Accounts'}
                </span>
                <div className="flex flex-wrap items-center gap-5 mt-3">
                  <div>
                    <span className="text-xs text-white/90 block font-extrabold">MTN MoMo:</span>
                    <span className="font-mono font-black text-lg text-white">
                      {adminSettings.mtnNumber}
                    </span>
                  </div>
                  <div className="w-px h-9 bg-white/30 hidden sm:block" />
                  <div>
                    <span className="text-xs text-white/90 block font-extrabold">Airtel Money:</span>
                    <span className="font-mono font-black text-lg text-white">
                      {adminSettings.airtelNumber}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setAdminTab('settings')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#fef2f2] text-[#dc2626] text-xs font-black self-start sm:self-center transition-colors cursor-pointer"
              >
                {isRw ? 'Hindura Numero' : 'Edit Numbers'}
              </button>
            </div>

            {/* Firebase Cloud Sync & Restore Banner */}
            <div className="p-5 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Cloud className="w-5 h-5 text-[#dc2626]" />
                  <span className="text-sm font-black uppercase text-[#b91c1c] tracking-wider">
                    {isRw ? 'Firebase Firestore Cloud Database' : 'Firebase Firestore Cloud DB'}
                  </span>
                  {auth.currentUser?.emailVerified && (
                    <span className="text-xs font-black bg-[#fee2e2] text-[#b91c1c] px-2.5 py-0.5 rounded-full border border-[#fca5a5]">
                      {auth.currentUser.email}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-[#7f1d1d] leading-relaxed">
                  {isRw
                    ? 'Bika cyangwa ugarure konti zose, amafaranga, kubitsa, kubikuza na VIPs mu bubiko buhoraho bwa Firebase Firestore.'
                    : 'Save or restore all member accounts, balances, deposits, withdrawals, and VIPs in persistent Firebase Firestore.'}
                </p>
                {cloudStatus && (
                  <p className="text-xs font-black text-[#dc2626] pt-1 break-words">{cloudStatus}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onImportCloudState && (
                  <button
                    type="button"
                    onClick={handleCloudRestore}
                    disabled={isCloudSyncing}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#fef2f2] border-2 border-[#dc2626] text-[#dc2626] font-black text-xs uppercase tracking-wider transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                  >
                    {isRw ? 'Garura (Restore)' : 'Restore'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloudBackup}
                  disabled={isCloudSyncing}
                  className="px-4 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase tracking-wider transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                >
                  {isCloudSyncing
                    ? isRw
                      ? 'Birakorwa...'
                      : 'Syncing...'
                    : isRw
                      ? 'Bika muri Firebase'
                      : 'Sync to Firebase'}
                </button>
              </div>
            </div>

            {/* Clear All Deposit / Withdraw / Transaction Records */}
            {onClearAllRecords && (
              <div className="p-5 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-[#dc2626]" />
                    <span className="text-sm font-black uppercase text-[#b91c1c] tracking-wider">
                      {isRw ? 'Siba Records Zose (Deposit & Withdraw)' : 'Clear All Transaction Records'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#7f1d1d] leading-relaxed">
                    {isRw
                      ? 'Siba records zose zo kubitsa (Deposits), kubikuza (Withdrawals) n’ibyakozwe muri Mine kugira ngo habe isuku (Abakoresha baraguma).'
                      : 'Clear all deposit, withdrawal, and account history records cleanly while preserving member accounts.'}
                  </p>
                  {clearRecordsMsg && (
                    <p className="text-xs font-black text-[#dc2626] pt-1">{clearRecordsMsg}</p>
                  )}
                </div>

                {!confirmClearRecords ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearRecords(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] border-2 border-[#dc2626] text-[#991b1b] font-black text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                  >
                    {isRw ? 'Siba Records' : 'Clear Records'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClearRecords(false)}
                      disabled={isClearingRecords}
                      className="px-3 py-2 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] font-black text-xs cursor-pointer"
                    >
                      {isRw ? 'Hagarika' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isClearingRecords}
                      onClick={async () => {
                        setIsClearingRecords(true);
                        try {
                          await onClearAllRecords();
                          setConfirmClearRecords(false);
                          setClearRecordsMsg(
                            isRw
                              ? 'Records zose zasibwe! Ubu harimo isuku.'
                              : 'All deposit & withdrawal records cleared cleanly.'
                          );
                          setTimeout(() => setClearRecordsMsg(null), 5000);
                        } finally {
                          setIsClearingRecords(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isClearingRecords
                        ? isRw
                          ? 'Biri gusibwa...'
                          : 'Clearing...'
                        : isRw
                          ? 'Emeza Gusiba'
                          : 'Confirm Clear'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Fresh Reset / Siba Konti Zose */}
            {onResetAllAccounts && (
              <div className="p-5 rounded-3xl bg-[#fef2f2] border-2 border-[#dc2626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
                    <span className="text-sm font-black uppercase text-[#b91c1c] tracking-wider">
                      {isRw ? 'Tangiza Website Bundi Bushya (Fresh Reset)' : 'Wipe All Member Accounts'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#7f1d1d] leading-relaxed">
                    {isRw
                      ? 'Siba konti zose zabiyandikishije, ubusabe bwo kubitsa/kubikuza n’ibikorwa byose kugira ngo website itangire bundi bushya (Konti ya Admin yo irasigara).'
                      : 'Delete all registered member accounts, deposits, withdrawals, and investments to start fresh (Admin account is preserved).'}
                  </p>
                  {resetSuccessMsg && (
                    <p className="text-xs font-black text-[#dc2626] pt-1">{resetSuccessMsg}</p>
                  )}
                </div>

                {!confirmResetStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetStep(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                  >
                    {isRw ? 'Siba Konti Zose' : 'Reset All Accounts'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmResetStep(false)}
                      disabled={isResettingAccounts}
                      className="px-3 py-2 rounded-xl bg-white border border-[#fecaca] text-[#991b1b] font-black text-xs cursor-pointer"
                    >
                      {isRw ? 'Hagarika' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isResettingAccounts}
                      onClick={async () => {
                        setIsResettingAccounts(true);
                        try {
                          await onResetAllAccounts();
                          setConfirmResetStep(false);
                          setResetSuccessMsg(
                            isRw
                              ? 'Konti zose zasibwe! Website yatangiye bundi bushya.'
                              : 'All member accounts wiped! Website is now fresh.'
                          );
                          setTimeout(() => setResetSuccessMsg(null), 5000);
                        } finally {
                          setIsResettingAccounts(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isResettingAccounts
                        ? isRw
                          ? 'Biri gusibwa...'
                          : 'Wiping...'
                        : isRw
                          ? 'Emeza Gusiba'
                          : 'Confirm Wipe'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Export / Download Publish-Ready ZIP */}
            <div className="p-5 rounded-3xl bg-white border-2 border-[#dc2626] space-y-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#b91c1c]">
                  <Download className="w-5 h-5 text-[#dc2626]" />
                  <h4 className="font-['Outfit'] font-black text-base uppercase">
                    {isRw ? 'Kuramo ZIP yo Gukora Publish Ahandi' : 'Download Publish-Ready Business ZIP'}
                  </h4>
                </div>
                <p className="text-xs font-bold text-[#7f1d1d]">
                  {isRw
                    ? 'Kuramo code yose yiteguye gukora nta kosa (Server + Frontend + dist) cyangwa Static Build gusa.'
                    : 'Download the complete zero-error full-stack business package or the compiled static dist build.'}
                </p>
              </div>

              {!adminToken && !userToken && (
                <div className="p-3 rounded-2xl bg-[#fef2f2] border border-[#dc2626] text-xs font-black text-[#b91c1c]">
                  {isRw
                    ? 'Sohoka wongere winjire nka Admin (0793002388) kugira ngo ubone uburenganzira bwo gukuramo ZIP.'
                    : 'Please log out and sign in again as Admin (0793002388) to activate ZIP download.'}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={buildExportUrl('full')}
                  download="picanon-business-publish.zip"
                  className="py-3.5 px-4 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-colors text-center"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{isRw ? 'Full Code ZIP (Server + Site)' : 'Download Full Business ZIP'}</span>
                </a>
                <a
                  href={buildExportUrl('dist')}
                  download="dist.zip"
                  className="py-3.5 px-4 rounded-2xl bg-[#fef2f2] hover:bg-[#fee2e2] border-2 border-[#dc2626] text-[#991b1b] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-center"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{isRw ? 'Static Dist ZIP (dist.zip)' : 'Download Static Dist ZIP'}</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => void handleCopyExportLink('full')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedZipLink ? (
                  <>
                    <Check className="w-4 h-4 text-[#dc2626]" />
                    <span>{isRw ? 'Link ya Full ZIP yakopewe!' : 'Full ZIP Link Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#dc2626]" />
                    <span>{isRw ? 'Koporora Link ya Full ZIP (uyifungure muri Chrome)' : 'Copy Full ZIP Direct Link'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: RECHARGES / KUBITSA QUEUE & RECORDS */}
        {adminTab === 'recharges' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-['Outfit'] font-black text-base uppercase text-[#b91c1c]">
                {isRw ? 'Kubitsa (Deposits · Pending / Approved / Rejected)' : 'Deposit Requests & Records'}
              </h3>
              {onClearAllRecords && rechargeRequests.length > 0 && (
                confirmClearTabRecords === 'recharges' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClearTabRecords(null)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#fecaca] text-[#991b1b] text-xs font-black cursor-pointer"
                    >
                      {isRw ? 'Hagarika' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClearTabRecords(null);
                        void onClearAllRecords();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black cursor-pointer"
                    >
                      {isRw ? 'Emeza Gusiba' : 'Confirm Clear'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearTabRecords('recharges')}
                    className="px-3 py-1.5 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] border border-[#dc2626] text-[#991b1b] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRw ? 'Siba Records' : 'Clear Records'}</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-[#fecaca] rounded-2xl">
              {(
                [
                  { key: 'all', label: `${isRw ? 'Byose' : 'All'} (${rechargeRequests.length})` },
                  { key: 'pending', label: `Pending (${pendingRecharges.length})` },
                  { key: 'approved', label: `Approved (${approvedRecharges.length})` },
                  { key: 'rejected', label: `Rejected (${rejectedRecharges.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRechargeFilter(tab.key)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap truncate cursor-pointer tabular-nums ${
                    rechargeFilter === tab.key
                      ? 'bg-[#dc2626] text-white'
                      : 'text-[#991b1b] hover:bg-[#fef2f2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visibleRecharges.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border-2 border-[#fecaca] text-center text-sm font-black text-[#991b1b]">
                {isRw ? 'Nta busabe bwo kubitsa buri muri iki cyiciro.' : 'No deposit records in this filter.'}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRecharges.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                            {req.paymentMethod.toUpperCase()}
                          </span>
                          <span className="font-mono font-black text-base text-[#7f1d1d]">
                            {req.senderPhone}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#991b1b] block mt-1.5">
                          Konti: <span className="font-mono font-black">{req.userPhone}</span> • Kode ya MoMo:{' '}
                          <span className="font-mono text-[#dc2626] font-black">{req.transactionId}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-lg text-[#dc2626] block">
                          +RWF {req.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#991b1b] font-mono font-bold">
                          {req.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#fee2e2] flex flex-wrap items-center justify-between gap-2">
                      {req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dc2626] text-white text-xs font-black">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isRw ? 'Byemejwe na Admin (Approved)' : 'Approved by Admin'}
                            {req.reviewedAt ? ` · ${req.reviewedAt}` : ''}
                          </span>
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#dc2626] text-xs font-black">
                          <XCircle className="w-4 h-4" />
                          <span>
                            {isRw ? 'Byanzwe na Admin (Rejected)' : 'Rejected by Admin'}
                            {req.reviewedAt ? ` · ${req.reviewedAt}` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#dc2626] border-2 border-[#dc2626] text-xs font-black">
                          <Clock className="w-4 h-4" />
                          <span>{isRw ? 'Bitegereje (Pending)' : 'Pending'}</span>
                        </span>
                      )}

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onRejectRecharge(req.id)}
                            className="px-3.5 py-2 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] border-2 border-[#dc2626] text-xs font-black transition-colors cursor-pointer"
                          >
                            {isRw ? 'Hakana (Reject)' : 'Reject'}
                          </button>
                          <button
                            onClick={() => onApproveRecharge(req.id)}
                            className="px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                          >
                            {isRw ? 'Emeza & Ongeraho (Approve)' : 'Approve & Credit'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WITHDRAWALS / KUBIKUZA QUEUE & RECORDS */}
        {adminTab === 'withdrawals' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-['Outfit'] font-black text-base uppercase text-[#b91c1c]">
                {isRw ? 'Kubikuza (Withdrawals · Pending / Approved / Rejected)' : 'Withdrawal Requests & Records'}
              </h3>
              {onClearAllRecords && withdrawRequests.length > 0 && (
                confirmClearTabRecords === 'withdrawals' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClearTabRecords(null)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#fecaca] text-[#991b1b] text-xs font-black cursor-pointer"
                    >
                      {isRw ? 'Hagarika' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClearTabRecords(null);
                        void onClearAllRecords();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black cursor-pointer"
                    >
                      {isRw ? 'Emeza Gusiba' : 'Confirm Clear'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearTabRecords('withdrawals')}
                    className="px-3 py-1.5 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] border border-[#dc2626] text-[#991b1b] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRw ? 'Siba Records' : 'Clear Records'}</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-[#fecaca] rounded-2xl">
              {(
                [
                  { key: 'all', label: `${isRw ? 'Byose' : 'All'} (${withdrawRequests.length})` },
                  { key: 'pending', label: `Pending (${pendingWithdrawals.length})` },
                  { key: 'approved', label: `Approved (${approvedWithdrawals.length})` },
                  { key: 'rejected', label: `Rejected (${rejectedWithdrawals.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWithdrawFilter(tab.key)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap truncate cursor-pointer tabular-nums ${
                    withdrawFilter === tab.key
                      ? 'bg-[#dc2626] text-white'
                      : 'text-[#991b1b] hover:bg-[#fef2f2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visibleWithdrawals.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border-2 border-[#fecaca] text-center text-sm font-black text-[#991b1b]">
                {isRw ? 'Nta busabe bwo kubikuza buri muri iki cyiciro.' : 'No withdrawal records in this filter.'}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                            {w.paymentMethod.toUpperCase()}
                          </span>
                          <span className="font-mono font-black text-base text-[#7f1d1d]">
                            {w.recipientPhone}
                          </span>
                        </div>
                        <span className="text-sm text-[#7f1d1d] font-black block mt-1">
                          {w.recipientName}
                        </span>
                        <span className="text-xs font-bold text-[#991b1b]">
                          Konti: <span className="font-mono font-black">{w.userPhone}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#991b1b] block">
                          Watse: RWF {w.amount.toLocaleString()} (-{w.fee.toLocaleString()})
                        </span>
                        <span className="font-mono font-black text-lg text-[#dc2626] block">
                          Ayoherezwa: RWF {w.netAmount.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#991b1b] font-mono font-bold">
                          {w.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#fee2e2] flex flex-wrap items-center justify-between gap-2">
                      {w.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dc2626] text-white text-xs font-black">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isRw ? 'Byemejwe na Admin (Approved)' : 'Approved by Admin'}
                            {w.reviewedAt ? ` · ${w.reviewedAt}` : ''}
                          </span>
                        </span>
                      ) : w.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#dc2626] text-xs font-black">
                          <XCircle className="w-4 h-4" />
                          <span>
                            {isRw ? 'Byanzwe na Admin (Rejected)' : 'Rejected by Admin'}
                            {w.reviewedAt ? ` · ${w.reviewedAt}` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#dc2626] border-2 border-[#dc2626] text-xs font-black">
                          <Clock className="w-4 h-4" />
                          <span>{isRw ? 'Bitegereje (Pending)' : 'Pending'}</span>
                        </span>
                      )}

                      {w.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onRejectWithdraw(w.id)}
                            className="px-3.5 py-2 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] border-2 border-[#dc2626] text-xs font-black transition-colors cursor-pointer"
                          >
                            {isRw ? 'Hakana & Subiza (Reject)' : 'Reject & Refund'}
                          </button>
                          <button
                            onClick={() => onApproveWithdraw(w.id)}
                            className="px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                          >
                            {isRw ? 'Emeza ko Wishyuye (Approve)' : 'Mark Paid & Approve'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS MANAGEMENT */}
        {adminTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-['Outfit'] font-black text-base uppercase text-[#b91c1c]">
                {isRw ? 'Gucunga Abanyamuryango' : 'Member Directory'}
              </h3>
              <div className="relative w-52 sm:w-64">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder={isRw ? 'Shakisha numero...' : 'Search phone...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border-2 border-[#fecaca] text-sm font-bold text-[#7f1d1d] placeholder:text-[#ef4444]/60 focus:outline-none focus:border-[#dc2626]"
                />
                <Search className="w-4 h-4 text-[#dc2626] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((u) => {
                const creditVal = creditAmountInput[u.id] || '';
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] flex items-center justify-center font-black">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-[#7f1d1d]">
                              {u.phone}
                            </span>
                            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white">
                              VIP {u.vipLevel}
                            </span>
                            {u.isBanned && (
                              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#991b1b] text-white">
                                Banned
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#991b1b] font-mono">
                            Ref: {u.referralCode} • Team: {u.teamCountLevel1 + u.teamCountLevel2}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-xs text-[#991b1b] block uppercase font-black">
                            {isRw ? 'Amafaranga Ariho' : 'Balance'}
                          </span>
                          <span className="font-mono font-black text-[#dc2626] text-lg">
                            RWF {u.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Admin Actions on User */}
                    <div className="pt-2.5 border-t border-[#fee2e2] flex flex-wrap items-center justify-between gap-2">
                      {/* Manual Balance Credit */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="RWF amount"
                          value={creditVal}
                          onChange={(e) =>
                            setCreditAmountInput({ ...creditAmountInput, [u.id]: e.target.value })
                          }
                          className="w-28 px-2.5 py-1.5 rounded-lg bg-[#fef2f2] border-2 border-[#fecaca] text-xs font-mono font-black text-[#7f1d1d] focus:outline-none focus:border-[#dc2626]"
                        />
                        <button
                          onClick={() => {
                            const amt = parseInt(creditVal, 10);
                            if (!isNaN(amt) && amt !== 0) {
                              onManualCreditUser(u.id, amt);
                              setCreditAmountInput({ ...creditAmountInput, [u.id]: '' });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase cursor-pointer"
                        >
                          + Credit
                        </button>
                      </div>

                      {/* VIP changer */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#991b1b] font-black text-xs">VIP:</span>
                        <select
                          value={u.vipLevel}
                          onChange={(e) => onUpdateUserVip(u.id, parseInt(e.target.value, 10))}
                          className="px-2.5 py-1.5 rounded-lg bg-[#fef2f2] border-2 border-[#fecaca] text-[#dc2626] text-xs font-black"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              VIP {lvl}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ban toggle */}
                      <button
                        onClick={() => onToggleUserBan(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 transition-colors cursor-pointer ${
                          u.isBanned
                            ? 'bg-[#dc2626] text-white border-[#b91c1c]'
                            : 'bg-[#fee2e2] text-[#991b1b] border-[#dc2626]'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Freeze/Ban'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: VIP TASKS & PACKAGES */}
        {adminTab === 'vips' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="font-['Outfit'] font-black text-base uppercase text-[#b91c1c]">
              {isRw ? 'Guhindura Inyungu za VIP 0 kugeza kuri 10' : 'Configure VIP 0–10 Return Rates'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-3xl bg-white border-2 border-[#fecaca] shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[#b91c1c] uppercase">
                      VIP {p.vipLevel} - {p.nameRw}
                    </span>
                    <span className="font-mono font-black text-xs text-[#dc2626] bg-[#fee2e2] px-2.5 py-0.5 rounded-full">
                      RWF {p.price.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-[#991b1b] block mb-1">
                      {isRw ? 'Inyungu ya buri munsi (RWF):' : 'Daily return (RWF):'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={vipDailyInputs[p.id] ?? String(p.dailyIncome)}
                        onChange={(e) =>
                          setVipDailyInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] font-mono font-black text-[#dc2626] text-sm focus:outline-none focus:border-[#dc2626]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const raw = vipDailyInputs[p.id] ?? String(p.dailyIncome);
                          const val = parseInt(raw, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateProductDailyIncome(p.id, val);
                            setSavedVipId(p.id);
                            setTimeout(() => setSavedVipId((cur) => (cur === p.id ? null : cur)), 2000);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs uppercase cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {savedVipId === p.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{isRw ? 'Byabitswe' : 'Saved'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{isRw ? 'Bika' : 'Save'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GIFT CODES (COMPANY REDEMPTION CODES) */}
        {adminTab === 'giftcodes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white border-2 border-[#fecaca] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md text-[#dc2626] font-black">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-white font-['Outfit'] uppercase">
                      {isRw ? "Kode z'Impano za Picanon" : 'Picanon Official Gift Codes'}
                    </h3>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white text-[#dc2626] uppercase">
                      Company Direct
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/95 mt-1 max-w-xl leading-relaxed">
                    {isRw
                      ? "Izi nizo kode zonyine zemewe kandi zikora kuri system. Buri kode mukoze hano niyo izajya icungurwa n'abanyamuryango ba Picanon."
                      : 'These are the official company-issued gift codes. Only codes created here are valid and redeemable by members.'}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-white/20 gap-1 text-xs">
                <span className="text-white/90 text-xs font-extrabold">{isRw ? 'Kode Zikora:' : 'Active Codes:'}</span>
                <span className="text-lg font-black text-white font-mono">
                  {redemptionCodes.filter((c) => c.isActive).length} / {redemptionCodes.length}
                </span>
              </div>
            </div>

            {/* Creation Form Card */}
            <div className="p-5 rounded-3xl bg-white border-2 border-[#fecaca] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-[#dc2626]" />
                  <h4 className="font-black text-base text-[#b91c1c] font-['Outfit'] uppercase tracking-wider">
                    {isRw ? 'Kora Kode Nshya ya Company' : 'Generate New Company Gift Code'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="px-3 py-1.5 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] border border-[#dc2626] text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>{isRw ? 'Kora Yikora (Random)' : 'Generate Random'}</span>
                </button>
              </div>

              {codeSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-[#fee2e2] border-2 border-[#dc2626] text-[#991b1b] text-xs font-black flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-[#dc2626] shrink-0" />
                  <span>{codeSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateCode} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1 uppercase tracking-wider">
                      {isRw ? 'Izina rya Kode:' : 'Code String:'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newCodeName}
                        onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                        placeholder="PICANON-2026"
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] text-[#b91c1c] font-mono font-black text-sm uppercase tracking-wider focus:outline-none focus:border-[#dc2626]"
                        required
                      />
                      <Tag className="w-4 h-4 text-[#dc2626] absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1 uppercase tracking-wider">
                      {isRw ? 'Amafaranga (RWF):' : 'Amount (RWF):'}
                    </label>
                    <input
                      type="number"
                      value={newCodeAmount}
                      onChange={(e) => setNewCodeAmount(e.target.value)}
                      placeholder="2000"
                      min="100"
                      step="100"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] text-[#dc2626] font-mono font-black text-sm focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1 uppercase tracking-wider">
                      {isRw ? "Umubare w'abayikoresha:" : 'Max Redemptions:'}
                    </label>
                    <input
                      type="number"
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] text-[#7f1d1d] font-mono font-black text-sm focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#991b1b] font-black uppercase mr-1">{isRw ? 'Amahitamo:' : 'Presets:'}</span>
                  {[500, 1000, 2000, 3000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewCodeAmount(preset.toString())}
                      className={`px-2.5 py-1 rounded-lg border-2 text-xs font-mono font-black transition-colors cursor-pointer ${
                        newCodeAmount === preset.toString()
                          ? 'bg-[#dc2626] text-white border-[#b91c1c]'
                          : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
                      }`}
                    >
                      {preset.toLocaleString()} RWF
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-black text-[#991b1b] block mb-1 uppercase tracking-wider">
                    {isRw ? "Ubusobanuro bw'Iki gikorwa (Description):" : 'Campaign Description:'}
                  </label>
                  <input
                    type="text"
                    value={newCodeDescRw}
                    onChange={(e) => setNewCodeDescRw(e.target.value)}
                    placeholder={isRw ? "urugero: Impano y'abanyamuryango ba Telegram" : 'e.g. Weekend VIP Community Gift'}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] text-[#7f1d1d] font-bold text-sm focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{isRw ? 'EMEZA & TANGIZA IYI KODE YA COMPANY' : 'CREATE & LAUNCH COMPANY CODE'}</span>
                </button>
              </form>
            </div>

            {/* List */}
            <div className="p-5 rounded-3xl bg-white border-2 border-[#fecaca] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#dc2626]" />
                  <h4 className="font-black text-base text-[#b91c1c] font-['Outfit'] uppercase">
                    {isRw ? "Urutonde rwa Kode za Company Ziriho" : 'Company Gift Codes Directory'}
                  </h4>
                </div>
                <span className="text-xs text-[#991b1b] font-mono font-black">
                  {redemptionCodes.length} {isRw ? 'zose' : 'total'}
                </span>
              </div>

              {redemptionCodes.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] text-center space-y-2">
                  <Gift className="w-9 h-9 text-[#dc2626] mx-auto" />
                  <p className="text-sm font-black text-[#b91c1c]">
                    {isRw ? 'Nta kode ya company irashyirwaho ubu.' : 'No company gift codes currently exist.'}
                  </p>
                  <p className="text-xs font-bold text-[#991b1b] max-w-sm mx-auto">
                    {isRw
                      ? 'Uzuza imbonerahamwe iri hejuru maze ukore kode nshya abanyamuryango bazajya bahabwa.'
                      : 'Use the form above to generate fresh official vouchers.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {redemptionCodes.map((item) => {
                    const percentUsed = item.maxUses ? Math.min(100, Math.round((item.usedCount / item.maxUses) * 100)) : 0;
                    const isCopied = copiedCodeId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border-2 transition-all space-y-2.5 ${
                          item.isActive
                            ? 'bg-[#fef2f2] border-[#fecaca] shadow-sm'
                            : 'bg-white border-[#fee2e2] opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-[#b91c1c] tracking-wider">
                                {item.code}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  item.isActive
                                    ? 'bg-[#dc2626] text-white'
                                    : 'bg-[#fee2e2] text-[#991b1b]'
                                }`}
                              >
                                {item.isActive ? (isRw ? 'Iremewe' : 'Active') : (isRw ? 'Yahagaritswe' : 'Paused')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#991b1b] block mt-0.5">
                              {item.createdAt ? `Yatangiye: ${item.createdAt}` : 'Company Code'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-base text-[#dc2626] block">
                              RWF {item.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#991b1b] font-mono font-bold">
                              {item.usedCount} / {item.maxUses || '∞'} {isRw ? 'yakoreshejwe' : 'claimed'}
                            </span>
                          </div>
                        </div>

                        {item.maxUses && (
                          <div className="w-full bg-[#fee2e2] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#dc2626] h-full rounded-full transition-all"
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        )}

                        <p className="text-xs font-bold text-[#7f1d1d] line-clamp-1">
                          {isRw ? item.descriptionRw : item.descriptionEn}
                        </p>

                        <div className="pt-2 border-t border-[#fecaca] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.code, item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-[#dc2626] text-white'
                                : 'bg-white hover:bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isRw ? 'Yanakopewe!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#dc2626]" />
                                <span>{isRw ? 'Koporora Kode' : 'Copy Code'}</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onToggleRedemptionCode(item.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#fee2e2] border border-[#fecaca] text-xs font-black text-[#991b1b] transition-colors cursor-pointer"
                            >
                              {item.isActive ? (isRw ? 'Hagarika' : 'Pause') : (isRw ? 'Kora' : 'Activate')}
                            </button>

                            {deleteCodeConfirmId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDeleteCodeConfirmId(null)}
                                  className="px-2 py-1 rounded-lg bg-white border border-[#fecaca] text-[#991b1b] text-xs font-black cursor-pointer"
                                >
                                  {isRw ? 'Oya' : 'No'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteRedemptionCode(item.id);
                                    setDeleteCodeConfirmId(null);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-[#dc2626] text-white text-xs font-black cursor-pointer"
                                >
                                  {isRw ? 'Siba' : 'Delete'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteCodeConfirmId(item.id)}
                                className="p-1.5 rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] border border-[#dc2626] transition-colors cursor-pointer"
                                title="Siba"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & PAYMENT NUMBERS */}
        {adminTab === 'settings' && (
          <div className="p-5 rounded-3xl bg-white border-2 border-[#fecaca] space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#dc2626]" />
              <h3 className="font-['Outfit'] font-black text-base uppercase text-[#b91c1c]">
                {isRw ? "Numero zo Kubitsaho n'Imikorere ya Sisitemu" : 'Gateway Payment Numbers & System Settings'}
              </h3>
            </div>

            {settingsSaved && (
              <div className="p-3.5 rounded-2xl bg-[#dc2626] text-white text-xs font-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{isRw ? 'Ibyahinduwe byabitswe neza!' : 'Settings updated successfully!'}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Payment Numbers */}
              <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] space-y-3">
                <span className="text-xs font-black text-[#b91c1c] uppercase tracking-wider block">
                  {isRw ? 'Numero zikoreshwa mu kubitsa (MTN & Airtel)' : 'Official Deposit Numbers'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1">
                      MTN Mobile Money Number:
                    </label>
                    <input
                      type="text"
                      value={mtnNumberInput}
                      onChange={(e) => setMtnNumberInput(e.target.value)}
                      placeholder="0793002388"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#fecaca] font-mono font-black text-[#dc2626] text-base focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1">
                      Airtel Money Number:
                    </label>
                    <input
                      type="text"
                      value={airtelNumberInput}
                      onChange={(e) => setAirtelNumberInput(e.target.value)}
                      placeholder="0793002388"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#fecaca] font-mono font-black text-[#dc2626] text-base focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-[#991b1b] block mb-1">
                    {isRw ? 'Amafaranga make yo kubitsa (Min Deposit):' : 'Min Deposit (RWF):'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={minDepositInput}
                    onChange={(e) => setMinDepositInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] font-mono font-black text-[#7f1d1d] text-sm focus:outline-none focus:border-[#dc2626]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-[#991b1b] block mb-1">
                    {isRw ? 'Amafaranga make yo kubikuza (Min Withdrawal):' : 'Min Withdrawal (RWF):'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={minWithdrawInput}
                    onChange={(e) => setMinWithdrawInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] font-mono font-black text-[#7f1d1d] text-sm focus:outline-none focus:border-[#dc2626]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-[#991b1b] block mb-1">
                    {isRw ? 'Ikiguzi cyo kubikuza (Withdraw Fee %):' : 'Withdrawal Fee (%):'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={withdrawFeeInput}
                    onChange={(e) => setWithdrawFeeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] font-mono font-black text-[#dc2626] text-sm focus:outline-none focus:border-[#dc2626]"
                    required
                  />
                </div>
              </div>

              {/* Telegram Group, Channel & Support Team URLs */}
              <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] space-y-3">
                <span className="text-xs font-black text-[#b91c1c] uppercase tracking-wider block">
                  {isRw
                    ? 'Aho bashakira Ubufasha (Telegram Group, Channel & Support Team)'
                    : 'Help Links (Telegram Group, Channel & Support Team)'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1">
                      Telegram Group Link:
                    </label>
                    <input
                      type="url"
                      value={telegramGroupInput}
                      onChange={(e) => setTelegramGroupInput(e.target.value)}
                      placeholder="https://t.me/picanonrw1"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#fecaca] font-mono font-bold text-[#7f1d1d] text-xs focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1">
                      Telegram Channel Link:
                    </label>
                    <input
                      type="url"
                      value={telegramChannelInput}
                      onChange={(e) => setTelegramChannelInput(e.target.value)}
                      placeholder="https://t.me/Picanon_channel"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#fecaca] font-mono font-bold text-[#7f1d1d] text-xs focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-[#991b1b] block mb-1">
                      Support Team Link:
                    </label>
                    <input
                      type="url"
                      value={telegramSupportInput}
                      onChange={(e) => setTelegramSupportInput(e.target.value)}
                      placeholder="https://t.me/Picanon_support"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#fecaca] font-mono font-bold text-[#7f1d1d] text-xs focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Broadcast announcement */}
              <div>
                <label className="text-xs font-black text-[#991b1b] block mb-1">
                  {isRw ? "Itangazo ry'Ubuyobozi (Broadcast Banner):" : 'Official Broadcast Message:'}
                </label>
                <textarea
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] text-[#7f1d1d] font-bold text-sm focus:outline-none focus:border-[#dc2626]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>{isRw ? 'BIKA IMPINDUKA ZA SISTEMU' : 'SAVE SYSTEM CONFIGURATION'}</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

