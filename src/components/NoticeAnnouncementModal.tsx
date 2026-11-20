import React from 'react';
import { Send } from 'lucide-react';
import { Language, AdminSettings } from '../types';
import { picanonBrandEmblem, picanonHeroBanner } from '../assets/images';

interface NoticeAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  channelUrl?: string;
  groupUrl?: string;
  adminSettings?: AdminSettings;
  language: Language;
}

export const NoticeAnnouncementModal: React.FC<NoticeAnnouncementModalProps> = ({
  isOpen,
  onClose,
  channelUrl = 'https://t.me/Picanon_channel',
  groupUrl,
  adminSettings,
  language,
}) => {
  if (!isOpen) return null;

  const isRw = language === 'rw';
  const minDeposit = adminSettings?.minDeposit ?? 1000;
  const minWithdrawal = adminSettings?.minWithdrawal ?? 1000;
  const withdrawFee = adminSettings?.withdrawalFeePercent ?? 10;
  const momoNumber = adminSettings?.mtnNumber || '0793002388';
  const telegramGroup = groupUrl || adminSettings?.telegramGroup || 'https://t.me/picanonrw1';
  const supportHandle = '@Picanon_support';

  const items = isRw
    ? [
        `Kubitsa bitangira kuri RWF ${minDeposit.toLocaleString()}; VIP 0 (RWF 3,000) itanga RWF 600 buri munsi mu minsi 40.`,
        `Numero yemewe ya MoMo & Airtel ni ${momoNumber} yonyine (MTN MoMo na Airtel Money).`,
        `Impano yo kwiyandikisha (Registration Bonus): RWF 1,500 + Free Spins 2; Check-in ya buri munsi: RWF 100.`,
        `Kubikuza bikorwa 24/7 guhera kuri RWF ${minWithdrawal.toLocaleString()}, ikiguzi cyo kubikuza ni ${withdrawFee}% (Pending · Approved · Rejected).`,
        `Tumira inshuti ukoresheje link yawe uhite ubona komisiyo ya 38% (L1), 2% (L2), na 1% (L3) ku byo bashoye.`,
        `Inyungu ya VIP ijya kuri konti yawe buri masaha 24 muri Tasks. Ubufasha: ${supportHandle}.`,
      ]
    : [
        `Minimum deposit is RWF ${minDeposit.toLocaleString()}; VIP 0 (RWF 3,000) earns RWF 600 daily for 40 days.`,
        `Official MoMo & Airtel payment number is ONLY ${momoNumber} (MTN MoMo & Airtel Money).`,
        `Registration Bonus: RWF 1,500 + 2 Free Spins; Daily Check-in Bonus: RWF 100.`,
        `Withdrawals run 24/7 from RWF ${minWithdrawal.toLocaleString()} with a ${withdrawFee}% fee and live Pending / Approved / Rejected tracking.`,
        `Invite friends to invest and immediately earn 38% (Level 1), 2% (Level 2), and 1% (Level 3) commission.`,
        `VIP product income credits every 24 hours in Tasks. Official Support: ${supportHandle}.`,
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#7f1d1d]/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="absolute inset-x-0 top-0 h-64 overflow-hidden opacity-45 pointer-events-none">
        <img
          src={picanonHeroBanner}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Centered White Card with Overlapping Large Red-Bordered Emblem */}
      <div className="relative w-full max-w-sm mt-12 bg-white border-2 border-[#dc2626] rounded-3xl shadow-2xl px-6 pt-16 pb-6 text-[#7f1d1d]">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-2xl bg-white border-2 border-[#dc2626] shadow-lg flex flex-col items-center justify-center p-1.5">
          <img
            src={picanonBrandEmblem}
            alt="Picanon"
            className="w-18 h-18 rounded-xl object-cover"
          />
          <span className="text-xs font-black tracking-wider text-[#dc2626] uppercase mt-1">
            PICANON
          </span>
        </div>

        <div className="space-y-3 text-sm font-extrabold text-[#7f1d1d] leading-snug max-h-[55vh] overflow-y-auto pr-1">
          {items.map((text, idx) => (
            <p key={idx}>
              <span className="font-black text-[#dc2626] mr-1">{idx + 1}.</span>
              {text}
            </p>
          ))}

          <p className="pt-1 font-black text-[#991b1b]">
            {isRw
              ? 'Injira muri groupe ya Telegram ya Picanon umenye amakuru n’ubufasha bwa buri munsi.'
              : 'Join our official Picanon Telegram group for updates, guides, and support.'}
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          <a
            href={telegramGroup}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-white border-2 border-[#dc2626] hover:bg-[#fef2f2] text-[#dc2626] font-black text-base shadow-sm flex items-center justify-between transition-colors"
          >
            <Send className="w-5 h-5 shrink-0" />
            <span className="text-center flex-1">
              {isRw ? 'Kanda winjire muri Telegram Group' : 'Click to Join Telegram group'}
            </span>
            <Send className="w-5 h-5 shrink-0 opacity-80" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-lg tracking-wide shadow-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            OK
          </button>

          <div className="text-center pt-0.5">
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-black text-[#991b1b] hover:text-[#dc2626] underline"
            >
              {isRw ? 'Channel: @Picanon_channel' : 'Official Channel: @Picanon_channel'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
