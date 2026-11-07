import { getPracticePresentation, getPracticeTarget, isSafePlayableUrl, type SadhanaPractice } from './practiceCatalog';

export const MEDITATION_STYLES = ['guided', 'silent', 'breathing', 'mantra', 'visualization', 'mindfulness', 'relaxation'] as const;

// Content comes from Sadhana; the legacy session enum remains a persistence detail.
export function getMeditationConfig(practice: SadhanaPractice, language = 'en') {
  const config = practice.category_config;
  const style = MEDITATION_STYLES.includes(config.meditation_style as typeof MEDITATION_STYLES[number])
    ? config.meditation_style as typeof MEDITATION_STYLES[number]
    : config.is_guided === false || practice.meditation_type === 'silent' ? 'silent' : 'guided';
  const guided = style === 'silent' ? false : style === 'guided' ? true
    : typeof config.is_guided === 'boolean' ? config.is_guided : practice.practice_mode === 'guided_audio';
  const target = getPracticeTarget(practice);
  const targetSeconds = target && practice.target_type === 'duration'
    ? target.value * (/^hour/i.test(target.unit) ? 3600 : /^sec/i.test(target.unit) ? 1 : 60) : null;
  const defaultDuration = targetSeconds ?? (practice.duration_minutes ? practice.duration_minutes * 60 : practice.default_duration_seconds ?? 600);
  const durations = targetSeconds ? [targetSeconds] : Array.from(new Set([
    defaultDuration, ...(practice.available_durations_seconds ?? [180, 300, 600, 900, 1200, 1800]),
  ]));
  const presentation = getPracticePresentation(practice, language);
  return { ...presentation, style, guided, defaultDuration, durations,
    sessionType: guided ? 'guided' : 'silent',
    guidedUrl: guided ? presentation.media.find(item => item.label !== 'Ambient audio')?.url ??
      (practice.media_type === 'audio' && isSafePlayableUrl(practice.media_url) ? practice.media_url : undefined) : undefined,
    ambientUrl: presentation.media.find(item => item.label === 'Ambient audio')?.url,
  };
}
