import React from 'react';
import { Home, Package, Users, User } from 'lucide-react';
import { Language } from '../types';

export type TabType = 'home' | 'products' | 'tasks' | 'team' | 'profile';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  language: Language;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  language,
}) => {
  const isRw = language === 'rw';

  const navItems: { id: TabType; label: string; icon: typeof Home }[] = [
    { id: 'home', label: isRw ? 'Ahabanza' : 'Home', icon: Home },
    { id: 'products', label: isRw ? 'Ibicuruzwa' : 'Product', icon: Package },
    { id: 'team', label: isRw ? 'Itsinda' : 'Team', icon: Users },
    { id: 'profile', label: isRw ? 'Konti' : 'Mine', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#fecaca] shadow-[0_-4px_16px_rgba(220,38,38,0.10)]">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'profile' && currentTab === 'tasks');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#dc2626]'
                  : 'text-[#991b1b]/75 hover:text-[#dc2626] hover:bg-[#fef2f2]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#dc2626]" />
              )}
              <Icon
                className={`w-6 h-6 mb-0.5 transition-transform ${
                  isActive ? 'scale-110 text-[#dc2626] stroke-[2.6]' : 'stroke-[2.1]'
                }`}
              />
              <span
                className={`text-[13px] tracking-tight leading-none font-display ${
                  isActive ? 'font-black text-[#dc2626]' : 'font-bold text-[#991b1b]/85'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
