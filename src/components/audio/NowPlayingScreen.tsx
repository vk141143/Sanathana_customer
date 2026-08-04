import React from 'react';
import { motion } from 'motion/react';
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

const gold = '#D4AF37';

export const NowPlayingScreen: React.FC<Props> = ({
  playerState, onTogglePlay, onNext, onPrev, onSeek, onToggleShuffle, onToggleRepeat, onMinimise,
}) => {
  const { album, track, isPlaying, currentSec, isShuffle, isRepeat } = playerState;
  if (!album || !track) return null;

  const progress = track.durationSec > 0 ? currentSec / track.durationSec : 0;

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
      className="fixed inset-0 z-[80] flex flex-col max-w-md mx-auto"
      style={{ background: `linear-gradient(160deg, ${album.coverGradient[0]} 0%, #0B1220 40%, #151B2D 100%)` }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${album.coverGradient[1]}30 0%, transparent 65%)`,
      }}/>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 shrink-0 relative z-10">
        <button onClick={onMinimise} className="flex items-center justify-center rounded-full active:scale-90"
          style={{ width: 38, height: 38, background: 'rgba(212,175,55,0.1)', border: `1px solid ${gold}25` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 7l5 5 5-5" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: `${gold}80` }}>Now Playing</p>
          <p className="text-xs font-cinzel" style={{ color: `${gold}60` }}>{album.name}</p>
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-8"
          style={{
            width: 220, height: 220, borderRadius: 28,
            background: `linear-gradient(135deg, ${album.coverGradient[0]}, ${album.coverGradient[1]})`,
            border: `1.5px solid ${gold}40`,
            boxShadow: `0 0 40px ${album.coverGradient[1]}60, 0 20px 60px rgba(0,0,0,0.6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 80 }}>{album.symbol}</span>
          {/* Glow ring */}
          {isPlaying && (
            <motion.div className="absolute inset-0 rounded-[28px]"
              animate={{ boxShadow: [`0 0 20px ${gold}30`, `0 0 50px ${gold}60`, `0 0 20px ${gold}30`] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Title */}
        <div className="text-center mb-6 w-full">
          <h2 className="font-cinzel text-xl font-bold truncate" style={{ color: gold }}>{track.title}</h2>
          <p className="text-sm mt-1" style={{ color: `${gold}60` }}>{album.deity}</p>
        </div>

        {/* Progress */}
        <div className="w-full mb-6">
          <div className="relative h-1 rounded-full mb-2 cursor-pointer"
            style={{ background: 'rgba(212,175,55,0.15)' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              onSeek(Math.round(ratio * track.durationSec));
            }}
          >
            <motion.div className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${gold}, #FFE680)`, boxShadow: `0 0 8px ${gold}80` }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{ left: `calc(${progress * 100}% - 6px)`, background: gold, boxShadow: `0 0 6px ${gold}` }} />
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: `${gold}60` }}>
            <span>{fmtSec(currentSec)}</span>
            <span>-{fmtSec(track.durationSec - currentSec)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full mb-6">
          {/* Shuffle */}
          <button onClick={onToggleShuffle} className="active:scale-90 transition-transform"
            style={{ opacity: isShuffle ? 1 : 0.4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </button>

          {/* Prev */}
          <button onClick={onPrev} className="active:scale-90 transition-transform">
            <svg width="28" height="28" viewBox="0 0 24 24" fill={gold}>
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          {/* Play/Pause */}
          <motion.button whileTap={{ scale: 0.92 }} onClick={onTogglePlay}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 68, height: 68,
              background: `linear-gradient(135deg, ${gold}, #B8960C)`,
              boxShadow: isPlaying ? `0 0 24px ${gold}80, 0 0 48px ${gold}40` : `0 0 16px ${gold}40`,
            }}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0B1220">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0B1220">
                <path d="M5 3l14 9-14 9V3z"/>
              </svg>
            )}
          </motion.button>

          {/* Next */}
          <button onClick={onNext} className="active:scale-90 transition-transform">
            <svg width="28" height="28" viewBox="0 0 24 24" fill={gold}>
              <path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4v8l-5.5-4zM16 6h2v12h-2z"/>
            </svg>
          </button>

          {/* Repeat */}
          <button onClick={onToggleRepeat} className="active:scale-90 transition-transform"
            style={{ opacity: isRepeat ? 1 : 0.4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
