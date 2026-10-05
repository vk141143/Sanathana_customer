import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { SupabaseAlbum } from './useSupabaseAudio';

interface Props {
  albums: SupabaseAlbum[];
  loading: boolean;
  error: string | null;
  onSelectAlbum: (album: SupabaseAlbum) => void;
  onBack: () => void;
}

const G = '#C89B3C';
const GL = '#E4C16A';
const CREAM = '#F2E4C8';

type Category = 'All' | 'Deities' | 'Mantras' | 'Stotrams' | 'Meditation' | 'Bhajans' | 'Sadhana';
const CATS: Category[] = ['All', 'Deities', 'Mantras', 'Stotrams', 'Meditation', 'Bhajans', 'Sadhana'];

const CAT_KEYS: Record<Exclude<Category, 'All'>, string[]> = {
  Deities:    ['vishnu', 'shiva', 'krishna', 'rama', 'devi', 'ganesha', 'hanuman', 'lakshmi', 'saraswati', 'durga'],
  Mantras:    ['mantra', 'gayatri', 'namah', 'namo', 'sahasranamam', 'vedic', 'om'],
  Stotrams:   ['stotram', 'stotra', 'ashtakam', 'suktam', 'chalisa', 'kavacham'],
  Meditation: ['meditation', 'peace', 'calm', 'dhyana', 'yoga', 'nidra'],
  Bhajans:    ['bhajan', 'bhakti', 'kirtan', 'keerthan', 'devotional', 'prayer'],
  Sadhana:    ['sadhana', 'morning', 'evening', 'temple', 'chant', 'daily'],
};

