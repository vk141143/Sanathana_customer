import React, { useState } from 'react';
import { NavTab } from '../types';

interface PracticeViewProps {
  onTabChange: (tab: NavTab) => void;
  onOpenChantingModal: () => void;
  onOpenGratitudeModal: () => void;
  onOpenAddTaskModal: () => void;
  onBack: () => void;
}

const CARDS = [
  {
    id: 'meditation',
    icon: '🧘',
    title: 'Meditation',
    subtitle: 'Find inner peace through guided meditation',
    glow: 'rgba(180,140,255,0.18)',
    accent: '#c9a8ff',
  },
  {
    id: 'japa',
    icon: '📿',
    title: 'Japa',
    subtitle: 'Chant your chosen mantra with a digital counter',
    glow: 'rgba(212,175,55,0.18)',
    accent: '#D4AF37',
  },
  {
    id: 'mantras',
    icon: '🕉',
    title: 'Mantras',
    subtitle: 'Listen, chant and learn sacred mantras',
    glow: 'rgba(255,160,80,0.18)',
    accent: '#f2a84e',
  },
  {
    id: 'gratitude',
    icon: '🙏',
    title: 'Gratitude',
    subtitle: "Express today's gratitude",
    glow: 'rgba(100,220,180,0.15)',
    accent: '#6edcb4',
  },
  {
    id: 'custom',
    icon: '✨',
    title: 'Custom Practice',
    subtitle: 'Create your own daily ritual',
    glow: 'rgba(212,175,55,0.12)',
    accent: '#D4AF37',
  },
];

export const PracticeView: React.FC<PracticeViewProps> = ({
  onTabChange,
  onOpenChantingModal,
  onOpenGratitudeModal,
  onOpenAddTaskModal,
  onBack,
}) => {
  const [pressed, setPressed] = useState<string | null>(null);

  const handleCard = (id: string) => {
    if (id === 'meditation') onTabChange('meditation');
    else if (id === 'japa') onOpenChantingModal();
    else if (id === 'mantras') onOpenChantingModal();
    else if (id === 'gratitude') onOpenGratitudeModal();
    else if (id === 'custom') onOpenAddTaskModal();
  };

  return (
    <div
      className="min-h-screen text-[#e5e2e1] relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d0b08 0%, #131008 50%, #0a0a0a 100%)' }}
    >
      {/* Cinematic ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 320,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.13) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 360, height: 200,
          background: 'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.07) 0%, transparent 70%)',
        }} />
      </div>

      {/* Temple silhouette */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-0 flex justify-center overflow-hidden" style={{ height: 180 }}>
        <svg viewBox="0 0 430 180" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          {/* Base platform */}
          <rect x="60" y="155" width="310" height="25" fill="#D4AF37" />
          {/* Main tower */}
          <polygon points="215,20 175,155 255,155" fill="#D4AF37" />
          {/* Left tower */}
          <polygon points="140,60 118,155 162,155" fill="#D4AF37" />
          {/* Right tower */}
          <polygon points="290,60 268,155 312,155" fill="#D4AF37" />
          {/* Far left */}
          <polygon points="90,90 74,155 106,155" fill="#D4AF37" />
          {/* Far right */}
          <polygon points="340,90 324,155 356,155" fill="#D4AF37" />
          {/* Spire tips */}
          <circle cx="215" cy="18" r="5" fill="#D4AF37" />
          <circle cx="140" cy="58" r="3.5" fill="#D4AF37" />
          <circle cx="290" cy="58" r="3.5" fill="#D4AF37" />
        </svg>
        {/* Fade out bottom of silhouette */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, transparent 40%, #0d0b08 100%)',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-14 pb-2 px-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="font-cinzel text-xl font-bold tracking-widest" style={{ color: '#D4AF37' }}>
            Sacred Practice
          </h1>
          <p className="text-xs tracking-wider" style={{ color: '#B5A98A', opacity: 0.8 }}>
            Choose your path to the divine
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-5 mb-6 mt-2 h-px" style={{
        background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)',
      }} />

      {/* Cards */}
      <div className="relative z-10 px-5 pb-32 flex flex-col gap-4" style={{ animation: 'practiceIn 0.5s ease both' }}>
        {CARDS.map((card, i) => (
          <button
            key={card.id}
            onPointerDown={() => setPressed(card.id)}
            onPointerUp={() => setPressed(null)}
            onPointerLeave={() => setPressed(null)}
            onClick={() => handleCard(card.id)}
            style={{
              animation: `practiceIn 0.45s ease ${i * 0.07}s both`,
              transform: pressed === card.id ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
              background: 'linear-gradient(135deg, #1a1710 0%, #111008 100%)',
              border: `1px solid rgba(212,175,55,${pressed === card.id ? '0.45' : '0.2'})`,
              borderRadius: 20,
              boxShadow: pressed === card.id
                ? `0 0 32px ${card.glow}, 0 8px 32px rgba(0,0,0,0.5)`
                : `0 2px 20px rgba(0,0,0,0.4), 0 0 0 0 ${card.glow}`,
              padding: '20px 20px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle inner glow on press */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 20,
              background: pressed === card.id ? `radial-gradient(ellipse at 30% 50%, ${card.glow} 0%, transparent 70%)` : 'transparent',
              transition: 'background 150ms ease',
              pointerEvents: 'none',
            }} />

            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: `radial-gradient(circle at 40% 35%, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0.3) 100%)`,
              border: `1px solid rgba(212,175,55,0.22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30,
              boxShadow: `0 0 18px ${card.glow}`,
            }}>
              {card.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 17,
                fontWeight: 700,
                color: card.accent,
                letterSpacing: '0.06em',
                marginBottom: 5,
              }}>
                {card.title}
              </div>
              <div style={{
                fontSize: 13,
                color: '#B5A98A',
                lineHeight: 1.45,
                opacity: 0.85,
              }}>
                {card.subtitle}
              </div>
              {/* Gold underline accent */}
              <div style={{
                marginTop: 10,
                width: 32, height: 1.5,
                background: `linear-gradient(to right, ${card.accent}, transparent)`,
                borderRadius: 2,
                opacity: 0.6,
              }} />
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes practiceIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
