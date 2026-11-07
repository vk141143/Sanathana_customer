import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Festival,
  FestivalContent,
  FestivalDetail,
  FestivalListItem,
  FestivalMedia,
  FestivalOccurrence,
  FestivalSettings,
} from '../types';

export const FESTIVAL_COLUMNS =
  'id,name,alternate_name,slug,festival_type,short_description,primary_deity,associated_deities,tradition,status,is_active,cover_media_id,created_at,updated_at';
export const OCCURRENCE_COLUMNS =
  'id,festival_id,year,festival_date,tithi_name,paksha,nakshatra_name,yoga_name,shubha_muhurta_start,shubha_muhurta_end,puja_time_start,puja_time_end,rahu_kalam_start,rahu_kalam_end,yamagandam_start,yamagandam_end,gulika_kalam_start,gulika_kalam_end,fasting_enabled,fasting_type,parana_required,parana_time,fasting_rules,custom_timings,status';
export const CONTENT_COLUMNS =
  'id,festival_id,occurrence_id,festival_description,spiritual_significance,festival_story,scriptural_references,puja_name,puja_duration_minutes,puja_description,puja_samagri,puja_vidhi,story_r2_key,story_r2_url,puja_r2_key,puja_r2_url,related_scriptures,related_slokas,related_mantras,related_stotrams,related_music,related_stories,created_at,updated_at';
export const MEDIA_COLUMNS =
  'id,festival_id,occurrence_id,media_type,storage_key,public_url,file_name,mime_type,file_size,display_order,title,description,r2_key,duration_seconds,language_code,alt_text,caption,sort_order,is_cover';
export const SETTINGS_COLUMNS =
  'id,festival_id,show_on_home,is_featured,priority,show_from,show_until,show_in_calendar';

const FESTIVALS_LIST_CACHE_TTL = 15 * 60 * 1000;
const FESTIVAL_DETAIL_CACHE_TTL = 15 * 60 * 1000;

type FestivalClient = SupabaseClient;

function logQueryError(operation: string, error: unknown): void {
  if (typeof import.meta.env === 'undefined' || !import.meta.env.DEV) return;
  const details = error && typeof error === 'object'
    ? {
        code: 'code' in error ? error.code : undefined,
        message: 'message' in error ? error.message : undefined,
        details: 'details' in error ? error.details : undefined,
        hint: 'hint' in error ? error.hint : undefined,
      }
    : error;
  console.error(`[festivals] ${operation} failed; verify Supabase grants and RLS policies.`, details);
}

function throwOnError(operation: string, error: unknown): void {
  if (!error) return;
  logQueryError(operation, error);
  throw error instanceof Error ? error : new Error(`Failed to ${operation}.`);
}

export function hasActiveVisibilityWindow(settings: FestivalSettings | null, today: string): boolean {
  if (!settings) return true;
  return (!settings.show_from || settings.show_from <= today)
    && (!settings.show_until || settings.show_until >= today);
}

function compareOccurrenceDate(a: FestivalListItem, b: FestivalListItem): number {
  const aDate = a.occurrence?.festival_date ?? '9999-12-31';
  const bDate = b.occurrence?.festival_date ?? '9999-12-31';
  return aDate.localeCompare(bDate)
    || (b.settings?.priority ?? 0) - (a.settings?.priority ?? 0)
    || a.name.localeCompare(b.name);
}

function isImageMedia(item: FestivalMedia): boolean {
  return ['banner', 'image', 'gallery'].includes(item.media_type) && isFestivalUrl(item.public_url);
}

export function selectCurrentYearOccurrence(
  occurrences: FestivalOccurrence[],
  year: number,
): FestivalOccurrence | null {
  return occurrences.find(occurrence =>
    occurrence.year === year && occurrence.status === 'published'
  ) ?? null;
}

export function selectRelevantOccurrence(
  occurrences: FestivalOccurrence[],
  year: number,
): FestivalOccurrence | null {
  const published = occurrences
    .filter(occurrence => occurrence.status === 'published')
    .sort((a, b) => a.year - b.year || a.festival_date.localeCompare(b.festival_date));
  const past = published.filter(occurrence => occurrence.year < year);
  return selectCurrentYearOccurrence(published, year)
    ?? published.find(occurrence => occurrence.year > year)
    ?? past[past.length - 1]
    ?? null;
}

