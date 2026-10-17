import { createHash } from 'node:crypto';

export const SARVAM_TTS_MODEL = 'bulbul:v3';
export const SARVAM_TTS_SPEAKER = 'priya';

export const SARVAM_LANGUAGES: Readonly<Record<string, string>> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  ta: 'ta-IN',
};

export function getSarvamLanguageCode(language: unknown): string | null {
  if (typeof language !== 'string') return null;
  return SARVAM_LANGUAGES[language.trim().toLowerCase()] ?? null;
}

export function getTranslationText(payload: unknown, language: string): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const languages = (payload as { languages?: unknown }).languages;
  if (!languages || typeof languages !== 'object') return null;

  const languageData = (languages as Record<string, unknown>)[language];
  if (!languageData || typeof languageData !== 'object') return null;
  const translation = (languageData as { translation?: unknown }).translation;
  return typeof translation === 'string' && translation.trim() ? translation.trim() : null;
}

export function createAudioCacheKey(slokaId: string, language: string, translation: string): string {
  const contentVersion = createHash('sha256').update(translation).digest('hex');
  const audioVersion = createHash('sha256')
    .update(JSON.stringify([SARVAM_TTS_MODEL, SARVAM_TTS_SPEAKER, language, contentVersion]))
    .digest('hex');
  return `scripture-audio/v1/${language}/${encodeURIComponent(slokaId)}/${audioVersion}.wav`;
}
