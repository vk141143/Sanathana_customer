import React, { useState, useEffect } from 'react';
import { Temple, SpiritualEvent, EmotionHealingCategory, NavTab } from '../types';
import { Header } from './Header';
import { SupabaseEmotion } from './EmotionDetailView';
import { EmotionHealingPage } from './healing/EmotionHealingPage';
import { supabase } from '../lib/supabase';

interface ExploreViewProps {
  temples: Temple[];
  events: SpiritualEvent[];
  emotions: EmotionHealingCategory[];
  onOpenTempleMap: () => void;
  onTabChange: (tab: NavTab) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  temples,
  events,
  onOpenTempleMap,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'temples' | 'gatherings' | 'healing'>('healing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<SupabaseEmotion | null>(null);
  const [dbEmotions, setDbEmotions] = useState<SupabaseEmotion[]>([]);

  useEffect(() => {
    supabase.from('emotions').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setDbEmotions(data as SupabaseEmotion[]); });
  }, []);

  const filteredTemples = temples.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedEmotion) {
    return (
      <EmotionHealingPage
        emotion={selectedEmotion}
        onBack={() => setSelectedEmotion(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pt-20 pb-36 max-w-lg mx-auto relative">
      <Header
        title="SANATANA"
        onNotificationClick={() => {}}
        onTabChange={onTabChange}
      />

      {/* Search Bar */}
      <section className="px-5 mb-6">
        <div className="relative flex items-center">
          <svg className="absolute left-4 w-5 h-5 text-[#d2c4b3]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search temples, events, wisdom..."
            className="w-full bg-[#1c1b1b] border-b border-[#f2c377]/30 focus:border-[#f2c377] outline-none py-3 pl-12 pr-4 text-sm text-[#e5e2e1] placeholder:text-[#d2c4b3]/40 rounded-t-lg transition-all"
          />
        </div>
      </section>

      {/* Tab Bar */}
      <section className="mb-6 px-5 sticky top-16 z-40 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex border-b border-[#4e4539]/20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('healing')}
            className={`px-4 py-3 text-xs font-label-sm uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'healing'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Emotions & Healing
          </button>
          <button
            onClick={() => setActiveTab('temples')}
            className={`px-4 py-3 text-xs font-label-sm uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'temples'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Temples Nearby
          </button>
          <button
            onClick={() => setActiveTab('gatherings')}
            className={`px-4 py-3 text-xs font-label-sm uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'gatherings'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60 hover:text-[#f2c377]'
            }`}
          >
            Sacred Gatherings
          </button>
        </div>
      </section>

      {/* Tab Contents */}
      <div className="px-5">
        {/* Temples Nearby */}
        {activeTab === 'temples' && (
          <section className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="font-cinzel text-xl text-[#f2c377] font-bold">Nearby Sanctuaries</h2>
              <button
                onClick={onOpenTempleMap}
                className="text-xs font-label-sm text-[#f1bf56] uppercase tracking-widest hover:underline flex items-center gap-1 font-bold"
              >
                View Map
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              {filteredTemples.map(temple => (
                <div
                  key={temple.id}
                  onClick={onOpenTempleMap}
                  className="glass-card rounded-[24px] p-4 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all hover:border-[#f2c377]/40"
                >
                  <div className="stone-texture absolute inset-0" />
                  <div className="flex gap-4 relative z-10">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-[#4e4539]/30">
                      <img src={temple.image} alt={temple.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-between py-0.5 flex-1">
                      <div>
                        <h3 className="font-cinzel text-lg text-[#e5e2e1] leading-tight font-bold group-hover:text-[#f2c377] transition-colors">{temple.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-[#d2c4b3] mt-1 font-label-sm">
                          <svg className="w-3 h-3 text-[#f2c377]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          <span>{temple.distance} • {temple.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-[#f2c377]">
                          {[...Array(4)].map((_, i) => (
                            <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          ))}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <span className="text-xs font-label-sm text-[#d2c4b3]/60">{temple.rating} ({temple.reviewsCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sacred Gatherings */}
        {activeTab === 'gatherings' && (
          <section className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="font-cinzel text-xl text-[#f2c377] font-bold">Upcoming Events</h2>
              <span className="text-xs font-label-sm text-[#f1bf56] uppercase tracking-widest font-bold">Bangalore</span>
            </div>
            <div className="space-y-3">
              {events.map(evt => (
                <div key={evt.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1b1b] hover:bg-[#201f1f] border border-[#4e4539]/30 transition-colors group">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#353534]/50 rounded-lg border border-[#f2c377]/20 shrink-0">
                    <span className="text-[10px] font-label-sm text-[#f2c377] uppercase font-bold">{evt.month}</span>
                    <span className="font-garamond text-2xl font-bold leading-none text-[#e5e2e1]">{evt.day}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-body-lg text-base text-[#e5e2e1] font-semibold group-hover:text-[#f2c377] transition-colors">{evt.title}</h4>
                    <p className="text-xs text-[#d2c4b3]/70 font-label-sm mt-0.5">{evt.time}</p>
                  </div>
                  <button
                    onClick={() => alert(`RSVP confirmed for ${evt.title}! Added to your calendar.`)}
                    className="px-3 py-1.5 rounded-full border border-[#f2c377]/40 text-xs font-label-sm uppercase text-[#f2c377] hover:bg-[#f2c377]/10"
                  >
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Emotions & Healing */}
        {activeTab === 'healing' && (
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="font-cinzel text-xl text-[#f2c377] font-bold">Transform Your Energy</h2>
              <p className="text-xs text-[#d2c4b3]/70 font-body-md mt-0.5">
                Select an emotion to discover sacred verses, guidance & action steps.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {dbEmotions.map(em => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmotion(em)}
                  className="relative h-36 rounded-[24px] overflow-hidden golden-border group cursor-pointer shadow-lg active:scale-95 transition-transform"
                >
                  <img
                    src={em.outside_image_url || em.card_image_url || ''}
                    alt={em.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 z-10">
                    <h3 className="text-base text-[#f2c377] font-cinzel font-bold tracking-wider">{em.name}</h3>
                    <p className="text-[10px] text-gray-300 font-serif-main opacity-80 mt-0.5">Tap to view scripture</p>
                  </div>
                </div>
              ))}
              {dbEmotions.length === 0 && (
                <p className="col-span-2 text-center text-[#d2c4b3]/40 text-xs py-8">No emotions added yet.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
