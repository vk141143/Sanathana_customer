import { Router, type Request, type Response } from 'express';
import {
  createAudioCacheKey,
  getSarvamLanguageCode,
  getTranslationText,
  SARVAM_TTS_MODEL,
  SARVAM_TTS_SPEAKER,
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

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createSarvamTtsRouter(dependencies: SarvamTtsDependencies): Router {
  const router = Router();
  const rateLimits = new Map<string, RateLimitEntry>();
  const inFlight = new Map<string, Promise<Buffer>>();

  router.post('/translation-audio', async (req: Request, res: Response) => {
    const authorization = req.header('authorization');
    const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) return res.status(401).json({ error: 'Sign in to listen to translations.' });

    let userId: string;
    try {
      userId = await dependencies.verifyIdToken(tokenMatch[1]);
    } catch {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }

    const now = Date.now();
    if (rateLimits.size > 5000) {
      for (const [id, entry] of rateLimits) {
        if (entry.resetAt <= now) rateLimits.delete(id);
      }
    }
    const rateLimit = rateLimits.get(userId);
    if (rateLimit && rateLimit.resetAt > now && rateLimit.count >= RATE_LIMIT_REQUESTS) {
      res.setHeader('Retry-After', String(Math.ceil((rateLimit.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many audio requests. Please try again shortly.' });
    }
    if (!rateLimit || rateLimit.resetAt <= now) {
      rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      rateLimit.count += 1;
    }

    const { slokaId, language } = req.body ?? {};
    const languageCode = getSarvamLanguageCode(language);
    if (
      typeof slokaId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(slokaId) ||
      !languageCode
    ) {
      return res.status(400).json({ error: 'Choose a valid verse and supported language.' });
    }

    try {
      const sloka = await dependencies.getPublishedSloka(slokaId);
      if (!sloka) return res.status(404).json({ error: 'This published verse is unavailable.' });

      const versePayload = await dependencies.fetchSlokaJson(sloka.jsonUrl);
      const translation = getTranslationText(versePayload, language);
      if (!translation) {
        return res.status(422).json({ error: 'Translation is not available in this language.' });
      }
      if (translation.length > MAX_TRANSLATION_LENGTH) {
        return res.status(422).json({ error: 'This translation is too long to generate audio.' });
      }

      const cacheKey = createAudioCacheKey(slokaId, language, translation);
      let audioPromise = inFlight.get(cacheKey);
      if (!audioPromise) {
        audioPromise = (async () => {
          const cachedAudio = await dependencies.audioCache.get(cacheKey);
          if (cachedAudio) return cachedAudio;

          const generatedAudio = await dependencies.generateAudio(translation, languageCode);
          if (!generatedAudio.length || generatedAudio.length > MAX_AUDIO_BYTES) {
            throw new Error('Generated audio has an invalid size.');
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
      if (!audio.length || audio.length > MAX_AUDIO_BYTES) {
        throw new Error('Cached audio has an invalid size.');
      }
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(audio.length));
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(audio);
    } catch (error) {
      console.error('Sarvam translation audio request failed:', error instanceof Error ? error.name : 'UnknownError');
      return res.status(502).json({ error: 'Audio is temporarily unavailable. Please try again.' });
    }
  });

  return router;
}

export async function synthesizeSarvamAudio(
  text: string,
  languageCode: string,
  apiKey: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<Buffer> {
  const response = await fetchImplementation('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model: SARVAM_TTS_MODEL,
      speaker: SARVAM_TTS_SPEAKER,
      language_code: languageCode,
      pace: 0.9,
      speech_sample_rate: 22050,
      output_audio_codec: 'wav',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Sarvam returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') throw new Error('Sarvam returned an invalid response.');
  const audios = (payload as { audios?: unknown }).audios;
  if (!Array.isArray(audios) || typeof audios[0] !== 'string') {
    throw new Error('Sarvam returned no audio.');
  }

  const encodedAudio = audios[0];
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedAudio)) {
    throw new Error('Sarvam returned invalid audio data.');
  }
  const audio = Buffer.from(encodedAudio, 'base64');
  if (!audio.length || audio.length > MAX_AUDIO_BYTES) {
    throw new Error('Sarvam returned audio with an invalid size.');
  }
  return audio;
}
