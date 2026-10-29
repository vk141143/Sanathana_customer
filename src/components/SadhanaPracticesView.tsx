import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { NavTab, ReadingProgress } from '../types';
import { ScriptureReader } from './ScriptureReader';
import { resolvePracticeReading, type PracticeReading } from '../services/sadhana/practiceReading';
import {
  fetchActiveSadhanaPractices,
  getPracticePresentation,
  getPracticeTarget,
  getRepetitionTarget,
  isCounterEnabled,
  isMalaCounterEnabled,
  isPracticeComplete,
  isSafePlayableUrl,
  PracticeCategory,
  PracticeRuntimeState,
  SadhanaPractice,
} from '../services/sadhana/practiceCatalog';

interface SadhanaPracticesViewProps {
  onTabChange: (tab: NavTab) => void;
  onBack: () => void;
  preferredLanguage?: string;
  bookmarks?: string[];
  onToggleBookmark?: (id: string) => void;
  onReadingProgressChange?: (progress: ReadingProgress) => void;
}

const CATEGORY_LABELS: Record<PracticeCategory, string> = {
  meditation: 'Meditation',
  japa: 'Japa',
  mantra: 'Mantra',
  gratitude: 'Gratitude',
  scripture_reading: 'Scripture reading',
};

const EMPTY_RUNTIME_STATE: PracticeRuntimeState = {
  elapsedSeconds: 0,
  repetitions: 0,
  submittedEntries: 0,
  audioCompleted: false,
  manuallyCompleted: false,
};

function scriptureVerseRange(start: unknown, end: unknown): string | null {
  const first = typeof start === 'number' && Number.isFinite(start) ? start : null;
  const last = typeof end === 'number' && Number.isFinite(end) ? end : null;
  if (first !== null && last !== null) return `Verses ${first}–${last}`;
  if (first !== null) return `From verse ${first}`;
  if (last !== null) return `Through verse ${last}`;
  return null;
}

