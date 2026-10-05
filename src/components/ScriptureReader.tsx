import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavTab, ReadingProgress } from '../types';
import {
  fetchPublishedScriptures,
  fetchPublishedChapters,
  fetchPublishedSlokas,
  fetchSlokaJson,
  getLanguageLabel,
  PublishedScripture,
  PublishedChapter,
  SlokaMetadata,
  FALLBACK_SCRIPTURE_IMAGE,
} from '../lib/scriptureLibrary';

interface ScriptureReaderProps {
  bookmarks: string[];
  onToggleBookmark: (verseId: string) => void;
  onTabChange: (tab: NavTab) => void;
  preferredReadingLanguage?: string;
  readingProgress?: ReadingProgress | null;
  onPreferredLanguageChange?: (language: string) => void;
  onReadingProgressChange?: (progress: {
    scripture_id: string;
    chapter_id: string;
    verse_number: number;
    language: string;
  }) => void;
}

type Screen = 'scriptures' | 'chapters' | 'slokas' | 'reader';

const LANGS = ['en', 'te', 'hi', 'kn', 'ml', 'ta'];

// In-memory verse JSON cache: verse_id -> raw R2 JSON payload
const verseJsonCache = new Map<string, any>();

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#2a2a2a] rounded ${className}`} />
);

