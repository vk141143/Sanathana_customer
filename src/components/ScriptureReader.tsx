import React, { useState } from 'react';
import { Verse, Chapter, NavTab } from '../types';
import { playBellSound, speakText, stopSpeech } from '../utils/audioSynth';

interface ScriptureReaderProps {
  chapters: Chapter[];
  bookmarks: string[];
  onToggleBookmark: (verseId: string) => void;
  onTabChange: (tab: NavTab) => void;
}

interface LibraryItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'SCRIPTURES' | 'BOOKS' | 'AUDIO';
  image: string;
  description?: string;
  altText?: string;
}

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    subtitle: '700 VERSES',
    category: 'SCRIPTURES',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVPV06tk50phEdou5Ip1tTH6JK0ys6a6tUTsgtUsbMZUwuhqGnG27UZJKv8pLZWlX4Kd9RKnBo5W4Qheu3YLxt3QCT7tAy2BskDxnJDJbTNwo9Q76swAJD6VB9GSqryYS3tE5jhylf0iU9axjJJl-yqPKO2Ul1ByIjfGacvKPwKKfs49WQZfHBrWaEukRWnie5tmvFN620UCfzBI5746JQrTtQM0KC0qaGiRuHxzH7xso7CGmy_1bQXcFIlMOvz_3FTGJ7Dq03ugg',
    altText:
      'A cinematic, high-detail oil painting style depiction of Lord Krishna delivering the Bhagavad Gita to Arjuna on a golden chariot in the middle of the Kurukshetra battlefield. Dark, moody atmosphere with divine golden lighting emanating from Krishna, creating a reverent and ancient sacred aesthetic.',
  },
  {
    id: 'ramayana',
    title: 'Ramayana',
    subtitle: '7 KANDAS',
    category: 'SCRIPTURES',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Cck2vqDjy-XyczG0eY6u-IpVxg4dV_kKQL9G5llZc-LSQui80P6He27RKsG163-Su1E-cLE4rzJg_Acdvi2ycQk9uqVFypmKcnKAN85tHd_lttbebkiy6doBAnzMtGx2y2a6R3lA97r_7yaduDumB6nJLYonXIryKyPN58zvLf5CoIG409RCyDPoLr62Kk_RKotzPs3uyBlbUh9i8xfy2iIv480Gb5iHIG3LJ-HYt9u3m8fn6sPluH7qYpqbg9ZrGtXPMAUqShg',
    altText:
      'Ancient temple carving style artwork of Lord Rama holding his bow, set against a backdrop of the cosmic Ayodhya skyline. The lighting is ethereal and atmospheric.',
  },
  {
    id: 'mahabharata',
    title: 'Mahabharata',
    subtitle: '18 PARVAS',
    category: 'SCRIPTURES',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATpXk3qH6G_ZG2pA2HOD4qsmeVWvRofe1Xi08-fvRJ248pwOB3VlM2HOAyhKK1KH5Apx0asmupadwjg8s0IkZlXr0ueDTZwjLtFJpZm2dI0mIDGiQJpYvwKb2t-Ic8iMQUmW_ucs07B1s9iWN6-mQ3yUUDKwSA1fWtbvNIRS-R6zpoXRnSASR_XDyauWYiREKNbCwyyy0Eg5sPJ1UZqdZ9VRnCO77yfg0fGNUubo9AoeqOVVVplvxtLpg7UCp2VlKekr0zj9h6rMw',
    altText:
      'An epic cinematic shot of the Kurukshetra war artifacts, including a broken wheel and ancient weaponry partially buried in soil.',
  },
  {
    id: 'vedas',
    title: 'Vedas',
    subtitle: '4 VEDAS',
    category: 'SCRIPTURES',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpVz4Sld7clMwVs6hZwRhA5CPneEjbqfI_1mnYnlNcFAd9MJmNpw94KdJ1rcBSR26zIY2M5tMDUweS-Kj1KdZf77us0EgDfctFhNdbJDAYvMlPznEgecwo2BYLlDtcs0FzuOH1OqtffaSAU_xtGihOEEkRrVgcFyOHy4rDZUm2DqUxq-1mq63zqX2csYTykCiU3YmauAV95Cvx8mNhitRBEzFJn_j8B-mLnyvcoSxRMceg7itzGRm1JfOJYqLnyAEHC3YrXGgxTpw',
    altText:
      'Macro photography of ancient palm leaf manuscripts with Sanskrit engravings. The edges of the leaves are slightly weathered, glowing with a soft amber light from a nearby diya flame.',
  },
  {
    id: 'upanishads',
    title: 'Upanishads',
    subtitle: '108 UPANISHADS',
    category: 'SCRIPTURES',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGzwbn1cdYo6Fd573UwcsrZhv4A84C2ygZW_sdjVPFwTO6b5hwquBOEJzGbUOD2DGH4RkBPZ5ZlaXiEf-BLnDkcIPh4dCsvqbelzaxJE-cRTVIaHGbcEbcJW6JQ-FWCRNIe4OzyTROLz7mX24Ndrw0J_SW4m1HKv749szTKGQ3PH-qM_z0C_I4vqwBGZ5TZLd3WXemhlJD68ta-vkawVa9V_lkt5lXSU7hMlkHaE9UkKMTgK36yOw7mrmyKztn-ZaaYhWCcYkw9XE',
    altText:
      'A meditative scene showing a sage in deep dhyana sitting at the mouth of a Himalayan cave. The atmosphere is filled with a spiritual golden mist.',
  },
  {
    id: 'yoga-sutras',
    title: 'Yoga Sutras of Patanjali',
    subtitle: '196 SUTRAS',
    category: 'BOOKS',
    image:
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80',
    altText: 'Meditation practitioner in serene posture surrounded by golden light.',
  },
  {
    id: 'autobiography-yogi',
    title: 'Autobiography of a Yogi',
    subtitle: '48 CHAPTERS',
    category: 'BOOKS',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    altText: 'Spiritual seeker reading ancient scripture by sunset.',
  },
  {
    id: 'rigveda-audio',
    title: 'Sama Veda Sacred Chants',
    subtitle: 'AUDIO RECORDINGS',
    category: 'AUDIO',
    image:
      'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
    altText: 'Sacred singing bowls and resonant sound vibrations.',
  },
];

