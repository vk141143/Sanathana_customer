import { supabase } from './supabase';

export const FALLBACK_SCRIPTURE_IMAGE =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80';

export interface PublishedScripture {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  status?: string;
  image?: string;
}

export interface PublishedChapter {
  id: string;
  scripture_id: string;
  chapter_number: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  sloka_count?: number;
  number?: number;
  totalVerses?: number;
  image?: string;
  status?: string;
}

export interface DynamicVerse {
  id: string;
  chapterNumber: number;
  verseNumber: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  explanation: string;
  meaning?: string;
  example?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  ta: 'தமிழ்',
  sa: 'संस्कृत',
};

const normalizeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const normalizeLanguageCode = (value: unknown): string => {
  const raw = normalizeString(value, '').trim().toLowerCase();
  return raw.replace(/[^a-z]/g, '');
};

const parseLanguageList = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(item => normalizeLanguageCode(item))
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  if (typeof value === 'object') {
    return Object.keys(value)
      .map(key => normalizeLanguageCode(key))
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  const text = normalizeString(value, '');
  return text
    .split(/[\s,|]+/)
    .map(item => normalizeLanguageCode(item))
    .filter(Boolean);
};

const getScriptureCoverUrl = (row: any): string => {
  const url = normalizeString(row.cover_image_url ?? row.coverImageUrl ?? row.image_url ?? row.imageUrl ?? row.coverUrl, '');
  return url || FALLBACK_SCRIPTURE_IMAGE;
};

export const normalizePublishedScripture = (row: any): PublishedScripture => ({
  id: normalizeString(row.id, ''),
  name: normalizeString(row.name ?? row.title, 'Untitled scripture'),
  description: normalizeString(row.description ?? row.summary ?? row.short_description ?? '', ''),
  cover_image_url: getScriptureCoverUrl(row),
  status: normalizeString(row.status, ''),
  image: getScriptureCoverUrl(row),
});

export const normalizePublishedChapter = (row: any): PublishedChapter => {
  const chapterNumber = Number(row.chapter_number ?? row.chapterNumber ?? row.number ?? 0);
  const titleText = normalizeString(row.title ?? row.name ?? `Chapter ${chapterNumber}`, '');
  const subtitleText = normalizeString(row.subtitle ?? row.short_title ?? row.subTitle ?? '', '');
  const imageUrl = normalizeString(row.image_url ?? row.imageUrl ?? row.cover_image_url ?? row.coverImageUrl ?? '', '');

  return {
    id: normalizeString(row.id, ''),
    scripture_id: normalizeString(row.scripture_id ?? row.scriptureId, ''),
    chapter_number: chapterNumber,
    title: titleText,
    subtitle: subtitleText,
    description: normalizeString(row.description ?? row.summary ?? '', ''),
    image_url: imageUrl,
    sloka_count: Number(row.sloka_count ?? row.slokaCount ?? row.total_verses ?? row.totalVerses ?? 0),
    number: chapterNumber,
    totalVerses: Number(row.sloka_count ?? row.slokaCount ?? row.total_verses ?? row.totalVerses ?? 0),
    image: imageUrl || FALLBACK_SCRIPTURE_IMAGE,
    status: normalizeString(row.status, ''),
  };
};

export async function fetchPublishedScriptures(): Promise<PublishedScripture[]> {
  const { data, error } = await supabase
    .from('scriptures')
    .select('*')
    .eq('status', 'Published')
    .order('name', { ascending: true });

  if (error) {
    console.error('Scripture fetch failed:', error.message);
    return [];
  }

  return (data ?? []).map(normalizePublishedScripture).filter(item => item.id);
}

export async function fetchPublishedChapters(scriptureId: string): Promise<PublishedChapter[]> {
  if (!scriptureId) return [];

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('scripture_id', scriptureId)
    .eq('status', 'Published')
    .order('chapter_number', { ascending: true });

  if (error) {
    console.error('Chapter fetch failed:', error.message);
    return [];
  }

  return (data ?? [])
    .map(normalizePublishedChapter)
    .filter(item => item.id)
    .sort((a, b) => (a.chapter_number ?? 0) - (b.chapter_number ?? 0));
}

export interface SlokaMetadata {
  id: string;
  chapter_id: string;
  verse_number: number;
  verse_id: string;
  json_url: string;
  status?: string;
}

export async function fetchPublishedSlokas(chapterId: string): Promise<SlokaMetadata[]> {
  if (!chapterId) return [];
  const { data, error } = await supabase
    .from('slokas')
    .select('id, chapter_id, verse_number, verse_id, json_url, status')
    .eq('chapter_id', chapterId)
    .eq('status', 'Published')
    .order('verse_number', { ascending: true });
  if (error) {
    console.error('Slokas fetch failed:', error.message);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: normalizeString(row.id, ''),
    chapter_id: normalizeString(row.chapter_id, ''),
    verse_number: Number(row.verse_number ?? 0),
    verse_id: normalizeString(row.verse_id ?? row.id, ''),
    json_url: normalizeString(row.json_url ?? '', ''),
    status: normalizeString(row.status, ''),
  })).filter(s => s.id && s.json_url);
}

export async function fetchSlokaJson(jsonUrl: string): Promise<any> {
  if (!jsonUrl) throw new Error('No json_url provided');
  const response = await fetch(jsonUrl);
  if (!response.ok) throw new Error(`R2 fetch failed: ${response.status}`);
  return response.json();
}

