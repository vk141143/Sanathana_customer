import React from 'react';
import { Flower2, LockKeyhole, Flame } from 'lucide-react';
import { NavTab } from '../types';
import { LEVELS } from '../services/sadhana/progressConfig';
import { STREAK_ACHIEVEMENTS } from '../data/achievements';
import { getCurrentLevel } from '../services/sadhana/SadhanaProgressEngine';
import { useSadhanaOverview } from './sadhana/useSadhanaOverview';
import { SadhanaHeading, SadhanaLevelCard } from './sadhana/SadhanaVisuals';

export const AchievementsView: React.FC<{user: {name: string; avatar: string}; onTabChange: (tab: NavTab) => void}> = ({onTabChange}) => {
  const {progress, meditation, loading, errors, refresh} = useSadhanaOverview();
  const xp = progress?.current_xp ?? (meditation ? 0 : null);
  const level = xp === null ? null : getCurrentLevel(xp);
  return <main className="sadhana-page sadhana-inner-page">
    <SadhanaHeading title="Sacred Milestones" subtitle="Every step brings you closer." onBack={() => onTabChange('sadhana')}/>
    <div className="sadhana-achievement-hero" aria-hidden="true"><img src="/lotus.png" alt=""/></div>
    {loading && <p role="status" className="sadhana-footnote">Loading your spiritual journey…</p>}
    {!!errors.length && <div className="sadhana-notice" role="status">{errors.join(' ')}<button onClick={refresh}>Retry</button></div>}
    <SadhanaLevelCard xp={xp}/>
    <div className="sadhana-section-title" style={{marginTop:28}}><h2>The temple within</h2><span>TEN SACRED LEVELS</span></div>
    <ol className="sadhana-level-path">{LEVELS.map(item => {
      const unlocked = level && item.level <= level.levelNumber;
      return <li key={item.level} className={unlocked ? 'is-unlocked' : ''} aria-current={level?.levelNumber === item.level ? 'step' : undefined}><span>{unlocked ? <Flower2 size={17}/> : <LockKeyhole size={13}/>}</span><div className="sadhana-eyebrow">LEVEL {item.level}{level?.levelNumber === item.level ? ' · YOU ARE HERE' : ''}</div><h3>{item.name}</h3><p>{item.xpRequired.toLocaleString()} XP · {unlocked ? 'Reached' : level ? 'Ahead on your path' : 'Progress unavailable'}</p></li>;
    })}</ol>
    <div className="sadhana-section-title"><h2>Devotion, recognised</h2><span>STREAK MILESTONES</span></div>
    <div className="sadhana-badges">{STREAK_ACHIEVEMENTS.map(achievement => {
      const known = !!progress;
      const unlocked = known && ((progress.longest_streak ?? 0) >= achievement.requiredStreak || progress.milestones_achieved?.includes(achievement.requiredStreak));
      return <article className={`sadhana-panel sadhana-badge ${unlocked ? '' : 'is-locked'}`} key={achievement.id}>
        {unlocked ? <Flame size={29}/> : <LockKeyhole size={24}/>}<h3>{achievement.title}</h3><p>{achievement.description}</p><span>{unlocked ? 'UNLOCKED' : known ? 'A MILESTONE AHEAD' : 'STATUS UNAVAILABLE'}</span>
      </article>;
    })}</div><p className="sadhana-closing">The journey is its own blessing.</p>
  </main>;
};