export const ScriptureReader: React.FC<ScriptureReaderProps> = ({
  chapters,
  bookmarks,
  onToggleBookmark,
  onTabChange,
}) => {
  // Navigation State inside Library
  const [selectedScripture, setSelectedScripture] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SCRIPTURES' | 'BOOKS' | 'AUDIO'>('ALL');
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Verse Reader State
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'sanskrit' | 'meaning' | 'explanation'>('sanskrit');
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const activeChapter = chapters[currentChapterIndex] || chapters[0];
  const activeVerse = activeChapter.verses[currentVerseIndex] || activeChapter.verses[0];
  const isBookmarked = bookmarks.includes(activeVerse.id);

  // Filtered Library Items
  const filteredItems = LIBRARY_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrevVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    } else if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setCurrentVerseIndex(chapters[currentChapterIndex - 1].verses.length - 1);
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < activeChapter.verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    } else if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentVerseIndex(0);
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playBellSound(432, 2.5);
      const textToSpeak = `${activeVerse.transliteration}. Translation: ${activeVerse.translation}`;
      speakText(textToSpeak, () => setIsPlayingAudio(false));
    }
  };

  const handleFontToggle = () => {
    if (fontSizeLevel === 'normal') setFontSizeLevel('large');
    else if (fontSizeLevel === 'large') setFontSizeLevel('xlarge');
    else setFontSizeLevel('normal');
  };

  const handleShare = () => {
    const text = `Bhagavad Gita ${activeVerse.chapterNumber}.${activeVerse.verseNumber}\n\n${activeVerse.sanskrit}\n\n"${activeVerse.translation}"\n- SANATANA App`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareNotice('Shloka copied to clipboard!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  const getSanskritFontSize = () => {
    if (fontSizeLevel === 'large') return 'text-3xl leading-relaxed';
    if (fontSizeLevel === 'xlarge') return 'text-4xl leading-loose';
    return 'text-sanskrit-lg leading-relaxed';
  };

  // If a scripture reader view is active
  if (selectedScripture) {
    const currentItemInfo = LIBRARY_ITEMS.find(item => item.id === selectedScripture);

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-[#e5e2e1] pt-20 pb-36 px-5 max-w-2xl mx-auto relative select-none">
        {/* Top App Bar with Back to Library */}
        <header className="flex justify-between items-center px-4 h-16 w-full fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#4e4539]/20 max-w-2xl mx-auto">
          <button
            onClick={() => {
              stopSpeech();
              setIsPlayingAudio(false);
              setSelectedScripture(null);
            }}
            className="flex items-center gap-2 text-[#f2c377] font-cinzel text-sm hover:opacity-80 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span>Library</span>
          </button>
          <h1 className="font-headline-lg text-lg tracking-widest text-[#f2c377] font-bold">
            {currentItemInfo?.title || 'BHAGAVAD GITA'}
          </h1>
          <button
            onClick={() => setShowNotificationToast(true)}
            className="text-[#f2c377] hover:scale-110 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </button>
        </header>

        {/* Notification Toast */}
        {showNotificationToast && (
          <div className="fixed top-20 right-6 left-6 z-[90] max-w-md mx-auto bg-[#1c1914]/95 border border-[#d4a85f]/40 p-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between text-xs text-[#d4a85f]">
            <span>🔔 Daily Shloka: "Perform your duties with equilibrium..."</span>
            <button onClick={() => setShowNotificationToast(false)} className="text-white/60">
              ✕
            </button>
          </div>
        )}

        {/* Chapter Banner Art */}
        <section className="mb-6 relative h-48 rounded-xl overflow-hidden golden-thread shadow-lg">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: `url(${
                selectedScripture === 'bhagavad-gita'
                  ? activeChapter.image
                  : currentItemInfo?.image || activeChapter.image
              })`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent z-10" />

          <div className="absolute bottom-4 left-4 z-20">
            {selectedScripture === 'bhagavad-gita' ? (
              <button
                onClick={() => setShowChapterModal(true)}
                className="text-label-sm text-[#f2c377] uppercase bg-[#1c1b1b]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#f2c377]/20 hover:bg-[#f2c377]/20 transition-all flex items-center gap-1"
              >
                Verse {activeVerse.chapterNumber}.{activeVerse.verseNumber}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>
              </button>
            ) : (
              <span className="text-label-sm text-[#f2c377] uppercase bg-[#1c1b1b]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#f2c377]/20">
                {currentItemInfo?.subtitle}
              </span>
            )}
            <h2 className="font-headline-lg text-2xl md:text-3xl text-white mt-1.5 font-garamond font-bold">
              {selectedScripture === 'bhagavad-gita'
                ? activeChapter.title
                : currentItemInfo?.title}
            </h2>
          </div>
        </section>

        {/* Navigation Sub-Tabs */}
        <nav className="flex justify-around mb-8 border-b border-[#4e4539]/30 pb-3">
          <button
            onClick={() => setActiveSubTab('sanskrit')}
            className={`text-label-sm uppercase tracking-widest pb-1 transition-all ${
              activeSubTab === 'sanskrit'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Sanskrit
          </button>
          <button
            onClick={() => setActiveSubTab('meaning')}
            className={`text-label-sm uppercase tracking-widest pb-1 transition-all ${
              activeSubTab === 'meaning'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Meaning
          </button>
          <button
            onClick={() => setActiveSubTab('explanation')}
            className={`text-label-sm uppercase tracking-widest pb-1 transition-all ${
              activeSubTab === 'explanation'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Explanation
          </button>
        </nav>

        {/* Scripture Content */}
        <div className="space-y-8">
          {/* Sanskrit Text */}
          {(activeSubTab === 'sanskrit' || activeSubTab === 'meaning') && (
            <section className="text-center px-2">
              <p
                className={`font-sanskrit text-[#f2c377] sanskrit-glow whitespace-pre-line ${getSanskritFontSize()}`}
              >
                {activeVerse.sanskrit}
              </p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#f2c377]/40 to-transparent mx-auto mt-4" />
            </section>
          )}

          {/* Transliteration */}
          {(activeSubTab === 'sanskrit' || activeSubTab === 'meaning') && (
            <section className="italic text-[#d2c4b3]/80 text-center font-garamond text-lg md:text-xl px-4 leading-relaxed whitespace-pre-line">
              {activeVerse.transliteration}
            </section>
          )}

          {/* Translation Card */}
          {(activeSubTab === 'meaning' || activeSubTab === 'sanskrit') && (
            <section className="luminous-layer p-6 rounded-xl border border-[#f2c377]/15 relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#f2c377] shadow-[0_0_8px_#f2c377]" />
                <h3 className="font-label-sm text-xs uppercase text-[#f2c377] tracking-widest">
                  Translation
                </h3>
              </div>
              <p className="font-garamond text-xl md:text-2xl leading-relaxed text-[#e5e2e1] opacity-95">
                {activeVerse.translation}
              </p>
            </section>
          )}

          {/* Explanation Tab Content */}
          {activeSubTab === 'explanation' && (
            <section className="luminous-layer p-6 rounded-xl border border-[#f2c377]/15 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f2c377] shadow-[0_0_8px_#f2c377]" />
                <h3 className="font-label-sm text-xs uppercase text-[#f2c377] tracking-widest">
                  Vedantic Commentary
                </h3>
              </div>
              <p className="font-body-lg text-[#e5e2e1]/90 leading-relaxed font-garamond text-xl">
                {activeVerse.explanation}
              </p>
            </section>
          )}

          {/* Notification Toast */}
          {shareNotice && (
            <div className="bg-[#f2c377] text-[#432c00] text-xs font-bold font-label-sm py-2 px-4 rounded-full text-center transition-all animate-bounce">
              {shareNotice}
            </div>
          )}

          {/* Actions Row (Listen, Save, Share, Font) */}
          <div className="flex justify-center items-center gap-6 pt-4">
            {/* Listen */}
            <button
              onClick={handleToggleAudio}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                  isPlayingAudio
                    ? 'bg-[#f2c377] text-[#432c00] border-[#f2c377] gold-glow animate-pulse'
                    : 'bg-[#f2c377]/10 border-[#f2c377]/20 text-[#f2c377] group-hover:bg-[#f2c377]/20'
                }`}
              >
                {isPlayingAudio
                  ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                }
              </div>
              <span className="text-[10px] uppercase font-label-sm text-[#d2c4b3] tracking-widest">
                {isPlayingAudio ? 'Pause' : 'Listen'}
              </span>
            </button>

            {/* Save / Bookmark */}
            <button
              onClick={() => onToggleBookmark(activeVerse.id)}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                  isBookmarked
                    ? 'bg-[#f2c377]/20 border-[#f2c377] text-[#f2c377]'
                    : 'bg-[#201f1f] border-[#4e4539]/30 text-[#d2c4b3] group-hover:border-[#f2c377]/40'
                }`}
              >
                <svg className="w-6 h-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </div>
              <span className="text-[10px] uppercase font-label-sm text-[#d2c4b3] tracking-widest">
                {isBookmarked ? 'Saved' : 'Save'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[#201f1f] border border-[#4e4539]/30 flex items-center justify-center group-hover:border-[#f2c377]/40 transition-all text-[#d2c4b3] group-hover:text-[#f2c377]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              </div>
              <span className="text-[10px] uppercase font-label-sm text-[#d2c4b3] tracking-widest">
                Share
              </span>
            </button>

            {/* Font Toggle */}
            <button
              onClick={handleFontToggle}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[#201f1f] border border-[#4e4539]/30 flex items-center justify-center group-hover:border-[#f2c377]/40 transition-all text-[#d2c4b3] group-hover:text-[#f2c377]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>
              </div>
              <span className="text-[10px] uppercase font-label-sm text-[#d2c4b3] tracking-widest">
                Font
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Verse Navigation Shell */}
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-[#0e0e0e]/85 backdrop-blur-2xl px-6 py-2 border-t border-[#4e4539]/20 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevVerse}
              className="flex items-center gap-1 text-[#d2c4b3]/70 hover:text-[#f2c377] transition-colors py-1 text-xs uppercase font-label-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Prev
            </button>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#353534]/40 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#f2c377] h-full shadow-[0_0_8px_#f2c377] transition-all duration-300"
                  style={{
                    width: `${((currentVerseIndex + 1) / activeChapter.verses.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-label-sm text-[#d2c4b3]/60 tracking-wider">
                {currentVerseIndex + 1} OF {activeChapter.verses.length} VERSES
              </span>
            </div>

            <button
              onClick={handleNextVerse}
              className="flex items-center gap-1 text-[#e5e2e1] hover:text-[#f2c377] transition-colors py-1 text-xs uppercase font-label-sm"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Chapter Selection Modal */}
        {showChapterModal && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-cinzel text-xl text-[#f2c377]">Select Chapter</h3>
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="text-[#d2c4b3] hover:text-[#f2c377]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-3">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.number}
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setCurrentVerseIndex(0);
                      setShowChapterModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      idx === currentChapterIndex
                        ? 'border-[#f2c377] bg-[#f2c377]/10 text-[#f2c377]'
                        : 'border-[#4e4539]/30 bg-[#201f1f] text-[#e5e2e1] hover:border-[#f2c377]/40'
                    }`}
                  >
                    <div>
                      <div className="font-garamond text-lg font-bold">{ch.title}</div>
                      <div className="text-xs text-[#d2c4b3]/70">{ch.subTitle}</div>
                    </div>
                    <span className="text-xs font-label-sm text-[#f2c377]">
                      {ch.totalVerses} Verses
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Main Library View (Matches requested HTML specification)
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-body-md overflow-x-hidden pb-32 max-w-md mx-auto relative select-none">
      {/* Top App Bar */}
      <header className="flex justify-between items-center px-5 h-16 w-full fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-xl bg-gradient-to-b from-[#0e0e0e] to-transparent max-w-md mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMenuModal(true)}
            className="text-[#f2c377] cursor-pointer hover:scale-110 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 className="font-headline-lg text-headline-lg tracking-widest text-primary font-bold">
            SANATANA
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowNotificationToast(true);
              setTimeout(() => setShowNotificationToast(false), 3000);
            }}
            className="text-[#f2c377] cursor-pointer hover:scale-110 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {showNotificationToast && (
        <div className="fixed top-20 right-6 left-6 z-50 max-w-md mx-auto bg-[#1c1914]/95 border border-[#f2c377]/30 p-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between text-xs text-[#f2c377]">
          <span>🔔 Daily Wisdom: Bhagavad Gita Chapter 2 Verse 47 available.</span>
          <button onClick={() => setShowNotificationToast(false)} className="text-white/60">
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 px-5 max-w-md mx-auto">
        {/* Search Section */}
        <section className="mb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-4 font-bold">
            Library
          </h2>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[#d2c4b3]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1b1b]/50 border-b border-[#f2c377]/30 py-4 pl-12 pr-4 focus:border-[#f2c377] focus:ring-0 transition-all text-[#e5e2e1] placeholder-[#d2c4b3]/50 font-body-md rounded-t-xl outline-none"
              placeholder="Search scriptures, books, audio..."
              type="text"
            />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f2c377]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
          </div>
        </section>

        {/* Category Filter */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
          {(['ALL', 'SCRIPTURES', 'BOOKS', 'AUDIO'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full glass-card font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-all ${
                selectedCategory === cat
                  ? 'border-[#f2c377] text-[#f2c377] shadow-[0_0_12px_rgba(242,195,119,0.2)]'
                  : 'border-[#4e4539]/20 text-[#d2c4b3] hover:border-[#f2c377]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Scripture List */}
        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-[#d2c4b3]/60 italic font-garamond text-lg">
              No spiritual texts found matching "{searchQuery}"
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedScripture(item.id)}
                className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#353534]/10 group transition-all duration-300 active:scale-[0.98]"
              >
                <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border border-[#f2c377]/20">
                  <img
                    className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                    data-alt={item.altText}
                    src={item.image}
                    alt={item.title}
                  />
                  <div className="absolute inset-0 stone-texture" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-headline-md text-[#f2c377] text-xl font-bold">
                    {item.title}
                  </h3>
                  <p className="font-label-sm text-xs text-[#d2c4b3] opacity-70 tracking-wider">
                    {item.subtitle}
                  </p>
                </div>
                <svg className="w-5 h-5 text-[#f2c377] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Menu Drawer Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-6 border-b border-[#f2c377]/20 pb-3">
              <h3 className="font-headline-lg text-2xl text-[#f2c377]">SANATANA Menu</h3>
              <button
                onClick={() => setShowMenuModal(false)}
                className="text-[#d2c4b3] hover:text-[#f2c377]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 font-cinzel">
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  onTabChange('home');
                }}
                className="w-full text-left p-3 rounded-xl bg-[#201f1f] border border-[#f2c377]/20 text-[#f2c377] flex items-center gap-3 hover:bg-[#f2c377]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
                <span>Home Sanctuary</span>
              </button>
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  onTabChange('sadhana');
                }}
                className="w-full text-left p-3 rounded-xl bg-[#201f1f] border border-[#f2c377]/20 text-[#f2c377] flex items-center gap-3 hover:bg-[#f2c377]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v4M12 11L7 14l-2-1M12 11l5 3 2-1M7 14Q9 18 12 18q3 0 5-4"/></svg>
                <span>Daily Sadhana</span>
              </button>
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  onTabChange('meditation');
                }}
                className="w-full text-left p-3 rounded-xl bg-[#201f1f] border border-[#f2c377]/20 text-[#f2c377] flex items-center gap-3 hover:bg-[#f2c377]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 6 5 10c0 3 2 5.5 5 6.5V20h4v-3.5c3-1 5-3.5 5-6.5 0-4-3-8-7-8z"/></svg>
                <span>Dhyana Meditation</span>
              </button>
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  onTabChange('explore');
                }}
                className="w-full text-left p-3 rounded-xl bg-[#201f1f] border border-[#f2c377]/20 text-[#f2c377] flex items-center gap-3 hover:bg-[#f2c377]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
                <span>Explore Temples & Wisdom</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
