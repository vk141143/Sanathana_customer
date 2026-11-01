import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  createNetlifyTranslationAudioHandler,
} from '../netlify/functions/translation-audio';
import {
  SarvamTtsConfigurationError,
  type AudioCache,
  type SarvamTtsDependencies,
} from '../server/translationAudioHandler';
import { createSarvamTtsDependencies } from '../server/sarvamTtsDependencies';
import { TRANSLATION_AUDIO_ENDPOINT } from '../src/lib/api';

const publishedTranslation = {
  languages: {
    en: { translation: 'English translation' },
    te: { translation: 'తెలుగు అనువాదం' },
  },
};

function makeDependencies(
  overrides: Partial<SarvamTtsDependencies> = {},
): { dependencies: SarvamTtsDependencies; cache: Map<string, Buffer> } {
  const cache = new Map<string, Buffer>();
  const audioCache: AudioCache = {
    get: async key => cache.get(key) ?? null,
    set: async (key, audio) => { cache.set(key, audio); },
  };
  return {
    cache,
    dependencies: {
      verifyIdToken: async token => {
        if (token !== 'valid-token') throw new Error('Invalid token');
        return 'customer-1';
      },
      getPublishedSloka: async id => id === 'sloka-1'
        ? { jsonUrl: 'https://content.example/sloka.json' }
        : null,
      fetchSlokaJson: async () => publishedTranslation,
      generateAudio: async (text, languageCode) => Buffer.from(`${languageCode}:${text}`),
      audioCache,
      ...overrides,
    },
  };
}

function event(
  method: string,
  body: string | null = null,
  headers: Record<string, string> = {},
) {
  return { httpMethod: method, headers, body };
}

function authenticatedEvent(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return event('POST', JSON.stringify(body), {
    authorization: 'Bearer valid-token',
    'content-type': 'application/json',
    ...headers,
  });
}

test('Netlify function returns authenticated translation audio as WAV', async () => {
  let spokenText = '';
  let spokenLanguage = '';
  const { dependencies, cache } = makeDependencies({
    generateAudio: async (text, language) => {
      spokenText = text;
      spokenLanguage = language;
      return Buffer.from('mock-wav');
    },
  });
  const handler = createNetlifyTranslationAudioHandler(dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'sloka-1', language: 'te' }));

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Content-Type'], 'audio/wav');
  assert.equal(response.isBase64Encoded, true);
  assert.equal(Buffer.from(response.body, 'base64').toString(), 'mock-wav');
  assert.equal(spokenText, 'తెలుగు అనువాదం');
  assert.equal(spokenLanguage, 'te-IN');
  assert.equal(cache.size, 1);
});

test('Netlify function rejects missing and invalid Firebase tokens', async () => {
  const handler = createNetlifyTranslationAudioHandler(makeDependencies().dependencies);
  const noToken = await handler(event('POST', JSON.stringify({ slokaId: 'sloka-1', language: 'en' })));
  const invalidToken = await handler(authenticatedEvent(
    { slokaId: 'sloka-1', language: 'en' },
    { authorization: 'Bearer invalid-token' },
  ));

  assert.equal(noToken.statusCode, 401);
  assert.equal(invalidToken.statusCode, 401);
});

test('Netlify function rejects malformed and invalid request bodies', async () => {
  const handler = createNetlifyTranslationAudioHandler(makeDependencies().dependencies);
  const invalidJson = await handler(event('POST', '{'));
  const invalidBody = await handler(authenticatedEvent('sloka-1'));

  assert.equal(invalidJson.statusCode, 400);
  assert.match(invalidJson.body, /valid JSON/);
  assert.equal(invalidBody.statusCode, 400);
});

test('Netlify function rejects unsupported languages', async () => {
  const handler = createNetlifyTranslationAudioHandler(makeDependencies().dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'sloka-1', language: 'sa' }));
  assert.equal(response.statusCode, 400);
});

test('Netlify function rejects unknown or unpublished Slokas', async () => {
  const handler = createNetlifyTranslationAudioHandler(makeDependencies().dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'unknown', language: 'en' }));
  assert.equal(response.statusCode, 404);
});

