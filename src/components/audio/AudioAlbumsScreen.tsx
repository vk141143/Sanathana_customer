import React from 'react';
import { motion } from 'motion/react';
import { ALBUMS, Album } from './audioData';

interface Props {
  onSelectAlbum: (album: Album) => void;
  onBack: () => void;
}

const gold = '#D4AF37';
const surface = 'rgba(21,27,45,0.85)';

export const AudioAlbumsScreen: React.FC<Props> = ({ onSelectAlbum, onBack }) => (
  <div className="fixed inset-0 z-[60] flex flex-col max-w-md mx-auto overflow-hidden"
    style={{ background: 'linear-gradient(160deg,#0B1220 0%,#151B2D 50%,#1D2335 100%)' }}>

    {/* Top bar */}
    <div className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0"
      style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
      <button onClick={onBack} className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
        style={{ width: 38, height: 38, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12 3L6 9l6 6" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="flex-1">
        <h1 className="font-cinzel text-lg font-bold" style={{ color: gold }}>Devotional Audio</h1>
        <p className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>Sacred collections for your practice</p>
      </div>
      <span className="text-2xl">🎵</span>
    </div>

    {/* Grid */}
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
      <div className="grid grid-cols-2 gap-4">
        {ALBUMS.map((album, i) => (
          <motion.button
            key={album.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectAlbum(album)}
            className="relative overflow-hidden flex flex-col items-start text-left active:scale-95 transition-transform"
            style={{
              borderRadius: 20,
              background: surface,
              border: `1px solid rgba(212,175,55,0.2)`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(20px)',
              minHeight: 160,
            }}
          >
            {/* Gradient cover */}
            <div className="w-full flex items-center justify-center"
              style={{
                height: 90,
                background: `linear-gradient(135deg, ${album.coverGradient[0]}, ${album.coverGradient[1]})`,
                borderRadius: '20px 20px 0 0',
              }}>
              <span style={{ fontSize: 36 }}>{album.symbol}</span>
            </div>
            {/* Gold shimmer line */}
            <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}40, transparent)` }} />
            {/* Info */}
            <div className="p-3 flex-1 flex flex-col justify-between w-full">
              <div>
                <p className="font-cinzel text-xs font-bold leading-tight" style={{ color: gold }}>{album.name}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(212,175,55,0.5)' }}>{album.trackCount} chants</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.4)' }}>{album.deity}</span>
                <div className="flex items-center justify-center rounded-full"
                  style={{ width: 22, height: 22, background: `${gold}20`, border: `1px solid ${gold}40` }}>
                  <svg width="8" height="10" viewBox="0 0 8 10" fill={gold}>
                    <path d="M0 0l8 5-8 5V0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  </div>
);
