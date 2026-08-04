import React from 'react';
import { NavTab } from '../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
  currentTab?: NavTab;
  onTabChange: (tab: NavTab) => void;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'SANATANA',
  subtitle,
  showBack = false,
  onBack,
  onSettingsClick,
  onNotificationClick,
  onTabChange,
  transparent = false,
}) => {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 px-5 flex justify-between items-center backdrop-blur-xl border-b ${
      transparent
        ? 'bg-transparent border-transparent'
        : 'bg-[#0A0A0A]/85 bg-gradient-to-b from-[#0e0e0e] to-transparent border-[#4e4539]/20'
    }`}>
      {showBack ? (
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#f2c377] hover:bg-[#353534]/30 active:scale-95 transition-all"
          aria-label="Go Back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => onTabChange('profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all"
          aria-label="Menu"
        >
          <img
            src="/lotus.png"
            alt="Menu"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(244, 174, 69, 0.5))' }}
          />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        <h1 className="font-cinzel text-lg md:text-xl tracking-[0.2em] font-bold text-[#f2c377] uppercase">
          {title}
        </h1>
        {subtitle && (
          <span className="text-[10px] text-[#d2c4b3]/70 font-label-sm uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onNotificationClick ? (
          <button
            onClick={onNotificationClick}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#f2c377] hover:bg-[#353534]/30 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onSettingsClick || (() => onTabChange('profile'))}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#f2c377] hover:bg-[#353534]/30 active:scale-95 transition-all"
            aria-label="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};
