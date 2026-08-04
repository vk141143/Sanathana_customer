import React, { useState, useEffect } from 'react';
import { NavTab } from '../types';

interface MeditationViewProps {
  onBack?: () => void;
  onTabChange?: (tab: NavTab) => void;
  onCompleteSession?: (minutes: number) => void;
}

export const MeditationView: React.FC<MeditationViewProps> = ({
  onBack,
  onTabChange,
  onCompleteSession,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins = 600 seconds
  const [selectedDuration, setSelectedDuration] = useState(10); // mins
  const [breathPhase, setBreathPhase] = useState<'In' | 'Hold' | 'Out'>('In');
  const [breathText, setBreathText] = useState('Breathe In Peace');
  
  // Toggles for secondary controls
  const [isMusicActive, setIsMusicActive] = useState(false);
  const [isBellActive, setIsBellActive] = useState(true);
  const [isAmbientActive, setIsAmbientActive] = useState(false);
  
  // Toast notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (onTabChange) {
      onTabChange('sadhana');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      showToast('Meditation Completed! Namaste 🙏');
      if (onCompleteSession) {
        onCompleteSession(selectedDuration);
      }
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, selectedDuration, onCompleteSession]);

  // Breathing Cycle
  useEffect(() => {
    let breathTimer: NodeJS.Timeout;
    if (isPlaying) {
      const cycle = () => {
        setBreathPhase('In');
        setBreathText('Breathe In Peace...');
        setTimeout(() => {
          setBreathPhase('Hold');
          setBreathText('Hold Gently...');
          setTimeout(() => {
            setBreathPhase('Out');
            setBreathText('Breathe Out Stress...');
          }, 4000);
        }, 4000);
      };

      cycle();
      breathTimer = setInterval(cycle, 12000);
    } else {
      setBreathText('Breathe In Peace\nBreathe Out Stress');
    }
    return () => clearInterval(breathTimer);
  }, [isPlaying]);

  // Temple Bell Sound Synthesizer
  const playBellSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, ctx.currentTime); // 432Hz sacred frequency
      osc.frequency.exponentialRampToValueAtTime(108, ctx.currentTime + 3);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.5);
      showToast('🔔 Temple Bell Chime');
    } catch {
      showToast('🔔 Bell Ringing');
    }
  };

  const handleStartToggle = () => {
    if (!isPlaying) {
      if (isBellActive) playBellSound();
      setIsPlaying(true);
      showToast('Meditation Session Started');
    } else {
      setIsPlaying(false);
      showToast('Session Paused');
    }
  };

  const handleTimerChange = () => {
    const options = [5, 10, 15, 20];
    const nextIdx = (options.indexOf(selectedDuration) + 1) % options.length;
    const nextDuration = options[nextIdx];
    setSelectedDuration(nextDuration);
    setTimeLeft(nextDuration * 60);
    showToast(`Timer set to ${nextDuration} Minutes`);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="relative h-screen w-full flex flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden select-none max-w-md mx-auto">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.4), rgba(10, 10, 10, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCkgtMTRpmVEm_A9G2CVOxgHiZO842QnTXrGJ0FEjBiukTUr5dzEUaxoAJAXLIY2DhhP3sC6w0cj2HogA1DZ_Qfa-kH11qjxN3y_Syvt-hDJVzk1GSAnkIc3G6ZZeW95O7CC36XjGY8PerrOrWZmW1WahKLA3JG5gazqhFyuALxLONu2Rxg1dsP3yXrd20fE_Po5hfI-ltkJhFPoxdBWjqXIy5WFnpCkDLyLK91ZME25uTo7nkjfJCBwV400UCbnb069qiHpb4tE9k')`,
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#d4a85f] text-[#0a0a0a] font-bold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4 z-10">
        <button
          onClick={handleGoBack}
          aria-label="Go back"
          className="text-[#d4a85f] hover:scale-110 active:scale-95 transition-transform p-1"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-serif text-2xl tracking-wide text-[#d4a85f] font-medium">
            Meditation
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-300 opacity-80">
            Find inner peace
          </p>
        </div>
        <button
          onClick={() => showToast('Settings: Sacred Om Ambient Active')}
          aria-label="Settings"
          className="text-[#d4a85f] hover:scale-110 active:scale-95 transition-transform p-1"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </button>
      </header>

      {/* Spacer */}
      <div className="flex-grow flex items-center justify-center relative">
        {isPlaying && (
          <div
            className={`w-48 h-48 rounded-full border-2 border-[#d4a85f]/30 flex items-center justify-center transition-all duration-1000 ${
              breathPhase === 'In'
                ? 'scale-125 bg-[#d4a85f]/20 blur-md'
                : breathPhase === 'Hold'
                ? 'scale-125 bg-[#d4a85f]/30 blur-sm'
                : 'scale-90 bg-[#d4a85f]/10 blur-md'
            }`}
          />
        )}
      </div>

      {/* Content Area */}
      <section className="px-8 pb-10 flex flex-col items-center text-center z-10">
        {/* Session Title */}
        <div className="mb-8">
          <h2 className="font-serif text-4xl text-[#d4a85f] leading-tight whitespace-pre-line font-normal drop-shadow-lg">
            {breathText}
          </h2>
          <p className="mt-3 text-sm tracking-widest text-gray-300 font-sans">
            {isPlaying ? (
              <span className="text-[#d4a85f] font-bold text-lg">{formatTime(timeLeft)} remaining</span>
            ) : (
              `${selectedDuration} Min • Guided Meditation`
            )}
          </p>
        </div>

        {/* Main CTA */}
        <button
          onClick={handleStartToggle}
          style={{
            background: 'linear-gradient(135deg, #8e6b3e 0%, #d4a85f 50%, #8e6b3e 100%)',
            boxShadow: '0 4px 15px rgba(212, 168, 95, 0.3)',
          }}
          className="w-full max-w-xs py-4 rounded-full text-[#0a0a0a] font-cinzel font-bold text-lg tracking-widest transition-transform active:scale-95 mb-10"
        >
          {isPlaying ? 'Pause Meditation' : 'Start Meditation'}
        </button>

        {/* Secondary Controls */}
        <div className="grid grid-cols-4 gap-6 w-full max-w-sm mb-12">
          {/* Music */}
          <button
            onClick={() => {
              setIsMusicActive(!isMusicActive);
              showToast(!isMusicActive ? 'Sacred Flute Music On 🎵' : 'Music Muted');
            }}
            className="flex flex-col items-center space-y-2 group"
          >
            <div
              className={`w-14 h-14 rounded-full border border-[#d4a85f]/40 flex items-center justify-center text-[#d4a85f] transition-all ${
                isMusicActive ? 'bg-[#d4a85f]/30 border-[#d4a85f] scale-105' : 'hover:bg-[#d4a85f]/10'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#d4a85f]/80 font-medium">Music</span>
          </button>

          {/* Bell */}
          <button
            onClick={() => {
              playBellSound();
              setIsBellActive(!isBellActive);
            }}
            className="flex flex-col items-center space-y-2 group"
          >
            <div
              className={`w-14 h-14 rounded-full border border-[#d4a85f]/40 flex items-center justify-center text-[#d4a85f] transition-all ${
                isBellActive ? 'bg-[#d4a85f]/20 border-[#d4a85f]' : 'hover:bg-[#d4a85f]/10'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#d4a85f]/80 font-medium">Bell</span>
          </button>

          {/* Timer */}
          <button
            onClick={handleTimerChange}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full border border-[#d4a85f]/40 flex items-center justify-center text-[#d4a85f] hover:bg-[#d4a85f]/10 transition-all">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#d4a85f]/80 font-medium">
              {selectedDuration}m
            </span>
          </button>

          {/* Ambient */}
          <button
            onClick={() => {
              setIsAmbientActive(!isAmbientActive);
              showToast(!isAmbientActive ? 'Tanpura Drone Sound On 🕉️' : 'Ambient Off');
            }}
            className="flex flex-col items-center space-y-2 group"
          >
            <div
              className={`w-14 h-14 rounded-full border border-[#d4a85f]/40 flex items-center justify-center text-[#d4a85f] transition-all ${
                isAmbientActive ? 'bg-[#d4a85f]/30 border-[#d4a85f] scale-105' : 'hover:bg-[#d4a85f]/10'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#d4a85f]/80 font-medium">Ambient</span>
          </button>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="bg-black/80 backdrop-blur-md border-t border-white/10 pb-8 pt-4 px-4 z-20">
        <div className="flex items-end justify-between max-w-lg mx-auto">
          {/* Home */}
          <button
            onClick={() => onTabChange?.('home')}
            className="flex flex-col items-center space-y-1 w-1/5 group"
          >
            <svg
              className="h-6 w-6 text-gray-500 group-hover:text-[#d4a85f] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-cinzel text-[10px] text-gray-500 group-hover:text-[#d4a85f] uppercase tracking-wider">
              Home
            </span>
          </button>

          {/* Library */}
          <button
            onClick={() => onTabChange?.('geeta')}
            className="flex flex-col items-center space-y-1 w-1/5 group"
          >
            <svg
              className="h-6 w-6 text-gray-500 group-hover:text-[#d4a85f] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-cinzel text-[10px] text-gray-500 group-hover:text-[#d4a85f] uppercase tracking-wider">
              Library
            </span>
          </button>

          {/* Sadhana (Prominent Center Item) */}
          <button
            onClick={() => onTabChange?.('sadhana')}
            className="flex flex-col items-center -mt-8 relative w-1/5 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4a85f]/20 blur-xl rounded-full" />
              <div
                className="relative w-16 h-16 rounded-full border-2 border-[#d4a85f] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 0 20px rgba(212, 168, 95, 0.4)' }}
              >
                <img
                  alt="Sadhana"
                  className="w-10 h-10 object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwqgjzmiw4b8a3vYYCK2jpIPCqBsWkAolPporvEv8TdeBNQYpRlHlX3wMRqvfmRCDiN7RojiiJ0ZaY6W4dGykPLdnUxy8EZjBsIGyvnRytSi5qFcaDD8cecJNEdjZrj2gcFlPVDD-2lu3R9KxzGnKPrgSuvsopFJao5pH4jLvxaS__zDszATw6GOVTa5BKEJy9lmrNncFOX3MA_isUU-0PxglyuL36N8Rtx1JfWAk3loneIZ1EjHpWUbjlkauMBetpNDWAs2qNMkw"
                />
              </div>
            </div>
            <span className="font-cinzel text-[10px] text-[#d4a85f] uppercase tracking-widest mt-2 font-bold">
              Sadhana
            </span>
          </button>

          {/* Explore */}
          <button
            onClick={() => onTabChange?.('explore')}
            className="flex flex-col items-center space-y-1 w-1/5 group"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-[#d4a85f]/40 group-hover:border-[#d4a85f] group-hover:scale-110 transition-all">
              <img
                src="/golden_lotus.jpg"
                alt="Explore"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-cinzel text-[10px] text-gray-500 group-hover:text-[#d4a85f] uppercase tracking-wider">
              Explore
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => onTabChange?.('achievements')}
            className="flex flex-col items-center space-y-1 w-1/5 group"
          >
            <svg
              className="h-6 w-6 text-gray-500 group-hover:text-[#d4a85f] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-cinzel text-[10px] text-gray-500 group-hover:text-[#d4a85f] uppercase tracking-wider">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
};
