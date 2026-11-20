import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpFromLine,
  HelpCircle,
  ListChecks,
  FileText,
  Info,
  Scale,
  CalendarCheck,
  Bell,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { UserAccount, VIPProduct, InvestmentRecord, Language } from '../types';
import { picanonHeroBanner, picanonBrandEmblem } from '../assets/images';

interface HomeViewProps {
  user: UserAccount;
  products: VIPProduct[];
  activeInvestments: InvestmentRecord[];
  broadcastMessage: string;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenLuckyWheel: () => void;
  onOpenGiftCode: () => void;
  onOpenNotice: () => void;
  onNavigateToProducts: () => void;
  onNavigateToTasks: () => void;
  onOpenRecords?: () => void;
  onDailyCheckIn?: () => Promise<boolean>;
  onOpenAbout: () => void;
  onOpenSupport?: () => void;
  onOpenLiveChat?: () => void;
  onOpenFaq?: () => void;
  language: Language;
}

const PARTNER_BRANDS = [
  'Nike',
  'Adidas',
  'Puma',
  'Zara',
  'New Balance',
  'Timberland',
  'H&M',
  'Lacoste',
  'Gucci',
];

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  broadcastMessage,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenNotice,
  onNavigateToProducts,
  onNavigateToTasks,
  onOpenRecords,
  onDailyCheckIn,
  onOpenAbout,
  onOpenSupport,
  onOpenLiveChat,
  onOpenFaq,
  language,
}) => {
  const isRw = language === 'rw';
  const [checkInDone, setCheckInDone] = useState<boolean>(false);
  const [checkInToast, setCheckInToast] = useState<string | null>(null);
  const [isRegulationOpen, setIsRegulationOpen] = useState<boolean>(false);

  const todayIso = new Date().toISOString().split('T')[0];
  const isCheckedInToday = checkInDone || user.lastCheckInDate === todayIso;

  const handleClickIn = async () => {
    if (isCheckedInToday) {
      setCheckInToast(
        isRw
          ? 'Wamaze gukora Check-in uyu munsi!'
          : 'You already checked in today!'
      );
      setTimeout(() => setCheckInToast(null), 3000);
      return;
    }

    if (onDailyCheckIn) {
      const ok = await onDailyCheckIn();
      setCheckInDone(true);
      setCheckInToast(
        ok
          ? isRw
            ? 'Wakiriye +100 Frw ya Daily Check-in!'
            : 'Checked in! +100 Frw added to your balance.'
          : isRw
            ? 'Wamaze gukora Check-in uyu munsi!'
            : 'You already checked in today!'
      );
      setTimeout(() => setCheckInToast(null), 3200);
    }
  };

  const actionItems = [
    {
      id: 'recharge',
      label: isRw ? 'Kubitsa' : 'Recharge',
      icon: Wallet,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onOpenDeposit,
    },
    {
      id: 'withdrawal',
      label: isRw ? 'Kubikuza' : 'Withdrawal',
      icon: ArrowUpFromLine,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onOpenWithdraw,
    },
    {
      id: 'help',
      label: isRw ? 'Ubufasha' : 'Help',
      icon: HelpCircle,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onOpenSupport || onOpenLiveChat || onOpenFaq || onOpenNotice,
    },
    {
      id: 'tasks',
      label: isRw ? 'Imirimo' : 'Task Center',
      icon: ListChecks,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onNavigateToTasks,
    },
    {
      id: 'records',
      label: isRw ? 'Ibyakozwe' : 'Records',
      icon: FileText,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onOpenRecords || onNavigateToProducts,
    },
    {
      id: 'about',
      label: isRw ? 'Ibyerekeye' : 'About',
      icon: Info,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: onOpenAbout,
    },
    {
      id: 'regulation',
      label: isRw ? 'Amategeko' : 'Regulation',
      icon: Scale,
      circleClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      onClick: () => setIsRegulationOpen(true),
    },
    {
      id: 'clickin',
      label: isCheckedInToday ? (isRw ? 'Byakozwe' : 'Checked') : isRw ? 'Check-in' : 'Click In',
      icon: CalendarCheck,
      circleClass: isCheckedInToday
        ? 'bg-gradient-to-br from-[#f87171] to-[#dc2626]'
        : 'bg-gradient-to-br from-[#dc2626] to-[#7f1d1d]',
      onClick: handleClickIn,
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-28 pt-3 px-4 max-w-md mx-auto space-y-4 animate-in fade-in duration-150">
      {/* Toast Notification for Click In */}
      {checkInToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#b91c1c] border-2 border-white text-white text-sm font-black px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{checkInToast}</span>
        </div>
      )}

      {/* 0. Large Prominent Brand & Collection Hero Photo */}
      <div className="relative rounded-[28px] overflow-hidden border-2 border-[#dc2626] shadow-[0_10px_28px_rgba(220,38,38,0.18)] aspect-[16/9] bg-[#991b1b]">
        <img
          src={picanonHeroBanner}
          alt="Picanon Luxury Apparel & Footwear"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#7f1d1d]/90 via-[#991b1b]/25 to-transparent flex items-end justify-between p-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={picanonBrandEmblem}
              alt="Picanon"
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {isRw ? "Picanon · Imyambaro n'Inkweto" : 'Picanon Luxury Fashion'}
              </h2>
              <p className="text-sm font-extrabold text-white/95 truncate">
                {isRw ? 'Shora uyu munsi, wunguke buri munsi' : 'Invest today, earn every day'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Live Announcements Bar */}
      <button
        type="button"
        onClick={onOpenNotice}
        className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-[#fecaca] shadow-sm text-[#7f1d1d] flex items-center gap-3 text-left hover:bg-[#fef2f2] transition-colors cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-picanon-notice items-center gap-10 whitespace-nowrap">
            <span className="text-sm sm:text-base font-black text-[#991b1b] pr-10">
              {broadcastMessage}
            </span>
            <span className="text-sm sm:text-base font-black text-[#991b1b] pr-10" aria-hidden="true">
              {broadcastMessage}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#dc2626] shrink-0 stroke-[2.5]" />
      </button>

      {/* 2. Quick Actions 4x2 Card */}
      <div className="bg-white rounded-[28px] border-2 border-[#fecaca] shadow-[0_8px_24px_rgba(220,38,38,0.1)] px-3.5 py-5">
        <div className="grid grid-cols-4 gap-y-5 gap-x-1.5">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-start text-center group cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-15 h-15 rounded-full ${item.circleClass} flex items-center justify-center text-white shadow-md border-2 border-[#fee2e2] group-hover:brightness-105 transition-all`}
                >
                  <Icon className="w-7 h-7 stroke-[2.3]" />
                </div>
                <span className="mt-2 text-xs sm:text-sm font-black text-[#7f1d1d] leading-tight px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Account Balance & Cumulative Income Red Gradient Card */}
      <div className="rounded-[28px] p-2.5 bg-gradient-to-r from-[#ef4444] via-[#dc2626] to-[#991b1b] shadow-[0_12px_28px_rgba(185,28,28,0.28)]">
        <div className="rounded-[22px] border-2 border-dashed border-white/75 px-5 py-5 text-white">
          <div>
            <span className="text-base font-black text-white block">
              {isRw ? 'Amafaranga ufite' : 'Account Balance'}
            </span>
            <span className="font-display text-4xl sm:text-5xl font-black tracking-tight tabular-nums block mt-1">
              {user.balance.toLocaleString()} Frw
            </span>
          </div>

          <div className="border-t-2 border-white/30 my-4" />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-sm font-black text-white/95 block">
                {isRw ? 'Inyungu yose' : 'Cumulative Income'}
              </span>
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight tabular-nums block mt-0.5">
                {user.totalIncome.toLocaleString()} Frw
              </span>
            </div>

            <button
              type="button"
              onClick={onNavigateToProducts}
              className="font-display bg-white text-[#dc2626] font-black text-sm sm:text-base px-5 py-3 rounded-full shadow-md hover:bg-[#fef2f2] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {isRw ? 'Ibicuruzwa byanjye' : 'My Products'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Partners White Card */}
      <div className="bg-white rounded-[28px] border-2 border-[#fecaca] shadow-[0_8px_24px_rgba(220,38,38,0.08)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-2xl leading-none" aria-hidden="true">
            🤝
          </span>
          <h3 className="text-2xl font-black text-[#b91c1c] tracking-tight">
            {isRw ? 'Abafatanyabikorwa' : 'Partners'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {PARTNER_BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-[#fee2e2] border border-[#fca5a5] rounded-2xl h-16 px-2 flex items-center justify-center text-center"
            >
              <span className="text-[#991b1b] font-black text-sm sm:text-base tracking-tight leading-tight">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regulation / Platform Rules Modal */}
      {isRegulationOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
              <h3 className="font-black text-lg text-white">
                {isRw ? 'Amategeko ya Picanon' : 'Platform Regulation'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRegulationOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm font-bold text-[#7f1d1d] leading-relaxed">
              <p className="font-black text-lg text-[#b91c1c]">
                {isRw ? 'Amategeko n’Amabwiriza bya Picanon' : 'Picanon Rules & Guidelines'}
              </p>
              <div className="space-y-3">
                <p>
                  1. <strong className="font-black text-[#b91c1c]">{isRw ? 'Kubitsa (Recharge):' : 'Recharge:'}</strong>{' '}
                  {isRw
                    ? 'Amafaranga make yo kubitsa ni RWF 1,000 (VIP 0 – VIP 10). Kuri MTN na Airtel Mobile Money bikora amasaha 24/7.'
                    : 'Minimum deposit is RWF 1,000 (VIP 0 – VIP 10). Mobile Money channels are available 24/7.'}
                </p>
                <p>
                  2. <strong className="font-black text-[#b91c1c]">{isRw ? 'Kubikuza (Withdrawals):' : 'Withdrawals:'}</strong>{' '}
                  {isRw
                    ? 'Kubikuza bitangira kuri RWF 1,000 kugeza kuri RWF 5,000,000 ku munsi. Ikiguzi cya serivisi ni 10%.'
                    : 'Withdrawals start from RWF 1,000 up to RWF 5,000,000 per day. Processing fee is 10%.'}
                </p>
                <p>
                  3. <strong className="font-black text-[#b91c1c]">{isRw ? 'Ubutumire (Referrals):' : 'Referrals:'}</strong>{' '}
                  {isRw
                    ? 'Level 1 itanga komisiyo ya 38%, Level 2 itanga 2%, naho Level 3 igatanga 1%.'
                    : 'Level 1 gives 38% immediate cashback, Level 2 gives 2%, and Level 3 gives 1%.'}
                </p>
                <p>
                  4. <strong className="font-black text-[#b91c1c]">{isRw ? 'Umutekano:' : 'Security:'}</strong>{' '}
                  {isRw
                    ? 'Ntukagire uwo usangiza ijambobanga ryawe. Abakozi ba Picanon ntibashobora kurigusaba.'
                    : 'Never share your account password. Official Picanon staff will never ask for your password.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