export async function fetchAvailableLanguagesForChapter(scriptureId: string, chapterId: string): Promise<string[]> {
  if (!scriptureId || !chapterId) return [];

  const hasChapterMetadata = await supabase
    .from('chapters')
    .select('id, available_languages, language_codes, languages, status')
    .eq('id', chapterId)
    .maybeSingle();

  if (!hasChapterMetadata.error && hasChapterMetadata.data) {
    const chapterMeta = hasChapterMetadata.data as any;
    const languages = parseLanguageList(
      chapterMeta.available_languages ?? chapterMeta.language_codes ?? chapterMeta.languages ?? chapterMeta.languageList ?? chapterMeta.locales
    );
    if (languages.length) return languages;
  }

  const { data, error } = await supabase
    .from('slokas')
    .select('id, json_url, status')
    .eq('chapter_id', chapterId)
    .eq('status', 'Published')
    .limit(1);

  if (error || !data?.length) {
    console.error('Language metadata fetch failed:', error?.message);
    return [];
  }

  // Languages live inside the R2 JSON — fetch the first sloka to discover them
  const firstRow = (data as any[])[0];
  const jsonUrl = normalizeString(firstRow?.json_url ?? '', '');
  if (!jsonUrl) return [];

  try {
    const payload = await fetch(jsonUrl, { cache: 'force-cache' }).then(r => r.json());
    const langs = Object.keys(payload?.languages ?? {}).map(normalizeLanguageCode).filter(Boolean);
    return langs.length ? langs : [];
  } catch {
    return [];
  }
}

const buildVerseId = (payload: any, fallback: string) => {
  const candidate = normalizeString(payload?.id ?? payload?.verse_id ?? payload?.verseId ?? '', '');
  return candidate || fallback;
};

const getLanguageData = (payload: any, language: string): any => {
  if (!payload) return {};

  const normalized = normalizeLanguageCode(language);
  const candidate = payload.languages?.[normalized] ?? payload.languages?.[language] ?? payload.language?.[normalized] ?? payload.language?.[language];
  if (candidate) return candidate;

  const keys = Object.keys(payload.languages ?? {});
  if (normalized && keys.some(key => normalizeLanguageCode(key) === normalized)) {
    return payload.languages[keys.find(key => normalizeLanguageCode(key) === normalized)];
  }

  return payload[normalized] ?? payload[language] ?? {};
};

const parseVersePayload = (payload: any, language: string, fallbackId: string): DynamicVerse => {
  const langData = getLanguageData(payload, language);
  const verseNumber = Number(payload?.verse_number ?? payload?.verseNumber ?? payload?.number ?? 0);
  const sanskritText = normalizeString(
    payload?.sanskrit?.devanagari ?? payload?.sanskrit ?? payload?.devanagari ?? payload?.text ?? '',
  );
  const transliteration = normalizeString(
    payload?.sanskrit?.transliteration ?? payload?.transliteration ?? payload?.romanized ?? '',
  );

  return {
    id: buildVerseId(payload, fallbackId),
    chapterNumber: Number(payload?.chapter_number ?? payload?.chapterNumber ?? 0),
    verseNumber,
    sanskrit: sanskritText,
    transliteration,
    translation: normalizeString(langData.translation ?? langData.text ?? langData.meaning ?? '', ''),
    explanation: normalizeString(langData.explanation ?? langData.commentary ?? '', ''),
    meaning: normalizeString(langData.meaning ?? langData.translation ?? '', ''),
    example: normalizeString(langData.example ?? '', ''),
  };
};

async function fetchVerseJson(jsonUrl: string): Promise<any> {
  if (!jsonUrl) return null;

  const response = await fetch(jsonUrl, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch verse JSON: ${response.status}`);
  }

  return response.json();
}

export async function loadChapterVersesForLanguage(
  scriptureId: string,
  chapterId: string,
  language: string,
  cache: Map<string, DynamicVerse[]>
): Promise<DynamicVerse[]> {
  const cacheKey = `${scriptureId}:${chapterId}:${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const { data: rows, error } = await supabase
    .from('slokas')
    .select('id, chapter_id, verse_number, verse_id, json_url, status')
    .eq('chapter_id', chapterId)
    .eq('status', 'Published')
    .order('verse_number', { ascending: true });

  if (error) {
    console.error('Slokas fetch failed:', error.message);
    return [];
  }

  const verseResults = await Promise.all(
    (rows ?? []).map(async (row: any) => {
      const jsonUrl = normalizeString(
        row.json_url ?? row.jsonUrl ?? row.url ?? row.source_url ?? '',
      );

      if (!jsonUrl) return null;

      try {
        const payload = await fetchVerseJson(jsonUrl);
        if (!payload) return null;
        return parseVersePayload(payload, language, normalizeString(row.verse_id ?? row.id, `${chapterId}.${row.verse_number ?? ''}`));
      } catch (e) {
        console.error('Verse JSON fetch failed:', row.verse_id ?? row.id, e);
        return null;
      }
    })
  );

  const verses = verseResults
    .filter((item): item is DynamicVerse => !!item)
    .sort((a, b) => a.verseNumber - b.verseNumber);

  cache.set(cacheKey, verses);
  return verses;
}

export function getLanguageLabel(languageCode: string): string {
  const normalized = normalizeLanguageCode(languageCode);
  return LANGUAGE_LABELS[normalized] ?? normalized.toUpperCase();
}

export function getDefaultLanguagePreference(languageOptions: string[], preferred?: string): string | null {
  if (!languageOptions.length) return null;

  const normalizedPreference = normalizeLanguageCode(preferred ?? 'en');
  if (normalizedPreference && languageOptions.includes(normalizedPreference)) return normalizedPreference;

  return languageOptions[0] ?? null;
}
