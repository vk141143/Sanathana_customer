import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion, animate } from 'motion/react';
import { ArrowLeft, ChevronRight, Flower2, Flame, BookOpen, Heart, Sparkles } from 'lucide-react';
import { getCurrentLevel } from '../../services/sadhana/SadhanaProgressEngine';
import type { PracticeCategory } from '../../services/sadhana/practiceCatalog';
import './sadhana.css';

export const practiceImages: Record<PracticeCategory, string> = {
  meditation: '/assets/inner-flame/meditation.png', japa: '/assets/inner-flame/chant.png',
  mantra: '/assets/inner-flame/sadhana.png', gratitude: '/assets/inner-flame/gratitude.png',
  scripture_reading: '/assets/inner-flame/scripture.png',
};
export function SadhanaHeading({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <header className="sadhana-heading"><button className="sadhana-icon-button" onClick={onBack} aria-label="Back"><ArrowLeft size={20}/></button><div><span className="sadhana-eyebrow">SANATANA</span><h1>{title}</h1><p>{subtitle}</p></div></header>;
}
export function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const controls = animate(previous.current, value, { duration: reduced ? 0 : .65, onUpdate: v => setDisplay(Math.round(v)) });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return <>{display.toLocaleString()}</>;
}
export function DailyCompletionRing({ value, initialValue = 0 }: { value: number | null; initialValue?: number }) {
  const reduced = useReducedMotion(), id = useId().replace(/:/g, '');
  const percent = Math.max(0, Math.min(100, value ?? 0));
  return <div className="sadhana-ring" role="progressbar" aria-label="Daily Completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : percent} aria-valuetext={value === null ? 'Progress unavailable' : `${percent}% complete`}>
    <svg viewBox="0 0 220 220" aria-hidden="true"><defs><linearGradient id={id}><stop stopColor="#a46b2d"/><stop offset=".5" stopColor="#ffe4a3"/><stop offset="1" stopColor="#d69a46"/></linearGradient></defs>
      <circle cx="110" cy="110" r="100" className="sadhana-ring-ornament"/>
      <circle cx="110" cy="110" r="88" fill="none" stroke="#ad83442a" strokeWidth="5"/>
      <motion.circle cx="110" cy="110" r="88" fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" pathLength="100" strokeDasharray="100" initial={{ strokeDashoffset: 100 - (reduced ? percent : initialValue) }} animate={{ strokeDashoffset: 100 - percent }} transition={{ duration: reduced ? 0 : .9, ease: 'easeOut' }} style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}/>
    </svg><div className="sadhana-ring-copy"><span className="sadhana-eyebrow">DAILY COMPLETION</span><strong>{value === null ? '—' : <><AnimatedNumber value={percent}/><small>%</small></>}</strong><span>{value === null ? 'Awaiting saved progress' : percent >= 60 ? 'A day devoted to growth' : 'Every practice is a beginning'}</span><Flower2 size={23} aria-hidden="true"/></div>
  </div>;
}
export function SadhanaLevelCard({ xp, onClick }: { xp: number | null; onClick?: () => void }) {
  const level = xp === null ? null : getCurrentLevel(xp);
  const content = <><div className="sadhana-level-top"><span className="sadhana-level-emblem"><Flower2 size={26}/></span><div><span className="sadhana-eyebrow">{level ? `LEVEL ${level.levelNumber} · YOUR SPIRITUAL JOURNEY` : 'YOUR SPIRITUAL JOURNEY'}</span><h2>{level?.levelName ?? 'Your path awaits'}</h2></div>{onClick && <ChevronRight size={18}/>}</div><div className="sadhana-xp"><span>{level ? <><AnimatedNumber value={level.currentXP}/> XP</> : 'XP unavailable'}</span><span>{level ? level.xpForNextLevel ? `${level.xpForNextLevel.toLocaleString()} XP · next level` : 'Highest level reached' : 'Connect to view progress'}</span></div><progress aria-label="Progress to next spiritual level" max={100} value={level?.progressPercent ?? 0}/></>;
  return onClick ? <button className="sadhana-panel sadhana-level" onClick={onClick}>{content}</button> : <section className="sadhana-panel sadhana-level">{content}</section>;
}
export function SadhanaStreaks({ values }: { values: Array<number | null> }) {
  const names = ['Sadhana', 'Japa', 'Meditation', 'Reading', 'Gratitude'];
  const icons = [Flame, Sparkles, Flower2, BookOpen, Heart];
  return <section className="sadhana-streak-section"><div className="sadhana-section-title"><h2>Keep the sacred flame</h2><span>DAY STREAKS</span></div><div className="sadhana-streaks">{names.map((name, index) => { const Icon = icons[index]; return <div key={name}><span className="sadhana-streak-icon"><Icon size={19} aria-hidden="true"/></span><strong>{values[index] ?? '—'}</strong><span>{name}</span></div>; })}</div><p className="sadhana-footnote">A dash means this practice has no available streak record.</p></section>;
}