test('Netlify function reports missing translations', async () => {
  const { dependencies } = makeDependencies({
    fetchSlokaJson: async () => ({ languages: { en: { meaning: 'Not spoken' } } }),
  });
  const handler = createNetlifyTranslationAudioHandler(dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'sloka-1', language: 'en' }));
  assert.equal(response.statusCode, 422);
});

test('Netlify function reports missing Sarvam API configuration without exposing values', async () => {
  const environment: NodeJS.ProcessEnv = {};
  const dependencies = createSarvamTtsDependencies(environment);
  await assert.rejects(
    dependencies.generateAudio('translation', 'en-IN'),
    error => error instanceof SarvamTtsConfigurationError && /SARVAM_API_KEY/.test(error.message),
  );

  const configuredDependencies = makeDependencies({
    generateAudio: async () => {
      throw new SarvamTtsConfigurationError('SARVAM_API_KEY is not configured for the Netlify Function.');
    },
  }).dependencies;
  const configuredHandler = createNetlifyTranslationAudioHandler(configuredDependencies);
  const configurationResponse = await configuredHandler(
    authenticatedEvent({ slokaId: 'sloka-1', language: 'en' }),
  );
  assert.equal(configurationResponse.statusCode, 503);
  assert.match(configurationResponse.body, /SARVAM_API_KEY/);
  assert.doesNotMatch(configurationResponse.body, /secret-value/);
});

test('Netlify function maps Sarvam provider failures to a safe 502 response', async () => {
  const { dependencies } = makeDependencies({
    generateAudio: async () => { throw new Error('private-provider-response'); },
  });
  const handler = createNetlifyTranslationAudioHandler(dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'sloka-1', language: 'en' }));

  assert.equal(response.statusCode, 502);
  assert.match(response.body, /Audio generation failed/);
  assert.doesNotMatch(response.body, /private-provider-response/);
});

test('Netlify function handles allowed and rejected CORS preflights', async () => {
  const handler = createNetlifyTranslationAudioHandler(
    makeDependencies().dependencies,
    'https://harved.netlify.app',
  );
  const preflight = await handler(event('OPTIONS', null, { origin: 'https://harved.netlify.app' }));
  const rejected = await handler(event('OPTIONS', null, { origin: 'https://untrusted.example' }));

  assert.equal(preflight.statusCode, 204);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'https://harved.netlify.app');
  assert.match(preflight.headers['Access-Control-Allow-Headers'], /Authorization/i);
  assert.equal(rejected.statusCode, 403);
});

test('frontend uses the clean API route configured for the Netlify function', () => {
  assert.equal(TRANSLATION_AUDIO_ENDPOINT, '/api/tts/translation-audio');
});

test('Netlify config routes the clean API path to the named function before the SPA fallback', () => {
  const config = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const routeIndex = config.indexOf('from = "/api/tts/translation-audio"');
  const functionTargetIndex = config.indexOf('to = "/.netlify/functions/translation-audio"');
  const spaFallbackIndex = config.indexOf('from = "/*"');

  assert.ok(routeIndex >= 0);
  assert.ok(functionTargetIndex > routeIndex);
  assert.ok(spaFallbackIndex > functionTargetIndex);
});

test('Netlify function coalesces concurrent generation within a warm instance', async () => {
  let generationCount = 0;
  const { dependencies } = makeDependencies({
    generateAudio: async () => {
      generationCount += 1;
      await new Promise(resolve => setTimeout(resolve, 10));
      return Buffer.from('one-generated-audio');
    },
  });
  const handler = createNetlifyTranslationAudioHandler(dependencies);
  const request = authenticatedEvent({ slokaId: 'sloka-1', language: 'en' });
  const responses = await Promise.all([handler(request), handler(request)]);

  assert.deepEqual(responses.map(response => response.statusCode), [200, 200]);
  assert.equal(generationCount, 1);
});

test('Netlify function returns JSON instead of exceeding its buffered audio response limit', async () => {
  const { dependencies } = makeDependencies({
    generateAudio: async () => Buffer.alloc(4 * 1024 * 1024 + 1),
  });
  const handler = createNetlifyTranslationAudioHandler(dependencies);
  const response = await handler(authenticatedEvent({ slokaId: 'sloka-1', language: 'en' }));

  assert.equal(response.statusCode, 502);
  assert.equal(response.isBase64Encoded, undefined);
  assert.match(response.body, /response size limit/);
});
