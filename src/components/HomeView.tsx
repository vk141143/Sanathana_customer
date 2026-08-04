import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, NavTab } from '../types';
import { supabase } from '../lib/supabase';
import { DevotionalAudioView } from './audio/DevotionalAudioView';

interface HomeViewProps {
  user: UserProfile;
  streakDays: number;
  onTabChange: (tab: NavTab) => void;
  onOpenGratitudeModal: () => void;
  onOpenChantingModal: () => void;
}

interface BannerImage {
  image_url: string;
}

interface DailyQuote {
  title: string;
  sanskrit: string;
  source: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  streakDays,
  onTabChange,
  onOpenGratitudeModal,
  onOpenChantingModal,
}) => {
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [bannerImg, setBannerImg] = useState<BannerImage | null>(null);
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
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

  useEffect(() => {
    const fetchBanner = async () => {
      const { data: imgData } = await supabase
        .from('banner_images')
        .select('image_url')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (imgData) setBannerImg(imgData);
    };
    fetchBanner();
    fetchQuote();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchQuote();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchQuote]);

  const heroBannerImage = bannerImg?.image_url || null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e5e7eb] font-garamond pb-28 max-w-md mx-auto relative select-none">
      {/* Devotional Audio overlay */}
      {showAudio && <DevotionalAudioView onBack={() => setShowAudio(false)} />}
      {/* Hero Section */}
      <section className="relative w-full min-h-[65vh] overflow-hidden">
        {/* Background banner from Supabase */}
        {heroBannerImage && (
          <img
            alt="Morning Banner"
            className="absolute top-0 right-0 h-full w-full object-cover object-right"
            src={heroBannerImage}
          />
        )}

        {/* Hero Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/95 via-[#0d0d0d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0d0d]" />

        {/* Status Bar Mock Area */}
        {/* <div className="relative z-10 flex justify-between items-center px-6 pt-4 text-white/90 text-sm font-sans">
          <span className="font-medium text-xs tracking-wider">9:41</span>
          <div className="flex items-center space-x-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v18h2V3z" />
            </svg>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 6H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
        </div> */}

        {/* Header Controls */}
        <div className="relative z-10 flex justify-between items-center px-6 mt-4">
          <button
            onClick={() => onTabChange('profile')}
            className="p-2 hover:scale-110 active:scale-95 transition-transform"
            title="Profile Menu"
          >
            <img
              src="/lotus.png"
              alt="Menu"
              className="h-9 w-9 object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(244, 174, 69, 0.5))' }}
            />
          </button>
          <button
            onClick={() => {
              setShowNotificationToast(true);
              setTimeout(() => setShowNotificationToast(false), 3000);
            }}
            className="p-2 text-[#d4a85f] relative hover:scale-110 active:scale-95 transition-transform"
            title="Notifications"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Toast Notification */}
        {showNotificationToast && (
          <div className="absolute top-20 right-6 left-6 z-30 bg-[#1c1914]/95 border border-[#d4a85f]/30 p-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between text-xs text-[#d4a85f]">
            <span>🔔 Morning Sadhana reminder: Time for morning Japa chant.</span>
            <button onClick={() => setShowNotificationToast(false)} className="text-white/60">✕</button>
          </div>
        )}

        {/* Welcome Message */}
        <div className="relative z-10 px-6 mt-8">
          <h1 className="text-3xl font-cinzel text-[#d4a85f] mb-2 font-bold drop-shadow">
            Good Morning, {user.name || 'Vishnu'}
          </h1>
        </div>

        {/* Bhagavad Gita Verses — from quote_schedules / daily_quotes */}
        <div className="relative z-10 px-6 mt-6">
          <div className="bg-[#1e1914]/80 backdrop-blur-md rounded-2xl p-5 border border-[#d4a85f]/20 border-l-4 border-l-[#d4a85f] shadow-2xl">
            {quoteLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-2/3 bg-[#d4a85f]/20 rounded" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-5/6 bg-white/10 rounded" />
                <div className="h-3 w-1/3 bg-[#a6834d]/20 rounded" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-cinzel text-[#d4a85f] text-lg font-bold">
                    {dailyQuote?.title || 'Daily Verse'}
                  </h2>
                  <svg className="h-5 w-5 text-[#d4a85f]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <p className="text-xl text-center text-white/90 mb-3 font-garamond italic leading-relaxed tracking-wide whitespace-pre-line">
                  {dailyQuote?.sanskrit ?? ''}
                </p>
                <p className="text-left text-[#a6834d] text-sm italic mb-4">
                  {dailyQuote?.source ? `— ${dailyQuote.source}` : ''}
                </p>
                <button
                  onClick={() => setShowExplanationModal(true)}
                  className={`w-full flex items-center justify-center space-x-2 text-[#d4a85f] font-cinzel text-sm group hover:text-white transition-colors ${
                    !dailyQuote ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <span>Read Explanation</span>
                  <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Continue Reading Section */}
      <section className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-cinzel text-white/80 text-lg uppercase tracking-wider font-bold">
            Continue Reading
          </h3>
          <button
            onClick={() => onTabChange('library')}
            className="text-[#d4a85f] text-sm font-cinzel flex items-center space-x-1 hover:underline"
          >
            <span>See All</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div
          onClick={() => onTabChange('library')}
          className="bg-[#1e1914]/60 backdrop-blur-md border border-[#d4a85f]/15 rounded-xl overflow-hidden flex h-32 cursor-pointer hover:border-[#d4a85f]/40 transition-all active:scale-[0.99]"
        >
          {/* Thumbnail area */}
          <div className="w-1/3 relative">
            {heroBannerImage ? (
              <img
                alt="Chapter Thumbnail"
                className="h-full w-full object-cover"
                src={heroBannerImage}
              />
            ) : (
              <div className="h-full w-full bg-[#1c1914]" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content area */}
          <div className="w-2/3 p-4 flex flex-col justify-between">
            <div>
              <h4 className="font-cinzel text-white text-lg font-bold">
                Bhagavad Gita
              </h4>
              <p className="text-white/60 text-sm">
                Chapter 2 – Sankhya Yoga
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">56%</span>
                <span className="text-[#d4a85f] text-[10px] font-cinzel flex items-center font-bold">
                  SEE ALL{' '}
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#d4a85f] h-full rounded-full" style={{ width: '56%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Sadhana Section */}
      <section className="px-6 mt-10">
        <h3 className="font-cinzel text-white/80 text-lg uppercase tracking-wider mb-6 font-bold">
          Today's Sadhana
        </h3>
        {/* Row 1 — 3 icons */}
        <div className="grid grid-cols-3 gap-y-6 mb-6">
          {/* Meditate */}
          <div
            onClick={() => onTabChange('meditation')}
            className="flex flex-col items-center space-y-3 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border border-[#d4a85f]/30 flex items-center justify-center bg-[#1c1914]/70 group-hover:bg-[#d4a85f]/20 group-hover:border-[#d4a85f] transition-all shadow-lg">
              <svg className="w-8 h-8 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A3,3 0 0,0 9,5A3,3 0 0,0 12,8A3,3 0 0,0 15,5A3,3 0 0,0 12,2M12,14C9.24,14 7,16.24 7,19H17C17,16.24 14.76,14 12,14M11,9H13V13H11V9M5,15H7V18H5V15M17,15H19V18H17V15Z" />
              </svg>
            </div>
            <span className="text-[#a6834d] text-xs font-cinzel tracking-wider group-hover:text-[#d4a85f]">Meditate</span>
          </div>

          {/* Chant */}
          <div
            onClick={onOpenChantingModal}
            className="flex flex-col items-center space-y-3 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border border-[#d4a85f]/30 flex items-center justify-center bg-[#1c1914]/70 group-hover:bg-[#d4a85f]/20 group-hover:border-[#d4a85f] transition-all shadow-lg">
              <svg className="w-8 h-8 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.83,3.41C11.83,2.41 10.17,2.41 9.17,3.41L5,7.59L6.41,9L10.59,4.83L13.41,7.66L12,9.07L13.41,10.5L16.24,7.66L19,10.41L20.41,9L12.83,3.41M5,11.59L12.59,19.17C13.59,20.17 15.25,20.17 16.25,19.17L20.41,15L19,13.59L15.17,17.41L12.34,14.59L13.76,13.17L12.34,11.76L9.5,14.59L6.76,11.83L5.34,13.24L5,11.59Z" />
              </svg>
            </div>
            <span className="text-[#a6834d] text-xs font-cinzel tracking-wider group-hover:text-[#d4a85f]">Chant</span>
          </div>

          {/* Gratitude */}
          <div
            onClick={onOpenGratitudeModal}
            className="flex flex-col items-center space-y-3 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border border-[#d4a85f]/30 flex items-center justify-center bg-[#1c1914]/70 group-hover:bg-[#d4a85f]/20 group-hover:border-[#d4a85f] transition-all shadow-lg">
              <svg className="w-8 h-8 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
              </svg>
            </div>
            <span className="text-[#a6834d] text-xs font-cinzel tracking-wider group-hover:text-[#d4a85f]">Gratitude</span>
          </div>
        </div>

        {/* Row 2 — 2 icons centered */}
        <div className="flex justify-center gap-16">
          {/* Read */}
          <div
            onClick={() => onTabChange('library')}
            className="flex flex-col items-center space-y-3 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border border-[#d4a85f]/30 flex items-center justify-center bg-[#1c1914]/70 group-hover:bg-[#d4a85f]/20 group-hover:border-[#d4a85f] transition-all shadow-lg">
              <svg className="w-8 h-8 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,2H5C3.89,2 3,2.89 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4C21,2.89 20.11,2 19,2M19,20H5V4H7V11L9.5,9.5L12,11V4H19V20Z" />
              </svg>
            </div>
            <span className="text-[#a6834d] text-xs font-cinzel tracking-wider group-hover:text-[#d4a85f]">Read</span>
          </div>

          {/* Music */}
          <div
            onClick={() => setShowAudio(true)}
            className="flex flex-col items-center space-y-3 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border border-[#d4a85f]/30 flex items-center justify-center bg-[#1c1914]/70 group-hover:bg-[#d4a85f]/20 group-hover:border-[#d4a85f] transition-all shadow-lg">
              <svg className="w-8 h-8 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
              </svg>
            </div>
            <span className="text-[#a6834d] text-xs font-cinzel tracking-wider group-hover:text-[#d4a85f]">Music</span>
          </div>
        </div>
      </section>

      {/* Daily Streak Section */}
      <section className="px-6 mt-10 mb-8">
        <div
          onClick={() => onTabChange('sadhana')}
          className="bg-[#1e1914]/60 backdrop-blur-md border border-[#d4a85f]/15 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-[#d4a85f]/40 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#d4a85f]/10 border border-[#d4a85f]/30">
              <svg className="w-7 h-7 text-[#d4a85f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C12 2 17 7 17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11C7 7 12 2 12 2M12 4.45L10 7.45C9.37 8.41 9 9.55 9 10.75C9 12.4 10.35 13.75 12 13.75C13.65 13.75 15 12.4 15 10.75C15 9.55 14.63 8.41 14 7.45L12 4.45M12 18V22M10 22H14" />
              </svg>
            </div>
            <div>
              <h4 className="font-cinzel text-[#d4a85f] text-lg leading-tight font-bold">
                Daily Streak
              </h4>
              <p className="text-white/60 text-sm font-serif">
                {streakDays} Days Pure
              </p>
            </div>
          </div>
          <button className="text-[#a6834d] text-sm font-cinzel flex items-center space-x-1 hover:text-[#d4a85f]">
            <span>View Progress</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </section>

      {/* Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1914] border border-[#d4a85f]/30 w-full max-w-md p-6 rounded-2xl relative shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-cinzel text-[#d4a85f] uppercase tracking-widest font-bold">
                  {dailyQuote?.source || 'Daily Verse'}
                </span>
                <h3 className="font-garamond text-2xl text-[#d4a85f] mt-1 font-bold">
                  {dailyQuote?.title || ''}
                </h3>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="text-[#a6834d] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-lg italic text-white/90 mb-4 text-center border-y border-[#d4a85f]/20 py-3 whitespace-pre-line">
              {dailyQuote?.sanskrit || ''}
            </p>
            <p className="text-[#a6834d] text-sm italic mb-4">
              {dailyQuote?.source ? `— ${dailyQuote.source}` : ''}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExplanationModal(false);
                  onTabChange('library');
                }}
                className="w-full py-3 bg-gradient-to-r from-[#d4a85f] to-[#a6834d] rounded-xl text-[#0d0d0d] font-cinzel font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Open Full Chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
