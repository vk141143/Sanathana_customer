import React, { useMemo } from 'react';
import { UserProfile, SadhanaTask } from '../types';

interface JourneyViewProps {
  user: UserProfile;
  tasks: SadhanaTask[];
  onBack: () => void;
}

const QUOTES = [
  { text: 'You have the right to perform your actions, but you are not entitled to the fruits of your actions.', source: 'Bhagavad Gita 2.47' },
  { text: 'The soul is neither born nor does it die at any time. It has not come into being, does not come into being, and will not come into being.', source: 'Bhagavad Gita 2.20' },
  { text: 'Tat tvam asi — Thou art That.', source: 'Chandogya Upanishad' },
  { text: 'Aham Brahmasmi — I am Brahman.', source: 'Brihadaranyaka Upanishad' },
  { text: 'Let noble thoughts come to us from every side.', source: 'Rigveda 1.89.1' },
  { text: 'Truth alone triumphs, not falsehood. By truth the divine path is laid out.', source: 'Mundaka Upanishad 3.1.6' },
  { text: 'Where Rama goes, there is Dharma. Where Dharma is, there is victory.', source: 'Ramayana' },
  { text: 'Dharma protects those who protect Dharma.', source: 'Mahabharata' },
  { text: 'The mind is everything. What you think, you become.', source: 'Upanishads' },
  { text: 'In the middle of difficulty lies opportunity for the soul to grow.', source: 'Bhagavad Gita' },
];

const MILESTONES = [
  { id: 1, icon: '🔥', title: 'First Flame', desc: '7-day streak', unlocked: true },
  { id: 2, icon: '🪷', title: 'Lotus Seeker', desc: '30 meditations', unlocked: true },
  { id: 3, icon: '📿', title: 'Japa Warrior', desc: '1008 chants', unlocked: true },
  { id: 4, icon: '🕉', title: 'Mantra Sage', desc: '21 days practice', unlocked: false },
  { id: 5, icon: '🙏', title: 'Grateful Heart', desc: '50 gratitude logs', unlocked: false },
  { id: 6, icon: '⭐', title: 'Divine Seeker', desc: '108-day streak', unlocked: false },
];

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'linear-gradient(135deg, #1a1710 0%, #111008 100%)',
    border: '1px solid rgba(212,175,55,0.18)',
    borderRadius: 20,
    padding: '20px 20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    ...style,
  }}>
    {children}
  </div>
);

const SectionLabel: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#D4AF37', letterSpacing: '0.12em', fontWeight: 700 }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(212,175,55,0.25), transparent)', marginLeft: 6 }} />
  </div>
);

const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(212,175,55,0.07)' }}>
    <span style={{ fontSize: 13, color: '#B5A98A', opacity: 0.85 }}>{label}</span>
    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#f2c377', fontWeight: 600 }}>{value}</span>
  </div>
);

