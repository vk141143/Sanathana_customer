import React, { useState } from 'react';
import { SadhanaTask, NavTab, UserProfile, ReadingProgress } from '../types';
import { Header } from './Header';
import { MeditationView } from './MeditationView';
import { SadhanaPracticesView } from './SadhanaPracticesView';
import { JourneyView } from './JourneyView';
import { DevotionalAudioView } from './audio/DevotionalAudioView';

interface SadhanaTrackerProps {
  onToggleBookmark?: (id: string) => void;
  onReadingProgressChange?: (progress: ReadingProgress) => void;
  tasks: SadhanaTask[];
  user: UserProfile;
  onToggleTask: (taskId: string) => void;
  onOpenGratitudeModal: () => void;
  onOpenChantingModal: () => void;
  onOpenAddTaskModal: () => void;
  streakDays: number;
  onTabChange: (tab: NavTab) => void;
}

export const SadhanaTracker: React.FC<SadhanaTrackerProps> = ({
  tasks,
  onReadingProgressChange,
  onToggleBookmark,
  user,
  onToggleTask,
  streakDays,
  onTabChange,
}) => {
  const [showMeditationView, setShowMeditationView] = useState(false);
  const [showPracticeView, setShowPracticeView] = useState(false);
  const [showJourneyView, setShowJourneyView] = useState(false);
  const [showAudioView, setShowAudioView] = useState(false);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (showMeditationView) {
    return <MeditationView onBack={() => setShowMeditationView(false)} onTabChange={onTabChange} />;
  }
  if (showAudioView) {
    return <DevotionalAudioView onBack={() => setShowAudioView(false)} />;
  }
  if (showJourneyView) {
    return <JourneyView user={user} tasks={tasks} onBack={() => setShowJourneyView(false)} />;
  }
  if (showPracticeView) {
    return (
      <SadhanaPracticesView
        onReadingProgressChange={onReadingProgressChange}
        bookmarks={user.bookmarks} onToggleBookmark={onToggleBookmark}
        onTabChange={tab => { setShowPracticeView(false); onTabChange(tab); }}
        preferredLanguage={user.preferred_reading_language}
        onBack={() => setShowPracticeView(false)}
      />
    );
  }

  // Progress ring geometry
  const RING_SIZE = 224;
  const cx = RING_SIZE / 2;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const daysOfWeek = [
    { day: 'M', checked: true },
    { day: 'T', checked: true },
    { day: 'W', checked: true },
    { day: 'T', checked: true },
    { day: 'F', checked: false, current: true },
    { day: 'S', checked: false },
    { day: 'S', checked: false },
  ];

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(28,21,16,0.92), rgba(9,9,9,0.97))',
    border: '1px solid rgba(243,186,90,0.20)',
    borderRadius: 24,
    boxShadow: '0 0 2px rgba(255,198,98,0.20), 0 0 10px rgba(214,144,40,0.18)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  };

  return (
    <div
      className="min-h-screen text-[#F3D992] pb-32 max-w-md mx-auto relative"
      style={{ background: '#080A0B' }}
    >
      {/* Hero image background — top to just above progress ring */}
      <div
        className="absolute left-0 right-0 top-0 pointer-events-none"
        style={{
  height: 370,
  zIndex: 0,
  overflow: 'hidden'
}}
      >
        <img
          src="/sadhan.png"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
        {/* Fade to background at bottom */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(8,10,11,0.0) 0%, rgba(8,10,11,0.3) 50%, rgba(8,10,11,0.85) 75%, rgba(8,10,11,1) 100%)' }}
        />
      </div>

      {/* All content sits above the hero */}
      <div className="relative px-5 pt-24" style={{ zIndex: 1 }}>

      <Header  onNotificationClick={() => {}} onTabChange={onTabChange} transparent />

      {/* Title */}
      <section className="py-2 mb-5">
        <h2 className="font-garamond text-2xl md:text-3xl" style={{ color: '#F3D992' }}>
          Sadhana Tracker
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#A18A67' }}>
          Discipline is the bridge to the divine.
        </p>
      </section>

      {/* Weekly tracker */}
      <section
  className="grid grid-cols-7 gap-2 mb-8 text-center px-1 py-4 rounded-2xl"
  style={{
    background: 'rgba(8,10,11,0.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(242,198,110,0.15)',
    boxShadow: 'none',
  }}
>
        {daysOfWeek.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-semibold" style={{ color: d.current ? '#F3D992' : '#665949' }}>
              {d.day}
            </span>
            {d.checked ? (
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #F2C66E, #C67E2D)',
                  boxShadow: '0 0 6px rgba(255,188,80,0.25), 0 0 14px rgba(232,161,55,0.3)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080A0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div
                className="w-[30px] h-[30px] rounded-full"
                style={{
                  border: d.current ? '2px solid #EAB351' : '1.5px solid rgba(143,92,41,0.4)',
                  boxShadow: d.current ? '0 0 8px rgba(234,179,81,0.35)' : 'none',
                  background: d.current ? 'rgba(234,179,81,0.08)' : 'transparent',
                }}
              />
            )}
            {d.current && (
              <span className="text-[9px] font-semibold tracking-wider" style={{ color: '#EAB351' }}>TODAY</span>
            )}
          </div>
        ))}
      </section>

      {/* Progress Ring — no card box, floats on background */}
      <section className="flex flex-col items-center mb-8">
        {/* Ambient glow behind ring */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          {/* Background radial glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: RING_SIZE + 80,
              height: RING_SIZE + 80,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(188,118,35,0.18) 0%, transparent 70%)',
              filter: 'blur(18px)',
            }}
          />

          {/* SVG Ring */}
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 2 }}
          >
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#FFE6A6" />
                <stop offset="20%"  stopColor="#F4C565" />
                <stop offset="45%"  stopColor="#E5A742" />
                <stop offset="75%"  stopColor="#C98328" />
                <stop offset="100%" stopColor="#8D5A22" />
              </linearGradient>
              <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Track */}
            <circle
              cx={cx} cy={cx} r={radius}
              fill="transparent"
              stroke="#2D241C"
              strokeWidth="10"
            />

            {/* Progress arc */}
            <circle
              cx={cx} cy={cx} r={radius}
              fill="transparent"
              stroke="url(#ringGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#ringGlow)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>

          {/* Content inside ring */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ zIndex: 3 }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.2em] mb-1"
              style={{ color: '#A18A67' }}
            >
              Today's Progress
            </span>
            <span
              className="font-garamond leading-none font-bold"
              style={{
                fontSize: 58,
                color: '#F3D992',
                textShadow: '0 0 18px rgba(255,188,80,0.45), 0 0 35px rgba(188,118,35,0.25)',
              }}
            >
              {progressPercent}%
            </span>
            {/* Lotus divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #8F5C29)' }} />
              <span style={{ fontSize: 12, color: '#C47D2F' }}>✿</span>
              <div className="h-px w-8" style={{ background: 'linear-gradient(to left, transparent, #8F5C29)' }} />
            </div>
            <span className="text-xs" style={{ color: '#D3B98A' }}>
              {progressPercent >= 100 ? 'Divine completion!' : progressPercent >= 50 ? 'Keep going' : 'Begin your practice'}
            </span>
            <span className="text-xs" style={{ color: '#A18A67' }}>
              {progressPercent >= 50 ? "You're doing great" : `${completedCount}/${tasks.length} complete`}
            </span>
          </div>
        </div>
      </section>

      {/* Practice, Journey & Audio cards */}
      <section className="mb-5" style={{ animation: 'fadeUpIn 0.5s ease both' }}>
        {/* Top row: Practice + Journey */}
        <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowPracticeView(true)}
          className="flex-1 relative overflow-hidden flex flex-col items-start p-5 active:scale-[0.97] transition-all"
          style={{ ...cardStyle, borderRadius: 24, minHeight: 130 }}
          onMouseDown={e => addRipple(e)}
        >
          <div className="mb-3" style={{ fontSize: 32 }}>🪷</div>
          <span className="font-cinzel text-sm font-bold tracking-wider block mb-1" style={{ color: '#F3D992' }}>
            Practice
          </span>
          <span className="text-xs leading-snug" style={{ color: '#A18A67' }}>
            Begin your daily spiritual practice
          </span>
          <div className="mt-3 h-px w-8" style={{ background: 'linear-gradient(to right, #EAB351, transparent)' }} />
        </button>
        <button
          onClick={() => setShowJourneyView(true)}
          className="flex-1 relative overflow-hidden flex flex-col items-start p-5 active:scale-[0.97] transition-all"
          style={{ ...cardStyle, borderRadius: 24, minHeight: 130 }}
          onMouseDown={e => addRipple(e)}
        >
          <div className="mb-3" style={{ fontSize: 32 }}>📈</div>
          <span className="font-cinzel text-sm font-bold tracking-wider block mb-1" style={{ color: '#F3D992' }}>
            Journey
          </span>
          <span className="text-xs leading-snug" style={{ color: '#A18A67' }}>
            Track your spiritual progress
          </span>
          <div className="mt-3 h-px w-8" style={{ background: 'linear-gradient(to right, #EAB351, transparent)' }} />
        </button>
        </div>
        {/* Full-width Audio card */}
        {/* <button
          onClick={() => setShowAudioView(true)}
          className="w-full relative overflow-hidden flex items-center gap-4 px-5 py-4 active:scale-[0.97] transition-all"
          style={{ ...cardStyle, borderRadius: 24 }}
          onMouseDown={e => addRipple(e)}
        >
          <div className="flex items-center justify-center rounded-2xl shrink-0"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#0D2B4E,#1A5276)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <span style={{ fontSize: 26 }}>🎵</span>
          </div>
          <div className="flex-1 text-left">
            <span className="font-cinzel text-sm font-bold tracking-wider block" style={{ color: '#F3D992' }}>
              Devotional Audio
            </span>
            <span className="text-xs" style={{ color: '#A18A67' }}>
              Sacred chants, bhajans &amp; Gita recitations
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB351" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button> */}
      </section>

      {/* Daily Streak */}
      <section>
        <div
          onClick={() => setShowJourneyView(true)}
          className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          style={{ ...cardStyle, borderRadius: 24, padding: '18px 20px' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(242,198,110,0.15), rgba(101,62,28,0.3))',
                  border: '1.5px solid rgba(243,186,90,0.35)',
                  boxShadow: '0 0 6px rgba(255,188,80,0.25), 0 0 18px rgba(232,161,55,0.2)',
                }}
              >
                🔥
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] mb-0.5" style={{ color: '#EAB351' }}>
                  Daily Streak
                </p>
                <h3 className="font-garamond text-2xl font-bold leading-tight" style={{ color: '#F3D992' }}>
                  {streakDays} Days
                </h3>
                <p className="text-xs" style={{ color: '#A18A67' }}>Keep the flame of discipline alive</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-garamond text-3xl font-bold" style={{ color: '#EAB351' }}>{streakDays}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F5C29" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ripple {
          to { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      {/* FAB */}
      <button
        onClick={() => setShowMeditationView(true)}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all"
        style={{
          background: 'linear-gradient(180deg, #F2C66E, #C67E2D)',
          boxShadow: '0 0 6px rgba(255,188,80,0.25), 0 0 18px rgba(232,161,55,0.35), 0 0 35px rgba(188,118,35,0.25)',
          border: '1px solid rgba(243,186,90,0.4)',
          backdropFilter: 'blur(24px)',
        }}
        title="Start Meditation"
      >
        <svg className="w-6 h-6" fill="#080A0B" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
      </div> {/* end relative content wrapper */}
    </div>
  );
};

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(234,179,81,0.15);width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;transform:scale(0);animation:ripple 0.5s linear;pointer-events:none;`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}
