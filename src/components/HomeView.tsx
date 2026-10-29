import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, NavTab } from '../types';
import { supabase } from '../lib/supabase';
import { DevotionalAudioView } from './audio/DevotionalAudioView';
import { InnerFlameGateway } from './InnerFlameGateway';
import { ChantHomeSection } from './chant/ChantHomeSection';

interface ContinueReadingInfo {
  scriptureName: string;
  chapterTitle: string;
  chapterNumber: number;
  verseNumber: number;
  slokaCount: number;
  coverImageUrl: string;
}

interface HomeViewProps {
  user: UserProfile;
  streakDays: number;
  onTabChange: (tab: NavTab) => void;
  onOpenGratitudeModal: () => void;
  onOpenChantingModal: () => void;
  userEmail?: string;
  readingProgress?: { scripture_id: string; chapter_id: string; verse_number: number; language: string } | null;
}

interface DailyQuote {
  title: string;
  sanskrit: string;
  source: string;
}

const SEEN_KEY = 'sanatana_seen_notif_ids';
const getSeenIds = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
};

// ── Main HomeView ─────────────────────────────────────────────────────────────
export const HomeView: React.FC<HomeViewProps> = ({
  user,
  streakDays,
  onTabChange,
  onOpenGratitudeModal,
  onOpenChantingModal,
  userEmail,
  readingProgress,
}) => {
  const [showAudio, setShowAudio] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [continueReading, setContinueReading] = useState<ContinueReadingInfo | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [heroBannerImage, setHeroBannerImage] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const currentQuoteTitle = useRef<string | null>(null);

  const fetchQuote = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: scheduled } = await supabase
      .from('quote_schedules')
      .select('title, sloka, source')
      .eq('status', 'published')
      .eq('scheduled_date', today)
      .order('scheduled_datetime', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scheduled) {
      if (currentQuoteTitle.current !== scheduled.title) {
        currentQuoteTitle.current = scheduled.title;
        setDailyQuote({ title: scheduled.title, sanskrit: scheduled.sloka, source: scheduled.source ?? '' });
      }
      setQuoteLoading(false);
      return;
    }
    const { data: quoteData } = await supabase
      .from('daily_quotes')
      .select('title, sanskrit, source')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (quoteData && currentQuoteTitle.current !== quoteData.title) {
      currentQuoteTitle.current = quoteData.title;
      setDailyQuote(quoteData);
    }
    setQuoteLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async (userId: string | null) => {
    let query = supabase.from('notifications').select('id');
    if (userId) {
      query = query.or(`target_type.eq.all,target_user_ids.cs.{"${userId}"}`);
    } else {
      query = query.eq('target_type', 'all');
    }
    const { data } = await query;
    if (!data) return;
    const seen = getSeenIds();
    setUnreadCount(data.filter((n: { id: string }) => !seen.has(n.id)).length);
  }, []);

  useEffect(() => {
    // Fetch banner image from Supabase
    supabase
      .from('banner_images')
      .select('image_url')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data?.image_url) setHeroBannerImage(data.image_url); });

    fetchQuote();
    (async () => {
      let userId: string | null = null;
      if (userEmail) {
        const { data } = await supabase.from('users').select('id').eq('email', userEmail).maybeSingle();
        userId = data?.id ?? null;
        userIdRef.current = userId;
      }
      await fetchUnreadCount(userId);
    })();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchQuote(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchQuote, fetchUnreadCount, userEmail]);

  useEffect(() => {
    const channel = supabase
      .channel('home-notif-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const row = payload.new as { id: string; target_type: string; target_user_ids: string[] };
        const userId = userIdRef.current;
        const isForMe = row.target_type === 'all' || (userId && row.target_user_ids?.includes(userId));
        if (isForMe) {
          const seen = getSeenIds();
          if (!seen.has(row.id)) setUnreadCount(c => c + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!readingProgress?.scripture_id || !readingProgress?.chapter_id) {
      setContinueReading(null);
      return;
    }
    Promise.all([
      supabase.from('scriptures').select('name, cover_image_url').eq('id', readingProgress.scripture_id).maybeSingle(),
      supabase.from('chapters').select('title, chapter_number, sloka_count').eq('id', readingProgress.chapter_id).maybeSingle(),
    ]).then(([sRes, cRes]) => {
      if (sRes.data && cRes.data) {
        setContinueReading({
          scriptureName: sRes.data.name,
          chapterTitle: cRes.data.title,
          chapterNumber: cRes.data.chapter_number,
          verseNumber: readingProgress.verse_number,
          slokaCount: cRes.data.sloka_count || 1,
          coverImageUrl: sRes.data.cover_image_url || '',
        });
      }
    });
  }, [readingProgress?.scripture_id, readingProgress?.chapter_id, readingProgress?.verse_number]);

  const handleLotusAction = (id: string) => {
    switch (id) {
      case 'meditate': onTabChange('meditation'); break;
      case 'chant': onOpenChantingModal(); break;
      case 'gratitude': onOpenGratitudeModal(); break;
      case 'read': onTabChange('library'); break;
      case 'music': setShowAudio(true); break;
      case 'sadhana': onTabChange('sadhana'); break;
    }
  };

  return (
    <div className="min-h-screen bg-[#080604] text-[#e5e7eb] font-garamond pb-28 max-w-md mx-auto relative select-none overflow-x-hidden">
      {showAudio && <DevotionalAudioView onBack={() => setShowAudio(false)} />}

      {/* ── KRISHNA HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '62vh', minHeight: 380, maxHeight: 560 }}
      >
        {/* Hero banner from Supabase */}
        <div className="absolute inset-0">
          {heroBannerImage ? (
            <img
              src={heroBannerImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1a0e06 0%, #080604 100%)' }} />
          )}
        </div>

        {/* Cinematic vignette edges */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(4,3,2,0.55) 100%)',
        }} />
        {/* Left dark edge */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(4,3,2,0.7), transparent)' }} />
        {/* Right dark edge */}
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(4,3,2,0.7), transparent)' }} />
        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,6,4,0.92) 80%, #080604)' }} />
        {/* Top fade for header */}
        <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(4,3,2,0.75), transparent)' }} />

        {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-5 pb-3">
          {/* Om symbol */}
          <button
            onClick={() => onTabChange('profile')}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <img
              src="/logo.png"
              alt="Sanatana"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                borderRadius: '8px',
                filter: 'drop-shadow(0 0 8px rgba(242,195,119,0.5))',
                
              }}
            />
          </button>

          {/* Center title */}
          <div className="flex flex-col items-center">
            <span
              className="font-cinzel font-bold tracking-[0.22em]"
              style={{
                fontSize: 15,
                background: 'linear-gradient(135deg, #f2c377 0%, #d4a85f 60%, #b98d28 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 6px rgba(212,168,95,0.4))',
              }}
            >
              SANATANA
            </span>
            <span className="text-[#a6834d]/70 tracking-widest" style={{ fontSize: 8, letterSpacing: '0.18em' }}>
              YOUR JOURNEY WITHIN
            </span>
          </div>

          {/* Notification */}
          <button
            onClick={() => {
              (async () => {
                let userId = userIdRef.current;
                if (!userId && userEmail) {
                  const { data } = await supabase.from('users').select('id').eq('email', userEmail).maybeSingle();
                  userId = data?.id ?? null;
                }
                let query = supabase.from('notifications').select('id');
                if (userId) {
                  query = query.or(`target_type.eq.all,target_user_ids.cs.{"${userId}"}`);
                } else {
                  query = query.eq('target_type', 'all');
                }
                const { data } = await query;
                if (data) {
                  const seen = getSeenIds();
                  data.forEach((n: { id: string }) => seen.add(n.id));
                  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
                  setUnreadCount(0);
                }
              })();
              onTabChange('notifications');
            }}
            className="relative p-1 active:scale-90 transition-transform"
            style={{ color: '#d4a85f' }}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: 9, padding: '0 3px' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        <InnerFlameGateway onAction={handleLotusAction} />
        <ChantHomeSection onOpen={onOpenChantingModal} />
      </section>

      {/* ── TODAY'S VERSE ─────────────────────────────────────────────────── */}
      <section className="px-5 mt-2">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,18,10,0.95) 0%, rgba(14,10,6,0.98) 100%)',
            border: '1px solid rgba(212,168,95,0.12)',
            boxShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Gold left accent */}
          <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
            style={{ background: 'linear-gradient(to bottom, transparent, #d4a85f, transparent)' }} />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-cinzel text-[#a6834d] tracking-widest" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                TODAY'S VERSE
              </span>
              <button
                onClick={() => setShowExplanationModal(true)}
                className="active:scale-90 transition-transform"
                style={{ color: 'rgba(212,168,95,0.5)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {quoteLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-7 w-full rounded bg-[#d4a85f]/10" />
                <div className="h-7 w-4/5 mx-auto rounded bg-[#d4a85f]/10" />
                <div className="h-3 w-1/3 rounded bg-white/5 mt-4" />
              </div>
            ) : (
              <>
                <p
                  className="text-center text-white/90 leading-loose mb-1 whitespace-pre-line"
                  style={{
                    fontFamily: "'Noto Serif Devanagari', serif",
                    fontSize: 20,
                    textShadow: '0 0 20px rgba(212,168,95,0.15)',
                  }}
                >
                  {dailyQuote?.sanskrit ?? ''}
                </p>
                <div className="flex items-center justify-center gap-3 mt-4 mb-1">
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,95,0.3))' }} />
                  <span className="text-[#a6834d]/70 font-cinzel" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
                    {dailyQuote?.source || ''}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,95,0.3))' }} />
                </div>
                <button
                  onClick={() => setShowExplanationModal(true)}
                  className="w-full flex items-center justify-center gap-2 mt-4 group"
                  style={{ color: 'rgba(212,168,95,0.7)', fontSize: 10, letterSpacing: '0.16em' }}
                >
                  <span className="font-cinzel group-hover:text-[#d4a85f] transition-colors">READ THE WISDOM</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── SADHANA PROGRESS ──────────────────────────────────────────────── */}
      <section className="px-5 mt-5">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(22,15,8,0.97) 0%, rgba(12,8,4,0.99) 100%)',
            border: '1px solid rgba(212,168,95,0.1)',
          }}
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-cinzel text-[#a6834d] tracking-widest" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                YOUR JOURNEY
              </span>
              <button
                onClick={() => onTabChange('sadhana')}
                className="font-cinzel text-[#d4a85f] flex items-center gap-1 active:scale-95 transition-transform"
                style={{ fontSize: 9, letterSpacing: '0.14em' }}
              >
                CONTINUE SADHANA
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-cinzel text-[#d4a85f] font-bold" style={{ fontSize: 22 }}>
                  {streakDays > 0 ? `${Math.min(streakDays * 4, 100)}%` : '0%'}
                </span>
                <span className="text-white/30" style={{ fontSize: 10 }}>COMPLETE</span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(streakDays * 4, 100)}%`,
                    background: 'linear-gradient(to right, #b98d28, #f2c377)',
                    boxShadow: '0 0 8px rgba(212,168,95,0.4)',
                  }}
                />
              </div>
            </div>

            {/* Practice items */}
            <div className="space-y-2.5">
              {[
                { label: 'Meditation', done: streakDays > 0 },
                { label: 'Japa', done: streakDays > 1 },
                { label: 'Scripture', done: !!readingProgress },
                { label: 'Gratitude', done: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-white/50" style={{ fontSize: 12 }}>{item.label}</span>
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 18,
                      height: 18,
                      background: item.done ? 'rgba(212,168,95,0.15)' : 'transparent',
                      border: item.done ? '1px solid rgba(212,168,95,0.5)' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {item.done && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="#d4a85f" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTINUE READING ──────────────────────────────────────────────── */}
      {continueReading && (
        <section className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-cinzel text-white/40 tracking-widest" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
              CONTINUE READING
            </span>
            <button onClick={() => onTabChange('library')} className="text-[#d4a85f]/60 font-cinzel" style={{ fontSize: 9 }}>
              SEE ALL →
            </button>
          </div>
          <div
            onClick={() => onTabChange('library')}
            className="flex overflow-hidden rounded-xl cursor-pointer active:scale-[0.99] transition-transform"
            style={{
              height: 88,
              background: 'rgba(18,12,6,0.95)',
              border: '1px solid rgba(212,168,95,0.1)',
            }}
          >
            <div className="w-24 relative flex-shrink-0">
              {continueReading.coverImageUrl
                ? <img src={continueReading.coverImageUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: 'rgba(30,20,10,1)' }} />
              }
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, rgba(18,12,6,0.6))' }} />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
              <div>
                <p className="font-cinzel text-white/90 font-bold leading-tight" style={{ fontSize: 12 }}>
                  {continueReading.scriptureName}
                </p>
                <p className="text-white/40 mt-0.5" style={{ fontSize: 10 }}>
                  Ch. {continueReading.chapterNumber} · {continueReading.chapterTitle}
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/30" style={{ fontSize: 9 }}>
                    {Math.round((continueReading.verseNumber / continueReading.slokaCount) * 100)}%
                  </span>
                  <span className="font-cinzel text-[#d4a85f]" style={{ fontSize: 9 }}>RESUME →</span>
                </div>
                <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((continueReading.verseNumber / continueReading.slokaCount) * 100)}%`,
                      background: 'linear-gradient(to right, #b98d28, #f2c377)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DISCOVER ──────────────────────────────────────────────────────── */}
      <section className="mt-8 pb-4">
        <div className="px-5 mb-4">
          <span className="font-cinzel text-white/40 tracking-widest" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
            DISCOVER
          </span>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
          {[
            {
              label: 'SACRED MUSIC',
              sub: 'Divine melodies',
              action: () => setShowAudio(true),
              color: 'from-[#1a0e06] to-[#0a0604]',
              accent: '#d4a85f',
            },
            {
              label: 'FESTIVALS',
              sub: 'Upcoming sacred days',
              action: () => onTabChange('festivals'),
              color: 'from-[#0e1206] to-[#060a04]',
              accent: '#8fba5a',
            },
            {
              label: 'HEALING',
              sub: 'Inner journey',
              action: () => onTabChange('explore'),
              color: 'from-[#0e0612] to-[#060408]',
              accent: '#a07ad4',
            },
            {
              label: 'LIBRARY',
              sub: 'Sacred wisdom',
              action: () => onTabChange('library'),
              color: 'from-[#120a06] to-[#080604]',
              accent: '#d4a85f',
            },
          ].map(card => (
            <button
              key={card.label}
              type="button"
              onClick={card.action}
              className={`flex-shrink-0 rounded-2xl bg-gradient-to-br ${card.color} flex flex-col justify-end p-4 active:scale-95 transition-transform`}
              style={{
                width: 140,
                height: 100,
                border: `1px solid ${card.accent}18`,
                boxShadow: `0 2px 16px rgba(0,0,0,0.4)`,
              }}
            >
              <div className="h-px w-8 mb-2 rounded-full" style={{ background: card.accent, opacity: 0.5 }} />
              <p className="font-cinzel font-bold text-left leading-tight" style={{ fontSize: 10, color: card.accent, letterSpacing: '0.1em' }}>
                {card.label}
              </p>
              <p className="text-left mt-0.5" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                {card.sub}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── DAILY STREAK ──────────────────────────────────────────────────── */}
      <section className="px-5 mt-4 mb-4">
        <div
          onClick={() => onTabChange('sadhana')}
          className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer active:scale-[0.99] transition-transform"
          style={{
            background: 'rgba(14,10,6,0.95)',
            border: '1px solid rgba(212,168,95,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, background: 'rgba(212,168,95,0.08)', border: '1px solid rgba(212,168,95,0.2)' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#d4a85f' }}>
                <path d="M12 2C12 2 17 7 17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11C7 7 12 2 12 2Z"/>
              </svg>
            </div>
            <div>
              <p className="font-cinzel text-[#d4a85f] font-bold" style={{ fontSize: 12 }}>Daily Streak</p>
              <p className="text-white/40" style={{ fontSize: 10 }}>{streakDays} Days Pure</p>
            </div>
          </div>
          <span className="font-cinzel text-[#a6834d]" style={{ fontSize: 9, letterSpacing: '0.12em' }}>VIEW →</span>
        </div>
      </section>

      {/* ── EXPLANATION MODAL ─────────────────────────────────────────────── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 relative"
            style={{ background: 'rgba(18,12,6,0.98)', border: '1px solid rgba(212,168,95,0.2)' }}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <span className="font-cinzel text-[#a6834d] tracking-widest" style={{ fontSize: 9 }}>
                  {dailyQuote?.source || 'DAILY VERSE'}
                </span>
                <h3 className="font-cinzel text-[#d4a85f] font-bold mt-1" style={{ fontSize: 16 }}>
                  {dailyQuote?.title || ''}
                </h3>
              </div>
              <button onClick={() => setShowExplanationModal(false)} className="text-[#a6834d] hover:text-white text-lg leading-none">✕</button>
            </div>
            <p className="text-center text-white/85 leading-loose mb-4 whitespace-pre-line"
              style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 18 }}>
              {dailyQuote?.sanskrit || ''}
            </p>
            <p className="text-[#a6834d]/70 text-sm italic mb-5">
              {dailyQuote?.source ? `— ${dailyQuote.source}` : ''}
            </p>
            <button
              onClick={() => { setShowExplanationModal(false); onTabChange('library'); }}
              className="w-full py-3 rounded-xl font-cinzel font-bold text-[#0d0804] tracking-widest"
              style={{ fontSize: 10, background: 'linear-gradient(135deg, #d4a85f, #b98d28)' }}
            >
              OPEN FULL CHAPTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
