import { FestivalImage, FestivalPlayer } from './FestivalMediaView';
import { formatFestivalDate, formatFestivalTime, formatFestivalClock, fetchFestivalSections } from '../lib/festivalPresentation';
import React, { useEffect, useRef, useState } from 'react';
import { cache } from '../lib/cache';
import { supabase } from '../lib/supabase';
import {
  currentFestivalYear,
  fetchFestivalDetail,
  festivalCache,
  isFestivalDetailCache,
} from '../lib/festivalData';
import type { FestivalDetail, FestivalMedia } from '../types';

interface FestivalDetailViewProps {
  festivalId: string;
  onBack: () => void;
  occurrenceId?: string | null;
}

type ActiveTab = 'overview' | 'story' | 'puja' | 'gallery';
interface ContentSection {
  title: string;
  content: string;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function entries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'sections' in value) {
    const sections = value.sections;
    return Array.isArray(sections) ? sections : [];
  }
  return [];
}

function contentSections(value: unknown): ContentSection[] {
  return entries(value).flatMap(item => {
    if (typeof item === 'string' && item.trim()) {
      return [{ title: '', content: item.trim() }];
    }
    if (!item || typeof item !== 'object') return [];
    const section = item as Record<string, unknown>;
    const title = text(section.title);
    const content = text(section.content ?? section.description ?? section.text);
    return content ? [{ title, content }] : [];
  });
}

function displayValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  const label = text(record.name ?? record.title ?? record.label ?? record.item ?? record.reference ?? record.text ?? record.description);
  const quantity = text(record.quantity);
  return [label, quantity].filter(Boolean).join(' — ');
}

function displayValues(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return values.map(displayValue).filter(Boolean);
}

const formatDate = formatFestivalDate;
const formatTime = formatFestivalTime;

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes < 1) return '';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function isImage(media: FestivalMedia): boolean {
  return ['image', 'banner', 'gallery'].includes(media.media_type) && !!media.public_url;
}

function isContentSectionAvailable(value: unknown): boolean {
  return contentSections(value).length > 0;
}

