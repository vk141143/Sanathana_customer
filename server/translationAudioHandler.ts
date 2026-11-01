import {
  createAudioCacheKey,
  getSarvamLanguageCode,
  getTranslationText,
} from '../src/lib/sarvamTts';

const MAX_TRANSLATION_LENGTH = 2500;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 20;

export interface AudioCache {
  get(key: string): Promise<Buffer | null>;
  set(key: string, audio: Buffer): Promise<void>;
}

export interface SarvamTtsDependencies {
  verifyIdToken(token: string): Promise<string>;
  getPublishedSloka(slokaId: string): Promise<{ jsonUrl: string } | null>;
  fetchSlokaJson(jsonUrl: string): Promise<unknown>;
  generateAudio(text: string, languageCode: string): Promise<Buffer>;
  audioCache: AudioCache;
}

export class SarvamTtsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SarvamTtsConfigurationError';
  }
}

export class SarvamAudioSizeError extends Error {
  constructor() {
    super('Generated audio exceeds the supported response size limit.');
    this.name = 'SarvamAudioSizeError';
  }
}

export interface TranslationAudioResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: Buffer | { error: string };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createTranslationAudioHandler(
  dependencies: SarvamTtsDependencies,
  maxAudioBytes = MAX_AUDIO_BYTES,
) {
  const rateLimits = new Map<string, RateLimitEntry>();
  const inFlight = new Map<string, Promise<Buffer>>();
  const responseAudioLimit = Math.min(maxAudioBytes, MAX_AUDIO_BYTES);

  return async (
    authorization: string | undefined,
    body: unknown,
  ): Promise<TranslationAudioResponse> => {
    const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
      return { statusCode: 401, body: { error: 'Sign in to listen to translations.' } };
    }

    let userId: string;
    try {
      userId = await dependencies.verifyIdToken(tokenMatch[1]);
    } catch (error) {
      if (error instanceof SarvamTtsConfigurationError) {
        return { statusCode: 503, body: { error: error.message } };
      }
      return { statusCode: 401, body: { error: 'Your session has expired. Please sign in again.' } };
    }

    const now = Date.now();
    if (rateLimits.size > 5000) {
      for (const [id, entry] of rateLimits) {
        if (entry.resetAt <= now) rateLimits.delete(id);
      }
    }
    const rateLimit = rateLimits.get(userId);
    if (rateLimit && rateLimit.resetAt > now && rateLimit.count >= RATE_LIMIT_REQUESTS) {
      return {
        statusCode: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - now) / 1000)) },
        body: { error: 'Too many audio requests. Please try again shortly.' },
      };
    }
    if (!rateLimit || rateLimit.resetAt <= now) {
      rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      rateLimit.count += 1;
    }

    const request = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const { slokaId, language } = request;
    const languageCode = typeof language === 'string' ? getSarvamLanguageCode(language) : null;
    if (
      typeof slokaId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(slokaId) ||
      typeof language !== 'string' ||
      !languageCode
    ) {
      return { statusCode: 400, body: { error: 'Choose a valid verse and supported language.' } };
    }

    try {
      const sloka = await dependencies.getPublishedSloka(slokaId);
      if (!sloka) {
        return { statusCode: 404, body: { error: 'This published verse is unavailable.' } };
      }

      const versePayload = await dependencies.fetchSlokaJson(sloka.jsonUrl);
      const translation = getTranslationText(versePayload, language);
      if (!translation) {
        return { statusCode: 422, body: { error: 'Translation is not available in this language.' } };
      }
      if (translation.length > MAX_TRANSLATION_LENGTH) {
        return { statusCode: 422, body: { error: 'This translation is too long to generate audio.' } };
      }

      const cacheKey = createAudioCacheKey(slokaId, language, translation);
      let audioPromise = inFlight.get(cacheKey);
      if (!audioPromise) {
        audioPromise = (async () => {
          const cachedAudio = await dependencies.audioCache.get(cacheKey);
          if (cachedAudio) return cachedAudio;

          const generatedAudio = await dependencies.generateAudio(translation, languageCode);
          if (!generatedAudio.length || generatedAudio.length > responseAudioLimit) {
            throw new SarvamAudioSizeError();
          }
          await dependencies.audioCache.set(cacheKey, generatedAudio);
          return generatedAudio;
        })();
        inFlight.set(cacheKey, audioPromise);
        void audioPromise.finally(() => {
          if (inFlight.get(cacheKey) === audioPromise) inFlight.delete(cacheKey);
        }).catch(() => undefined);
      }

      const audio = await audioPromise;
      if (!audio.length || audio.length > responseAudioLimit) {
        throw new SarvamAudioSizeError();
      }
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': String(audio.length),
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
        body: audio,
      };
    } catch (error) {
      if (error instanceof SarvamTtsConfigurationError) {
        return { statusCode: 503, body: { error: error.message } };
      }
      if (error instanceof SarvamAudioSizeError) {
        return { statusCode: 502, body: { error: error.message } };
      }
      console.error('Sarvam translation audio request failed:', error instanceof Error ? error.name : 'UnknownError');
      return {
        statusCode: 502,
        body: {
          error: 'Audio generation failed. Please retry; if it continues, check Sarvam configuration and the API logs.',
        },
      };
    }
  };
}
