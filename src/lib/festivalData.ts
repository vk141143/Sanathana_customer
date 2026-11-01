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

const FESTIVAL_COLUMNS =
  'id,name,alternate_name,slug,festival_type,short_description,primary_deity,associated_deities,tradition,status,is_active,cover_media_id,created_at,updated_at';
const OCCURRENCE_COLUMNS =
  'id,festival_id,year,festival_date,tithi_name,paksha,nakshatra_name,yoga_name,shubha_muhurta_start,shubha_muhurta_end,puja_time_start,puja_time_end,rahu_kalam_start,rahu_kalam_end,yamagandam_start,yamagandam_end,gulika_kalam_start,gulika_kalam_end,fasting_enabled,fasting_type,parana_required,parana_time,fasting_rules,custom_timings,status';
const CONTENT_COLUMNS =
  'id,festival_id,occurrence_id,festival_description,spiritual_significance,festival_story,scriptural_references,puja_name,puja_duration_minutes,puja_description,puja_samagri,puja_vidhi,story_r2_key,story_r2_url,puja_r2_key,puja_r2_url,related_scriptures,related_slokas,related_mantras,related_stotrams,related_music,related_stories,created_at,updated_at';
const MEDIA_COLUMNS =
  'id,festival_id,occurrence_id,media_type,storage_key,public_url,file_name,mime_type,file_size,display_order,title,description,r2_key,duration_seconds,language_code,alt_text,caption,sort_order,is_cover';
const SETTINGS_COLUMNS =
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

function hasActiveVisibilityWindow(settings: FestivalSettings | null, today: string): boolean {
  if (!settings) return true;
  return (!settings.show_from || settings.show_from <= today)
    && (!settings.show_until || settings.show_until >= today);
}

function compareOccurrenceDate(a: FestivalListItem, b: FestivalListItem): number {
  const aDate = a.occurrence?.festival_date ?? '9999-12-31';
  const bDate = b.occurrence?.festival_date ?? '9999-12-31';
  return aDate.localeCompare(bDate)
    || (a.settings?.priority ?? 0) - (b.settings?.priority ?? 0)
    || a.name.localeCompare(b.name);
}

function isImageMedia(item: FestivalMedia): boolean {
  return ['banner', 'image', 'gallery'].includes(item.media_type) && !!item.public_url;
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
  return contentRows.find(row => row.occurrence_id === occurrenceId && occurrenceId !== null)
    ?? contentRows.find(row => row.occurrence_id === null)
    ?? null;
}

export function selectFestivalCover(
  festival: Festival,
  media: FestivalMedia[],
): FestivalMedia | null {
  const ordered = media.filter(isImageMedia).sort((a, b) =>
    a.sort_order - b.sort_order || a.display_order - b.display_order
  );
  return ordered.find(item => item.id === festival.cover_media_id)
    ?? ordered.find(item => item.is_cover)
    ?? ordered[0]
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
    .filter(festival => hasActiveVisibilityWindow(festival.settings, today))
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

export async function fetchFestivalList(
  client: FestivalClient,
  year = currentFestivalYear(),
): Promise<FestivalListItem[]> {
  const { data: festivals, error: festivalError } = await client
    .from('festivals')
    .select(FESTIVAL_COLUMNS)
    .eq('status', 'Published')
    .eq('is_active', true)
    .order('name', { ascending: true });
  throwOnError('load published festivals', festivalError);
  const publishedFestivals = (festivals ?? []) as Festival[];
  if (publishedFestivals.length === 0) return [];

  const festivalIds = publishedFestivals.map(festival => festival.id);
  const [occurrencesResult, mediaResult, settingsResult] = await Promise.all([
    client
      .from('festival_occurrences')
      .select(OCCURRENCE_COLUMNS)
      .in('festival_id', festivalIds)
      .eq('year', year)
      .eq('status', 'published'),
    client
      .from('festival_media')
      .select(MEDIA_COLUMNS)
      .in('festival_id', festivalIds)
      .order('sort_order', { ascending: true })
      .order('display_order', { ascending: true }),
    client
      .from('festival_settings')
      .select(SETTINGS_COLUMNS)
      .in('festival_id', festivalIds),
  ]);
  throwOnError('load published festival occurrences', occurrencesResult.error);
  throwOnError('load festival media', mediaResult.error);
  throwOnError('load festival display settings', settingsResult.error);

  return mapFestivalListData(
    publishedFestivals,
    (occurrencesResult.data ?? []) as FestivalOccurrence[],
    (mediaResult.data ?? []) as FestivalMedia[],
    (settingsResult.data ?? []) as FestivalSettings[],
    year,
    currentDate(),
  );
}

export async function fetchFestivalDetail(
  festivalId: string,
  client: FestivalClient,
  year = currentFestivalYear(),
): Promise<FestivalDetail | null> {
  const { data: festival, error: festivalError } = await client
    .from('festivals')
    .select(FESTIVAL_COLUMNS)
    .eq('id', festivalId)
    .eq('status', 'Published')
    .eq('is_active', true)
    .maybeSingle();
  throwOnError('load published festival', festivalError);
  if (!festival) return null;

  const [occurrencesResult, contentResult, mediaResult, settingsResult] = await Promise.all([
    client
      .from('festival_occurrences')
      .select(OCCURRENCE_COLUMNS)
      .eq('festival_id', festivalId)
      .eq('status', 'published')
      .order('year', { ascending: true }),
    client
      .from('festival_content')
      .select(CONTENT_COLUMNS)
      .eq('festival_id', festivalId),
    client
      .from('festival_media')
      .select(MEDIA_COLUMNS)
      .eq('festival_id', festivalId)
      .order('sort_order', { ascending: true })
      .order('display_order', { ascending: true }),
    client
      .from('festival_settings')
      .select(SETTINGS_COLUMNS)
      .eq('festival_id', festivalId)
      .maybeSingle(),
  ]);
  throwOnError('load published festival occurrences', occurrencesResult.error);
  throwOnError('load festival content', contentResult.error);
  throwOnError('load festival media', mediaResult.error);
  throwOnError('load festival display settings', settingsResult.error);

  const master = festival as Festival;
  const occurrence = selectRelevantOccurrence(
    (occurrencesResult.data ?? []) as FestivalOccurrence[],
    year,
  );
  const content = selectFestivalContent(
    (contentResult.data ?? []) as FestivalContent[],
    occurrence?.id ?? null,
  );
  const relatedMedia = ((mediaResult.data ?? []) as FestivalMedia[])
    .filter(item => item.occurrence_id === null || item.occurrence_id === occurrence?.id);
  return {
    ...master,
    occurrence,
    content,
    media: relatedMedia,
    settings: (settingsResult.data as FestivalSettings | null) ?? null,
    coverMedia: selectFestivalCover(master, relatedMedia),
  };
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
