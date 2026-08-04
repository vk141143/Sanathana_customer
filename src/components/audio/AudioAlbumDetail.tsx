import React from 'react';
import { motion } from 'motion/react';
import { Album, Track } from './audioData';
import { PlayerState, fmtSec } from './useAudioPlayer';

interface Props {
  album: Album;
  playerState: PlayerState;
  onPlayTrack: (index: number) => void;
  onBack: () => void;
  onOpenPlayer: () => void;
}

const gold = '#D4AF37';

export const AudioAlbumDetail: React.FC<Props> = ({ album, playerState, onPlayTrack, onBack, onOpenPlayer }) => {
  const isCurrentAlbum = playerState.album?.id === album.id;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col max-w-md mx-auto overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#0B1220 0%,#151B2D 60%,#1D2335 100%)' }}>

      {/* Hero header */}
      <div className="relative shrink-0" style={{ height: 220 }}>
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${album.coverGradient[0]}, ${album.coverGradient[1]})` }}>
          <span style={{ fontSize: 72 }}>{album.symbol}</span>
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(11,18,32,0.3) 0%, rgba(11,18,32,0.95) 100%)' }} />

        {/* Back */}
        <button onClick={onBack} className="absolute top-12 left-5 z-10 flex items-center justify-center rounded-full active:scale-90"
          style={{ width: 38, height: 38, background: 'rgba(0,0,0,0.5)', border: `1px solid ${gold}40`, backdropFilter: 'blur(8px)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M12 3L6 9l6 6" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Title */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <h1 className="font-cinzel text-2xl font-bold" style={{ color: gold }}>{album.name}</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.6)' }}>{album.description}</p>
        </div>
      </div>

      {/* Play controls */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => { onPlayTrack(0); onOpenPlayer(); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-cinzel text-xs font-bold uppercase tracking-widest"
          style={{ background: `linear-gradient(135deg, ${gold}, #B8960C)`, color: '#0B1220', boxShadow: `0 0 16px ${gold}50` }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor"><path d="M0 0l12 7-12 7V0z"/></svg>
          Play All
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-label-sm uppercase tracking-widest"
          style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${gold}30`, color: gold }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Shuffle
        </motion.button>
        <span className="ml-auto text-xs" style={{ color: 'rgba(212,175,55,0.4)' }}>{album.trackCount} tracks</span>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-8">
        {album.tracks.map((track, idx) => {
          const isActive = isCurrentAlbum && playerState.trackIndex === idx;
          return (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onPlayTrack(idx); onOpenPlayer(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-2 text-left transition-all"
              style={{
                background: isActive ? `rgba(212,175,55,0.12)` : 'rgba(21,27,45,0.6)',
                border: `1px solid ${isActive ? gold + '40' : 'rgba(212,175,55,0.08)'}`,
                boxShadow: isActive ? `0 0 12px ${gold}20` : 'none',
              }}
            >
              {/* Number / equalizer */}
              <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32 }}>
                {isActive && playerState.isPlaying ? (
                  <EqBars />
                ) : (
                  <span className="text-xs font-bold" style={{ color: isActive ? gold : 'rgba(212,175,55,0.35)' }}>{idx + 1}</span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: isActive ? gold : '#E8DCC8' }}>{track.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.4)' }}>{track.duration}</p>
              </div>
              {/* Play icon */}
              <div className="shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: isActive ? `${gold}20` : 'transparent' }}>
                <svg width="10" height="12" viewBox="0 0 10 12" fill={isActive ? gold : 'rgba(212,175,55,0.3)'}>
                  <path d="M0 0l10 6-10 6V0z"/>
                </svg>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const EqBars = () => (
  <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="rounded-full" style={{
        width: 3, background: '#D4AF37',
        animation: `eqBar${i} 0.6s ease-in-out infinite alternate`,
        height: i === 2 ? 16 : 10,
      }}/>
    ))}
    <style>{`
      @keyframes eqBar1 { from{height:4px} to{height:14px} }
      @keyframes eqBar2 { from{height:14px} to{height:5px} }
      @keyframes eqBar3 { from{height:7px} to{height:16px} }
    `}</style>
  </div>
);
