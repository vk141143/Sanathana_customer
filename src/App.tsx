import { useState, useEffect } from 'react';
import { NavTab, UserProfile, SadhanaTask } from './types';
import { TEMPLES_DATA, SPIRITUAL_EVENTS, EMOTION_HEALING_CATEGORIES } from './data/temples';
import { DEFAULT_SADHANA_TASKS } from './data/sadhana';

import { SplashModal } from './components/SplashModal';
import { TempleJourney } from './components/TempleJourney';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScriptureReader } from './components/ScriptureReader';
import { SadhanaTracker } from './components/SadhanaTracker';
import { MeditationView } from './components/MeditationView';
import { ExploreView } from './components/ExploreView';
import { TempleMapView } from './components/TempleMapView';
import { ProfileView } from './components/ProfileView';
import { AchievementsView } from './components/AchievementsView';
import { AuthView } from './components/AuthView';
import { NotificationsView } from './components/NotificationsView';
import { FestivalsListView } from './components/FestivalsListView';
import { FestivalDetailView } from './components/FestivalDetailView';

import { GratitudeModal } from './components/GratitudeModal';
import { JapaCounterModal } from './components/JapaCounterModal';
import { AddTaskModal } from './components/AddTaskModal';
import { NotesModal } from './components/NotesModal';

