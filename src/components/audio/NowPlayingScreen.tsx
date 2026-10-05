import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerState, fmtSec } from './useAudioPlayer';

interface Props {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (sec: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onMinimise: () => void;
}

const G = '#C89B3C';
const GL = '#E4C16A';

// Sacred mandala visualizer
const SacredVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
    <motion.div
      animate={{ rotate: isPlaying ? 360 : 0 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      style={{ width: 320, height: 320, opacity: 0.07 }}>
      <svg viewBox="0 0 320 320" className="w-full h-full">
        <circle cx="160" cy="160" r="155" fill="none" stroke={GL} strokeWidth="0.5" strokeDasharray="3 9" />
        <circle cx="160" cy="160" r="130" fill="none" stroke={GL} strokeWidth="0.3" strokeDasharray="2 7" />
        <circle cx="160" cy="160" r="105" fill="none" stroke={GL} strokeWidth="0.4" strokeDasharray="4 6" />
        <circle cx="160" cy="160" r="80" fill="none" stroke={GL} strokeWidth="0.3" strokeDasharray="2 5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
          <g key={deg} transform={`rotate(${deg} 160 160)`}>
            <line x1="160" y1="5" x2="160" y2="30" stroke={GL} strokeWidth="0.6" opacity="0.8" />
            <line x1="160" y1="55" x2="160" y2="75" stroke={GL} strokeWidth="0.4" opacity="0.5" />
          </g>
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <g key={deg} transform={`rotate(${deg} 160 160)`}>
            <path d="M160 30 L155 50 L160 45 L165 50 Z" fill={GL} opacity="0.4" />
          </g>
        ))}
      </svg>
    </motion.div>

    {/* Inner breathing ring */}
    <motion.div
      className="absolute rounded-full"
      animate={isPlaying
        ? { scale: [1, 1.04, 1], opacity: [0.06, 0.12, 0.06] }
        : { scale: 1, opacity: 0.05 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: 280, height: 280, border: `1px solid ${GL}`, borderRadius: '50%' }}
    />
  </div>
);

