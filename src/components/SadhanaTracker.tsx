import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChartNoAxesCombined, ChevronRight, Award } from 'lucide-react';
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { SadhanaTask, NavTab, UserProfile, ReadingProgress } from '../types';
import { SadhanaPracticesView } from './SadhanaPracticesView';
import { JourneyView } from './JourneyView';
import { useSadhanaOverview } from './sadhana/useSadhanaOverview';
import { currentSnapshot, currentStreak, engineDay, streakFromDates } from './sadhana/overview';
import { calculateDailyProgress } from '../services/sadhana/SadhanaProgressEngine';
import type { SadhanaProgress } from '../services/sadhana/progressTypes';
import { DailyCompletionRing, SadhanaLevelCard, SadhanaStreaks } from './sadhana/SadhanaVisuals';

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
export const SadhanaTracker: React.FC<SadhanaTrackerProps> = ({ user, tasks, onReadingProgressChange, onToggleBookmark, onTabChange, onOpenGratitudeModal, onOpenChantingModal }) => {
  const data = useSadhanaOverview();
  const [journey, setJourney] = useState(window.history.state?.sadhanaView === 'progress');
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 32]);
  const snapshot = currentSnapshot(data.progress);
  const percent = data.loading ? null : snapshot ? calculateDailyProgress(snapshot as SadhanaProgress).totalPercent : data.meditation ? 0 : null;
  const previousPercent = useRef(0);
  useEffect(() => { if (percent !== null) previousPercent.current = percent; }, [percent]);
  useEffect(() => {
    const back = () => { setJourney(window.history.state?.sadhanaView === 'progress'); data.refresh(); };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [data.refresh]);
  const openProgress = () => {
    window.history.pushState({ ...window.history.state, tab: 'sadhana', sadhanaView: 'progress' }, '', '#sadhana');
    setJourney(true); window.scrollTo(0, 0);
  };
  if (journey) return <JourneyView user={user} tasks={tasks} onBack={() => window.history.back()}/>;
  const today = engineDay();
  const japaStreak = data.chant ? streakFromDates(data.chant.stats.filter(day => day.completed_sessions > 0).map(day => day.practice_date), new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())) : null;
  const meditationStreak = data.meditation && data.meditation.sessions.length < 20 ? streakFromDates(data.meditation.sessions.filter(s => s.status === 'completed').map(s => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(s.started_at))), today) : null;
  const intro = <>
    <section className="sadhana-hero">
      <motion.div className="sadhana-hero-art" style={{ y: reduced ? 0 : y }}><img src="/assets/sadhana/temple.webp" alt="Ancient temple steps illuminated by a golden sunrise" fetchPriority="high"/></motion.div>
      <div className="sadhana-light" aria-hidden="true"/>
      <header className="sadhana-topbar"><button onClick={() => onTabChange('profile')} aria-label="Open profile"><img src="/lotus.png" alt=""/></button><div><span>SANATANA</span><p>Your daily sacred space</p></div><button onClick={() => onTabChange('notifications')} aria-label="Notifications"><Bell size={20}/></button></header>
      <div className="sadhana-hero-copy"><span className="sadhana-eyebrow">A MOMENT FOR YOUR INNER SELF</span><h1>My Daily Sadhana</h1><p>Discipline · Devotion · Inner Transformation</p><div className="sadhana-hero-rule"/></div>
    </section>
    <div className="sadhana-overview">
      <DailyCompletionRing value={percent} initialValue={previousPercent.current}/>
      <p className="sadhana-intention">Small acts of devotion. A deeper connection.</p>
      {data.loading && <p role="status" className="sadhana-footnote">Gathering your saved progress…</p>}
      {data.errors.length > 0 && <div className="sadhana-notice" role="status"><p>{data.errors.join(' ')}</p><button onClick={data.refresh}>Retry connection</button></div>}
      <SadhanaLevelCard xp={data.progress?.current_xp ?? (data.meditation ? 0 : null)} onClick={() => onTabChange('achievements')}/>
      <SadhanaStreaks values={[currentStreak(data.progress), data.chant?.stats.length === 90 && japaStreak === 90 ? null : japaStreak, meditationStreak, null, null]}/>
      <div className="sadhana-shortcuts"><button onClick={openProgress}><ChartNoAxesCombined size={19}/><span>My Progress</span><ChevronRight size={16}/></button><button onClick={() => onTabChange('achievements')}><Award size={19}/><span>Achievements</span><ChevronRight size={16}/></button></div>
    </div>
  </>;
  return <MotionConfig reducedMotion="user"><SadhanaPracticesView dashboardIntro={intro}
    onReadingProgressChange={onReadingProgressChange} bookmarks={user.bookmarks} onToggleBookmark={onToggleBookmark}
    onTabChange={onTabChange} preferredLanguage={user.preferred_reading_language} onBack={() => onTabChange('home')}
    onPracticeReturn={data.refresh} onOpenJournal={onOpenGratitudeModal} onOpenSavedJapa={onOpenChantingModal}/></MotionConfig>;
};
