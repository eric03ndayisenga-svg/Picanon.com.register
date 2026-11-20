import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, RotateCw, ShoppingCart, Users } from 'lucide-react';
import { Language, UserAccount } from '../types';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  hasPurchasedProduct?: boolean;
  onSpinWin: (amount: number, freeSpinsDelta?: number) => void;
  language: Language;
  onGoToProducts?: () => void;
  onGoToTeam?: () => void;
}

interface Sector {
  label: string;
  labelRw: string;
  amount: number;
  isTryAgain: boolean;
}

const SECTORS: Sector[] = [
  { label: 'Try Again', labelRw: 'Ongera Ugerageze', amount: 0, isTryAgain: true },
  { label: '50,000 RWF', labelRw: '50,000 RWF', amount: 50000, isTryAgain: false },
  { label: 'Try Again', labelRw: 'Ongera Ugerageze', amount: 0, isTryAgain: true },
  { label: '10,000 RWF', labelRw: '10,000 RWF', amount: 10000, isTryAgain: false },
  { label: 'Try Again', labelRw: 'Ongera Ugerageze', amount: 0, isTryAgain: true },
  { label: '100,000 RWF', labelRw: '100,000 RWF', amount: 100000, isTryAgain: false },
  { label: 'Try Again', labelRw: 'Ongera Ugerageze', amount: 0, isTryAgain: true },
  { label: '25,000 RWF', labelRw: '25,000 RWF', amount: 25000, isTryAgain: false },
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  user,
  hasPurchasedProduct = false,
  onSpinWin,
  language,
  onGoToProducts,
  onGoToTeam,
}) => {
  if (!isOpen) return null;

  const isRw = language === 'rw';
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [requirementError, setRequirementError] = useState<string | null>(null);

  const hasInvitedFriends = (user.teamCountLevel1 || 0) > 0;
  const isEligibleToSpin = hasPurchasedProduct || hasInvitedFriends || (user.vipLevel || 0) > 0 || (user.totalRecharged || 0) >= 1000;

  const handleSpin = () => {
    setRequirementError(null);
    setResultMessage(null);

    if (!isEligibleToSpin) {
      setRequirementError(
        isRw
          ? 'Gukaraga bisaba ko waguze umugabane wa VIP cyangwa watumiye inshuti! Banza ugure igicuruzwa cya VIP cyangwa usangize inshuti link yawe.'
          : 'Spinning requires purchasing a VIP product or inviting friends! Please purchase a VIP product or invite friends first.'
      );
      return;
    }

    if (spinning || user.freeSpins <= 0) return;

    setSpinning(true);

    const tryAgainIndices = [0, 2, 4, 6];
    const chosenIndex = tryAgainIndices[Math.floor(Math.random() * tryAgainIndices.length)];

    const sectorAngle = 360 / SECTORS.length;
    const sectorCenter = chosenIndex * sectorAngle + sectorAngle / 2;
    const targetOffset = (360 - sectorCenter) % 360;
    const extraFullRotations = 360 * 6;
    const nextRotation = rotation + extraFullRotations + ((targetOffset - (rotation % 360) + 360) % 360);

    setRotation(nextRotation);

    setTimeout(() => {
      setSpinning(false);
      setResultMessage(
        isRw
          ? 'Try Again! Ongera ugerageze ubutaha. Nta mafaranga watsindiye kuri iyi nshuro.'
          : 'Try Again! Better luck next time. No prize won on this spin.'
      );
      onSpinWin(0, -1);
    }, 4200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#fee2e2] text-[#b91c1c] hover:bg-[#dc2626] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5 mt-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#dc2626] text-white text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{isRw ? "Ikarita y'Amahirwe" : 'Lucky Style Wheel'}</span>
          </div>
          <h3 className="font-black text-[#7f1d1d] text-2xl">
            {isRw ? 'Zunguza Utsindire Ibihembo' : 'Spin the Wheel'}
          </h3>
          <p className="text-sm font-black text-[#991b1b]">
            {isRw
              ? `Ufite inshuro ${user.freeSpins} zo kuzunguza`
              : `You have ${user.freeSpins} available spin(s)`}
          </p>
        </div>

        {/* Eligibility Status Banner */}
        {!isEligibleToSpin && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#fef2f2] border-2 border-[#dc2626] text-[#7f1d1d] text-sm space-y-2 text-center w-full">
            <div className="flex items-center justify-center gap-1.5 font-black text-[#dc2626]">
              <AlertCircle className="w-5 h-5" />
              <span>{isRw ? 'Ibisabwa mbere yo Gukaraga' : 'Requirements to Spin'}</span>
            </div>
            <p className="text-xs font-bold text-[#991b1b] leading-relaxed">
              {isRw
                ? 'Gukaraga bige bisaba ko waguze umugabane (VIP Product) cyangwa watumiye inshuti muri Picanon!'
                : 'Spinning requires having purchased a VIP product or invited at least 1 friend!'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {onGoToProducts && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToProducts();
                  }}
                  className="px-3.5 py-2 rounded-full bg-[#dc2626] text-white font-black text-xs flex items-center gap-1.5 hover:bg-[#b91c1c] cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isRw ? 'Gura Umugabane' : 'Buy VIP'}</span>
                </button>
              )}
              {onGoToTeam && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToTeam();
                  }}
                  className="px-3.5 py-2 rounded-full bg-white border-2 border-[#dc2626] text-[#dc2626] font-black text-xs flex items-center gap-1.5 hover:bg-[#fef2f2] cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isRw ? 'Tumira Inshuti' : 'Invite Friends'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {requirementError && (
          <div className="mt-3 p-3 rounded-2xl bg-[#dc2626] text-white text-sm font-black text-center w-full animate-in zoom-in-95">
            {requirementError}
          </div>
        )}

        {/* Wheel Container (Red & White Alternating Sectors) */}
        <div className="relative my-5 w-64 h-64 flex items-center justify-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-x-8 border-x-transparent border-t-16 border-t-[#991b1b] drop-shadow-md" />

          <div
            className="w-full h-full rounded-full border-4 border-[#dc2626] shadow-2xl overflow-hidden relative transition-transform duration-[4200ms] cubic-bezier(0.15, 0.85, 0.25, 1)"
            style={{
              transform: `rotate(${rotation}deg)`,
              background:
                'conic-gradient(#dc2626 0deg 45deg, #ffffff 45deg 90deg, #b91c1c 90deg 135deg, #fee2e2 135deg 180deg, #dc2626 180deg 225deg, #ffffff 225deg 270deg, #b91c1c 270deg 315deg, #fee2e2 315deg 360deg)',
            }}
          >
            {SECTORS.map((s, idx) => {
              const angle = idx * 45 + 22.5;
              return (
                <div
                  key={idx}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center font-black text-[10px] tracking-tight uppercase ${
                    s.isTryAgain ? 'text-white' : 'text-[#b91c1c]'
                  }`}
                  style={{
                    transform: `rotate(${angle}deg) translate(0, -85px)`,
                  }}
                >
                  {s.label}
                </div>
              );
            })}
          </div>

          <div className="absolute w-16 h-16 rounded-full bg-white border-4 border-[#dc2626] flex items-center justify-center text-[#dc2626] font-black shadow-lg z-10 text-xs">
            PICANON
          </div>
        </div>

        {resultMessage && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-[#fef2f2] border-2 border-[#dc2626] text-[#7f1d1d] font-bold text-sm text-center animate-in zoom-in-95">
            <span className="text-[#dc2626] block mb-0.5 font-black uppercase text-base">
              TRY AGAIN
            </span>
            <span>{resultMessage}</span>
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning || user.freeSpins <= 0}
          className={`w-full max-w-xs py-4 rounded-full font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            spinning || user.freeSpins <= 0
              ? 'bg-[#fee2e2] text-[#991b1b] cursor-not-allowed'
              : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white active:scale-98 cursor-pointer'
          }`}
        >
          <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
          <span>
            {spinning
              ? isRw
                ? 'Biri Kuzunguruka...'
                : 'Spinning...'
              : user.freeSpins > 0
              ? isRw
                ? `ZUNGUZA NONAHA (${user.freeSpins})`
                : `SPIN NOW (${user.freeSpins})`
              : isRw
              ? 'NTA MAHIRWE UFITE'
              : 'NO SPINS LEFT'}
          </span>
        </button>
      </div>
    </div>
  );
};