export const FestivalDetailView: React.FC<FestivalDetailViewProps> = ({ festivalId, occurrenceId, onBack }) => {
  const [festival, setFestival] = useState<FestivalDetail | null>(null);
  const [remoteStory, setRemoteStory] = useState<unknown>(null);
  const [remotePuja, setRemotePuja] = useState<unknown>(null);
  const [remoteContentError, setRemoteContentError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const requestId = useRef(0);

  const fetchAll = async (forceRefresh = false) => {
    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    setFestival(null);
    setRemoteStory(null);
    setRemotePuja(null);
    setRemoteContentError(false);
    try {
      const year = currentFestivalYear();
      const cacheKey = festivalCache.detailKey(festivalId);
      if (forceRefresh) cache.remove(cacheKey);
      const detail = await fetchFestivalDetail(festivalId, supabase, year, occurrenceId);
      if (request !== requestId.current) return;
      setFestival(detail);
      if (detail) cache.set(cacheKey, detail, festivalCache.detailTtl);
    } catch (fetchError) {
      if (request !== requestId.current) return;
      console.error('Error fetching festival details:', fetchError);
      setError('Failed to load festival details. Please try again.');
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab('overview');
    void fetchAll();
    return () => {
      requestId.current += 1;
    };
  }, [festivalId, occurrenceId]);

  useEffect(() => {
    if (!festival?.content) return;
    const content = festival.content;
    const storyNeeded = !isContentSectionAvailable(content.festival_story) && !!content.story_r2_url;
    const pujaNeeded = !isContentSectionAvailable(content.puja_vidhi) && !!content.puja_r2_url;
    if (!storyNeeded && !pujaNeeded) return;

    let active = true;
    const controller = new AbortController();
    const loadRemote = (url: string) => fetchFestivalSections(url, controller.signal);
    const requests: Promise<void>[] = [];
    if (storyNeeded) {
      requests.push(loadRemote(content.story_r2_url!).then(value => {
        if (active) setRemoteStory(value);
      }));
    }
    if (pujaNeeded) {
      requests.push(loadRemote(content.puja_r2_url!).then(value => {
        if (active) setRemotePuja(value);
      }));
    }
    void Promise.all(requests).catch(remoteError => {
      if (!active) return;
      if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
        console.warn('[festivals] Could not load R2 story or puja content.', remoteError);
      }
      setRemoteContentError(true);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [festival]);

  const media = festival?.media ?? [];
  const images = media.filter(isImage);
  const audio = media.filter(item => item.media_type === 'audio' && item.public_url);
  const video = media.filter(item => item.media_type === 'video' && item.public_url);
  const content = festival?.content;
  const storySections = contentSections(
    isContentSectionAvailable(content?.festival_story) ? content?.festival_story : remoteStory,
  );
  const pujaSections = contentSections(
    isContentSectionAvailable(content?.puja_vidhi) ? content?.puja_vidhi : remotePuja,
  );
  const deityNames = [
    festival?.primary_deity ?? '',
    ...displayValues(festival?.associated_deities),
  ].filter(Boolean);
  const hasStory = storySections.length > 0 || !!content?.story_r2_url;
  const hasPuja = !!(
    content?.puja_name
    || content?.puja_description
    || content?.puja_duration_minutes
    || displayValues(content?.puja_samagri).length
    || pujaSections.length
    || content?.puja_r2_url
  );

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    ...(hasStory ? [{ key: 'story' as const, label: 'Story' }] : []),
    ...(hasPuja ? [{ key: 'puja' as const, label: 'Puja Vidhi' }] : []),
    ...(images.length ? [{ key: 'gallery' as const, label: 'Gallery' }] : []),
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
        {error && (
          <button onClick={() => void fetchAll(true)} className="text-[#f2c377] font-cinzel text-sm underline">
            Try Again
          </button>
        )}
        <button onClick={onBack} className="text-[#f2c377] font-cinzel text-sm underline">Go Back</button>
      </div>
    );
  }

  const occurrence = festival.occurrence;
  const banner = festival.coverMedia;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] max-w-lg mx-auto pb-10">
      <div className="relative h-64 overflow-hidden">
        {banner?.public_url ? (
          <FestivalImage
            src={banner.public_url}
            alt={banner.alt_text || banner.title || banner.file_name || festival.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d4a85f]/20 to-[#8a5820]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        <button
          onClick={onBack}
          aria-label="Go back"
          className="absolute top-5 left-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="absolute bottom-4 left-5">
          <span className="px-3 py-1 bg-[#d4a85f]/20 border border-[#d4a85f]/40 rounded-full text-[#f2c377] text-xs font-label-sm">
            {festival.festival_type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <button onClick={() => void fetchAll(true)} className="text-xs text-[#f2c377] underline mb-3">Refresh festival</button>
        <h1 className="font-cinzel text-2xl text-[#f2c377] font-bold leading-tight">{festival.name}</h1>
        {festival.alternate_name && (
          <p className="text-sm text-[#d2c4b3]/70 italic mt-1">{festival.alternate_name}</p>
        )}
        {festival.tradition && <p className="text-xs mt-2">Tradition: {festival.tradition}</p>}
        {festival.short_description && <p className="text-sm mt-2">{festival.short_description}</p>}
        {occurrence?.festival_date && (
          <p className="text-xs text-[#d2c4b3]/60 mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
            </svg>
            {formatDate(occurrence.festival_date)}
          </p>
        )}
      </div>

      {tabs.length > 1 && (
        <div className="px-5 mt-4 sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md">
          <div className="flex border-b border-[#4e4539]/30 overflow-x-auto no-scrollbar gap-1">
            {tabs.map(tab => (
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
      )}

      <div className="px-5 mt-5">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {(content?.festival_description || festival.short_description) && (
              <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">
                {content?.festival_description || festival.short_description}
              </p>
            )}

            {deityNames.length > 0 && (
              <InfoSection title="Deities">
                <p className="text-[#d2c4b3]/80 text-sm">{deityNames.join(' · ')}</p>
              </InfoSection>
            )}

            {content?.spiritual_significance && (
              <InfoSection title="Spiritual Significance">
                <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">{content.spiritual_significance}</p>
              </InfoSection>
            )}

            {occurrence && (
              <Panchanga occurrence={occurrence} />
            )}

            {occurrence && (
              <FestivalTimings occurrence={occurrence} />
            )}

            {occurrence && (occurrence.fasting_enabled || occurrence.parana_required && formatTime(occurrence.parana_time)) && (
              <InfoSection title="Fasting & Parana">
                <div className="space-y-2 text-sm text-[#d2c4b3]/80">
                  {occurrence.fasting_enabled && occurrence.fasting_type && <p><span className="text-[#f2c377]">Fasting:</span> {occurrence.fasting_type}</p>}
                  {occurrence.fasting_enabled && occurrence.fasting_rules && <p>{occurrence.fasting_rules}</p>}
                  {occurrence.parana_required && formatTime(occurrence.parana_time) && <p><span className="text-[#f2c377]">Parana:</span> {formatTime(occurrence.parana_time)} IST</p>}
                </div>
              </InfoSection>
            )}

            <RelatedSection title="Scriptural References" value={content?.scriptural_references} />
            <RelatedSection title="Related Scriptures" value={content?.related_scriptures} />
            <RelatedSection title="Related Slokas" value={content?.related_slokas} />
            <RelatedSection title="Related Mantras" value={content?.related_mantras} />
            <RelatedSection title="Related Stotrams" value={content?.related_stotrams} />
            <RelatedSection title="Related Music" value={content?.related_music} />
            <RelatedSection title="Related Stories" value={content?.related_stories} />

            {audio.length > 0 && (
              <InfoSection title="Audio">
                <div className="space-y-3">
                  {audio.map(item => <FestivalPlayer key={item.id} media={item} />)}
                </div>
              </InfoSection>
            )}

            {video.length > 0 && (
              <InfoSection title="Videos">
                <div className="space-y-3">
                  {video.map(item => <FestivalPlayer key={item.id} media={item} />)}
                </div>
              </InfoSection>
            )}
          </div>
        )}

        {activeTab === 'story' && (
          <div className="space-y-5">
            {storySections.length === 0 && !remoteContentError && (
              <div className="h-16 animate-pulse rounded-xl bg-[#1c1b1b]" aria-label="Loading festival story" />
            )}
            {storySections.map((section, index) => (
              <div key={`${section.title}-${index}`} className="space-y-2">
                {section.title && <h3 className="font-cinzel text-[#d4a85f] text-sm font-semibold">{section.title}</h3>}
                <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
            {storySections.length === 0 && remoteContentError && (
              <p className="text-[#d2c4b3]/60 text-sm text-center py-10">Festival story could not be loaded right now.</p>
            )}
          </div>
        )}

        {activeTab === 'puja' && (
          <div className="space-y-5">
            {pujaSections.length === 0 && !!content?.puja_r2_url && !remoteContentError && (
              <div className="h-16 animate-pulse rounded-xl bg-[#1c1b1b]" aria-label="Loading puja instructions" />
            )}
            {content?.puja_name && <h2 className="font-cinzel text-[#f2c377] text-lg font-bold">{content.puja_name}</h2>}
            {content?.puja_duration_minutes && (
              <p className="text-xs text-[#d2c4b3]/65">Approx. {formatDuration(content.puja_duration_minutes)}</p>
            )}
            {content?.puja_description && (
              <p className="text-[#d2c4b3]/80 text-sm leading-relaxed">{content.puja_description}</p>
            )}
            <RelatedSection title="Puja Samagri" value={content?.puja_samagri} />
            {pujaSections.map((section, index) => (
              <div key={`${section.title}-${index}`} className="bg-[#1c1b1b] rounded-xl p-4 border border-[#4e4539]/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#d4a85f]/20 border border-[#d4a85f]/40 flex items-center justify-center text-[#f2c377] text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  {section.title && <h3 className="font-cinzel text-[#d4a85f] text-sm font-semibold">{section.title}</h3>}
                </div>
                <p className="text-[#d2c4b3]/80 text-sm leading-relaxed pl-8">{section.content}</p>
              </div>
            ))}
            {pujaSections.length === 0 && remoteContentError && (
              <p className="text-[#d2c4b3]/60 text-sm text-center py-10">Puja instructions could not be loaded right now.</p>
            )}
          </div>
        )}

        {activeTab === 'gallery' && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map(item => (
              <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-[#1c1b1b]">
                <FestivalImage
                  src={item.public_url}
                  alt={item.alt_text || item.title || item.file_name || festival.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4e4539]/30">
    <h3 className="font-cinzel text-[#f2c377] text-sm font-bold mb-3 uppercase tracking-wider">{title}</h3>
    {children}
  </section>
);

const RelatedSection: React.FC<{ title: string; value: unknown }> = ({ title, value }) => {
  const values = displayValues(value);
  if (values.length === 0) return null;
  return (
    <InfoSection title={title}>
      <ul className="space-y-2 text-sm text-[#d2c4b3]/80">
        {values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </InfoSection>
  );
};

const Panchanga: React.FC<{ occurrence: NonNullable<FestivalDetail['occurrence']> }> = ({ occurrence }) => {
  const items = [
    ['Tithi', [occurrence.paksha, occurrence.tithi_name].filter(Boolean).join(' ')],
    ['Nakshatra', occurrence.nakshatra_name ?? ''],
    ['Yoga', occurrence.yoga_name ?? ''],
  ].filter(([, value]) => value);
  if (items.length === 0) return null;
  return (
    <InfoSection title="Panchanga">
      <div className="grid grid-cols-2 gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="bg-[#0A0A0A]/60 rounded-lg p-2.5">
            <p className="text-[10px] text-[#d2c4b3]/50 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xs text-[#f2c377] font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </InfoSection>
  );
};

const FestivalTimings: React.FC<{ occurrence: NonNullable<FestivalDetail['occurrence']> }> = ({ occurrence }) => {
  const timingRows: Array<{
    label: string;
    start: string | null;
    end: string | null;
    color: string;
    isBad: boolean;
  }> = [
    { label: 'Shubha Muhurta', start: occurrence.shubha_muhurta_start, end: occurrence.shubha_muhurta_end, color: 'text-[#f2c377]', isBad: false },
    { label: 'Puja Time', start: occurrence.puja_time_start, end: occurrence.puja_time_end, color: 'text-[#f2c377]', isBad: false },
    { label: 'Rahu Kalam', start: occurrence.rahu_kalam_start, end: occurrence.rahu_kalam_end, color: 'text-red-400', isBad: true },
    { label: 'Yamagandam', start: occurrence.yamagandam_start, end: occurrence.yamagandam_end, color: 'text-red-400', isBad: true },
    { label: 'Gulika', start: occurrence.gulika_kalam_start, end: occurrence.gulika_kalam_end, color: 'text-orange-400', isBad: true },
  ];
  const timings = timingRows.filter(item => formatTime(item.start) || formatTime(item.end));
  const custom = entries(occurrence.custom_timings).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const label = text(record.name ?? record.title);
    const start = formatFestivalClock(record.start);
    const end = formatFestivalClock(record.end);
    return label && (start || end) ? [{ label, start, end, description: text(record.description) }] : [];
  });
  if (timings.length === 0 && custom.length === 0) return null;
  return (
    <InfoSection title="Timings (Asia/Kolkata ? IST)">
      <div className="space-y-2">
        {timings.map(({ label, start, end, color, isBad }) => (
          <TimingRow
            key={label}
            label={label}
            start={formatTime(start)}
            end={formatTime(end)}
            color={color}
            isBad={isBad}
          />
        ))}
        {custom.map(item => (
          <div key={item.label}><TimingRow label={item.label} start={item.start} end={item.end} color="text-[#f2c377]" />{item.description && <p className="text-xs text-[#d2c4b3]/70">{item.description}</p>}</div>
        ))}
      </div>
    </InfoSection>
  );
};

const TimingRow: React.FC<{ label: string; start: string; end: string; color: string; isBad?: boolean }> = ({
  label,
  start,
  end,
  color,
  isBad,
}) => (
  <div className="flex justify-between items-center py-2 border-b border-[#4e4539]/20 last:border-0">
    <div className="flex items-center gap-2">
      {isBad && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
      <span className="text-xs text-[#d2c4b3]/70">{label}</span>
    </div>
    <span className={`text-xs font-semibold ${color}`}>{[start, end].filter(Boolean).join(' – ')}</span>
  </div>
);