// ── Back button ───────────────────────────────────────────────────────────────
const BackBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-[#f2c377] hover:opacity-80 transition-opacity flex-shrink-0"
    aria-label={`Back to ${label}`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="font-cinzel text-xs truncate max-w-[140px]">{label}</span>
  </button>
);

// ── Content block ─────────────────────────────────────────────────────────────
const ContentBlock: React.FC<{ label: string; text: string; italic?: boolean }> = ({ label, text, italic }) => (
  <div className="bg-[#1c1b1b] border border-[#4e4539]/30 rounded-xl p-4 mb-3">
    <p className="text-[10px] text-[#d2c4b3]/50 uppercase tracking-wider mb-1.5">{label}</p>
    <p className={`text-[#e5e2e1] text-base leading-relaxed ${italic ? 'italic text-[#d2c4b3]/80' : ''}`}>{text}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const ScriptureReader: React.FC<ScriptureReaderProps> = ({
  bookmarks,
  onToggleBookmark,
  onTabChange,
  preferredReadingLanguage = 'en',
  readingProgress,
  onPreferredLanguageChange,
  onReadingProgressChange,
}) => {
  const [screen, setScreen] = useState<Screen>('scriptures');

  // Data
  const [scriptures, setScriptures] = useState<PublishedScripture[]>([]);
  const [chapters, setChapters] = useState<PublishedChapter[]>([]);
  const [slokas, setSlokas] = useState<SlokaMetadata[]>([]);
  const [verseJson, setVerseJson] = useState<any>(null);

  // Selection
  const [selectedScripture, setSelectedScripture] = useState<PublishedScripture | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<PublishedChapter | null>(null);
  const [selectedSlokaIdx, setSelectedSlokaIdx] = useState(0);

  // Loading / error
  const [loadingScriptures, setLoadingScriptures] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingSlokas, setLoadingSlokas] = useState(false);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [errorScriptures, setErrorScriptures] = useState<string | null>(null);
  const [errorChapters, setErrorChapters] = useState<string | null>(null);
  const [errorSlokas, setErrorSlokas] = useState<string | null>(null);
  const [errorVerse, setErrorVerse] = useState<string | null>(null);

  // Reader UI
  const [selectedLanguage, setSelectedLanguage] = useState(preferredReadingLanguage);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch scriptures on mount ─────────────────────────────────────────────
  const loadScriptures = useCallback(() => {
    setLoadingScriptures(true);
    setErrorScriptures(null);
    fetchPublishedScriptures()
      .then(setScriptures)
      .catch(() => setErrorScriptures('Unable to load scriptures. Please try again.'))
      .finally(() => setLoadingScriptures(false));
  }, []);

  useEffect(() => { loadScriptures(); }, [loadScriptures]);

  // ── Fetch chapters when scripture selected ────────────────────────────────
  const loadChapters = useCallback((scriptureId: string) => {
    setLoadingChapters(true);
    setErrorChapters(null);
    fetchPublishedChapters(scriptureId)
      .then(setChapters)
      .catch(() => setErrorChapters('Unable to load chapters. Please try again.'))
      .finally(() => setLoadingChapters(false));
  }, []);

  // ── Fetch sloka metadata when chapter selected ────────────────────────────
  const loadSlokas = useCallback((chapterId: string) => {
    setLoadingSlokas(true);
    setErrorSlokas(null);
    fetchPublishedSlokas(chapterId)
      .then(setSlokas)
      .catch(() => setErrorSlokas('Unable to load verses. Please try again.'))
      .finally(() => setLoadingSlokas(false));
  }, []);

  // ── Fetch single verse JSON from R2 (with in-memory cache) ───────────────
  const loadVerseJson = useCallback(async (sloka: SlokaMetadata) => {
    const cacheKey = sloka.verse_id || sloka.id;
    if (verseJsonCache.has(cacheKey)) {
      setVerseJson(verseJsonCache.get(cacheKey));
      return;
    }
    setLoadingVerse(true);
    setErrorVerse(null);
    setVerseJson(null);
    try {
      const data = await fetchSlokaJson(sloka.json_url);
      verseJsonCache.set(cacheKey, data);
      setVerseJson(data);
    } catch {
      setErrorVerse('This verse is temporarily unavailable. Please try again.');
    } finally {
      setLoadingVerse(false);
    }
  }, []);

  // Load verse JSON whenever selected sloka changes
  useEffect(() => {
    if (screen !== 'reader' || slokas.length === 0) return;
    const sloka = slokas[selectedSlokaIdx];
    if (sloka) loadVerseJson(sloka);
  }, [screen, selectedSlokaIdx, slokas, loadVerseJson]);

  // ── Debounced reading progress save ──────────────────────────────────────
  useEffect(() => {
    if (screen !== 'reader' || !selectedScripture || !selectedChapter || slokas.length === 0) return;
    const sloka = slokas[selectedSlokaIdx];
    if (!sloka) return;
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      onReadingProgressChange?.({
        scripture_id: selectedScripture.id,
        chapter_id: selectedChapter.id,
        verse_number: sloka.verse_number,
        language: selectedLanguage,
      });
    }, 1500);
    return () => { if (progressTimerRef.current) clearTimeout(progressTimerRef.current); };
  }, [screen, selectedSlokaIdx, selectedLanguage]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleSelectScripture = (s: PublishedScripture) => {
    setSelectedScripture(s);
    setChapters([]);
    setScreen('chapters');
    loadChapters(s.id);
  };

  const handleSelectChapter = (c: PublishedChapter) => {
    setSelectedChapter(c);
    setSlokas([]);
    setScreen('slokas');
    loadSlokas(c.id);
  };

  const handleSelectSloka = (idx: number) => {
    setSelectedSlokaIdx(idx);
    setVerseJson(null);
    setSelectedLanguage(preferredReadingLanguage);
    setScreen('reader');
  };

  const handleBackToScriptures = () => {
    setScreen('scriptures');
    setSelectedScripture(null);
    setChapters([]);
    setSearchQuery('');
  };

  const handleBackToChapters = () => {
    setScreen('chapters');
    setSelectedChapter(null);
    setSlokas([]);
  };

  const handleBackToSlokas = () => {
    setScreen('slokas');
    setVerseJson(null);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    onPreferredLanguageChange?.(lang);
    setShowLangDropdown(false);
    // No network request — language data already in verseJson
  };

  const handleShare = () => {
    const sloka = slokas[selectedSlokaIdx];
    if (!sloka || !verseJson) return;
    const langData = verseJson.languages?.[selectedLanguage] ?? {};
    const text = `${selectedScripture?.name} — ${sloka.verse_id}\n\n${verseJson.sanskrit?.devanagari ?? ''}\n\n"${langData.translation ?? ''}"\n— SANATANA App`;
    navigator.clipboard?.writeText(text);
    setShareNotice('Verse copied!');
    setTimeout(() => setShareNotice(null), 2500);
  };

  const filteredScriptures = scriptures.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSloka = slokas[selectedSlokaIdx] ?? null;
  const isBookmarked = currentSloka ? bookmarks.includes(currentSloka.verse_id || currentSloka.id) : false;

  // ── SCREEN: SCRIPTURES LIST ───────────────────────────────────────────────
  if (screen === 'scriptures') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pb-32 max-w-md mx-auto">
        <header className="flex items-center justify-between px-5 h-16 fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl max-w-md mx-auto border-b border-[#4e4539]/20">
          <h1 className="font-cinzel text-xl text-[#f2c377] font-bold tracking-widest">LIBRARY</h1>
          <button onClick={() => onTabChange('home')} className="text-[#d2c4b3]/60 hover:text-[#f2c377] transition-colors" aria-label="Home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <main className="pt-20 px-5">
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d2c4b3]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search scriptures..."
              className="w-full bg-[#1c1b1b] border-b border-[#f2c377]/30 focus:border-[#f2c377] outline-none py-3 pl-11 pr-4 text-sm text-[#e5e2e1] placeholder:text-[#d2c4b3]/40 rounded-t-lg transition-all"
            />
          </div>

          <h2 className="font-cinzel text-[#d2c4b3]/70 text-xs uppercase tracking-widest mb-4">Sacred Scriptures</h2>

          {loadingScriptures && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 bg-[#1c1b1b] rounded-2xl">
                  <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {errorScriptures && !loadingScriptures && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm mb-3">{errorScriptures}</p>
              <button onClick={loadScriptures} className="text-[#f2c377] text-sm underline">Try Again</button>
            </div>
          )}

          {!loadingScriptures && !errorScriptures && filteredScriptures.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">✦</div>
              <p className="font-cinzel text-[#d2c4b3]/60 text-sm">
                {searchQuery ? `No scriptures matching "${searchQuery}"` : 'No scriptures published yet.'}
              </p>
            </div>
          )}

          {!loadingScriptures && !errorScriptures && (
            <div className="space-y-4">
              {filteredScriptures.map(scripture => (
                <div
                  key={scripture.id}
                  onClick={() => handleSelectScripture(scripture)}
                  className="flex gap-4 p-4 bg-[#1c1b1b] border border-[#4e4539]/30 rounded-2xl cursor-pointer hover:border-[#f2c377]/40 active:scale-[0.98] transition-all group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#f2c377]/20">
                    <img
                      src={scripture.cover_image_url || FALLBACK_SCRIPTURE_IMAGE}
                      alt={scripture.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cinzel text-[#f2c377] font-bold text-base leading-tight mb-1">{scripture.name}</h3>
                    {scripture.description && (
                      <p className="text-[#d2c4b3]/60 text-xs line-clamp-2 mb-2">{scripture.description}</p>
                    )}
                    <span className="text-[#f2c377]/70 text-xs font-cinzel flex items-center gap-1">
                      Open Scripture
                      <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── SCREEN: CHAPTERS LIST ─────────────────────────────────────────────────
  if (screen === 'chapters') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pb-32 max-w-md mx-auto">
        <header className="flex items-center gap-3 px-5 h-16 fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl max-w-md mx-auto border-b border-[#4e4539]/20">
          <BackBtn onClick={handleBackToScriptures} label="Library" />
          <h1 className="font-cinzel text-[#f2c377] font-bold text-base truncate flex-1">{selectedScripture?.name}</h1>
        </header>

        <main className="pt-20 px-5">
          {selectedScripture?.cover_image_url && (
            <div className="relative h-40 rounded-2xl overflow-hidden mb-6 border border-[#4e4539]/30">
              <img src={selectedScripture.cover_image_url} alt={selectedScripture.name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h2 className="font-cinzel text-white text-xl font-bold">{selectedScripture.name}</h2>
                {chapters.length > 0 && (
                  <p className="text-[#f2c377]/80 text-xs mt-0.5">{chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )}

          <h2 className="font-cinzel text-[#d2c4b3]/70 text-xs uppercase tracking-widest mb-4">Chapters</h2>

          {loadingChapters && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 bg-[#1c1b1b] rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {errorChapters && !loadingChapters && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm mb-3">{errorChapters}</p>
              <button onClick={() => selectedScripture && loadChapters(selectedScripture.id)} className="text-[#f2c377] text-sm underline">Try Again</button>
            </div>
          )}

          {!loadingChapters && !errorChapters && chapters.length === 0 && (
            <div className="text-center py-16">
              <p className="font-cinzel text-[#d2c4b3]/60 text-sm">No chapters published yet.</p>
            </div>
          )}

          {!loadingChapters && !errorChapters && (
            <div className="space-y-3">
              {chapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  onClick={() => handleSelectChapter(chapter)}
                  className="flex items-center gap-4 p-4 bg-[#1c1b1b] border border-[#4e4539]/30 rounded-xl cursor-pointer hover:border-[#f2c377]/40 active:scale-[0.98] transition-all group"
                >
                  {chapter.image_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[#f2c377]/20">
                      <img src={chapter.image_url} alt={chapter.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#d4a85f]/10 border border-[#d4a85f]/30 flex items-center justify-center flex-shrink-0">
                      <span className="font-cinzel text-[#f2c377] text-sm font-bold">{chapter.chapter_number || idx + 1}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#d2c4b3]/50 text-[10px] font-cinzel uppercase tracking-wider">Chapter {chapter.chapter_number || idx + 1}</p>
                    <h3 className="font-cinzel text-[#e5e2e1] font-semibold text-sm leading-tight">{chapter.title}</h3>
                    {chapter.subtitle && <p className="text-[#d2c4b3]/60 text-xs mt-0.5 truncate">{chapter.subtitle}</p>}
                    {(chapter.sloka_count ?? 0) > 0 && (
                      <p className="text-[#f2c377]/60 text-xs mt-1">{chapter.sloka_count} Slokas</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-[#f2c377]/50 group-hover:text-[#f2c377] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── SCREEN: SLOKAS LIST ───────────────────────────────────────────────────
  if (screen === 'slokas') {
    // Check if user has reading progress for this chapter
    const continueFromVerse = readingProgress?.chapter_id === selectedChapter?.id
      ? readingProgress.verse_number
      : null;
    const continueIdx = continueFromVerse != null
      ? slokas.findIndex(s => s.verse_number === continueFromVerse)
      : -1;

    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pb-32 max-w-md mx-auto">
        <header className="flex items-center gap-3 px-5 h-16 fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl max-w-md mx-auto border-b border-[#4e4539]/20">
          <BackBtn onClick={handleBackToChapters} label={selectedScripture?.name ?? 'Chapters'} />
          <div className="flex-1 min-w-0">
            <p className="font-cinzel text-[#f2c377] font-bold text-sm truncate">{selectedChapter?.title}</p>
            <p className="text-[#d2c4b3]/50 text-[10px]">Chapter {selectedChapter?.chapter_number}</p>
          </div>
        </header>

        <main className="pt-20 px-5">
          {/* Continue banner */}
          {continueIdx >= 0 && !loadingSlokas && (
            <div
              onClick={() => handleSelectSloka(continueIdx)}
              className="flex items-center gap-3 p-4 mb-5 bg-[#f2c377]/10 border border-[#f2c377]/30 rounded-xl cursor-pointer hover:bg-[#f2c377]/15 transition-all"
            >
              <span className="text-[#f2c377] text-lg">↩</span>
              <div>
                <p className="font-cinzel text-[#f2c377] text-xs font-bold">Continue Reading</p>
                <p className="text-[#d2c4b3]/70 text-xs">Sloka {continueFromVerse}</p>
              </div>
            </div>
          )}

          <h2 className="font-cinzel text-[#d2c4b3]/70 text-xs uppercase tracking-widest mb-4">
            {slokas.length > 0 ? `${slokas.length} Slokas` : 'Slokas'}
          </h2>

          {loadingSlokas && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 bg-[#1c1b1b] rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="w-14 h-7 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {errorSlokas && !loadingSlokas && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm mb-3">{errorSlokas}</p>
              <button onClick={() => selectedChapter && loadSlokas(selectedChapter.id)} className="text-[#f2c377] text-sm underline">Try Again</button>
            </div>
          )}

          {!loadingSlokas && !errorSlokas && slokas.length === 0 && (
            <div className="text-center py-16">
              <p className="font-cinzel text-[#d2c4b3]/60 text-sm">No slokas published yet.</p>
            </div>
          )}

          {!loadingSlokas && !errorSlokas && (
            <div className="space-y-2">
              {slokas.map((sloka, idx) => {
                const isBookmarkedSloka = bookmarks.includes(sloka.verse_id || sloka.id);
                return (
                  <div
                    key={sloka.id}
                    onClick={() => handleSelectSloka(idx)}
                    className="flex items-center gap-4 p-4 bg-[#1c1b1b] border border-[#4e4539]/30 rounded-xl cursor-pointer hover:border-[#f2c377]/40 active:scale-[0.98] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#d4a85f]/10 border border-[#d4a85f]/30 flex items-center justify-center flex-shrink-0">
                      <span className="font-cinzel text-[#f2c377] text-xs font-bold">{sloka.verse_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cinzel text-[#e5e2e1] text-sm font-semibold">{sloka.verse_id}</p>
                      <p className="text-[#d2c4b3]/50 text-xs mt-0.5">Sloka {sloka.verse_number}</p>
                    </div>
                    {isBookmarkedSloka && (
                      <svg className="w-3.5 h-3.5 text-[#f2c377] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    <span className="text-[#f2c377]/60 text-xs font-cinzel group-hover:text-[#f2c377] transition-colors flex-shrink-0">Read →</span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── SCREEN: SLOKA READER ──────────────────────────────────────────────────
  const langData = verseJson?.languages?.[selectedLanguage] ?? {};
  const devanagari: string = verseJson?.sanskrit?.devanagari ?? '';
  const transliteration: string = verseJson?.sanskrit?.transliteration ?? '';

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1] pb-36 max-w-lg mx-auto select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-xl border-b border-[#4e4539]/20 max-w-lg mx-auto">
        <BackBtn onClick={handleBackToSlokas} label={selectedChapter?.title ?? 'Slokas'} />

        {/* Language selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setShowLangDropdown(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1b1b] border border-[#f2c377]/30 rounded-full text-[#f2c377] text-xs font-cinzel hover:border-[#f2c377]/60 transition-colors"
          >
            {getLanguageLabel(selectedLanguage)}
            <svg className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showLangDropdown && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1c1b1b] border border-[#f2c377]/30 rounded-xl shadow-2xl z-[100] overflow-hidden">
              {LANGS.map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${selectedLanguage === lang ? 'bg-[#f2c377]/15 text-[#f2c377] font-semibold' : 'text-[#d2c4b3] hover:bg-[#f2c377]/10'}`}
                >
                  {getLanguageLabel(lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="pt-14 px-5">
        {/* Breadcrumb */}
        <div className="py-4 border-b border-[#4e4539]/20 mb-6">
          <p className="text-[#d2c4b3]/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">
            {selectedScripture?.name} · Chapter {selectedChapter?.chapter_number}
          </p>
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-[#f2c377] text-lg font-bold">{currentSloka?.verse_id}</h2>
            {/* Bookmark */}
            <button
              onClick={() => currentSloka && onToggleBookmark(currentSloka.verse_id || currentSloka.id)}
              className={`p-1.5 rounded-full transition-colors ${isBookmarked ? 'text-[#f2c377]' : 'text-[#d2c4b3]/40 hover:text-[#f2c377]'}`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
            >
              <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loadingVerse && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* Error */}
        {errorVerse && !loadingVerse && (
          <div className="text-center py-12">
            <p className="text-red-400 text-sm mb-3">{errorVerse}</p>
            <button
              onClick={() => currentSloka && loadVerseJson(currentSloka)}
              className="text-[#f2c377] text-sm underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Verse content */}
        {!loadingVerse && !errorVerse && verseJson && (
          <>
            {/* Sanskrit */}
            {devanagari && (
              <p className="font-sanskrit text-[#f2c377] text-2xl leading-loose text-center whitespace-pre-line mb-3">
                {devanagari}
              </p>
            )}

            {/* Transliteration */}
            {transliteration && (
              <p className="text-[#d2c4b3]/70 text-sm italic text-center leading-relaxed whitespace-pre-line mb-5">
                {transliteration}
              </p>
            )}

            <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#f2c377]/30 to-transparent mx-auto mb-6" />

            <p className="text-[#f2c377]/50 text-xs font-cinzel uppercase tracking-widest mb-3">
              {getLanguageLabel(selectedLanguage)}
            </p>

            {langData.translation && <ContentBlock label="Translation" text={langData.translation} />}
            {langData.meaning && langData.meaning !== langData.translation && (
              <ContentBlock label="Meaning" text={langData.meaning} />
            )}
            {langData.explanation && <ContentBlock label="Explanation" text={langData.explanation} />}
            {langData.example && <ContentBlock label="Example" text={langData.example} italic />}

            {!langData.translation && !langData.meaning && !langData.explanation && (
              <div className="bg-[#1c1b1b] border border-[#4e4539]/20 rounded-xl p-4 text-center">
                <p className="text-[#d2c4b3]/40 text-xs">
                  Translation not available in {getLanguageLabel(selectedLanguage)}.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Prev / Next navigation */}
      <div className="fixed bottom-20 left-0 right-0 z-40 max-w-lg mx-auto px-5">
        <div className="bg-[#1c1b1b]/90 backdrop-blur-xl border border-[#4e4539]/30 rounded-2xl px-4 py-2 flex items-center justify-between gap-3">
          <button
            onClick={() => { if (selectedSlokaIdx > 0) { setSelectedSlokaIdx(i => i - 1); setVerseJson(null); } }}
            disabled={selectedSlokaIdx === 0}
            className="flex items-center gap-1.5 text-xs font-cinzel disabled:opacity-30 text-[#d2c4b3]/70 hover:text-[#f2c377] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleShare}
            className="text-[#d2c4b3]/50 hover:text-[#f2c377] transition-colors"
            aria-label="Share verse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => { if (selectedSlokaIdx < slokas.length - 1) { setSelectedSlokaIdx(i => i + 1); setVerseJson(null); } }}
            disabled={selectedSlokaIdx === slokas.length - 1}
            className="flex items-center gap-1.5 text-xs font-cinzel disabled:opacity-30 text-[#d2c4b3]/70 hover:text-[#f2c377] transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Share toast */}
      {shareNotice && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-[#f2c377] text-[#432c00] text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50">
          {shareNotice}
        </div>
      )}
    </div>
  );
};
