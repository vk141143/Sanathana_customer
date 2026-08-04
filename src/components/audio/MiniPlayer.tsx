import React from 'react';
import { motion } from 'motion/react';
import { PlayerState, fmtSec } from './useAudioPlayer';

interface Props {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
}

const gold = '#D4AF37';

export const MiniPlayer: React.FC<Props> = ({ playerState, onTogglePlay, onNext, onPrev, onExpand }) => {
  const { album, track, isPlaying, currentSec } = playerState;
  if (!album || !track) return null;

  const progress = track.durationSec > 0 ? (currentSec / track.durationSec) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
      className="fixed left-0 right-0 z-[55] max-w-md mx-auto"
      style={{ bottom: 110 }}
    >
      <div
        className="mx-3 rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${album.coverGradient[0]}ee, #151B2Dee)`,
          border: `1px solid ${gold}30`,
          backdropFilter: 'blur(24px)',
          boxShadow: `0 -4px 24px rgba(0,0,0,0.5), 0 0 16px ${gold}15`,
        }}
        onClick={onExpand}
      >
        {/* Progress line */}
        <div className="h-[2px] w-full" style={{ background: 'rgba(212,175,55,0.15)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${gold}, #FFE680)`, boxShadow: `0 0 6px ${gold}` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Cover */}
          <div className="shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width: 42, height: 42,
              background: `linear-gradient(135deg, ${album.coverGradient[0]}, ${album.coverGradient[1]})`,
              border: `1px solid ${gold}30`,
            }}>
            <span style={{ fontSize: 20 }}>{album.symbol}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: gold }}>{track.title}</p>
            <p className="text-[10px] truncate" style={{ color: `${gold}50` }}>{album.name}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={onPrev} className="p-2 active:scale-90 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={gold}>
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button onClick={onTogglePlay}
              className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${gold}, #B8960C)`, boxShadow: `0 0 10px ${gold}50` }}>
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0B1220">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0B1220">
                  <path d="M5 3l14 9-14 9V3z"/>
                </svg>
              )}
            </button>
            <button onClick={onNext} className="p-2 active:scale-90 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={gold}>
                <path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4v8l-5.5-4zM16 6h2v12h-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
