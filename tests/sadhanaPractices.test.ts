import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePracticeReading } from '../src/services/sadhana/practiceReading';
import {
  fetchActiveSadhanaPractices,
  filterVisiblePractices,
  getLocalizedPracticeText,
  getPracticeMedia,
  getPracticePresentation,
  getPracticeTarget,
  getRepetitionTarget,
  isCounterEnabled,
  isPracticeComplete,
  isSafePlayableUrl,
  normalizeSadhanaPractice,
  PracticeRuntimeState,
  SadhanaPractice,
} from '../src/services/sadhana/practiceCatalog';

function practice(overrides: Partial<SadhanaPractice> = {}): SadhanaPractice {
  return {
    id: 'practice-id',
    name: 'Quiet Japa',
    slug: 'quiet-japa',
    subtitle: null,
    description: null,
    category: 'japa',
    instructions: null,
    difficulty: null,
    practice_mode: 'repetition',
    target_type: 'repetitions',
    target_count: 3,
    target_unit: null,
    duration_minutes: null,
    completion_rule: 'repetitions_reached',
    time_of_day: null,
    is_featured: false,
    benefits: [],
    tags: [],
    category_config: { counter_enabled: true, mantra_text: 'हरे कृष्ण' },
    cover_image_url: null,
    guided_audio_url: null,
    ambient_audio_url: null,
    media_type: null,
    media_url: null,
    display_order: 0,
    is_active: true,
    archived_at: null,
    ...overrides,
  };
}

const runtime = (overrides: Partial<PracticeRuntimeState> = {}): PracticeRuntimeState => ({
  elapsedSeconds: 0,
  repetitions: 0,
  submittedEntries: 0,
  audioCompleted: false,
  manuallyCompleted: false,
  ...overrides,
});

test('configured scripture reading resolves only published catalogue references and exact ranges', async () => {
  const catalogue = {
    fetchPublishedScriptures: async () => [{ id: 'scripture', name: 'Configured scripture', description: '', cover_image_url: '' }],
    fetchPublishedChapters: async (id: string) => { assert.equal(id, 'scripture'); return [{ id: 'chapter', scripture_id: id, chapter_number: 2, title: 'Two' }]; },
    fetchPublishedSlokas: async (id: string) => { assert.equal(id, 'chapter'); return [1, 2, 3].map(n => ({ id: `verse-${n}`, chapter_id: id, verse_number: n, verse_id: `${n}`, json_url: 'https://example.test/verse.json' })); },
  };
  const config = { scripture_name: 'Configured scripture', chapter_number: 2, start_verse: 2, end_verse: 3 };
  const result = await resolvePracticeReading(practice({ category: 'scripture_reading', category_config: config }), catalogue);
  assert.deepEqual(result.slokas.map(row => row.verse_number), [2, 3]);
  for (const override of [{ scripture_name: 'Missing' }, { chapter_number: 99 }, { end_verse: 99 }, { start_verse: 3, end_verse: 2 }]) {
    await assert.rejects(resolvePracticeReading(practice({ category_config: { ...config, ...override } }), catalogue), /unavailable|invalid/);
  }
});

test('invalid targets cannot complete a newly opened practice', () => {
  for (const target_count of [0, -1, 1.5]) {
    assert.equal(isPracticeComplete(practice({ target_count }), runtime()), false);
  }
});

test('fetches and filters admin definitions using the active catalogue contract', async () => {
  const queryCalls: string[] = [];
  const result = await fetchActiveSadhanaPractices(() => {
    queryCalls.push('read');
    return Promise.resolve({
      data: [
        { ...practice({ id: 'later', name: 'Later', display_order: 2 }) },
        { ...practice({ id: 'first', name: 'First', display_order: 1 }) },
        { ...practice({ id: 'inactive', is_active: false }) },
        { ...practice({ id: 'archived', archived_at: '2026-01-01T00:00:00Z' }) },
      ],
      error: null,
    });
  });
  assert.deepEqual(queryCalls, ['read']);
  assert.deepEqual(result.map(item => item.id), ['first', 'later']);
});

test('coalesces overlapping catalogue loads caused by effect replay', async () => {
  let reads = 0;
  const query = () => {
    reads += 1;
    return new Promise<{ data: unknown[]; error: null }>(resolve => {
      setTimeout(() => resolve({ data: [practice()], error: null }), 5);
    });
  };
  const [first, second] = await Promise.all([
    fetchActiveSadhanaPractices(query),
    fetchActiveSadhanaPractices(query),
  ]);
  assert.equal(reads, 1);
  assert.deepEqual(first, second);
});

test('normalizes older definitions with missing optional columns', () => {
  const definition = normalizeSadhanaPractice({
    id: 'old-id',
    name: 'Older meditation',
    slug: 'older-meditation',
    category: 'meditation',
    is_active: true,
    archived_at: null,
  });
  assert.ok(definition);
  assert.equal(definition.subtitle, null);
  assert.equal(definition.target_count, null);
  assert.deepEqual(definition.category_config, {});
  assert.deepEqual(definition.benefits, []);
  assert.deepEqual(filterVisiblePractices([definition]).map(item => item.id), ['old-id']);
});

test('sorts visible definitions by display_order and then name', () => {
  const ordered = filterVisiblePractices([
    practice({ id: 'z', name: 'Zulu', display_order: 1 }),
    practice({ id: 'b', name: 'Beta', display_order: 1 }),
    practice({ id: 'a', name: 'Alpha', display_order: 1 }),
  ]);
  assert.deepEqual(ordered.map(item => item.name), ['Alpha', 'Beta', 'Zulu']);
});