export const SadhanaPracticesView: React.FC<SadhanaPracticesViewProps> = ({
  onTabChange,
  onBack,
  preferredLanguage = 'en',
  onReadingProgressChange,
  bookmarks = [],
  onToggleBookmark,
}) => {
  const [practices, setPractices] = useState<SadhanaPractice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNumber, setRetryNumber] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => onAuthStateChanged(auth, user => {
    setSelectedId(null);
    setPractices([]);
    setSignedIn(!!user);
  }), []);

  useEffect(() => {
    let current = true;
    if (!signedIn) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchActiveSadhanaPractices()
      .then(result => {
        if (current) setPractices(result);
      })
      .catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : 'Unable to load Sadhana practices.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [retryNumber, signedIn]);

  const selectedPractice = useMemo(
    () => practices.find(practice => practice.id === selectedId) ?? null,
    [practices, selectedId],
  );

  if (selectedPractice) {
    return (
      <PracticeSession
        key={selectedPractice.id}
        practice={selectedPractice}
        onReadingProgressChange={onReadingProgressChange}
        bookmarks={bookmarks} onToggleBookmark={onToggleBookmark}
        preferredLanguage={preferredLanguage}
        onBack={() => setSelectedId(null)}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 pt-14 pb-32 text-[#e5e2e1]"
      style={{ background: 'linear-gradient(180deg, #0d0b08 0%, #131008 50%, #0a0a0a 100%)' }}>
      <header className="flex items-center gap-3 mb-6">
        <button onClick={onBack} aria-label="Back to Sadhana tracker"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="font-cinzel text-xl font-bold tracking-widest" style={{ color: '#D4AF37' }}>
            Sacred Practice
          </h1>
          <p className="text-xs" style={{ color: '#B5A98A' }}>Practices curated for your journey</p>
        </div>
      </header>

      {loading && <p role="status" className="py-10 text-center text-sm text-[#B5A98A]">Loading practices…</p>}
      {!loading && error && (
        <section role="alert" className="rounded-2xl p-5" style={{ background: '#19140e', border: '1px solid #6d4921' }}>
          <p className="text-sm text-[#F3D992]">{error}</p>
          <button onClick={() => setRetryNumber(value => value + 1)}
            className="mt-4 rounded-full px-4 py-2 text-sm" style={{ background: '#D4AF37', color: '#100e08' }}>
            Retry
          </button>
        </section>
      )}
      {signedIn === false && <p role="status">Please sign in to open your Sadhana practices.</p>}
      {signedIn === null && <p role="status">Checking sign-in…</p>}
      {signedIn && !loading && !error && practices.length === 0 && (
        <p className="py-10 text-center text-sm text-[#B5A98A]">No published practices are available yet.</p>
      )}
      {!loading && !error && practices.length > 0 && (
        <div className="flex flex-col gap-3">
          {practices.map(practice => (
            <button key={practice.id} onClick={() => setSelectedId(practice.id)}
              className="w-full text-left rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a1710 0%, #111008 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
              {isSafePlayableUrl(practice.cover_image_url) && (
                <img src={practice.cover_image_url} alt="" className="w-full h-36 object-cover" loading="lazy" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {practice.is_featured && <span className="text-[10px] uppercase tracking-widest text-[#EAB351]">Featured · </span>}
                    <span className="text-[10px] uppercase tracking-widest text-[#A18A67]">
                      {CATEGORY_LABELS[practice.category]}
                    </span>
                    <h2 className="font-cinzel font-bold mt-1 text-[#F3D992]">{practice.name}</h2>
                  </div>
                  <svg className="mt-1 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#EAB351" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
                {practice.subtitle && <p className="mt-1 text-sm text-[#B5A98A]">{practice.subtitle}</p>}
                {practice.description && <p className="mt-2 text-xs leading-relaxed text-[#9b8d71] line-clamp-3">{practice.description}</p>}
                <PracticeTargetSummary practice={practice} />
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
};

const PracticeTargetSummary: React.FC<{ practice: SadhanaPractice }> = ({ practice }) => {
  const target = getPracticeTarget(practice);
  if (!target) return null;
  return <p className="mt-3 text-xs text-[#EAB351]">Target: {target.value} {target.unit}</p>;
};

interface PracticeSessionProps {
  practice: SadhanaPractice;
  preferredLanguage: string;
  bookmarks?: string[];
  onToggleBookmark?: (id: string) => void;
  onReadingProgressChange?: (progress: ReadingProgress) => void;
  onBack: () => void;
  onTabChange: (tab: NavTab) => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({
  practice,
  preferredLanguage,
  onReadingProgressChange,
  bookmarks = [],
  onToggleBookmark,
  onBack,
  onTabChange,
}) => {
  const [runtime, setRuntime] = useState(EMPTY_RUNTIME_STATE);
  const [timerRunning, setTimerRunning] = useState(false);
  const [malaCount, setMalaCount] = useState(0);
  const [reflection, setReflection] = useState('');
  const [submittedReflections, setSubmittedReflections] = useState<string[]>([]);
  const [reading, setReading] = useState<PracticeReading | null>(null);
  const [readingError, setReadingError] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingAttempt, setReadingAttempt] = useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const target = getPracticeTarget(practice);
  const completionRule = practice.completion_rule ?? 'manual';
  const repetitionTarget = getRepetitionTarget(practice);
  const completed = isPracticeComplete(practice, runtime);
  const presentation = getPracticePresentation(practice, preferredLanguage);
  const mantraText = presentation.mantraText;
  const localizedInstructions = presentation.instructions;
  const localizedMeaning = presentation.meaning;
  const media = presentation.media;
  const config = practice.category_config;
  const canCountRepetitions = isCounterEnabled(practice) ||
    (practice.category === 'mantra' && practice.practice_mode === 'repetition' && practice.target_type === 'repetitions');
  const canWriteReflection = practice.category_config.allow_personal_reflection !== false;

  useEffect(() => {
    if (!timerRunning) return;
    const timerId = window.setInterval(() => {
      setRuntime(current => ({ ...current, elapsedSeconds: current.elapsedSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [timerRunning]);

  useEffect(() => {
    if (completed) setTimerRunning(false);
  }, [completed]);

  useEffect(() => {
    if (practice.category !== 'scripture_reading') return;
    let alive = true;
    setReadingLoading(true); setReadingError(''); setReading(null);
    resolvePracticeReading(practice).then(value => { if (alive) setReading(value); })
      .catch(error => { if (alive) setReadingError(error.message); })
      .finally(() => { if (alive) setReadingLoading(false); });
    return () => { alive = false; };
  }, [practice, readingAttempt]);

  const addReflection = (event: React.FormEvent) => {
    event.preventDefault();
    const value = reflection.trim();
    if (!value) return;
    setSubmittedReflections(current => [...current, value]);
    setReflection('');
    setRuntime(current => ({ ...current, submittedEntries: current.submittedEntries + 1 }));
  };

  const handleAudioEnded = () => {
    setAudioError(null);
    setRuntime(current => ({ ...current, audioCompleted: true }));
  };

  const audioElements = media.map(item => (
    <div key={item.url} className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.16)' }}>
      <p className="text-xs mb-2 text-[#EAB351]">{item.label}</p>
      <audio controls preload="none" className="w-full"
        onEnded={item.label === 'Ambient audio' ? undefined : handleAudioEnded}
        onError={() => setAudioError('This audio could not be played. Please try again later.')}>
        <source src={item.url} />
        Your browser does not support audio playback.
      </audio>
    </div>
  ));

  if (readerOpen && reading) return <>
    <button onClick={() => setReaderOpen(false)} className="p-4 text-[#D4AF37]">Back to practice</button>
    <ScriptureReader initialSelection={reading} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark}
      onTabChange={onTabChange} preferredReadingLanguage={preferredLanguage}
      onReadingProgressChange={onReadingProgressChange} />
  </>;

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 pt-14 pb-32 text-[#e5e2e1]"
      style={{ background: 'linear-gradient(180deg, #0d0b08 0%, #131008 50%, #0a0a0a 100%)' }}>
      <header className="flex items-center gap-3 mb-6">
        <button onClick={onBack} aria-label="Back to practices"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#A18A67]">{CATEGORY_LABELS[practice.category]}</p>
          <h1 className="font-cinzel text-lg font-bold text-[#D4AF37]">{practice.name}</h1>
        </div>
      </header>

      {isSafePlayableUrl(practice.cover_image_url) && (
        <img src={practice.cover_image_url} alt="" className="w-full max-h-56 rounded-2xl object-cover mb-5" />
      )}
      {practice.subtitle && <p className="text-base text-[#F3D992] mb-2">{practice.subtitle}</p>}
      {practice.description && <p className="text-sm leading-relaxed text-[#B5A98A] mb-4">{practice.description}</p>}
      <div className="flex flex-wrap gap-2 mb-4 text-[11px] text-[#A18A67]">
        {practice.difficulty && <span className="rounded-full px-3 py-1 border border-[#514124]">{practice.difficulty}</span>}
        {practice.practice_mode && <span className="rounded-full px-3 py-1 border border-[#514124]">{practice.practice_mode.replace(/_/g, ' ')}</span>}
        {practice.time_of_day && <span className="rounded-full px-3 py-1 border border-[#514124]">{practice.time_of_day.replace(/_/g, ' ')}</span>}
      </div>
      {localizedInstructions && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Instructions</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#D3B98A]">{localizedInstructions}</p>
        </section>
      )}
      {practice.benefits.length > 0 && (
        <section className="mb-4">
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Benefits</h2>
          <ul className="list-disc pl-5 text-sm text-[#B5A98A] space-y-1">
            {practice.benefits.map((benefit, index) => <li key={`${index}-${benefit}`}>{benefit}</li>)}
          </ul>
        </section>
      )}
      {practice.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {practice.tags.map((tag, index) => (
            <span key={`${index}-${tag}`} className="rounded-full px-3 py-1 text-[11px] text-[#D3B98A]"
              style={{ border: '1px solid rgba(212,175,55,0.2)' }}>{tag}</span>
          ))}
        </div>
      )}

      {(practice.category === 'japa' || practice.category === 'mantra') && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          {presentation.mantraName && <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">{presentation.mantraName}</h2>}
          {mantraText && <p className="text-xl leading-loose whitespace-pre-wrap text-[#F3D992]">{mantraText}</p>}
          {presentation.transliteration && (
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap italic text-[#D3B98A]">{presentation.transliteration}</p>
          )}
          {localizedMeaning && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-[#B5A98A]">{localizedMeaning}</p>}
        </section>
      )}

      {practice.category === 'meditation' && typeof config.breathing_guidance === 'string' && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Breathing guidance</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#D3B98A]">{config.breathing_guidance}</p>
        </section>
      )}
      {practice.category === 'meditation' && typeof config.begin_instructions === 'string' && (
        <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-[#D3B98A]">{config.begin_instructions}</p>
      )}
      {practice.category === 'meditation' && typeof config.end_instructions === 'string' && (
        <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-[#D3B98A]">{config.end_instructions}</p>
      )}

      {practice.category === 'gratitude' && presentation.prompts.length > 0 && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Reflection prompts</h2>
          <ul className="list-disc pl-5 text-sm text-[#D3B98A] space-y-1">
            {presentation.prompts.map((prompt, index) => <li key={`${index}-${prompt}`}>{prompt}</li>)}
          </ul>
        </section>
      )}

      {practice.category === 'scripture_reading' && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Scripture selection</h2>
          <p className="text-sm text-[#D3B98A]">
            {[presentation.scriptureName, presentation.scriptureChapter ? `Chapter ${presentation.scriptureChapter}` : null,
              scriptureVerseRange(presentation.startVerse, presentation.endVerse)]
              .filter((item): item is string => typeof item === 'string')
              .join(' · ') || 'Continue in the scripture library'}
          </p>
          {readingLoading && <p role="status">Loading configured reading?</p>}
          {readingError && <p role="alert">{readingError} <button onClick={() => setReadingAttempt(value => value + 1)}>Retry</button></p>}
          <button disabled={!reading || readingLoading} onClick={() => setReaderOpen(true)} className="mt-3 rounded-full px-4 py-2 text-sm disabled:opacity-50"
            style={{ background: '#D4AF37', color: '#100e08' }}>Read configured verses</button>
        </section>
      )}

      {target && <p className="mb-4 text-sm text-[#EAB351]">Configured target: {target.value} {target.unit}</p>}

      {canCountRepetitions && (
        <section className="rounded-2xl p-4 mb-4 text-center" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <p className="text-xs uppercase tracking-widest text-[#A18A67]">Completed repetitions</p>
          <p className="font-garamond text-4xl font-bold text-[#F3D992] my-2">{runtime.repetitions}</p>
          {repetitionTarget && <p className="mb-3 text-xs text-[#B5A98A]">Repetition target: {repetitionTarget}</p>}
          <button onClick={() => setRuntime(current => ({ ...current, repetitions: current.repetitions + 1 }))}
            disabled={completed} className="rounded-full px-5 py-2 text-sm disabled:opacity-50"
            style={{ background: '#D4AF37', color: '#100e08' }}>Count one complete recitation</button>
          {isMalaCounterEnabled(practice) && (
            <div className="mt-3">
              <p className="text-xs text-[#B5A98A]">Completed malas: {malaCount}</p>
              <button onClick={() => setMalaCount(value => value + 1)} disabled={completed}
                className="mt-2 rounded-full px-4 py-2 text-xs disabled:opacity-50"
                style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#F3D992' }}>Mark one mala complete</button>
            </div>
          )}
          {typeof config.counter_instructions === 'string' && (
            <p className="mt-3 text-xs leading-relaxed text-[#A18A67]">{config.counter_instructions}</p>
          )}
        </section>
      )}

      {(practice.practice_mode === 'timer' || completionRule === 'timer_elapsed') && (
        <section className="rounded-2xl p-4 mb-4 text-center" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <p className="text-xs uppercase tracking-widest text-[#A18A67]">Session timer</p>
          <p className="font-garamond text-4xl font-bold text-[#F3D992] my-2">
            {Math.floor(runtime.elapsedSeconds / 60).toString().padStart(2, '0')}:{(runtime.elapsedSeconds % 60).toString().padStart(2, '0')}
          </p>
          <button onClick={() => setTimerRunning(value => !value)} disabled={completed}
            className="rounded-full px-5 py-2 text-sm disabled:opacity-50"
            style={{ background: '#D4AF37', color: '#100e08' }}>{timerRunning ? 'Pause timer' : 'Start timer'}</button>
        </section>
      )}

      {practice.category === 'gratitude' && canWriteReflection && (
        <section className="rounded-2xl p-4 mb-4" style={{ background: '#17130c', border: '1px solid rgba(212,175,55,0.16)' }}>
          <h2 className="font-cinzel text-sm text-[#EAB351] mb-2">Your reflection</h2>
          <form onSubmit={addReflection}>
            <textarea value={reflection} onChange={event => setReflection(event.target.value)}
              rows={3} className="w-full rounded-xl p-3 text-sm text-[#F3D992] bg-[#0d0b08] border border-[#514124]"
              placeholder="Write a gratitude entry (kept only for this visit)." />
            <button type="submit" disabled={!reflection.trim() || completed}
              className="mt-2 rounded-full px-4 py-2 text-sm disabled:opacity-50"
              style={{ background: '#D4AF37', color: '#100e08' }}>Submit entry</button>
          </form>
          {submittedReflections.length > 0 && (
            <p className="mt-2 text-xs text-[#A18A67]">{submittedReflections.length} private entr{submittedReflections.length === 1 ? 'y' : 'ies'} held in memory for this visit.</p>
          )}
        </section>
      )}

      {media.length > 0 && (
        <section className="flex flex-col gap-3 mb-4">
          <h2 className="font-cinzel text-sm text-[#EAB351]">Practice audio</h2>
          {audioElements}
          {audioError && <p role="alert" className="text-xs text-red-300">{audioError}</p>}
        </section>
      )}

      {(completionRule === 'manual' || completionRule === 'audio_completed') && (
        <button onClick={() => setRuntime(current => ({ ...current, manuallyCompleted: true }))}
          disabled={completed || (completionRule === 'audio_completed' && !runtime.audioCompleted)} className="w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: completed ? '#4d432c' : '#D4AF37', color: '#100e08' }}>
          {completed ? 'Completed for this visit' : 'Mark practice complete'}
        </button>
      )}
      {completed && <p role="status" className="mt-3 text-center text-sm text-[#EAB351]">Practice complete for this visit.</p>}
      <p className="mt-5 text-center text-xs leading-relaxed text-[#8d8067]">
        Session progress and reflections are not saved yet. Leaving this screen clears them.
      </p>
    </main>
  );
};