export const AudioAlbumsScreen: React.FC<Props> = ({ albums, loading, error, onSelectAlbum, onBack }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return albums.filter(a => {
      const text = [a.title, a.artist, a.description, ...(a.tracks ?? []).map(t => t.title)]
        .filter(Boolean).join(' ').toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchCat = category === 'All' || CAT_KEYS[category].some(k => text.includes(k));
      return matchSearch && matchCat;
    });
  }, [albums, search, category]);

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  return (
    <div className="fixed inset-0 z-[60] max-w-md mx-auto overflow-hidden" style={{ background: '#050403' }}>
      {/* Background */}
      <img src="/album.png" alt="" className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center 20%', opacity: 0.55 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(5,4,3,0.3) 0%, rgba(5,4,3,0.55) 35%, rgba(5,4,3,0.82) 65%, #050403 100%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 15%, rgba(200,155,60,0.12), transparent 55%)' }} />

      {/* Scroll container */}
      <div className="devotional-scrollbar relative z-10 h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} aria-label="Back"
            className="flex items-center justify-center rounded-full"
            style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(200,155,60,0.25)', backdropFilter: 'blur(16px)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10l6 6" stroke={GL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          <div className="text-center">
            <p className="font-cinzel font-bold tracking-[0.2em]" style={{ fontSize: 14, color: GL }}>SACRED MUSIC</p>
            <p style={{ fontSize: 9, color: 'rgba(228,193,106,0.55)', letterSpacing: '0.14em' }}>Albums & Collections</p>
          </div>

          <div style={{ width: 42 }} />
        </div>

        {/* Hero tagline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="px-5 pt-6 pb-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to right, transparent, rgba(228,193,106,0.5))' }} />
            <span style={{ color: GL, fontSize: 11 }}>❖</span>
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to left, transparent, rgba(228,193,106,0.5))' }} />
          </div>
          <p style={{ color: 'rgba(242,228,200,0.65)', fontSize: 11, fontStyle: 'italic', letterSpacing: '0.04em' }}>
            Let the divine become your soundscape.
          </p>
        </motion.div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-3 px-4"
            style={{ height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(200,155,60,0.2)', backdropFilter: 'blur(20px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="rgba(228,193,106,0.7)" strokeWidth="1.5" />
              <path d="M16 16l4 4" stroke="rgba(228,193,106,0.7)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search albums, mantras, chants..."
              className="flex-1 bg-transparent border-none outline-none"
              style={{ color: CREAM, fontSize: 11 }} />
            {search && (
              <button type="button" onClick={() => setSearch('')} style={{ color: GL, fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
          {CATS.map(cat => {
            const active = category === cat;
            return (
              <motion.button key={cat} whileTap={{ scale: 0.94 }} type="button" onClick={() => setCategory(cat)}
                className="shrink-0 rounded-full font-cinzel"
                style={{
                  padding: '7px 14px', fontSize: 9, letterSpacing: '0.1em',
                  color: active ? '#1a0e04' : 'rgba(242,228,200,0.75)',
                  background: active ? 'linear-gradient(135deg, #E4C16A, #B8821E)' : 'rgba(255,255,255,0.07)',
                  border: active ? '1px solid rgba(228,193,106,0.8)' : '1px solid rgba(200,155,60,0.18)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: active ? '0 0 16px rgba(200,155,60,0.25)' : 'none',
                }}>
                {cat}
              </motion.button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="rounded-full border-2 animate-spin"
              style={{ width: 32, height: 32, borderColor: 'rgba(200,155,60,0.15)', borderTopColor: GL }} />
            <p className="mt-4" style={{ color: 'rgba(228,193,106,0.5)', fontSize: 10 }}>Opening sacred collections…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-4 p-5 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,120,100,0.15)' }}>
            <p style={{ color: 'rgba(255,180,160,0.8)', fontSize: 11 }}>Unable to load albums.<br />{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto flex items-center justify-center rounded-full mb-4"
              style={{ width: 64, height: 64, background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)' }}>
              <span style={{ color: GL, fontSize: 28 }}>ॐ</span>
            </div>
            <p className="font-cinzel" style={{ color: 'rgba(228,193,106,0.6)', fontSize: 12 }}>No albums found</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Featured album */}
            {featured && (
              <div className="px-4 mb-6">
                <p className="font-cinzel mb-3" style={{ fontSize: 8, color: 'rgba(200,155,60,0.55)', letterSpacing: '0.22em' }}>
                  FEATURED ALBUM
                </p>
                <motion.button
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                  whileTap={{ scale: 0.985 }} type="button" onClick={() => onSelectAlbum(featured)}
                  className="relative w-full overflow-hidden text-left"
                  style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,155,60,0.2)', backdropFilter: 'blur(20px)' }}>
                  {/* Cover */}
                  <div className="relative overflow-hidden" style={{ height: 180 }}>
                    {featured.cover_url
                      ? <img src={featured.cover_url} alt={featured.title} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, #2a1a08, #0d0804)' }}>
                          <span style={{ color: GL, fontSize: 56 }}>ॐ</span>
                        </div>
                    }
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,4,3,0.85) 0%, transparent 55%)' }} />
                    {featured.status === 'Premium' && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full"
                        style={{ background: 'rgba(5,4,3,0.7)', border: '1px solid rgba(200,155,60,0.4)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ color: GL, fontSize: 8, letterSpacing: '0.1em' }}>✦ PREMIUM</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 flex items-center justify-center rounded-full"
                      style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #E4C16A, #B8821E)', boxShadow: '0 0 16px rgba(200,155,60,0.4)' }}>
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="#1a0e04"><path d="M0 0l10 6-10 6V0z" /></svg>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="font-cinzel font-bold" style={{ color: '#F2DFA0', fontSize: 15 }}>{featured.title}</h3>
                    <p style={{ color: 'rgba(242,228,200,0.5)', fontSize: 9, marginTop: 3 }}>
                      {featured.artist || 'Devotional Audio'} · {featured.tracks?.length ?? featured.track_count ?? 0} Tracks
                    </p>
                  </div>
                </motion.button>
              </div>
            )}

            {/* All albums grid */}
            {rest.length > 0 && (
              <div className="px-4 pb-32">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-cinzel" style={{ fontSize: 8, color: 'rgba(200,155,60,0.55)', letterSpacing: '0.22em' }}>
                    ALL ALBUMS
                  </p>
                  <span style={{ color: 'rgba(200,155,60,0.45)', fontSize: 9 }}>{filtered.length} albums</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {rest.map((album, i) => {
                    const trackCount = album.tracks?.length ?? album.track_count ?? 0;
                    const premium = album.status === 'Premium';
                    return (
                      <motion.button
                        key={album.id}
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                        whileTap={{ scale: 0.97 }} type="button" onClick={() => onSelectAlbum(album)}
                        className="relative overflow-hidden text-left"
                        style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,155,60,0.15)', backdropFilter: 'blur(16px)' }}>
                        {/* Cover */}
                        <div className="relative overflow-hidden" style={{ height: 120, margin: 6, borderRadius: 13, background: 'rgba(30,18,6,0.6)' }}>
                          {album.cover_url
                            ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" loading="lazy" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <span style={{ color: GL, fontSize: 36 }}>ॐ</span>
                              </div>
                          }
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,4,3,0.6), transparent 50%)' }} />
                          {premium && (
                            <div className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                              style={{ width: 20, height: 20, background: 'rgba(5,4,3,0.65)', border: '1px solid rgba(200,155,60,0.3)' }}>
                              <span style={{ color: GL, fontSize: 8 }}>✦</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 flex items-center justify-center rounded-full"
                            style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #E4C16A, #B8821E)', boxShadow: '0 0 10px rgba(200,155,60,0.35)' }}>
                            <svg width="7" height="9" viewBox="0 0 10 12" fill="#1a0e04"><path d="M0 0l10 6-10 6V0z" /></svg>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="px-2.5 pb-3">
                          <h3 className="font-cinzel line-clamp-2 leading-tight" style={{ color: '#F0D898', fontSize: 11 }}>{album.title}</h3>
                          <p className="truncate mt-1" style={{ color: 'rgba(242,228,200,0.45)', fontSize: 8 }}>
                            {album.artist || 'Devotional'} · {trackCount} {trackCount === 1 ? 'Track' : 'Tracks'}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="text-center py-8 pb-32">
            <span style={{ color: 'rgba(200,155,60,0.3)', fontSize: 18 }}>ॐ</span>
            <p className="font-cinzel mt-2" style={{ color: 'rgba(200,155,60,0.25)', fontSize: 7, letterSpacing: '0.2em' }}>
              LISTEN · REFLECT · DEVOTE
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