export function selectFestivalContent(
  contentRows: FestivalContent[],
  occurrenceId: string | null,
): FestivalContent | null {
  const matching = contentRows.filter(row => occurrenceId !== null && row.occurrence_id === occurrenceId);
  const scope = matching.length ? matching : contentRows.filter(row => row.occurrence_id === null);
  if (scope.length > 1) console.warn('[festivals] Duplicate content rows for selected scope; using latest updated_at.');
  return [...scope].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '') || a.id.localeCompare(b.id))[0] ?? null;
}

export function selectFestivalCover(
  festival: Festival,
  media: FestivalMedia[],
): FestivalMedia | null {
  const ordered = media.filter(isImageMedia).sort((a, b) =>
    (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0) || a.id.localeCompare(b.id)
  );
  return ordered.find(item => item.id === festival.cover_media_id)
    ?? ordered.find(item => item.is_cover)
    ?? null;
}

export function mapFestivalListData(
  festivals: Festival[],
  occurrences: FestivalOccurrence[],
  media: FestivalMedia[],
  settings: FestivalSettings[],
  year: number,
  today: string,
): FestivalListItem[] {
  const occurrenceByFestival = new Map<string, FestivalOccurrence>();
  for (const occurrence of occurrences) {
    if (occurrence.status === 'published' && occurrence.year === year) {
      occurrenceByFestival.set(occurrence.festival_id, occurrence);
    }
  }
  const settingsByFestival = new Map(settings.map(setting => [setting.festival_id, setting]));
  const byFestival = new Map<string, FestivalMedia[]>();
  for (const item of media) {
    const items = byFestival.get(item.festival_id) ?? [];
    items.push(item);
    byFestival.set(item.festival_id, items);
  }

  return festivals
    .filter(festival => festival.status === 'Published' && festival.is_active)
    .map(festival => {
      const occurrence = occurrenceByFestival.get(festival.id) ?? null;
      const festivalMedia = (byFestival.get(festival.id) ?? []).filter(item =>
        item.occurrence_id === null || item.occurrence_id === occurrence?.id
      );
      return {
        ...festival,
        occurrence,
        settings: settingsByFestival.get(festival.id) ?? null,
        coverMedia: selectFestivalCover(festival, festivalMedia),
      };
    })
    .sort(compareOccurrenceDate);
}

function currentDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function currentFestivalYear(): number {
  return Number(new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
  }).format(new Date()));
}

export function filterFestivalList(
  festivals: FestivalListItem[],
  searchQuery: string,
  selectedType: string,
): FestivalListItem[] {
  const query = searchQuery.trim().toLowerCase();
  return festivals.filter(festival => {
    const matchesSearch = !query || [
      festival.name,
      festival.alternate_name ?? '',
      festival.primary_deity ?? '',
    ].join(' ').toLowerCase().includes(query);
    const normalizeType = (value: string) => value.toLowerCase().replace(/_/g, ' ');
    const matchesType = selectedType === 'All'
      || normalizeType(festival.festival_type) === normalizeType(selectedType);
    return matchesSearch && matchesType;
  });
}

export function isFestivalListCache(value: unknown): value is FestivalListItem[] {
  return Array.isArray(value) && value.every(item =>
    item !== null
    && typeof item === 'object'
    && 'id' in item && typeof item.id === 'string'
    && 'name' in item && typeof item.name === 'string'
    && 'festival_type' in item && typeof item.festival_type === 'string'
    && 'occurrence' in item
    && (item.occurrence === null || typeof item.occurrence === 'object')
    && 'settings' in item
    && (item.settings === null || typeof item.settings === 'object')
    && 'coverMedia' in item
    && (item.coverMedia === null || typeof item.coverMedia === 'object')
  );
}

export function isFestivalDetailCache(value: unknown): value is FestivalDetail {
  return value !== null
    && typeof value === 'object'
    && 'id' in value && typeof value.id === 'string'
    && 'name' in value && typeof value.name === 'string'
    && 'festival_type' in value && typeof value.festival_type === 'string'
    && 'occurrence' in value
    && (value.occurrence === null || typeof value.occurrence === 'object')
    && 'content' in value
    && (value.content === null || typeof value.content === 'object')
    && 'media' in value
    && Array.isArray(value.media)
    && 'settings' in value
    && (value.settings === null || typeof value.settings === 'object')
    && 'coverMedia' in value
    && (value.coverMedia === null || typeof value.coverMedia === 'object');
}

export function isFestivalUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}

export const FESTIVAL_MEDIA_TYPES = ['image', 'banner', 'gallery', 'audio', 'video', 'story_json', 'puja_json'];

