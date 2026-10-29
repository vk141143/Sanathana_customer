export const PRACTICE_CATEGORIES = [
  'meditation',
  'japa',
  'mantra',
  'gratitude',
  'scripture_reading',
] as const;

export type PracticeCategory = typeof PRACTICE_CATEGORIES[number];
export type CompletionRule =
  | 'manual'
  | 'timer_elapsed'
  | 'repetitions_reached'
  | 'entries_submitted'
  | 'audio_completed';

export interface SadhanaPractice {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  category: PracticeCategory;
  instructions: string | null;
  difficulty: string | null;
  practice_mode: string | null;
  target_type: string | null;
  target_count: number | null;
  target_unit: string | null;
  duration_minutes: number | null;
  completion_rule: CompletionRule | null;
  time_of_day: string | null;
  is_featured: boolean;
  benefits: string[];
  tags: string[];
  category_config: Record<string, unknown>;
  cover_image_url: string | null;
  guided_audio_url: string | null;
  ambient_audio_url: string | null;
  media_type: string | null;
  media_url: string | null;
  display_order: number;
  is_active: boolean;
  archived_at: string | null;
}

export interface PracticeRuntimeState {
  elapsedSeconds: number;
  repetitions: number;
  submittedEntries: number;
  audioCompleted: boolean;
  manuallyCompleted: boolean;
}

export const PRACTICE_COLUMNS = [
  'id',
  'name',
  'slug',
  'subtitle',
  'description',
  'category',
  'instructions',
  'difficulty',
  'practice_mode',
  'target_type',
  'target_count',
  'target_unit',
  'duration_minutes',
  'completion_rule',
  'time_of_day',
  'is_featured',
  'benefits',
  'tags',
  'category_config',
  'cover_image_url',
  'guided_audio_url',
  'ambient_audio_url',
  'media_type',
  'media_url',
  'display_order',
  'is_active',
  'archived_at',
].join(',');
type PracticeQueryResult = {
  data: unknown[] | null;
  error: { code?: string; message: string } | null;
};
type PracticeQuery = () => PromiseLike<PracticeQueryResult>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const optionalNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function normalizeSadhanaPractice(value: unknown): SadhanaPractice | null {
  const row = asRecord(value);
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.slug !== 'string' ||
    !PRACTICE_CATEGORIES.includes(row.category as PracticeCategory)
  ) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subtitle: optionalString(row.subtitle),
    description: optionalString(row.description),
    category: row.category as PracticeCategory,
    instructions: optionalString(row.instructions),
    difficulty: optionalString(row.difficulty),
    practice_mode: optionalString(row.practice_mode),
    target_type: optionalString(row.target_type),
    target_count: optionalNumber(row.target_count),
    target_unit: optionalString(row.target_unit),
    duration_minutes: optionalNumber(row.duration_minutes),
    completion_rule: optionalString(row.completion_rule) as CompletionRule | null,
    time_of_day: optionalString(row.time_of_day),
    is_featured: row.is_featured === true,
    benefits: stringList(row.benefits),
    tags: stringList(row.tags),
    category_config: asRecord(row.category_config),
    cover_image_url: optionalString(row.cover_image_url),
    guided_audio_url: optionalString(row.guided_audio_url),
    ambient_audio_url: optionalString(row.ambient_audio_url),
    media_type: optionalString(row.media_type),
    media_url: optionalString(row.media_url),
    display_order: optionalNumber(row.display_order) ?? 0,
    is_active: row.is_active === true,
    archived_at: optionalString(row.archived_at),
  };
}

export function filterVisiblePractices(practices: SadhanaPractice[]): SadhanaPractice[] {
  return practices
    .filter(practice => practice.is_active && practice.archived_at === null)
    .sort((left, right) => left.display_order - right.display_order || left.name.localeCompare(right.name));
}

const defaultPracticeQuery: PracticeQuery = async () => {
  const { supabase } = await import('../../lib/supabase');
  return supabase
    .from('sadhana_practices')
    .select(PRACTICE_COLUMNS)
    .eq('is_active', true)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
};

export async function fetchActiveSadhanaPractices(
  query: PracticeQuery = defaultPracticeQuery,
): Promise<SadhanaPractice[]> {
  const pending = activeCatalogRequests.get(query);
  if (pending) return pending;
  const request = (async () => {
    const { data, error } = await query();

    if (error) {
      console.error('Sadhana practice catalogue fetch failed:', { code: error.code, message: error.message });
      throw new Error('Unable to load Sadhana practices. Please retry.');
    }

    return filterVisiblePractices((data ?? [])
      .map(normalizeSadhanaPractice)
      .filter((practice): practice is SadhanaPractice => practice !== null));
  })();
  activeCatalogRequests.set(query, request);
  try {
    return await request;
  } finally {
    if (activeCatalogRequests.get(query) === request) activeCatalogRequests.delete(query);
  }
}

const activeCatalogRequests = new Map<PracticeQuery, Promise<SadhanaPractice[]>>();