export default function App() {
  const [showTempleJourney, setShowTempleJourney] = useState(false);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>(null);

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanatana_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn) return false;
      }
    } catch {}
    return true;
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [showTempleMap, setShowTempleMap] = useState<boolean>(false);

  // Persistent User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sanatana_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if explicitly logged in
        if (parsed.isLoggedIn) return parsed;
      } catch {}
    }
    return {
      name: '',
      title: 'Seeker of Truth',
      avatar: '',
      dayStreak: 0,
      booksRead: 0,
      eventsCount: 0,
      isLoggedIn: false,
      email: '',
      preferred_reading_language: 'en',
      reading_progress: null,
      bookmarks: [],
      notes: {},
      gratitudeLogs: [],
      chantCount: 108,
    };
  });

  // Persistent Sadhana Tasks State
  const [sadhanaTasks, setSadhanaTasks] = useState<SadhanaTask[]>(() => {
    const saved = localStorage.getItem('sanatana_sadhana');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SADHANA_TASKS;
  });

  // Modals state
  const [isGratitudeOpen, setIsGratitudeOpen] = useState(false);
  const [isChantingOpen, setIsChantingOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('sanatana_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sanatana_sadhana', JSON.stringify(sadhanaTasks));
  }, [sadhanaTasks]);

  const handleTabChange = (tab: NavTab) => {
    if (tab !== 'festivals') setSelectedFestivalId(null);
    setCurrentTab(tab);
  };

  const handleToggleTask = (taskId: string) => {
    setSadhanaTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleToggleBookmark = (verseId: string) => {
    setUser(prev => {
      const exists = prev.bookmarks.includes(verseId);
      const updated = exists
        ? prev.bookmarks.filter(id => id !== verseId)
        : [...prev.bookmarks, verseId];
      return { ...prev, bookmarks: updated };
    });
  };

  const handlePreferredReadingLanguageChange = (language: string) => {
    setUser(prev => ({ ...prev, preferred_reading_language: language }));
  };

  const handleReadingProgressChange = (progress: {
    scripture_id: string;
    chapter_id: string;
    verse_number: number;
    language: string;
  }) => {
    setUser(prev => ({ ...prev, reading_progress: progress }));
  };

  const handleSaveNote = (verseId: string, noteText: string) => {
    setUser(prev => ({
      ...prev,
      notes: { ...prev.notes, [verseId]: noteText },
    }));
  };

  const handleSaveGratitude = (blessingText: string) => {
    setUser(prev => ({
      ...prev,
      gratitudeLogs: [
        ...prev.gratitudeLogs,
        { date: new Date().toLocaleDateString(), blessing: blessingText },
      ],
    }));
    // Mark gratitude task as completed
    setSadhanaTasks(prev =>
      prev.map(t => (t.type === 'gratitude' ? { ...t, completed: true } : t))
    );
  };

  const handleCompleteChanting = (count: number) => {
    setUser(prev => ({ ...prev, chantCount: prev.chantCount + count }));
    if (count >= 108) {
      setSadhanaTasks(prev =>
        prev.map(t => (t.type === 'chanting' ? { ...t, completed: true } : t))
      );
    }
  };

  const handleAddCustomTask = (newTask: SadhanaTask) => {
    setSadhanaTasks(prev => [...prev, newTask]);
  };

  const handleMeditationCompleted = (minutes: number) => {
    setSadhanaTasks(prev =>
      prev.map(t => (t.type === 'meditation' ? { ...t, completed: true } : t))
    );
    alert(`Meditation session completed! You dedicated ${minutes} minutes to inner peace.`);
  };

  const handleSignOut = () => {
    setUser(prev => ({ ...prev, isLoggedIn: false }));
    handleTabChange('auth');
  };

  const handleSignInSuccess = (userData: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...userData, isLoggedIn: true, title: 'Seeker of Truth' }));
  };

  const renderActiveTab = () => {
    if (currentTab === 'auth' || !user.isLoggedIn) {
      return (
        <AuthView
          onSignInSuccess={handleSignInSuccess}
          onTabChange={handleTabChange}
        />
      );
    }

    if (showTempleMap) {
      return (
        <TempleMapView
          temples={TEMPLES_DATA}
          onTabChange={tab => {
            setShowTempleMap(false);
            handleTabChange(tab);
          }}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            user={user}
            streakDays={user.dayStreak}
            onTabChange={handleTabChange}
            onOpenGratitudeModal={() => setIsGratitudeOpen(true)}
            onOpenChantingModal={() => setIsChantingOpen(true)}
            userEmail={user.email}
            readingProgress={user.reading_progress}
          />
        );

      case 'library':
        return (
          <ScriptureReader
            bookmarks={user.bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onTabChange={handleTabChange}
            preferredReadingLanguage={user.preferred_reading_language ?? 'en'}
            readingProgress={user.reading_progress ?? null}
            onPreferredLanguageChange={handlePreferredReadingLanguageChange}
            onReadingProgressChange={handleReadingProgressChange}
          />
        );

      case 'sadhana':
        return (
          <SadhanaTracker
            tasks={sadhanaTasks}
            user={user}
            onToggleTask={handleToggleTask}
            onOpenGratitudeModal={() => setIsGratitudeOpen(true)}
            onOpenChantingModal={() => setIsChantingOpen(true)}
            onOpenAddTaskModal={() => setIsAddTaskOpen(true)}
            streakDays={user.dayStreak}
            onTabChange={handleTabChange}
          />
        );

      case 'meditation':
        return (
          <MeditationView
            onTabChange={handleTabChange}
            onCompleteSession={handleMeditationCompleted}
          />
        );

      case 'explore':
        return (
          <ExploreView
            temples={TEMPLES_DATA}
            events={SPIRITUAL_EVENTS}
            emotions={EMOTION_HEALING_CATEGORIES}
            onOpenTempleMap={() => setShowTempleMap(true)}
            onTabChange={handleTabChange}
          />
        );

      case 'profile':
        return (
          <ProfileView
            user={user}
            onTabChange={handleTabChange}
            onSignOut={handleSignOut}
            onOpenBookmarksModal={() => setIsNotesOpen(true)}
            onOpenNotesModal={() => setIsNotesOpen(true)}
          />
        );

      case 'achievements':
        return (
          <AchievementsView
            user={user}
            onTabChange={handleTabChange}
          />
        );

      case 'festivals':
        if (selectedFestivalId) {
          return (
            <FestivalDetailView
              festivalId={selectedFestivalId}
              onBack={() => setSelectedFestivalId(null)}
            />
          );
        }
        return (
          <FestivalsListView
            onTabChange={handleTabChange}
            onSelectFestival={(festivalId) => setSelectedFestivalId(festivalId)}
          />
        );

      case 'notifications':
        return <NotificationsView onTabChange={handleTabChange} userEmail={user.email} />;

      default:
        return (
          <SadhanaTracker
            tasks={sadhanaTasks}
            user={user}
            onToggleTask={handleToggleTask}
            onOpenGratitudeModal={() => setIsGratitudeOpen(true)}
            onOpenChantingModal={() => setIsChantingOpen(true)}
            onOpenAddTaskModal={() => setIsAddTaskOpen(true)}
            streakDays={user.dayStreak}
            onTabChange={handleTabChange}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-sans selection:bg-[#f2c377]/30">
      {/* Splash Screen */}
      {showSplash && (
        <SplashModal
          onEnter={() => {
            setShowSplash(false);
            setShowTempleJourney(true);
          }}
        />
      )}

      {showTempleJourney && (
        <TempleJourney
          onComplete={() => {
            setShowTempleJourney(false);
            if (!user.isLoggedIn) setCurrentTab('auth');
          }}
        />
      )}

      {/* Main Active View */}
      <main>{renderActiveTab()}</main>

      {/* Global Bottom Navigation */}
      {!showSplash && !showTempleJourney && currentTab !== 'auth' && user.isLoggedIn && !showTempleMap && currentTab !== 'festivals' && (
        <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      )}

      {/* Modals */}
      <GratitudeModal
        isOpen={isGratitudeOpen}
        onClose={() => setIsGratitudeOpen(false)}
        onSaveGratitude={handleSaveGratitude}
      />

      <JapaCounterModal
        isOpen={isChantingOpen}
        onClose={() => setIsChantingOpen(false)}
        onCompleteChanting={handleCompleteChanting}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddCustomTask}
      />

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        bookmarks={user.bookmarks}
        allVerses={[]}
        notes={user.notes}
        onSaveNote={handleSaveNote}
        onRemoveBookmark={handleToggleBookmark}
      />
    </div>
  );
}
