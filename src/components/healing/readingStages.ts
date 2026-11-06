import type { SupabaseEmotion } from '../EmotionDetailView';
export type TopicKind = 'emotion' | 'healing';
export type StageId = 'understanding' | 'wisdom' | 'meaning' | 'application' | 'practices';
export interface ReadingBlock { id: string; text: string; heading?: string; kind?: 'verse' | 'quote'; lang?: string }
export interface ReadingStage { id: StageId; title: string; blocks: ReadingBlock[] }
/** Only published source fields are mapped. Missing sections remain empty. */
export function getReadingStages(topic: SupabaseEmotion, kind: TopicKind = 'emotion'): ReadingStage[] {
  const block = (id: string, text: string | null | undefined, extra: Partial<ReadingBlock> = {}): ReadingBlock[] =>
    text?.trim() ? [{ id, text, ...extra }] : [];
  return [
    { id: 'understanding', title: `Understanding ${topic.name}`, blocks: block('introduction', topic.tagline) },
    { id: 'wisdom', title: kind === 'healing' ? 'Relevant Spiritual Wisdom' : 'What Does Bhagavad Gita Say?', blocks: [
      ...block('sanskrit', topic.gita_sanskrit, { kind: 'verse', lang: 'sa' }),
      ...block('reference', topic.gita_reference),
      ...block('transliteration', topic.gita_transliteration, { lang: 'sa-Latn' }),
      ...block('translation', topic.gita_translation, { kind: 'quote' }),
    ] },
    { id: 'meaning', title: 'Meaning and Deeper Understanding', blocks: [
      ...block('meaning', topic.what_it_means),
      ...block('example', topic.example_text, { heading: 'Everyday Example' }),
    ] },
    // No causes/application field exists in the current database.
    { id: 'application', title: kind === 'healing' ? 'Applying It in Everyday Life' : 'Why We Experience It', blocks: [] },
    { id: 'practices', title: kind === 'healing' ? 'Practices for Growth and Inner Balance' : 'How to Overcome or Manage It', blocks: [
      ...(topic.how_to_overcome ?? []).flatMap((practice, index) => practice.title?.trim() || practice.sub?.trim()
        ? [{ id: `practice-${index}`, heading: practice.title, text: practice.sub ?? '' }] : []),
      ...block('mantra', topic.mantra_sanskrit, { heading: 'Mantra for Inner Peace', kind: 'verse', lang: 'sa' }),
      ...block('mantra-transliteration', topic.mantra_transliteration, { lang: 'sa-Latn' }),
      ...block('mantra-meaning', topic.mantra_meaning),
    ] },
  ];
}