export function getLocalizedPracticeText(
  practice: SadhanaPractice,
  field: 'meaning' | 'instructions',
  preferredLanguage: string,
): string | null {
  const localizedContent = asRecord(practice.category_config.localized_content);
  const baseLanguage = preferredLanguage.split('-')[0];
  const languageContent = asRecord(localizedContent[preferredLanguage] ?? localizedContent[baseLanguage]);
  const localized = optionalString(languageContent[field]);
  if (localized) return localized;
  return field === 'instructions'
    ? practice.instructions
    : optionalString(practice.category_config.meaning);
}

export function getPracticeTarget(practice: SadhanaPractice): { value: number; unit: string } | null {
  if (practice.target_type === 'duration') {
    const unit = practice.target_unit?.toLowerCase();
    const durationUnit = unit && /^(seconds?|minutes?|hours?)$/.test(unit) ? unit : null;
    // Older admin records may retain "repetitions" after switching to timer mode.
    const value = durationUnit ? practice.target_count ?? practice.duration_minutes
      : practice.duration_minutes ?? practice.target_count;
    return value === null || value <= 0 ? null : { value, unit: durationUnit ?? 'minutes' };
  }
  if (practice.target_type === 'repetitions' || practice.target_type === 'entries' ||
      practice.target_type === 'verses' || practice.target_type === 'chapters') {
    const preset = practice.category === 'japa' && practice.category_config.counter_enabled === true
      ? optionalNumber(practice.category_config.count_preset)
      : null;
    const count = practice.target_count ?? preset;
    return count === null || !Number.isSafeInteger(count) || count <= 0 ? null : {
      value: count,
      unit: practice.target_unit ?? practice.target_type,
    };
  }
  if (!practice.target_type && practice.practice_mode === 'timer' && practice.duration_minutes !== null && practice.duration_minutes > 0) {
    return { value: practice.duration_minutes, unit: 'minutes' };
  }
  return null;
}

export function isPracticeComplete(
  practice: SadhanaPractice,
  state: PracticeRuntimeState,
): boolean {
  const rule = practice.completion_rule ?? 'manual';
  const target = getPracticeTarget(practice);
  switch (rule) {
    case 'manual':
      return state.manuallyCompleted;
    case 'timer_elapsed': {
      if (!target || (practice.target_type && practice.target_type !== 'duration')) return false;
      const unit = target.unit.toLowerCase();
      const targetSeconds = target.value * (unit.startsWith('hour') ? 3600 : unit.startsWith('sec') ? 1 : 60);
      return state.elapsedSeconds >= targetSeconds;
    }
    case 'repetitions_reached':
      return practice.target_type === 'repetitions' && !!target && state.repetitions >= target.value;
    case 'entries_submitted':
      return practice.target_type === 'entries' && !!target && state.submittedEntries >= target.value;
    case 'audio_completed':
      return state.audioCompleted && state.manuallyCompleted;
    default:
      return false;
  }
}

export function getPracticeMantraText(practice: SadhanaPractice): string | null {
  return optionalString(practice.category_config.mantra_text);
}

export function isCounterEnabled(practice: SadhanaPractice): boolean {
  return practice.category === 'japa' &&
    practice.category_config.counter_enabled === true;
}

export function getRepetitionTarget(practice: SadhanaPractice): number | null {
  const value = practice.target_type === 'repetitions'
    ? practice.target_count ?? optionalNumber(practice.category_config.count_preset)
    : optionalNumber(practice.category_config.count_preset);
  return value !== null && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function isMalaCounterEnabled(practice: SadhanaPractice): boolean {
  const value = practice.category_config.mala_counter;
  if (value === true) return true;
  return asRecord(value).enabled === true;
}

export function isSafePlayableUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getPracticeMedia(practice: SadhanaPractice): Array<{ label: string; url: string }> {
  const media: Array<{ label: string; url: string }> = [];
  if (isSafePlayableUrl(practice.guided_audio_url)) media.push({ label: 'Guided audio', url: practice.guided_audio_url });
  if (isSafePlayableUrl(practice.ambient_audio_url)) media.push({ label: 'Ambient audio', url: practice.ambient_audio_url });
  if (!media.length && practice.media_type && /audio/i.test(practice.media_type) && isSafePlayableUrl(practice.media_url)) {
    media.push({ label: 'Audio', url: practice.media_url });
  }
  return media;
}

export function getPracticePresentation(practice: SadhanaPractice, preferredLanguage = 'en') {
  const config = practice.category_config;
  return {
    mantraName: optionalString(config.mantra_name),
    mantraText: getPracticeMantraText(practice),
    transliteration: optionalString(config.transliteration),
    meaning: getLocalizedPracticeText(practice, 'meaning', preferredLanguage),
    instructions: getLocalizedPracticeText(practice, 'instructions', preferredLanguage),
    prompts: stringList(config.prompts),
    breathingGuidance: optionalString(config.breathing_guidance),
    beginInstructions: optionalString(config.begin_instructions),
    endInstructions: optionalString(config.end_instructions),
    scriptureName: optionalString(config.scripture_name),
    scriptureChapter: optionalNumber(config.chapter_number),
    startVerse: optionalNumber(config.start_verse),
    endVerse: optionalNumber(config.end_verse),
    media: getPracticeMedia(practice),
  };
}
