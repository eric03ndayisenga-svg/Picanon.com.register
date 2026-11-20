import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Play,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount, InvestmentRecord, TeamMemberSummary, Language } from '../types';
import {
  picanonBrandEmblem,
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

const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const INVITE_MILESTONES = [
  { target: 3, reward: 1500 },
  { target: 5, reward: 3000 },
  { target: 10, reward: 5000 },
  { target: 30, reward: 10000 },
  { target: 50, reward: 30000 },
];

interface TasksViewProps {
  user: UserAccount;
  activeInvestments: InvestmentRecord[];
  teamMembers?: TeamMemberSummary[];
  onCompleteDailyTask: (investmentId: string, rewardAmount: number) => void;
  onClaimInviteMilestone?: (target: number, reward: number) => Promise<boolean>;
  onNavigateToProducts: () => void;
  onBack?: () => void;
  language: Language;
}

export const TasksView: React.FC<TasksViewProps> = ({
  user,
  activeInvestments,
  teamMembers = [],
  onCompleteDailyTask,
  onClaimInviteMilestone,
  onNavigateToProducts,
  onBack,
  language,
}) => {
  const isRw = language === 'rw';
  const [subTab, setSubTab] = useState<'invite' | 'daily'>('invite');
  const [workingTaskId, setWorkingTaskId] = useState<string | null>(null);
  const [claimingTarget, setClaimingTarget] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const taskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
    };
  }, []);

  const getRemainingCooldownMs = (inv: InvestmentRecord) => {
    if (!inv.lastClaimAt) return 0;
    const elapsed = now - inv.lastClaimAt;
    return Math.max(0, CLAIM_COOLDOWN_MS - elapsed);
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeOnly = activeInvestments.filter((inv) => inv.status === 'active');
  const claimableVipCount = activeOnly.filter((inv) => getRemainingCooldownMs(inv) === 0).length;

  const depositedDirectCount = teamMembers.filter(
    (m) => m.level === 1 && (m.hasDeposited || m.totalInvested > 0)
  ).length;
  const claimedMilestones = user.claimedInviteMilestones || [];

  const getVipImage = (vipLevel: number) => {
    switch (vipLevel) {
      case 0:
        return picanonClassicSneakers;
      case 1:
        return picanonAthleticRunners;
      case 2:
        return picanonStreetwearCollection;
      case 3:
        return picanonLeatherBoots;
      case 4:
        return picanonTailoredSuit;
      case 5:
        return picanonVip5Tracksuit;
      case 6:
        return picanonVip6Capsule;
      case 7:
        return picanonVip7Atelier;
      case 8:
        return picanonVip8Showroom;
      case 9:
        return picanonVip9Couture;
      case 10:
      default:
        return picanonVip10Empire;
    }
  };

  const handleStartTask = (inv: InvestmentRecord) => {
    if (workingTaskId || getRemainingCooldownMs(inv) > 0 || inv.status !== 'active') return;

    setWorkingTaskId(inv.id);

    taskTimerRef.current = setTimeout(() => {
      taskTimerRef.current = null;
      setWorkingTaskId(null);
      onCompleteDailyTask(inv.id, inv.dailyIncome);
      setNow(Date.now());
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#dc2626', '#ffffff', '#ef4444'],
      });
    }, 3000);
  };

  const handleClaimMilestone = async (target: number, reward: number) => {
    if (!onClaimInviteMilestone || claimingTarget !== null) return;
    if (depositedDirectCount < target || claimedMilestones.includes(target)) return;
    setClaimingTarget(target);
    try {
      const ok = await onClaimInviteMilestone(target, reward);
      if (ok) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#ffffff', '#ef4444'],
        });
      }
    } finally {
      setClaimingTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-28 max-w-md mx-auto animate-in fade-in duration-150">
      {/* 1. Top Red Header Bar */}
      <div className="bg-[#dc2626] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}
          <h1 className="font-display text-2xl font-black tracking-tight">
            {isRw ? 'Ikigo cy’Imirimo' : 'Task Center'}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <img
            src={picanonBrandEmblem}
            alt="Picanon"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <span className="font-display text-sm font-black tracking-[0.2em] uppercase">
            PICANON
          </span>
        </div>
      </div>

      {/* 2. Clean Sub-Tab Switcher (Invite Tasks vs Daily VIP) */}
      <div className="px-4 pt-4">
        <div className="bg-white border-2 border-[#fecaca] rounded-full p-1.5 shadow-xs grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('invite')}
            className={`py-2.5 px-3 rounded-full text-sm font-black transition-colors cursor-pointer ${
              subTab === 'invite'
                ? 'bg-[#dc2626] text-white shadow-sm'
                : 'text-[#991b1b] hover:bg-[#fef2f2]'
            }`}
          >
            {isRw ? 'Gutumira Abashora' : 'Invite Tasks'}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('daily')}
            className={`py-2.5 px-3 rounded-full text-sm font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'daily'
                ? 'bg-[#dc2626] text-white shadow-sm'
                : 'text-[#991b1b] hover:bg-[#fef2f2]'
            }`}
          >
            <span>{isRw ? 'Inyungu za VIP (24h)' : 'VIP Daily'}</span>
            {claimableVipCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-black ${
                  subTab === 'daily' ? 'bg-white text-[#dc2626]' : 'bg-[#dc2626] text-white'
                }`}
              >
                {claimableVipCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Invite Milestones */}
      {subTab === 'invite' && (
        <div className="px-4 pt-4 space-y-4">
          {INVITE_MILESTONES.map(({ target, reward }) => {
            const currentCount = Math.min(target, depositedDirectCount);
            const pct = Math.min(100, Math.round((currentCount / target) * 100));
            const isClaimed = claimedMilestones.includes(target);
            const canClaim = !isClaimed && depositedDirectCount >= target;

            return (
              <div
                key={target}
                className="bg-white rounded-[28px] border-2 border-[#fecaca] p-5 shadow-[0_6px_20px_rgba(220,38,38,0.08)] space-y-3.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-black text-[#7f1d1d] leading-snug">
                    {isRw
                      ? `Tumira abantu ${target} babitsa`
                      : `Invite ${target} people who deposit`}
                  </h3>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="text-2xl font-black text-[#dc2626] block leading-tight">
                      {reward.toLocaleString()}
                    </span>
                    <span className="text-lg font-black text-[#dc2626] block leading-tight">
                      Frw
                    </span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full h-3 rounded-full bg-[#fee2e2] overflow-hidden">
                  <div
                    className="h-full bg-[#dc2626] rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-base font-black text-[#7f1d1d] tabular-nums">
                  {currentCount}/{target}
                </div>

                <button
                  type="button"
                  disabled={!canClaim || claimingTarget === target}
                  onClick={() => handleClaimMilestone(target, reward)}
                  className={`w-full py-3.5 rounded-full font-black text-base sm:text-lg transition-all ${
                    isClaimed
                      ? 'bg-[#fee2e2] text-[#991b1b] border-2 border-[#fca5a5] cursor-default'
                      : canClaim
                        ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-md active:scale-[0.99] cursor-pointer'
                        : 'bg-[#fca5a5] text-white cursor-not-allowed'
                  }`}
                >
                  {isClaimed
                    ? isRw
                      ? `Wakiriye ${reward.toLocaleString()} Frw`
                      : `Claimed ${reward.toLocaleString()} Frw`
                    : claimingTarget === target
                      ? isRw
                        ? 'Birakorwa...'
                        : 'Claiming...'
                      : isRw
                        ? `Akira ${reward.toLocaleString()} Frw`
                        : `Claim ${reward.toLocaleString()} Frw`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. VIP Daily 24h Dividend Claim Section */}
      {subTab === 'daily' && (
        <div className="px-4 pt-4 space-y-4">
          {activeOnly.length === 0 ? (
            <div className="bg-white border-2 border-[#fecaca] rounded-[28px] p-7 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] text-[#dc2626] mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-[#7f1d1d] text-xl">
                {isRw ? 'Nta masezerano ya VIP urafungura' : 'No Active VIP Contract'}
              </h3>
              <p className="text-base font-bold text-[#991b1b] max-w-xs mx-auto leading-relaxed">
                {isRw
                  ? 'Gura VIP 0 (3,000 Frw -> +600 Frw/munsi) cyangwa hejuru yayo kugira ngo wakire inyungu buri masaha 24.'
                  : 'Purchase VIP 0 (3,000 Frw -> +600 Frw/day) or higher to claim daily dividends every 24 hours.'}
              </p>
              <button
                type="button"
                onClick={onNavigateToProducts}
                className="px-6 py-3.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>{isRw ? 'Reba Ibicuruzwa bya VIP' : 'Browse VIP Products'}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            activeOnly.map((inv) => {
              const remainingMs = getRemainingCooldownMs(inv);
              const isCooldown = remainingMs > 0;
              const isWorking = workingTaskId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-[28px] border-2 border-[#fecaca] p-4 shadow-[0_6px_20px_rgba(220,38,38,0.08)] space-y-3.5"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getVipImage(inv.vipLevel)}
                      alt={inv.productName}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-[#dc2626] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black uppercase tracking-wider text-[#dc2626] block">
                        VIP {inv.vipLevel} · {inv.daysRemaining}/{inv.cycleDays}{' '}
                        {isRw ? 'iminsi' : 'days'}
                      </span>
                      <h4 className="font-black text-base text-[#7f1d1d] line-clamp-2 mt-0.5">
                        {inv.productName}
                      </h4>
                      <span className="font-black text-[#dc2626] text-lg block mt-1 tabular-nums">
                        +{inv.dailyIncome.toLocaleString()} Frw / {isRw ? 'munsi' : 'day'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#fecaca] flex items-center justify-between gap-2">
                    <span className="text-sm text-[#991b1b] font-black flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-4 h-4 text-[#dc2626]" />
                      <span>
                        {isCooldown
                          ? isRw
                            ? `Ubutaha: ${formatDuration(remainingMs)}`
                            : `Next: ${formatDuration(remainingMs)}`
                          : isRw
                            ? 'Buri masaha 24'
                            : 'Ready every 24h'}
                      </span>
                    </span>

                    {isCooldown ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2.5 rounded-full bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] text-sm font-black flex items-center gap-1.5 cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{isRw ? 'Wabifashe (24h)' : 'Claimed (24h)'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartTask(inv)}
                        disabled={isWorking}
                        className="px-5 py-2.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        {isWorking ? (
                          <>
                            <Zap className="w-4 h-4 animate-spin" />
                            <span>{isRw ? 'Birakorwa...' : 'Claiming...'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>{isRw ? 'Akira inyungu' : 'Claim'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
