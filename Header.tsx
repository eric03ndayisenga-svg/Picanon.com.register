import React from 'react';
import {
  Globe,
  Headphones,
  Bell,
  LogOut,
  Info,
} from 'lucide-react';
import { UserAccount, Language } from '../types';
import { picanonBrandEmblem } from '../assets/images';

interface HeaderProps {
  user: UserAccount;
  language: Language;
  onToggleLanguage: () => void;
  onOpenSupport: () => void;
  onOpenNoticeModal: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  language,
  onToggleLanguage,
  onOpenSupport,
  onOpenNoticeModal,
  onOpenAdmin,
  onOpenAbout,
  onLogout,
}) => {
  const isRw = language === 'rw';

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-[#fecaca] px-3 py-2.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: Quick utilities */}
        <div className="flex items-center gap-1.5 min-w-[96px]">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="min-h-[42px] px-3 rounded-xl text-sm font-black text-[#b91c1c] hover:text-white hover:bg-[#dc2626] border-2 border-[#fecaca] bg-[#fef2f2] flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isRw ? 'Hindura Ururimi' : 'Change Language'}
          >
            <Globe className="w-4 h-4" />
            <span>{isRw ? 'RW' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            aria-label={isRw ? 'Ibyerekeye Picanon' : 'About Picanon'}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#b91c1c] hover:text-white hover:bg-[#dc2626] border-2 border-[#fecaca] bg-[#fef2f2] transition-colors cursor-pointer"
            title="Picanon"
          >
            <Info className="w-5 h-5 stroke-[2.4]" />
          </button>
        </div>

        {/* Center: Large Brand Medallion & Bold Title */}
        <div
          onClick={user.phone === '0793002388' ? onOpenAdmin : undefined}
          className={`flex flex-col items-center justify-center ${user.phone === '0793002388' ? 'cursor-pointer active:scale-95' : ''}`}
        >
          <img
            src={picanonBrandEmblem}
            alt="Picanon"
            className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-[#dc2626] mb-1"
          />
          <span className="font-display text-lg font-black tracking-[0.22em] text-[#dc2626] uppercase leading-none">
            PICANON
          </span>
        </div>

        {/* Right: Support, Notice & Logout */}
        <div className="flex items-center justify-end gap-1 min-w-[96px]">
          <button
            type="button"
            onClick={onOpenSupport}
            aria-label={isRw ? 'Ubufasha' : 'Customer Service'}
            className="min-h-[42px] min-w-[40px] flex items-center justify-center rounded-xl text-[#b91c1c] hover:text-white hover:bg-[#dc2626] transition-colors cursor-pointer"
            title={isRw ? 'Ubufasha' : 'Customer Service'}
          >
            <Headphones className="w-5 h-5 stroke-[2.4]" />
          </button>

          <button
            type="button"
            onClick={onOpenNoticeModal}
            aria-label={isRw ? 'Amatangazo' : 'Announcements'}
            className="min-h-[42px] min-w-[40px] flex items-center justify-center rounded-xl text-[#b91c1c] hover:text-white hover:bg-[#dc2626] transition-colors cursor-pointer"
            title={isRw ? 'Amatangazo' : 'Announcements'}
          >
            <Bell className="w-5 h-5 stroke-[2.4]" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            aria-label={isRw ? 'Sohoka' : 'Logout'}
            className="min-h-[42px] min-w-[40px] flex items-center justify-center rounded-xl text-[#dc2626] hover:text-white hover:bg-[#dc2626] transition-colors cursor-pointer"
            title={isRw ? 'Sohoka' : 'Logout'}
          >
            <LogOut className="w-5 h-5 stroke-[2.4]" />
          </button>
        </div>
      </div>
    </header>
  );
};