export const NowPlayingScreen: React.FC<Props> = ({
  playerState, onTogglePlay, onNext, onPrev, onSeek,
  onToggleShuffle, onToggleRepeat, onMinimise,
}) => {
  const [immersive, setImmersive] = useState(false);
  const { album, track, isPlaying, currentSec, durationSec, isShuffle, isRepeat, trackIndex } = playerState;

  if (!album || !track) return null;

  const progress = durationSec > 0 ? Math.min(1, Math.max(0, currentSec / durationSec)) : 0;
  const trackNum = (trackIndex ?? 0) + 1;
  const totalTracks = album.tracks?.length ?? 0;

  const handleSeek = (clientX: number, el: HTMLDivElement) => {
    if (!durationSec) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * durationSec));
  };

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="fixed inset-0 z-[80] flex flex-col max-w-md mx-auto overflow-hidden"
      style={{ background: '#050403' }}>

      {/* Album cover as full background */}
      {album.cover_url && (
        <img src={album.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.18, transform: 'scale(1.08)' }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(5,4,3,0.6) 0%, rgba(5,4,3,0.75) 40%, rgba(5,4,3,0.92) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(200,155,60,0.1), transparent 55%)' }} />

      {/* Sacred visualizer */}
      <SacredVisualizer isPlaying={isPlaying} />

      {/* Immersive mode overlay */}
      <AnimatePresence>
        {immersive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            style={{ background: 'rgba(5,4,3,0.92)', backdropFilter: 'blur(4px)' }}
            onClick={() => setImmersive(false)}>
            {/* Large artwork */}
            <motion.div animate={isPlaying ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden"
              style={{ width: 'min(80vw, 300px)', aspectRatio: '1/1', borderRadius: 24, border: '1px solid rgba(200,155,60,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(200,155,60,0.08)' }}>
              {album.cover_url
                ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, #2a1a08, #0d0804)' }}>
                    <span className="font-cinzel" style={{ color: GL, fontSize: 72 }}>ॐ</span>
                  </div>
              }
            </motion.div>
            <p className="font-cinzel mt-6 text-center" style={{ color: '#F5DFA0', fontSize: 18 }}>{track.title}</p>
            <p className="mt-1" style={{ color: 'rgba(242,228,200,0.5)', fontSize: 11 }}>{album.title}</p>
            {/* Minimal controls */}
            <div className="flex items-center gap-8 mt-8">
              <button onClick={e => { e.stopPropagation(); onPrev(); }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={G}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              <motion.button whileTap={{ scale: 0.92 }} onClick={e => { e.stopPropagation(); onTogglePlay(); }}
                className="flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #E4C16A, #B8821E)', color: '#1a0e04', boxShadow: '0 0 24px rgba(200,155,60,0.4)' }}>
                {isPlaying
                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M5 3l14 9-14 9V3z" /></svg>
                }
              </motion.button>
              <button onClick={e => { e.stopPropagation(); onNext(); }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={G}><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4v8l-5.5-4zM16 6h2v12h-2z" /></svg>
              </button>
            </div>
            <p className="mt-8" style={{ color: 'rgba(200,155,60,0.35)', fontSize: 9, letterSpacing: '0.16em' }}>TAP TO RETURN</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <button onClick={onMinimise} className="flex items-center justify-center rounded-full active:scale-90"
            style={{ width: 40, height: 40, background: 'rgba(5,4,3,0.6)', border: '1px solid rgba(200,155,60,0.2)', backdropFilter: 'blur(12px)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 7l5 5 5-5" stroke={GL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="text-center">
            <p className="uppercase tracking-[0.28em]" style={{ color: 'rgba(200,155,60,0.6)', fontSize: 9 }}>Now Playing</p>
            <p className="font-cinzel truncate mt-0.5" style={{ color: 'rgba(228,193,106,0.65)', fontSize: 10, maxWidth: 180 }}>{album.title}</p>
          </div>

          <div style={{ width: 40 }} />
        </div>

        {/* Artwork — tappable for immersive */}
        <div className="flex justify-center shrink-0 mb-6">
          <motion.div
            animate={isPlaying ? { scale: [1, 1.012, 1] } : { scale: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => setImmersive(true)}
            className="relative overflow-hidden cursor-pointer"
            style={{
              width: 'min(72vw, 270px)', aspectRatio: '1/1', borderRadius: 24,
              background: 'linear-gradient(145deg, #2a1a08, #0d0804)',
              border: '1px solid rgba(200,155,60,0.28)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(200,155,60,0.07)',
            }}>
            {album.cover_url
              ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <span className="font-cinzel" style={{ color: GL, fontSize: 72 }}>ॐ</span>
                </div>
            }
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(5,4,3,0.35), transparent 50%)' }} />
            {isPlaying && (
              <motion.div className="absolute inset-0 rounded-[24px] pointer-events-none"
                animate={{ boxShadow: ['inset 0 0 16px rgba(200,155,60,0.05)', 'inset 0 0 28px rgba(200,155,60,0.14)', 'inset 0 0 16px rgba(200,155,60,0.05)'] }}
                transition={{ duration: 2.4, repeat: Infinity }} />
            )}
            {/* Tap hint */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full"
              style={{ background: 'rgba(5,4,3,0.55)', border: '1px solid rgba(200,155,60,0.2)', backdropFilter: 'blur(8px)' }}>
              <span style={{ color: 'rgba(200,155,60,0.6)', fontSize: 7, letterSpacing: '0.1em' }}>IMMERSE</span>
            </div>
          </motion.div>
        </div>

        {/* Track info */}
        <div className="text-center shrink-0 mb-5">
          <h2 className="font-cinzel truncate" style={{ color: '#F1D6A0', fontSize: 20, lineHeight: 1.2 }}>{track.title}</h2>
          <p className="mt-1.5 truncate" style={{ color: 'rgba(242,228,200,0.45)', fontSize: 11 }}>
            {track.artist || album.artist || 'Devotional Audio'}
          </p>
          {totalTracks > 0 && (
            <p className="mt-1" style={{ color: 'rgba(200,155,60,0.4)', fontSize: 9, letterSpacing: '0.1em' }}>
              Track {trackNum} of {totalTracks}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="w-full shrink-0 mb-6">
          <div className="relative h-[4px] rounded-full cursor-pointer touch-none"
            style={{ background: 'rgba(200,155,60,0.12)' }}
            onClick={e => handleSeek(e.clientX, e.currentTarget)}
            onPointerMove={e => { if (e.buttons === 1) handleSeek(e.clientX, e.currentTarget); }}>
            <div className="absolute left-0 top-0 h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #B8821E, #E4C16A)', boxShadow: '0 0 6px rgba(200,155,60,0.4)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `calc(${progress * 100}% - 6px)`, width: 12, height: 12, background: '#E4C16A', boxShadow: '0 0 8px rgba(200,155,60,0.55)' }} />
          </div>
          <div className="flex justify-between mt-2" style={{ color: 'rgba(200,155,60,0.45)', fontSize: 10 }}>
            <span>{fmtSec(currentSec)}</span>
            <span>{fmtSec(durationSec)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-between w-full shrink-0 mb-6 px-1">
          <button onClick={onToggleShuffle} style={{ opacity: isShuffle ? 1 : 0.35 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GL} strokeWidth="1.8" strokeLinecap="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
            </svg>
          </button>

          <button onClick={onPrev} className="active:scale-90 transition-transform">
            <svg width="30" height="30" viewBox="0 0 24 24" fill={GL}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>

          <motion.button whileTap={{ scale: 0.92 }} onClick={onTogglePlay}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 68, height: 68, color: '#1a0e04',
              background: 'linear-gradient(135deg, #E4C16A, #B8821E)',
              boxShadow: isPlaying ? '0 0 28px rgba(200,155,60,0.45), 0 0 56px rgba(200,155,60,0.12)' : '0 0 16px rgba(200,155,60,0.22)',
            }}>
            {isPlaying
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M5 3l14 9-14 9V3z" /></svg>
            }
          </motion.button>

          <button onClick={onNext} className="active:scale-90 transition-transform">
            <svg width="30" height="30" viewBox="0 0 24 24" fill={GL}><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4v8l-5.5-4zM16 6h2v12h-2z" /></svg>
          </button>

          <button onClick={onToggleRepeat} style={{ opacity: isRepeat ? 1 : 0.35 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GL} strokeWidth="1.8" strokeLinecap="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center shrink-0">
          <p className="uppercase tracking-[0.24em]" style={{ color: 'rgba(200,155,60,0.3)', fontSize: 8 }}>
            Listen · Reflect · Devote
          </p>
        </div>
      </div>
    </motion.div>
  );
};
