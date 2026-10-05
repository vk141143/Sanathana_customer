import React from 'react';
import { motion } from 'motion/react';
import { SupabaseAlbum } from './useSupabaseAudio';
import { PlayerState, fmtSec } from './useAudioPlayer';

interface Props {
  album: SupabaseAlbum;
  playerState: PlayerState;
  onPlayTrack: (index: number) => void;
  onBack: () => void;
  onOpenPlayer: () => void;
}

const G = '#C89B3C';
const GL = '#E4C16A';
const CREAM = '#F2E4C8';

export const AudioAlbumDetail: React.FC<Props> = ({ album, playerState, onPlayTrack, onBack, onOpenPlayer }) => {
  const tracks = album.tracks ?? [];
  const isCurrentAlbum = playerState.album?.id === album.id;
  const isPremium = album.status === 'Premium';

  const handlePlay = (index: number) => { onPlayTrack(index); onOpenPlayer(); };

  return (
    <div className="fixed inset-0 z-[60] max-w-md mx-auto overflow-hidden" style={{ background: '#050403' }}>
      {/* Full-bleed album cover */}
      {album.cover_url
        ? <img src={album.cover_url} alt={album.title} className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 20%', transform: 'scale(1.04)' }} />
        : <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 25%, #3a1e08, #0d0804 60%, #050403)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-cinzel" style={{ color: GL, fontSize: 100, opacity: 0.12 }}>ॐ</span>
            </div>
          </div>
      }

      {/* Layered overlays */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(5,4,3,0.2) 0%, rgba(5,4,3,0.45) 30%, rgba(5,4,3,0.78) 58%, #050403 82%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(200,155,60,0.14), transparent 45%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.4)' }} />

      {/* Scroll content */}
      <div className="devotional-scrollbar relative z-10 h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-12">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} aria-label="Back"
            className="flex items-center justify-center rounded-full"
            style={{ width: 42, height: 42, background: 'rgba(5,4,3,0.55)', border: '1px solid rgba(200,155,60,0.22)', backdropFilter: 'blur(16px)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10l6 6" stroke={GL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <div style={{ width: 42 }} />
        </div>

        {/* Hero info */}
        <section className="flex flex-col items-center text-center px-6 pt-4" style={{ minHeight: 320, justifyContent: 'flex-end', paddingBottom: 24 }}>
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 48, height: 48, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.25)', backdropFilter: 'blur(12px)', color: GL, fontSize: 22 }}>
            ॐ
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="font-cinzel uppercase mb-2" style={{ color: 'rgba(228,193,106,0.6)', fontSize: 8, letterSpacing: '0.24em' }}>
            Sacred Collection
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5 }}
            className="font-cinzel" style={{ color: '#F5DFA0', fontSize: 26, lineHeight: 1.2, textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
            {album.title}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            className="mt-2" style={{ color: 'rgba(242,228,200,0.65)', fontSize: 11 }}>
            {album.artist || 'Devotional Audio'}
          </motion.p>

          {isPremium && (
            <div className="mt-3 px-3 py-1 rounded-full"
              style={{ background: 'rgba(5,4,3,0.6)', border: '1px solid rgba(200,155,60,0.25)', backdropFilter: 'blur(10px)', color: GL, fontSize: 8, letterSpacing: '0.1em' }}>
              ✦ Sacred Premium Collection
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <div style={{ height: 1, width: 36, background: 'linear-gradient(to right, transparent, rgba(228,193,106,0.5))' }} />
            <span style={{ color: GL, fontSize: 10 }}>❖</span>
            <div style={{ height: 1, width: 36, background: 'linear-gradient(to left, transparent, rgba(228,193,106,0.5))' }} />
          </div>
        </section>

        {/* Info card */}
        <section className="px-4 mt-2">
          <div className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,155,60,0.15)', backdropFilter: 'blur(24px)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(200,155,60,0.08), transparent 55%)' }} />

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-3 mb-4">
              {[
                { icon: '♫', val: tracks.length, label: 'Tracks' },
                { icon: 'ॐ', val: 'Sacred', label: 'Collection' },
                { icon: '✦', val: isPremium ? 'Premium' : 'Divine', label: 'Audio' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center py-2"
                  style={{ borderRight: i < 2 ? '1px solid rgba(200,155,60,0.1)' : 'none' }}>
                  <span style={{ color: GL, fontSize: 12 }}>{s.icon}</span>
                  <span className="font-cinzel mt-1" style={{ color: '#F0D390', fontSize: 10 }}>{s.val}</span>
                  <span style={{ color: 'rgba(242,228,200,0.35)', fontSize: 7, marginTop: 2 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {album.description && (
              <p className="relative z-10 text-center px-2 mb-4"
                style={{ color: 'rgba(242,228,200,0.55)', fontSize: 10.5, lineHeight: 1.75 }}>
                {album.description}
              </p>
            )}

            {/* Play All */}
            <motion.button whileTap={{ scale: 0.97 }} disabled={tracks.length === 0} type="button"
              onClick={() => tracks.length > 0 && handlePlay(0)}
              className="relative z-10 w-full flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ height: 48, borderRadius: 24, color: '#1a0e04', background: 'linear-gradient(135deg, #E4C16A, #C8821E)', boxShadow: '0 8px 24px rgba(200,155,60,0.22)' }}>
              <svg width="11" height="13" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6V0z" /></svg>
              <span className="font-cinzel uppercase" style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600 }}>Play Album</span>
            </motion.button>
          </div>
        </section>

        {/* Tracks */}
        <section className="px-4 pt-6 pb-32">
          <div className="flex items-end justify-between px-1 mb-4">
            <div>
              <p className="uppercase" style={{ color: 'rgba(200,155,60,0.45)', fontSize: 7.5, letterSpacing: '0.22em' }}>Listen with devotion</p>
              <h2 className="font-cinzel mt-1" style={{ color: '#F0D391', fontSize: 17 }}>Sacred Tracks</h2>
            </div>
            <span style={{ color: 'rgba(200,155,60,0.55)', fontSize: 9 }}>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
          </div>

          {tracks.length === 0 && (
            <div className="text-center py-12 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,155,60,0.1)' }}>
              <span style={{ color: GL, fontSize: 28 }}>ॐ</span>
              <p className="mt-3" style={{ color: 'rgba(242,228,200,0.45)', fontSize: 10 }}>No tracks in this album yet.</p>
            </div>
          )}

          <div className="space-y-2">
            {tracks.map((track, idx) => {
              const isActive = isCurrentAlbum && playerState.trackIndex === idx;
              return (
                <motion.button key={track.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.25) }}
                  whileTap={{ scale: 0.985 }} type="button" onClick={() => handlePlay(idx)}
                  className="relative w-full flex items-center gap-3 text-left overflow-hidden"
                  style={{
                    minHeight: 66, padding: '8px 10px', borderRadius: 16,
                    background: isActive ? 'rgba(200,155,60,0.12)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(200,155,60,0.35)' : '1px solid rgba(200,155,60,0.1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: isActive ? '0 0 20px rgba(200,155,60,0.12)' : 'none',
                  }}>
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 8% 50%, rgba(200,155,60,0.1), transparent 40%)' }} />
                  )}

                  {/* Track number */}
                  <div className="relative z-10 shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 40, height: 40, background: isActive ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,155,60,0.15)', color: isActive ? GL : 'rgba(228,193,106,0.5)' }}>
                    <span className="font-cinzel" style={{ fontSize: 9 }}>{String(idx + 1).padStart(2, '0')}</span>
                  </div>

                  {/* Text */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className="truncate" style={{ color: isActive ? '#F9DFA4' : CREAM, fontSize: 12.5, fontWeight: isActive ? 500 : 400 }}>
                      {track.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="truncate" style={{ color: 'rgba(242,228,200,0.4)', fontSize: 8.5 }}>
                        {track.artist || album.artist || 'Devotional'}
                      </span>
                      <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(200,155,60,0.35)', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(200,155,60,0.65)', fontSize: 8.5 }}>
                        {isActive ? fmtSec(playerState.currentSec) : track.duration}
                      </span>
                    </div>
                  </div>

                  {/* Premium badge */}
                  {track.is_premium && (
                    <span className="relative z-10 rounded-full px-2 py-0.5"
                      style={{ color: GL, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.2)', fontSize: 7 }}>
                      ✦
                    </span>
                  )}

                  {/* Play/pause */}
                  <div className="relative z-10 shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 34, height: 34,
                      color: isActive ? '#1a0e04' : GL,
                      background: isActive ? 'linear-gradient(135deg, #E4C16A, #C8821E)' : 'rgba(200,155,60,0.08)',
                      border: isActive ? '1px solid rgba(228,193,106,0.6)' : '1px solid rgba(200,155,60,0.2)',
                      boxShadow: isActive ? '0 0 14px rgba(200,155,60,0.28)' : 'none',
                    }}>
                    {isActive && playerState.isPlaying
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      : <svg width="8" height="10" viewBox="0 0 10 12" fill="currentColor" style={{ marginLeft: 1 }}><path d="M0 0l10 6-10 6V0z" /></svg>
                    }
                  </div>
                </motion.button>
              );
            })}
          </div>

          {tracks.length > 0 && (
            <div className="text-center pt-10">
              <span style={{ color: 'rgba(200,155,60,0.35)', fontSize: 18 }}>ॐ</span>
              <p className="font-cinzel mt-2" style={{ color: 'rgba(200,155,60,0.25)', fontSize: 7, letterSpacing: '0.2em' }}>
                LISTEN · REFLECT · DEVOTE
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
