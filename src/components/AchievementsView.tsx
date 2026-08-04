import React from 'react';
import { NavTab } from '../types';

interface AchievementsViewProps {
  user: { name: string; avatar: string };
  onTabChange: (tab: NavTab) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ onTabChange }) => {
  return (
    <div className="relative h-screen overflow-hidden">

      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/achieve.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Blur + dark overlay — only on this page */}
      <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#0B1220]/70" />

      {/* Back button — top-left */}
      <button
        onClick={() => onTabChange('profile')}
        className="absolute top-5 left-5 z-30 flex items-center justify-center w-10 h-10 rounded-full border border-[#D4AF37]/30 bg-[#1a1410]/60 backdrop-blur-sm"
        aria-label="Go back"
      >
        <span className="material-symbols-outlined text-[#D4AF37] text-xl">arrow_back</span>
      </button>

      {/* Coming Soon card — centered */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-8">
        <div className="glass-panel w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center relative overflow-y-auto no-scrollbar" style={{ maxHeight: '80vh' }}>

          {/* Stone texture */}
          <div className="stone-texture absolute inset-0 rounded-3xl" />

          {/* Corner ornaments */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4AF37]/40" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4AF37]/40" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4AF37]/40" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4AF37]/40" />

          <div className="relative z-10 flex flex-col items-center gap-5">

            {/* Sacred lotus icon */}
            <div className="w-20 h-20 rounded-full milestone-node-unlocked flex items-center justify-center text-[#0B1220]">
              <svg className="w-11 h-11" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                <path d="M50 20 Q60 35 55 50 Q50 60 50 70 M50 20 Q40 35 45 50 Q50 60 50 70" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="50" cy="50" r="8" fill="currentColor" />
              </svg>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-cinzel text-2xl text-[#D4AF37] tracking-[0.15em] uppercase font-bold mb-1">
                Coming Soon
              </h1>
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent my-3" />
              <p className="font-garamond text-lg text-[#e5e2e1] leading-relaxed">
                The Sacred Achievement Journey
              </p>
            </div>

            {/* Description */}
            <p className="font-body-md text-[14px] text-[#d2c4b3]/70 leading-relaxed">
              Your spiritual milestones and temple path are being crafted with devotion. Return soon to walk the sacred journey.
            </p>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

            {/* Sanskrit verse */}
            <p className="font-sanskrit text-base text-[#D4AF37]/60 tracking-wide">
              ॐ तत् सत्
            </p>

            {/* Back button */}
            <button
              onClick={() => onTabChange('profile')}
              className="mt-2 w-full py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] font-label-sm text-[11px] uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors"
            >
              Return to Profile
            </button>

          </div>
        </div>
      </div>

    </div>
  );
};
