import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMeditationConfig, MEDITATION_STYLES } from '../src/services/sadhana/meditationConfig';
import { normalizeSadhanaPractice, isPracticeComplete } from '../src/services/sadhana/practiceCatalog';

const practice = (config = {}, fields = {}) => normalizeSadhanaPractice({
  id: 'meditation', name: 'Meditation', slug: 'meditation', category: 'meditation',
  is_active: true, category_config: config, ...fields,
})!;

test('all meditation styles use Sadhana JSON and preserve URLs', () => {
  for (const meditation_style of MEDITATION_STYLES) {
    const content = getMeditationConfig(practice({ meditation_style, is_guided: true }, {
      guided_audio_url: 'https://media.example/guided.mp3', ambient_audio_url: 'https://media.example/ambient.mp3',
    }));
    assert.equal(content.style, meditation_style);
    assert.equal(content.guided, meditation_style !== 'silent');
    assert.equal(content.guidedUrl, meditation_style === 'silent' ? undefined : 'https://media.example/guided.mp3');
    assert.equal(content.ambientUrl, 'https://media.example/ambient.mp3');
  }
});

test('legacy guided flag, safe legacy audio and target units remain supported', () => {
  const content = getMeditationConfig(practice({ is_guided: false }, {
    target_type: 'duration', target_count: 90, target_unit: 'seconds', duration_minutes: 10,
  }));
  assert.equal(content.guided, false);
  assert.deepEqual(content.durations, [90]);
  assert.equal(content.defaultDuration, 90);
  assert.equal(getMeditationConfig(practice({ is_guided: true }, { media_type: 'audio', media_url: 'https://media.example/old.mp3' })).guidedUrl, 'https://media.example/old.mp3');
  assert.equal(getMeditationConfig(practice({}, { guided_audio_url: 'javascript:alert(1)' })).guidedUrl, undefined);
});

test('reviewed languages switch with English fallback and meditation guidance', () => {
  const localized_content = Object.fromEntries(['en', 'te', 'hi', 'kn', 'ta', 'ml'].map(language => [language, { meaning: `${language} meaning`, instructions: `${language} instructions` }]));
  const row = practice({ localized_content, breathing_guidance: 'Breathe', begin_instructions: 'Sit', end_instructions: 'Open eyes' });
  for (const language of Object.keys(localized_content)) {
    const content = getMeditationConfig(row, `${language}-IN`);
    assert.equal(content.meaning, `${language} meaning`);
    assert.equal(content.instructions, `${language} instructions`);
    assert.equal(content.breathingGuidance, 'Breathe');
    assert.equal(content.beginInstructions, 'Sit');
    assert.equal(content.endInstructions, 'Open eyes');
  }
  assert.equal(getMeditationConfig(row, 'fr').instructions, 'en instructions');
});

test('opening and audio playback alone never satisfy completion rules', () => {
  const state = { elapsedSeconds: 0, repetitions: 0, submittedEntries: 0, audioCompleted: false, manuallyCompleted: false };
  for (const completion_rule of ['manual', 'timer_elapsed', 'audio_completed']) {
    const row = practice({}, { completion_rule, target_type: 'duration', target_count: 1, target_unit: 'minutes' });
    assert.equal(isPracticeComplete(row, state), false);
    assert.equal(isPracticeComplete(row, { ...state, audioCompleted: true }), false);
  }
});
