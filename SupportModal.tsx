import React from 'react';
import {
  X,
  Send,
  Users,
  Radio,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Language, AdminSettings } from '../types';
import { picanonBrandEmblem } from '../assets/images';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  language: Language;
  onOpenLiveChat?: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  language,
  onOpenLiveChat,
}) => {
  if (!isOpen) return null;

  const isRw = language === 'rw';
  const telegramGroupUrl = adminSettings.telegramGroup || 'https://t.me/picanonrw1';
  const telegramChannelUrl = adminSettings.telegramChannel || 'https://t.me/Picanon_channel';
  const supportTeamUrl = adminSettings.telegramSupport || 'https://t.me/Picanon_support';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b-2 border-[#fecaca] shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={picanonBrandEmblem}
              alt="Picanon"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#dc2626]"
            />
            <div>
              <h3 className="font-black text-[#7f1d1d] text-lg">
                {isRw ? 'Ubufasha (Help & Support)' : 'Picanon Help & Support'}
              </h3>
              <p className="text-xs font-extrabold text-[#991b1b]">
                {isRw
                  ? 'Telegram Group, Telegram Channel & Support Team'
                  : 'Telegram Group, Telegram Channel & Support Team'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#dc2626] hover:bg-[#fee2e2] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-3.5">
          {/* 1. Telegram Group */}
          <a
            href={telegramGroupUrl}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white hover:bg-[#fef2f2] flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-base text-[#7f1d1d] block">
                  Telegram Group
                </span>
                <span className="text-xs font-bold text-[#991b1b] block truncate">
                  {isRw
                    ? "Itsinda ry'abanyamuryango ba Picanon"
                    : 'Join Picanon members community group'}
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-[#dc2626] shrink-0 ml-2">
              {isRw ? 'Injira' : 'Join'} &rarr;
            </span>
          </a>

          {/* 2. Telegram Channel */}
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white hover:bg-[#fef2f2] flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-base text-[#7f1d1d] block">
                  Telegram Channel
                </span>
                <span className="text-xs font-bold text-[#991b1b] block truncate">
                  {isRw
                    ? "Amakuru mashya n'impano z'umunsi"
                    : 'Official announcements & daily gift codes'}
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-[#dc2626] shrink-0 ml-2">
              {isRw ? 'Fungura' : 'Open'} &rarr;
            </span>
          </a>

          {/* 3. Support Team */}
          <a
            href={supportTeamUrl}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-2xl border-2 border-[#fecaca] bg-white hover:bg-[#fef2f2] flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-base text-[#7f1d1d] block">
                  Support Team
                </span>
                <span className="text-xs font-bold text-[#991b1b] block truncate">
                  {isRw
                    ? "Vugana n'itsinda ry'ubufasha (24/7)"
                    : 'Direct Picanon Support Team (24/7)'}
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-[#dc2626] shrink-0 ml-2">
              {isRw ? 'Bandikire' : 'Chat'} &rarr;
            </span>
          </a>

          {/* Live Chat Feature Card */}
          {onOpenLiveChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveChat();
              }}
              className="w-full p-4 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white flex items-center justify-between shadow-md active:scale-[0.99] transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white text-[#dc2626] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white">
                      {isRw ? 'Fungura Live Chat' : 'Open Live Chat'}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#dc2626]">
                      Online
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/95">
                    {isRw
                      ? "Ganira n'umukozi wa Picanon ako kanya"
                      : 'Instant support chat with Picanon desk'}
                  </p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-white shrink-0" />
            </button>
          )}

          {/* Working Hours Info */}
          <div className="p-3.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] flex items-center gap-2.5 text-[#991b1b] text-sm font-bold">
            <Clock className="w-5 h-5 shrink-0 text-[#dc2626]" />
            <span>
              {isRw
                ? "Amasaha y'akazi: Buri munsi (24/7). Kubitsa no kubikuza bikorwa ako kanya."
                : 'Working hours: Available 24/7. Automated MTN & Airtel payment handling.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