test('maps category fields and uses reviewed localized content without replacing the original mantra', () => {
  const item = practice({
    category_config: {
      mantra_name: 'Maha Mantra',
      mantra_text: 'हरे कृष्ण\nहरे राम',
      transliteration: 'Hare Krishna\nHare Rama',
      meaning: 'Default meaning',
      localized_content: { te: { meaning: 'Reviewed Telugu meaning', instructions: 'Reviewed instructions' } },
      scripture_name: 'Bhagavad Gita',
      chapter_number: 2,
      start_verse: 10,
      end_verse: 12,
    },
  });
  const presentation = getPracticePresentation(item, 'te-IN');
  assert.equal(presentation.mantraText, 'हरे कृष्ण\nहरे राम');
  assert.equal(presentation.transliteration, 'Hare Krishna\nHare Rama');
  assert.equal(presentation.meaning, 'Reviewed Telugu meaning');
  assert.equal(presentation.instructions, 'Reviewed instructions');
  assert.equal(presentation.scriptureName, 'Bhagavad Gita');
  assert.equal(presentation.startVerse, 10);
  assert.equal(getLocalizedPracticeText(item, 'meaning', 'ml'), 'Default meaning');
});

test('does not invent repetition targets and honors configured Japa presets only', () => {
  const noTarget = practice({ target_count: null, category_config: { counter_enabled: true } });
  assert.equal(getPracticeTarget(noTarget), null);
  const configuredPreset = practice({
    target_count: null,
    category_config: { counter_enabled: true, count_preset: 54 },
  });
  assert.deepEqual(getPracticeTarget(configuredPreset), { value: 54, unit: 'repetitions' });
  assert.equal(isCounterEnabled(configuredPreset), true);
  assert.equal(isCounterEnabled(practice({ category_config: { counter_enabled: false } })), false);
});

test('duration targets are never interpreted as repetition targets', () => {
  const timed = practice({
    category: 'meditation',
    practice_mode: 'timer',
    target_type: 'duration',
    target_count: 10,
    target_unit: 'minutes',
    completion_rule: 'timer_elapsed',
  });
  assert.deepEqual(getPracticeTarget(timed), { value: 10, unit: 'minutes' });
  assert.equal(isPracticeComplete(timed, runtime({ repetitions: 10 })), false);
  assert.equal(isPracticeComplete(timed, runtime({ elapsedSeconds: 599 })), false);
  assert.equal(isPracticeComplete(timed, runtime({ elapsedSeconds: 600 })), true);
});

test('respects manual, repetition, entry, timer and audio completion rules', () => {
  const manual = practice({ completion_rule: 'manual' });
  assert.equal(isPracticeComplete(manual, runtime()), false);
  assert.equal(isPracticeComplete(manual, runtime({ manuallyCompleted: true })), true);

  const repetitions = practice({ target_count: 2 });
  assert.equal(isPracticeComplete(repetitions, runtime({ repetitions: 1 })), false);
  assert.equal(isPracticeComplete(repetitions, runtime({ repetitions: 2 })), true);

  const entries = practice({ category: 'gratitude', target_type: 'entries', target_count: 2, completion_rule: 'entries_submitted' });
  assert.equal(isPracticeComplete(entries, runtime({ submittedEntries: 1 })), false);
  assert.equal(isPracticeComplete(entries, runtime({ submittedEntries: 2 })), true);

  const audio = practice({ completion_rule: 'audio_completed' });
  assert.equal(isPracticeComplete(audio, runtime()), false);
  assert.equal(isPracticeComplete(audio, runtime({ audioCompleted: true })), false);
  assert.equal(isPracticeComplete(audio, runtime({ audioCompleted: true, manuallyCompleted: true })), true);
});

test('live admin timer configuration retains its independent Japa counter', () => {
  const item = practice({ practice_mode: 'timer', target_type: 'duration', target_count: 15,
    duration_minutes: 15, target_unit: 'repetitions', completion_rule: 'manual',
    category_config: { counter_enabled: true, count_preset: 108, mala_counter: true } });
  assert.deepEqual(getPracticeTarget(item), { value: 15, unit: 'minutes' });
  assert.equal(getRepetitionTarget(item), 108);
  assert.equal(isCounterEnabled(item), true);
  assert.equal(isPracticeComplete(item, runtime({ repetitions: 108, elapsedSeconds: 900 })), false);
  assert.equal(isPracticeComplete(item, runtime({ manuallyCompleted: true })), true);
  assert.equal(getRepetitionTarget(practice({ target_type: 'duration', category_config: {} })), null);
});

test('audio playback does not increment repetition state and invalid media URLs are excluded', () => {
  const item = practice({
    guided_audio_url: 'https://cdn.example.test/guided.mp3',
    ambient_audio_url: 'javascript:alert(1)',
    media_type: 'audio',
    media_url: 'https://cdn.example.test/legacy.mp3',
  });
  assert.equal(isSafePlayableUrl('javascript:alert(1)'), false);
  assert.deepEqual(getPracticeMedia(item), [
    { label: 'Guided audio', url: 'https://cdn.example.test/guided.mp3' },
  ]);
  const afterAudioEnds = runtime({ audioCompleted: true });
  assert.equal(afterAudioEnds.repetitions, 0);
  assert.equal(isPracticeComplete(item, afterAudioEnds), false);
});