export const JourneyView: React.FC<JourneyViewProps> = ({ user, tasks, onBack }) => {
  const quote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  const meditationTask = tasks.find(t => t.type === 'meditation');
  const gratitudeLogs = user.gratitudeLogs?.length ?? 0;

  return (
    <div
      className="min-h-screen text-[#e5e2e1] relative overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, #0d0b08 0%, #0a0a0a 100%)' }}
    >
      {/* Ambient top glow */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-0" style={{
        height: 260,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 70%)',
      }} />

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
          <h1 className="font-cinzel text-xl font-bold tracking-widest" style={{ color: '#D4AF37' }}>My Journey</h1>
          <p className="text-xs tracking-wider" style={{ color: '#B5A98A', opacity: 0.8 }}>Your spiritual path unfolds</p>
        </div>
      </div>

      {/* Gold divider */}
      <div className="relative z-10 mx-5 mb-6 mt-2 h-px" style={{
        background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)',
      }} />

      <div className="relative z-10 px-5 pb-36 flex flex-col gap-5" style={{ animation: 'journeyIn 0.5s ease both' }}>

        {/* ── Current Streak ── */}
        <Card>
          <SectionLabel icon="🔥" title="Current Streak" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Animated flame */}
              <div style={{ fontSize: 52, lineHeight: 1, animation: 'flamePulse 2s ease-in-out infinite' }}>
                🔥
              </div>
              <div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 42, color: '#f2c377', fontWeight: 700, lineHeight: 1 }}>
                  {user.dayStreak}
                </div>
                <div style={{ fontSize: 12, color: '#B5A98A', letterSpacing: '0.1em', marginTop: 2 }}>DAYS ABLAZE</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#B5A98A', marginBottom: 4 }}>Longest</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', fontWeight: 600 }}>
                {Math.max(user.dayStreak, 21)}
              </div>
              <div style={{ fontSize: 10, color: '#B5A98A' }}>days</div>
            </div>
          </div>
        </Card>

        {/* ── Weekly Activity ── */}
        <Card>
          <SectionLabel icon="📅" title="Weekly Activity" />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {DAYS.map((d, i) => {
              const isToday = i === TODAY_IDX;
              const isDone = i < TODAY_IDX;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: isToday ? '#D4AF37' : '#B5A98A', fontWeight: isToday ? 700 : 400 }}>{d}</span>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)' : 'transparent',
                    border: isToday ? '2px solid #D4AF37' : isDone ? '1.5px solid rgba(212,175,55,0.4)' : '1.5px solid rgba(212,175,55,0.12)',
                    boxShadow: isToday ? '0 0 12px rgba(212,175,55,0.45)' : isDone ? '0 0 6px rgba(212,175,55,0.15)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone && <span style={{ fontSize: 14 }}>✓</span>}
                    {isToday && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px #D4AF37' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Meditation ── */}
        <Card>
          <SectionLabel icon="🧘" title="Meditation" />
          <StatRow label="Total Sessions" value={meditationTask?.progressValue ?? 12} />
          <StatRow label="Total Minutes" value={`${(meditationTask?.progressValue ?? 12) * 15} min`} />
          <StatRow label="Longest Session" value="45 min" />
        </Card>

        {/* ── Japa ── */}
        <Card>
          <SectionLabel icon="📿" title="Japa" />
          <StatRow label="Total Chants" value={user.chantCount?.toLocaleString() ?? '0'} />
          <StatRow label="Today's Chants" value="108" />
          <StatRow label="Best Day" value="1,008" />
        </Card>

        {/* ── Mantras ── */}
        <Card>
          <SectionLabel icon="🕉" title="Mantras" />
          <StatRow label="Listening Sessions" value="24" />
          <StatRow label="Favorite Mantra" value="Om Namah Shivaya" />
          <StatRow label="Most Played" value="Gayatri Mantra" />
        </Card>

        {/* ── Gratitude ── */}
        <Card>
          <SectionLabel icon="🙏" title="Gratitude" />
          <StatRow label="Total Entries" value={gratitudeLogs} />
          <StatRow label="Current Streak" value={`${Math.min(gratitudeLogs, user.dayStreak)} days`} />
        </Card>

        {/* ── Sacred Milestones ── */}
        <Card>
          <SectionLabel icon="⭐" title="Sacred Milestones" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {MILESTONES.map(m => (
              <div key={m.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px',
                borderRadius: 14,
                background: m.unlocked ? 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0.2) 100%)' : 'rgba(255,255,255,0.03)',
                border: m.unlocked ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: m.unlocked ? '0 0 16px rgba(212,175,55,0.12)' : 'none',
                opacity: m.unlocked ? 1 : 0.45,
                filter: m.unlocked ? 'none' : 'grayscale(1)',
              }}>
                <span style={{ fontSize: 26 }}>{m.icon}</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: m.unlocked ? '#D4AF37' : '#888', textAlign: 'center', fontWeight: 600, lineHeight: 1.3 }}>{m.title}</span>
                <span style={{ fontSize: 9, color: '#B5A98A', textAlign: 'center', opacity: 0.8, lineHeight: 1.3 }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Today's Inspiration ── */}
        <Card style={{ background: 'linear-gradient(135deg, #1c1608 0%, #0f0d06 100%)', border: '1px solid rgba(212,175,55,0.28)' }}>
          <SectionLabel icon="✨" title="Today's Inspiration" />
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontSize: 22, marginBottom: 12, opacity: 0.6 }}>❝</div>
            <p style={{
              fontFamily: 'Garamond, Georgia, serif',
              fontSize: 15,
              color: '#e8d9b8',
              lineHeight: 1.7,
              fontStyle: 'italic',
              marginBottom: 14,
            }}>
              {quote.text}
            </p>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)', marginBottom: 12 }} />
            <span style={{ fontSize: 11, color: '#D4AF37', letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
              — {quote.source}
            </span>
          </div>
        </Card>

      </div>

      <style>{`
        @keyframes journeyIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%       { transform: scale(1.12) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};
