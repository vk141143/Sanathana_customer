import type { PublishedScripture, PublishedChapter, SlokaMetadata } from '../../lib/scriptureLibrary';
import type { SadhanaPractice } from './practiceCatalog';

export interface PracticeReading {
  scripture: PublishedScripture;
  chapter: PublishedChapter;
  slokas: SlokaMetadata[];
}
interface Catalogue {
  fetchPublishedScriptures(): Promise<PublishedScripture[]>;
  fetchPublishedChapters(id: string): Promise<PublishedChapter[]>;
  fetchPublishedSlokas(id: string): Promise<SlokaMetadata[]>;
}

export async function resolvePracticeReading(practice: SadhanaPractice, catalogue?: Catalogue): Promise<PracticeReading> {
  const api = catalogue ?? await import('../../lib/scriptureLibrary');
  const config = practice.category_config;
  const scriptures = await api.fetchPublishedScriptures();
  const matches = scriptures.filter(row => config.scripture_id ? row.id === config.scripture_id : row.name === config.scripture_name);
  if (matches.length !== 1) throw new Error('The configured scripture is unavailable. Please contact support.');
  const scripture = matches[0];
  const chapters = await api.fetchPublishedChapters(scripture.id);
  const chapter = chapters.find(row => config.chapter_id ? row.id === config.chapter_id : row.chapter_number === config.chapter_number);
  if (!chapter) throw new Error('The configured chapter is unavailable. Please contact support.');
  const rows = await api.fetchPublishedSlokas(chapter.id);
  const start = config.start_verse, end = config.end_verse;
  const validVerse = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value > 0;
  if ((start != null && !validVerse(start)) || (end != null && !validVerse(end)) ||
      (typeof start === 'number' && typeof end === 'number' && start > end)) {
    throw new Error('The configured verse range is invalid. Please contact support.');
  }
  if ((start != null && !rows.some(row => row.verse_number === start)) ||
      (end != null && !rows.some(row => row.verse_number === end))) {
    throw new Error('The configured verses are unavailable. Please contact support.');
  }
  const slokas = rows.filter(row => (typeof start !== 'number' || row.verse_number >= start) &&
    (typeof end !== 'number' || row.verse_number <= end));
  if (!slokas.length) throw new Error('No published verses are available for this practice.');
  return { scripture, chapter, slokas };
}