// Each request is bounded; parent IDs are batched, never fetched once per card.
async function allRows<T>(query: () => any, operation: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499);
    throwOnError(operation, error);
    const page = Array.isArray(data) ? data : [];
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

export function homeFestivalItems(rows: FestivalListItem[], today = currentDate()): FestivalListItem[] {
  return rows.filter(row => row.status === 'Published' && row.is_active && row.settings?.show_on_home && hasActiveVisibilityWindow(row.settings, today))
    .sort((a, b) => (b.settings?.priority ?? 0) - (a.settings?.priority ?? 0) || compareOccurrenceDate(a, b));
}

export async function fetchFestivalList(client: FestivalClient, year = currentFestivalYear()): Promise<FestivalListItem[]> {
  const festivals = await allRows<Festival>(() => client.from('festivals').select(FESTIVAL_COLUMNS)
    .eq('status', 'Published').eq('is_active', true).order('id'), 'load published festivals');
  const visible = festivals.filter(row => row.status === 'Published' && row.is_active);
  const occurrences: FestivalOccurrence[] = [], media: FestivalMedia[] = [], settings: FestivalSettings[] = [];
  for (let offset = 0; offset < visible.length; offset += 100) {
    const ids = visible.slice(offset, offset + 100).map(row => row.id);
    const [o, m, s] = await Promise.all([
      allRows<FestivalOccurrence>(() => client.from('festival_occurrences').select(OCCURRENCE_COLUMNS).in('festival_id', ids)
        .eq('year', year).eq('status', 'published').order('id'), 'load published occurrences'),
      allRows<FestivalMedia>(() => client.from('festival_media').select(MEDIA_COLUMNS).in('festival_id', ids)
        .in('media_type', FESTIVAL_MEDIA_TYPES).order('id'), 'load festival media'),
      allRows<FestivalSettings>(() => client.from('festival_settings').select(SETTINGS_COLUMNS).in('festival_id', ids)
        .order('festival_id'), 'load festival settings'),
    ]);
    occurrences.push(...o); media.push(...m); settings.push(...s);
  }
  return mapFestivalListData(visible, occurrences, media, settings, year, currentDate());
}

export async function fetchFestivalDetail(festivalId: string, client: FestivalClient,
  year = currentFestivalYear(), requestedOccurrenceId?: string | null): Promise<FestivalDetail | null> {
  const { data: festival, error } = await client.from('festivals').select(FESTIVAL_COLUMNS)
    .eq('id', festivalId).eq('status', 'Published').eq('is_active', true).maybeSingle();
  throwOnError('load published festival', error);
  if (!festival || festival.status !== 'Published' || !festival.is_active) return null;
  const occurrences = await allRows<FestivalOccurrence>(() => client.from('festival_occurrences').select(OCCURRENCE_COLUMNS)
    .eq('festival_id', festivalId).eq('status', 'published').order('id'), 'load published occurrences');
  const occurrence = requestedOccurrenceId
    ? occurrences.find(row => row.id === requestedOccurrenceId && row.status === 'published') ?? null
    : selectRelevantOccurrence(occurrences, year);
  if (requestedOccurrenceId && !occurrence) return null;
  const [contentRows, mediaRows, settingsRows] = await Promise.all([
    allRows<FestivalContent>(() => client.from('festival_content').select(CONTENT_COLUMNS).eq('festival_id', festivalId).order('id'), 'load festival content'),
    allRows<FestivalMedia>(() => client.from('festival_media').select(MEDIA_COLUMNS).eq('festival_id', festivalId)
      .in('media_type', FESTIVAL_MEDIA_TYPES).order('id'), 'load festival media'),
    allRows<FestivalSettings>(() => client.from('festival_settings').select(SETTINGS_COLUMNS).eq('festival_id', festivalId).order('festival_id'), 'load festival settings'),
  ]);
  const media = mediaRows.filter(item => item.occurrence_id === null || item.occurrence_id === occurrence?.id)
    .sort((a, b) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0) || a.id.localeCompare(b.id));
  return { ...festival, occurrence, content: selectFestivalContent(contentRows, occurrence?.id ?? null),
    media, settings: settingsRows[0] ?? null, coverMedia: selectFestivalCover(festival, media) };
}

export const festivalCache = {
  listKey(year: number): string {
    return `festivals_list_v2_${year}`;
  },
  detailKey(festivalId: string): string {
    return `festival_detail_v2_${festivalId}_${currentFestivalYear()}`;
  },
  listTtl: FESTIVALS_LIST_CACHE_TTL,
  detailTtl: FESTIVAL_DETAIL_CACHE_TTL,
};
