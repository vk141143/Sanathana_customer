import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Festival, FestivalTiming, FestivalMedia, StoryJson, PujaJson } from '../types';

interface FestivalDetailViewProps {
  festivalId: string;
  onBack: () => void;
}

type ActiveTab = 'overview' | 'story' | 'puja' | 'gallery';

export const FestivalDetailView: React.FC<FestivalDetailViewProps> = ({ festivalId, onBack }) => {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [timings, setTimings] = useState<FestivalTiming | null>(null);
  const [media, setMedia] = useState<FestivalMedia[]>([]);
  const [story, setStory] = useState<StoryJson | null>(null);
  const [puja, setPuja] = useState<PujaJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  useEffect(() => {
    fetchAll();
  }, [festivalId]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [festivalRes, timingsRes, mediaRes] = await Promise.all([
        supabase.from('festivals').select('*').eq('id', festivalId).single(),
        supabase
          .from('festival_timings')
          .select('shubha_muhurta_start,shubha_muhurta_end,puja_start,puja_end,manchi_samayam_start,manchi_samayam_end,rahu_kalam_start,rahu_kalam_end,yamagandam_start,yamagandam_end,gulika_start,gulika_end,parana_time')
          .eq('festival_id', festivalId)
          .maybeSingle(),
        supabase
          .from('festival_media')
          .select('id,festival_id,media_type,public_url,file_name,display_order,storage_key')
          .eq('festival_id', festivalId)
          .order('display_order', { ascending: true }),
      ]);

      if (festivalRes.error) throw festivalRes.error;
      const fest = festivalRes.data as Festival;
      setFestival(fest);
      setTimings((timingsRes.data as FestivalTiming) || null);
      setMedia((mediaRes.data as FestivalMedia[]) || []);

      // Fetch story and puja JSON in parallel if URLs exist
      const jsonFetches: Promise<void>[] = [];
      if (fest.story_url) {
        jsonFetches.push(
          fetch(fest.story_url)
            .then(r => r.json())
            .then(d => setStory(d as StoryJson))
            .catch(() => {})
        );
      }
      if (fest.puja_url) {
        jsonFetches.push(
          fetch(fest.puja_url)
            .then(r => r.json())
            .then(d => setPuja(d as PujaJson))
            .catch(() => {})
        );
      }
      await Promise.all(jsonFetches);
    } catch (err) {
      console.error(err);
      setError('Failed to load festival details.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t?: string) => {
    if (!t) return '—';
    try {
      return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return t; }
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  const bannerMedia = media.find(m => m.media_type === 'banner') || media.find(m => m.media_type === 'thumbnail');
  const galleryMedia = media.filter(m => m.media_type === 'gallery');
  const audioMedia = media.filter(m => m.media_type === 'audio');
  const videoMedia = media.filter(m => m.media_type === 'video');

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'story', label: 'Story' },
    { key: 'puja', label: 'Puja Vidhi' },
    { key: 'gallery', label: 'Gallery' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] max-w-lg mx-auto">
        <div className="animate-pulse">
          <div className="h-64 bg-[#1c1b1b]" />
          <div className="p-5 space-y-4">
            <div className="h-6 w-2/3 bg-[#2a2a2a] rounded" />
            <div className="h-4 w-1/2 bg-[#2a2a2a] rounded" />
            <div className="h-4 w-full bg-[#2a2a2a] rounded" />
            <div className="h-4 w-5/6 bg-[#2a2a2a] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !festival) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col items-center justify-center gap-4 max-w-lg mx-auto px-5">
        <p className="text-red-400 text-sm">{error || 'Festival not found.'}</p>
        <button onClick={onBack} className="text-[#f2c377] font-cinzel text-sm underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] max-w-lg mx-auto pb-10">
      {/* Banner */}
      <div className="relative h-64 overflow-hidden">
        {bannerMedia?.public_url ? (
          <img src={bannerMedia.public_url} alt={festival.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d4a85f]/20 to-[#8a5820]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-5 left-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Festival type badge */}
        <div className="absolute bottom-4 left-5">
          <span className="px-3 py-1 bg-[#d4a85f]/20 border border-[#d4a85f]/40 rounded-full text-[#f2c377] text-xs font-label-sm">
            {festival.festival_type}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="font-cinzel text-2xl text-[#f2c377] font-bold leading-tight">{festival.name}</h1>
        {festival.alternate_name && (
          <p className="text-sm text-[#d2c4b3]/70 italic mt-1">{festival.alternate_name}</p>
        )}
        {festival.festival_date && (
          <p className="text-xs text-[#d2c4b3]/60 mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
            </svg>
            {formatDate(festival.festival_date)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4 sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="flex border-b border-[#4e4539]/30 overflow-x-auto no-scrollbar gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-label-sm uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                  : 'text-[#d2c4b3]/50 hover:text-[#f2c377]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            {(festival.short_description || festival.description) && (
              <div>
                <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">
                  {festival.description || festival.short_description}
                </p>
              </div>
            )}

            {/* Panchanga */}
            {(festival.tithi || festival.nakshatra || festival.yoga) && (
              <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4e4539]/30">
                <h3 className="font-cinzel text-[#f2c377] text-sm font-bold mb-3 uppercase tracking-wider">Panchanga</h3>
                <div className="grid grid-cols-2 gap-3">
                  {festival.tithi && <PanchangaItem label="Tithi" value={`${festival.paksha ? festival.paksha + ' ' : ''}${festival.tithi}`} />}
                  {festival.nakshatra && <PanchangaItem label="Nakshatra" value={festival.nakshatra} />}
                  {festival.yoga && <PanchangaItem label="Yoga" value={festival.yoga} />}
                  {festival.karana && <PanchangaItem label="Karana" value={festival.karana} />}
                  {festival.tithi_start && <PanchangaItem label="Tithi Start" value={formatTime(festival.tithi_start)} />}
                  {festival.tithi_end && <PanchangaItem label="Tithi End" value={formatTime(festival.tithi_end)} />}
                </div>
              </div>
            )}

            {/* Timings */}
            {timings && (
              <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4e4539]/30">
                <h3 className="font-cinzel text-[#f2c377] text-sm font-bold mb-3 uppercase tracking-wider">Auspicious Timings</h3>
                <div className="space-y-2">
                  {timings.shubha_muhurta_start && (
                    <TimingRow label="Shubha Muhurta" start={formatTime(timings.shubha_muhurta_start)} end={formatTime(timings.shubha_muhurta_end)} color="text-[#f2c377]" />
                  )}
                  {timings.puja_start && (
                    <TimingRow label="Puja Time" start={formatTime(timings.puja_start)} end={formatTime(timings.puja_end)} color="text-[#f2c377]" />
                  )}
                  {timings.manchi_samayam_start && (
                    <TimingRow label="Manchi Samayam" start={formatTime(timings.manchi_samayam_start)} end={formatTime(timings.manchi_samayam_end)} color="text-green-400" />
                  )}
                  {timings.rahu_kalam_start && (
                    <TimingRow label="Rahu Kalam" start={formatTime(timings.rahu_kalam_start)} end={formatTime(timings.rahu_kalam_end)} color="text-red-400" isBad />
                  )}
                  {timings.yamagandam_start && (
                    <TimingRow label="Yamagandam" start={formatTime(timings.yamagandam_start)} end={formatTime(timings.yamagandam_end)} color="text-red-400" isBad />
                  )}
                  {timings.gulika_start && (
                    <TimingRow label="Gulika" start={formatTime(timings.gulika_start)} end={formatTime(timings.gulika_end)} color="text-orange-400" isBad />
                  )}
                  {timings.parana_time && (
                    <div className="flex justify-between items-center py-2 border-b border-[#4e4539]/20 last:border-0">
                      <span className="text-xs text-[#d2c4b3]/70">Parana Time</span>
                      <span className="text-xs text-[#f2c377] font-semibold">{formatTime(timings.parana_time)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio */}
            {audioMedia.length > 0 && (
              <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4e4539]/30">
                <h3 className="font-cinzel text-[#f2c377] text-sm font-bold mb-3 uppercase tracking-wider">Audio</h3>
                <div className="space-y-2">
                  {audioMedia.map(a => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d4a85f]/10 border border-[#d4a85f]/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#f2c377]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <audio controls src={a.public_url} className="flex-1 h-8" style={{ accentColor: '#f2c377' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {videoMedia.length > 0 && (
              <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4e4539]/30">
                <h3 className="font-cinzel text-[#f2c377] text-sm font-bold mb-3 uppercase tracking-wider">Videos</h3>
                <div className="space-y-3">
                  {videoMedia.map(v => (
                    <video key={v.id} controls src={v.public_url} className="w-full rounded-xl" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STORY TAB */}
        {activeTab === 'story' && (
          <div className="space-y-5">
            {story ? (
              <>
                <h2 className="font-cinzel text-[#f2c377] text-lg font-bold">{story.title}</h2>
                {story.sections.map((s, i) => (
                  <div key={i} className="space-y-2">
                    {s.title && <h3 className="font-cinzel text-[#d4a85f] text-sm font-semibold">{s.title}</h3>}
                    <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">{s.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[#d2c4b3]/50 text-sm text-center py-10">Story not available for this festival.</p>
            )}
          </div>
        )}

        {/* PUJA VIDHI TAB */}
        {activeTab === 'puja' && (
          <div className="space-y-5">
            {puja ? (
              <>
                <h2 className="font-cinzel text-[#f2c377] text-lg font-bold">{puja.title}</h2>
                {puja.sections.map((s, i) => (
                  <div key={i} className="bg-[#1c1b1b] rounded-xl p-4 border border-[#4e4539]/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#d4a85f]/20 border border-[#d4a85f]/40 flex items-center justify-center text-[#f2c377] text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {s.title && <h3 className="font-cinzel text-[#d4a85f] text-sm font-semibold">{s.title}</h3>}
                    </div>
                    <p className="text-[#d2c4b3]/80 text-sm leading-relaxed pl-8">{s.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[#d2c4b3]/50 text-sm text-center py-10">Puja Vidhi not available for this festival.</p>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            {galleryMedia.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {galleryMedia.map(img => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-[#1c1b1b]">
                    <img src={img.public_url} alt={img.file_name || festival.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#d2c4b3]/50 text-sm text-center py-10">No gallery images available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PanchangaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#0A0A0A]/60 rounded-lg p-2.5">
    <p className="text-[10px] text-[#d2c4b3]/50 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-xs text-[#f2c377] font-semibold">{value}</p>
  </div>
);

const TimingRow: React.FC<{ label: string; start: string; end: string; color: string; isBad?: boolean }> = ({ label, start, end, color, isBad }) => (
  <div className="flex justify-between items-center py-2 border-b border-[#4e4539]/20 last:border-0">
    <div className="flex items-center gap-2">
      {isBad && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
      <span className="text-xs text-[#d2c4b3]/70">{label}</span>
    </div>
    <span className={`text-xs font-semibold ${color}`}>{start} – {end}</span>
  </div>
);
