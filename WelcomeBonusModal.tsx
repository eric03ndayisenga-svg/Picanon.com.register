import React from 'react';
import { Gift, Sparkles, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../types';

interface WelcomeBonusModalProps {
  isOpen: boolean;
  onClaim: () => void;
  onClose?: () => void;
  language: Language;
}

export const WelcomeBonusModal: React.FC<WelcomeBonusModalProps> = ({
  isOpen,
  onClaim,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const isRw = language === 'rw';

  const handleClaim = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#ffffff', '#ef4444'],
    });
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border-2 border-[#dc2626] rounded-3xl p-6 text-center shadow-2xl space-y-4 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#fee2e2] text-[#b91c1c] hover:bg-[#dc2626] hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-sm font-black leading-none">&times;</span>
          </button>
        )}
        <div className="w-18 h-18 rounded-3xl bg-[#dc2626] mx-auto flex items-center justify-center text-white shadow-xl animate-bounce">
          <Gift className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-[#dc2626] px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRw ? 'Impano yo Kwinjira' : 'Welcome Gift'}</span>
          </div>
          <h3 className="font-black text-[#7f1d1d] text-2xl tracking-tight">
            {isRw ? 'Murakaza Neza muri Picanon!' : 'Welcome to Picanon!'}
          </h3>
          <p className="text-sm font-bold text-[#991b1b]">
            {isRw
              ? "Konti yawe yahawe impano y'ikaze ya 1,500 RWF y'ubuntu n'amahirwe 2 yo kuzunguza uruziga rw'ibihembo!"
              : 'Your new account has received a 1,500 RWF free starter gift and 2 Lucky Wheel spins to kickstart your journey!'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] flex items-center justify-around">
          <div>
            <span className="text-xs text-[#991b1b] uppercase font-black block">
              {isRw ? 'Amafaranga' : 'Cash Bonus'}
            </span>
            <span className="text-xl font-black text-[#dc2626] font-mono">
              +1,500 RWF
            </span>
          </div>
          <div className="w-0.5 h-9 bg-[#fca5a5]" />
          <div>
            <span className="text-xs text-[#991b1b] uppercase font-black block">
              {isRw ? 'Kuzunguza' : 'Free Spins'}
            </span>
            <span className="text-xl font-black text-[#dc2626] font-mono">
              +2 Spins
            </span>
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle className="w-5 h-5" />
          <span>{isRw ? 'BYAKIRIWE · KOMEZA' : 'CREDITED · CONTINUE'}</span>
        </button>
      </div>
    </div>
  );
};
