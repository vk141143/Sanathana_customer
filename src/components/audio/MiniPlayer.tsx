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

const GL = '#E4C16A';
const G = '#C89B3C';

export const MiniPlayer: React.FC<Props> = ({ playerState, onTogglePlay, onNext, onPrev, onExpand }) => {
  const { album, track, isPlaying, currentSec, durationSec } = playerState;
  if (!album || !track) return null;

  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="fixed left-0 right-0 z-[55] max-w-md mx-auto"
      style={{ bottom: 100 }}>
      <div className="mx-3 rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'rgba(10,7,4,0.92)',
          border: '1px solid rgba(200,155,60,0.2)',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.5), 0 0 12px rgba(200,155,60,0.08)',
        }}
        onClick={onExpand}>
        {/* Progress line */}
        <div className="h-[2px] w-full" style={{ background: 'rgba(200,155,60,0.1)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${G}, ${GL})`, boxShadow: `0 0 4px ${G}` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }} />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Cover */}
          <div className="shrink-0 rounded-xl overflow-hidden"
            style={{ width: 40, height: 40, background: 'rgba(30,18,6,0.8)', border: '1px solid rgba(200,155,60,0.2)' }}>
            {album.cover_url
              ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <span style={{ color: GL, fontSize: 18 }}>ॐ</span>
                </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium" style={{ color: '#F2DFA0', fontSize: 12 }}>{track.title}</p>
            <p className="truncate" style={{ color: 'rgba(200,155,60,0.5)', fontSize: 9 }}>{album.title}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={onPrev} className="p-2 active:scale-90 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill={G}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button onClick={onTogglePlay}
              className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #E4C16A, #B8821E)', boxShadow: `0 0 10px rgba(200,155,60,0.35)` }}>
              {isPlaying
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="#1a0e04"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="#1a0e04" style={{ marginLeft: 1 }}><path d="M5 3l14 9-14 9V3z" /></svg>
              }
            </button>
            <button onClick={onNext} className="p-2 active:scale-90 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill={G}><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4v8l-5.5-4zM16 6h2v12h-2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
