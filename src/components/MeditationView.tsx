import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { NavTab } from '../types';
import { meditationApi, type MeditationHistory, type MeditationLibrary, type MeditationSession } from '../services/meditationApi';
import { isSafePlayableUrl, type SadhanaPractice } from '../services/sadhana/practiceCatalog';

interface MeditationViewProps {
  onBack?: () => void;
  onTabChange?: (tab: NavTab) => void;
  onCompleteSession?: (minutes: number) => void;
  initialPractice?: SadhanaPractice;
  preferredLanguage?: string;
}

type ViewMode = 'library' | 'session' | 'history';
type SessionActionResult = { session: MeditationSession; xp_awarded: number; progress?: MeditationHistory['progress'] };

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export const MeditationView: React.FC<MeditationViewProps> = ({
  onBack,
  onTabChange,
  onCompleteSession,
  initialPractice,
  preferredLanguage = 'en',
}) => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [mode, setMode] = useState<ViewMode>(initialPractice ? 'session' : 'library');
  const [library, setLibrary] = useState<MeditationLibrary | null>(null);
  const [history, setHistory] = useState<MeditationHistory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialPractice?.id ?? null);
  const [session, setSession] = useState<MeditationSession | null>(null);
  const sessionRef = useRef<MeditationSession | null>(null);
  const actionBusy = useRef(false);
  const localStart = useRef<number | null>(null);
  const completionRequested = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [selectedDuration, setSelectedDuration] = useState(initialPractice?.default_duration_seconds ?? 600);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [intention, setIntention] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [bellEnabled, setBellEnabled] = useState(true);

  const selectedPractice = useMemo(() =>
    library?.practices.find(item => item.id === selectedId) ??
      (initialPractice?.id === selectedId ? initialPractice : null),
  [initialPractice, library, selectedId]);
  const selectedTranslation = library?.translations.find(item =>
    item.practice_id === selectedId && item.language_code === preferredLanguage.split('-')[0]);
  const practiceAudio = library?.audio.filter(item => item.practice_id === selectedId) ?? [];
  const languageAudio = practiceAudio.filter(item => item.language_code === preferredLanguage.split('-')[0]);
  const guidedAudio = languageAudio.find(item => item.audio_type === 'guided' && item.is_default) ??
    languageAudio.find(item => item.audio_type === 'guided') ??
    practiceAudio.find(item => item.audio_type === 'guided' && item.is_default) ??
    practiceAudio.find(item => item.audio_type === 'guided');
  const ambientAudio = languageAudio.find(item => item.audio_type === 'ambient' && item.is_default) ??
    languageAudio.find(item => item.audio_type === 'ambient') ??
    practiceAudio.find(item => item.audio_type === 'ambient' && item.is_default) ??
    practiceAudio.find(item => item.audio_type === 'ambient');
  const currentPhases = (library?.phases.filter(item => item.practice_id === selectedId) ?? [])
    .sort((left, right) => left.display_order - right.display_order);
  const durations = selectedPractice?.available_durations_seconds?.length
    ? selectedPractice.available_durations_seconds
    : [180, 300, 600, 900, 1200, 1800];

  useEffect(() => onAuthStateChanged(auth, user => {
    setSignedIn(!!user);
    if (!user) {
      setPlaying(false);
      setSession(null);
      sessionRef.current = null;
      localStart.current = null;
      setLibrary(null);
      setHistory(null);
    }
  }), []);

  useEffect(() => {
    if (signedIn !== true) {
      setLoading(signedIn === null);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      meditationApi.getLibrary(preferredLanguage.split('-')[0]),
      meditationApi.getHistory(),
    ]).then(([catalogue, saved]) => {
      if (!active) return;
      setLibrary(catalogue);
      setHistory(saved);
      const prefs = saved.preferences;
      setAudioEnabled(prefs?.ambient_enabled ?? true);
      setBellEnabled(prefs?.bell_enabled ?? true);
      if (!initialPractice && !selectedId && catalogue.recommendations.length) {
        setSelectedId(catalogue.recommendations[0].practice_id);
      }
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Meditation Library could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [preferredLanguage, signedIn]);

  useEffect(() => {
    if (!playing || !session) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      const started = localStart.current;
      const elapsed = session.active_duration_seconds +
        (started === null ? 0 : Math.floor((Date.now() - started) / 1000));
      if (elapsed >= session.planned_duration_seconds && !completionRequested.current && !actionBusy.current) {
        completionRequested.current = true;
        void performAction('complete');
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, session]);

  useEffect(() => {
    if (!playing || !session) return;
    const heartbeat = window.setInterval(() => {
      void performAction('heartbeat');
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void performAction('heartbeat');
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [playing, session?.id]);

  const setCurrentSession = (updated: MeditationSession | null) => {
    sessionRef.current = updated;
    setSession(updated);
  };

  const performAction = async (action: string) => {
    const current = sessionRef.current;
    if (!current || actionBusy.current) return;
    actionBusy.current = true;
    try {
      const result = await meditationApi.sessionAction(current.id, {
        action,
        version: current.version,
        position_seconds: Math.min(current.planned_duration_seconds, current.active_duration_seconds +
          (localStart.current === null ? 0 : Math.floor((Date.now() - localStart.current) / 1000))),
      });
      setCurrentSession(result.session);
      localStart.current = action === 'heartbeat' || action === 'resume' ? Date.now() : null;
      if (action === 'pause' || action === 'complete' || action === 'abandon') setPlaying(false);
      if (action === 'complete') {
        setNotice(`Session completed. ${result.xp_awarded} XP earned.`);
        setMode('session');
        setHistory(currentHistory => currentHistory
          ? { ...currentHistory, progress: result.progress ?? currentHistory.progress }
          : currentHistory);
        onCompleteSession?.(Math.floor(result.session.active_duration_seconds / 60));
      }
      if (action === 'abandon') {
        setNotice('Session saved. You can return to the Meditation Library.');
        setMode('library');
      }
      setError('');
    } catch (cause) {
      if (cause instanceof Error && cause.message.toLowerCase().includes('changed')) {
        try {
          const fresh = await meditationApi.getSession(current.id);
          setCurrentSession(fresh);
          localStart.current = fresh.status === 'in_progress' ? Date.now() : null;
        } catch (reloadError) {
          setError(reloadError instanceof Error ? reloadError.message : 'Session state could not be refreshed.');
        }
      } else {
        setError(cause instanceof Error ? cause.message : 'Meditation session could not be updated.');
      }
      if (action === 'complete') completionRequested.current = false;
    } finally {
      actionBusy.current = false;
    }
  };

  const start = async () => {
    if (!selectedPractice) return;
    setError('');
    setNotice('');
    completionRequested.current = false;
    try {
      const created = await meditationApi.startSession({
        practice_id: selectedPractice.id,
        planned_duration_seconds: selectedDuration,
        client_session_key: crypto.randomUUID(),
      });
      playBell();
      setCurrentSession(created);
      localStart.current = Date.now();
      setPlaying(true);
      setMode('session');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Meditation session could not be started.');
    }
  };

  const resume = async (saved: MeditationSession) => {
    try {
      const fresh = await meditationApi.getSession(saved.id);
      setCurrentSession(fresh);
      setSelectedId(fresh.practice_id);
      setSelectedDuration(fresh.planned_duration_seconds);
      completionRequested.current = false;
      if (fresh.status === 'paused') {
        const result = await meditationApi.sessionAction(fresh.id, {
          action: 'resume',
          version: fresh.version,
        });
        setCurrentSession(result.session);
      }
      localStart.current = Date.now();
      setPlaying(true);
      setMode('session');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Meditation session could not be resumed.');
    }
  };

  const savePreferences = async () => {
    try {
      await meditationApi.savePreferences({
        preferred_duration_seconds: selectedDuration,
        ambient_enabled: audioEnabled,
        bell_enabled: bellEnabled,
        preferred_language: preferredLanguage.split('-')[0],
        preferred_session_type: selectedPractice?.meditation_type ?? null,
      });
      setNotice('Meditation preferences saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Meditation preferences could not be saved.');
    }
  };

  const playBell = () => {
    if (!bellEnabled || selectedPractice?.has_bell === false) return;
    try {
      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(432, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(108, context.currentTime + 2.5);
      gain.gain.setValueAtTime(0.25, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { void context.close(); };
      oscillator.start();
      oscillator.stop(context.currentTime + 3);
    } catch {
      setNotice('Your device could not play the optional bell. Meditation can continue without it.');
    }
  };

  const leaveSession = async () => {
    if (playing && sessionRef.current?.status === 'in_progress') await performAction('pause');
    setPlaying(false);
    setMode('library');
  };

  const saveReflection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setSavingReflection(true);
    setError('');
    try {
      await meditationApi.saveReflection(session.id, { mood, reflection_text: reflection.trim(), intention_text: intention.trim() });
      setNotice('Your reflection is saved privately.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your reflection could not be saved.');
    } finally {
      setSavingReflection(false);
    }
  };

  const activeSeconds = session
    ? Math.min(session.planned_duration_seconds, session.active_duration_seconds +
      (playing && localStart.current !== null ? Math.floor((now - localStart.current) / 1000) : 0))
    : 0;
  const remaining = session ? Math.max(0, session.planned_duration_seconds - activeSeconds) : selectedDuration;
  const completionPercent = session ? Math.min(100, activeSeconds / session.planned_duration_seconds * 100) : 0;
  const phase = (() => {
    let end = 0;
    for (const item of currentPhases) {
      end += item.duration_seconds;
      if (activeSeconds < end) return item;
    }
    return currentPhases[currentPhases.length - 1] ?? null;
  })();

  const back = () => {
    if (onBack) onBack();
    else onTabChange?.('sadhana');
  };

  if (signedIn === null || loading) {
    return <main className="mx-auto min-h-screen max-w-md bg-[#0b0b09] px-6 pt-16 text-center text-[#b5a98a]" role="status">Preparing your Meditation space…</main>;
  }
  if (!signedIn) {
    return <main className="mx-auto min-h-screen max-w-md bg-[#0b0b09] px-6 pt-16 text-center text-[#b5a98a]" role="status">Please sign in to use Meditation.</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[radial-gradient(ellipse_at_top,#292114_0%,#11100d_42%,#090909_100%)] px-5 pb-12 pt-10 text-[#e5e2e1]">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={() => { if (mode === 'session') void leaveSession(); else back(); }} aria-label="Go back" className="rounded-full border border-[#d4af37]/25 px-3 py-2 text-[#d4af37]">‹ Back</button>
        <div className="text-center">
          <h1 className="font-serif text-xl tracking-wide text-[#d4af37]">Meditation</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b5a98a]">{mode === 'history' ? 'Your journey' : 'A quiet moment for you'}</p>
        </div>
        <button onClick={() => setMode(mode === 'history' ? 'library' : 'history')} className="rounded-full border border-[#d4af37]/20 px-3 py-2 text-xs text-[#e5d6b7]">{mode === 'history' ? 'Library' : 'History'}</button>
      </header>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">{notice}</div>}

      {mode === 'history' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-[#b5a98a]">Current streak</p><p className="mt-1 text-2xl text-[#d4af37]">{history?.progress?.current_streak ?? 0} days</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-[#b5a98a]">Total meditation</p><p className="mt-1 text-2xl text-[#d4af37]">{history?.progress?.total_meditation_minutes ?? 0} min</p></div>
          </div>
          <p className="text-sm text-[#d4af37]">Level {history?.progress?.level_number ?? 1} · {history?.progress?.level_name ?? 'Temple Entrance'} · {history?.progress?.current_xp ?? 0} XP</p>
          <h2 className="font-serif text-lg text-[#f3d992]">Recent sessions</h2>
          <div className="space-y-2">
            {(history?.sessions ?? []).map(item => (
              <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <div><p className="text-sm text-[#f3d992]">{item.status.replace('_', ' ')}</p><p className="text-xs text-[#b5a98a]">{formatDate(item.started_at)} · {Math.floor(item.active_duration_seconds / 60)} min</p></div>
                {(item.status === 'paused' || item.status === 'in_progress') && item.practice_id && <button onClick={() => void resume(item)} className="rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-[#17130b]">Resume</button>}
              </article>
            ))}
            {!history?.sessions.length && <p className="text-sm text-[#b5a98a]">Completed sessions will appear here.</p>}
          </div>
        </section>
      )}

      {mode === 'library' && (
        <section className="space-y-4">
          {!!library?.stages.length && <section className="space-y-3">
            <h2 className="font-serif text-lg text-[#f3d992]">Your meditation journey</h2>
            {library.stages.map(stage => {
              const stagePractices = library.stage_practices
                .filter(item => item.stage_id === stage.id)
                .sort((left, right) => left.display_order - right.display_order)
                .map(item => library.practices.find(practice => practice.id === item.practice_id))
                .filter((practice): practice is SadhanaPractice => Boolean(practice));
              return <article key={stage.id} className="rounded-xl border border-[#d4af37]/20 bg-black/20 p-4">
                <p className="text-[10px] uppercase tracking-widest text-[#a18a67]">Stage {stage.stage_number} · {stage.recommended_duration_minutes} min daily</p>
                <h3 className="mt-1 font-serif text-base text-[#f3d992]">{stage.name}</h3>
                <p className="mt-1 text-xs text-[#b5a98a]">{stage.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stagePractices.map(practice => <button key={practice.id} onClick={() => {
                    setSelectedId(practice.id);
                    setSelectedDuration(practice.default_duration_seconds ?? 600);
                    setMode('session');
                    setPlaying(false);
                    setCurrentSession(null);
                  }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#e5d6b7]">{practice.name}</button>)}
                </div>
              </article>;
            })}
          </section>}
          {library?.recommendations.length ? <p className="rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/10 p-3 text-sm text-[#f3d992]">Recommended for today</p> : null}
          <div className="space-y-3">
            {(library?.practices ?? []).map(practice => {
              const isRecommended = library?.recommendations.some(item => item.practice_id === practice.id);
              const category = library?.categories.find(item => item.id === practice.meditation_category_id);
              return (
                <button key={practice.id} onClick={() => { setSelectedId(practice.id); const preferred = history?.preferences?.preferred_duration_seconds; setSelectedDuration(preferred && practice.available_durations_seconds?.includes(preferred) ? preferred : practice.default_duration_seconds ?? 600); setMode('session'); setPlaying(false); setCurrentSession(null); }}
                  className="w-full overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#17140f] text-left">
                  {isSafePlayableUrl(practice.cover_image_url) && <img src={practice.cover_image_url!} alt="" className="h-36 w-full object-cover" loading="lazy" />}
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#a18a67]">{category?.name ?? 'Meditation'}{isRecommended ? ' · Today’s practice' : ''}</p>
                    <h2 className="mt-1 font-serif text-lg text-[#f3d992]">{practice.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-[#b5a98a]">{practice.subtitle || practice.description}</p>
                    <p className="mt-3 text-xs text-[#d4af37]">{(practice.meditation_type ?? 'guided').replace(/_/g, ' ')} · {Math.round((practice.default_duration_seconds ?? 600) / 60)} min</p>
                  </div>
                </button>
              );
            })}
            {!library?.practices.length && <p className="rounded-xl border border-white/10 p-5 text-sm text-[#b5a98a]">No published meditations are available yet.</p>}
          </div>
        </section>
      )}

      {mode === 'session' && selectedPractice && (
        <section className="space-y-5">
          {isSafePlayableUrl(selectedPractice.cover_image_url) && <img src={selectedPractice.cover_image_url!} alt="" className="h-40 w-full rounded-2xl object-cover" />}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#a18a67]">{(selectedPractice.meditation_type ?? 'guided').replace(/_/g, ' ')}</p>
            <h2 className="mt-1 font-serif text-2xl text-[#f3d992]">{selectedTranslation?.title || selectedPractice.name}</h2>
            <p className="mt-2 text-sm text-[#b5a98a]">{selectedTranslation?.subtitle || selectedPractice.subtitle || selectedPractice.description}</p>
          </div>

          {!session && <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <label className="block text-xs text-[#b5a98a]">Session duration
              <select className="mt-2 w-full rounded-lg border border-white/10 bg-[#15130f] p-3 text-sm text-[#f3d992]" value={selectedDuration} onChange={event => setSelectedDuration(Number(event.target.value))}>
                {durations.map(value => <option key={value} value={value}>{Math.round(value / 60)} minutes</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-4 text-xs text-[#b5a98a]">
              <label className="flex items-center gap-2"><input type="checkbox" checked={audioEnabled} onChange={event => setAudioEnabled(event.target.checked)} />Ambient audio</label>
              {selectedPractice.has_bell !== false && <label className="flex items-center gap-2"><input type="checkbox" checked={bellEnabled} onChange={event => setBellEnabled(event.target.checked)} />Temple bell</label>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => void savePreferences()} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-[#d9c99f]">Save preferences</button>
              <button disabled={selectedPractice.requires_audio && !selectedPractice.allow_silent_mode && !guidedAudio && !selectedPractice.guided_audio_url} onClick={() => void start()} className="flex-1 rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#17130b] disabled:cursor-not-allowed disabled:opacity-50">Begin meditation</button>
            </div>
          </div>}

          {session && <>
            <div className="flex flex-col items-center rounded-2xl border border-[#d4af37]/20 bg-black/20 p-6">
              <div className={`mb-5 grid h-36 w-36 place-items-center rounded-full border border-[#d4af37]/40 text-center ${playing ? 'animate-pulse bg-[#d4af37]/10' : 'bg-transparent'}`}>
                <div><p className="font-serif text-3xl text-[#f3d992]">{formatTime(remaining)}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-[#b5a98a]">remaining</p></div>
              </div>
              <p className="text-center font-serif text-lg text-[#f3d992]">{phase?.title || (playing ? 'Rest in stillness' : 'Ready when you are')}</p>
              <p className="mt-2 text-center text-sm leading-relaxed text-[#b5a98a]">{selectedTranslation?.guided_script || selectedTranslation?.instructions || phase?.instructions || selectedPractice.instructions}</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#d4af37] transition-all" style={{ width: `${completionPercent}%` }} /></div>
              <div className="mt-5 flex w-full gap-2">
                {playing ? <button onClick={() => void performAction('pause')} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm">Pause</button> : session.status === 'paused' ? <button onClick={() => void performAction('resume')} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm">Resume</button> : null}
                {!playing && completionPercent >= 80 && session.status === 'in_progress' && <button onClick={() => { completionRequested.current = true; void performAction('complete'); }} className="flex-1 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-semibold text-[#17130b]">Complete</button>}
                {session.status !== 'completed' && <button onClick={() => void performAction('abandon')} className="rounded-xl border border-red-900/50 px-3 py-3 text-xs text-red-200">End</button>}
              </div>
            </div>

            {guidedAudio && isSafePlayableUrl(guidedAudio.public_url) && <audio controls preload="none" className="w-full" src={guidedAudio.public_url} />}
            {ambientAudio && audioEnabled && isSafePlayableUrl(ambientAudio.public_url) && <audio controls loop preload="none" className="w-full" src={ambientAudio.public_url} />}
            {selectedPractice.requires_audio && !guidedAudio && !selectedPractice.guided_audio_url && <p role="status" className="text-xs text-amber-200">Guided audio is not currently published. Continue in silent mode if available.</p>}
            {!guidedAudio && isSafePlayableUrl(selectedPractice.guided_audio_url) && <audio controls preload="none" className="w-full" src={selectedPractice.guided_audio_url!} />}
          </>}

          {session?.status === 'completed' && (
            <form onSubmit={saveReflection} className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/20 p-4">
              <h3 className="font-serif text-lg text-[#f3d992]">A moment to reflect</h3>
              <label className="block text-xs text-[#b5a98a]">How do you feel?
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-[#15130f] p-2 text-[#f3d992]" value={mood ?? ''} onChange={event => setMood(event.target.value || null)}>
                  <option value="">Choose if you wish</option>{['peaceful', 'relaxed', 'focused', 'restless', 'neutral'].map(item => <option key={item}>{item}</option>)}
                </select>
              </label>
              <textarea maxLength={2000} rows={3} className="w-full rounded-lg border border-white/10 bg-[#15130f] p-3 text-sm" placeholder="Private reflection (optional)" value={reflection} onChange={event => setReflection(event.target.value)} />
              <input maxLength={1000} className="w-full rounded-lg border border-white/10 bg-[#15130f] p-3 text-sm" placeholder="An intention for the day (optional)" value={intention} onChange={event => setIntention(event.target.value)} />
              <button disabled={savingReflection} className="w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#17130b]">{savingReflection ? 'Saving…' : 'Save reflection'}</button>
            </form>
          )}
        </section>
      )}
    </main>
  );
};
