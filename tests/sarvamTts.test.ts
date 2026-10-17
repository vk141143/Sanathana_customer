import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import {
  createAudioCacheKey,
  getSarvamLanguageCode,
  getTranslationText,
} from '../src/lib/sarvamTts';
import {
  createSarvamTtsRouter,
  synthesizeSarvamAudio,
  type AudioCache,
  type SarvamTtsDependencies,
} from '../server/sarvamTtsRouter';

const servers: Array<ReturnType<express.Express['listen']>> = [];

async function withTtsServer(
  dependencies: SarvamTtsDependencies,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use('/api/tts', createSarvamTtsRouter(dependencies));
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  await run(`http://127.0.0.1:${address.port}/api/tts/translation-audio`);
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  })));
});

function makeDependencies(overrides: Partial<SarvamTtsDependencies> = {}) {
  const cache = new Map<string, Buffer>();
  const audioCache: AudioCache = {
    get: async key => cache.get(key) ?? null,
    set: async (key, audio) => { cache.set(key, audio); },
  };
  const dependencies: SarvamTtsDependencies = {
    verifyIdToken: async token => token === 'valid-token' ? 'user-1' : Promise.reject(new Error('invalid')),
    getPublishedSloka: async id => id === 'sloka-1' ? { jsonUrl: 'https://content.example/sloka.json' } : null,
    fetchSlokaJson: async () => ({
      sanskrit: { devanagari: 'KEEP THIS SCRIPTURE UNCHANGED' },
      languages: {
        en: { translation: 'English translation only', meaning: 'not to be spoken' },
        te: { translation: 'తెలుగు అనువాదం', explanation: 'చదవకూడదు' },
        hi: { translation: 'हिन्दी अनुवाद', example: 'नहीं पढ़ें' },
        kn: { translation: 'ಕನ್ನಡ ಅನುವಾದ' },
        ml: { translation: 'മലയാളം വിവർത്തനം' },
        ta: { translation: 'தமிழ் மொழிபெயர்ப்பு' },
      },
    }),
    generateAudio: async text => Buffer.from(`audio:${text}`),
    audioCache,
    ...overrides,
  };
  return { dependencies, cache };
}

test('maps all requested reading languages to Sarvam BCP-47 codes', () => {
  assert.deepEqual(
    ['en', 'te', 'hi', 'kn', 'ml', 'ta'].map(getSarvamLanguageCode),
    ['en-IN', 'te-IN', 'hi-IN', 'kn-IN', 'ml-IN', 'ta-IN'],
  );
  assert.equal(getSarvamLanguageCode('sa'), null);
});

test('selects only the exact language translation field', () => {
  const payload = {
    sanskrit: { devanagari: 'Sanskrit content' },
    languages: {
      en: { translation: 'English' },
      te: { translation: 'తెలుగు', meaning: 'అర్థం', explanation: 'వివరణ' },
      hi: { translation: 'हिन्दी' },
      kn: { translation: 'ಕನ್ನಡ' },
      ml: { translation: 'മലയാളം' },
      ta: { translation: 'தமிழ்' },
    },
  };
  for (const language of ['en', 'te', 'hi', 'kn', 'ml', 'ta'] as const) {
    const languageData = payload.languages[language];
    assert.equal(getTranslationText(payload, language), languageData.translation);
  }
  assert.equal(getTranslationText(payload, 'te'), 'తెలుగు');
  assert.equal(getTranslationText(payload, 'hi'), 'हिन्दी');
  assert.equal(getTranslationText(payload, 'en'), 'English');
  assert.equal(getTranslationText({ languages: { en: { meaning: 'meaning only' } } }, 'en'), null);
});

test('generates version-aware cache keys from sloka, language and translation content', () => {
  const firstKey = createAudioCacheKey('sloka-1', 'te', 'తెలుగు');
  assert.equal(firstKey, createAudioCacheKey('sloka-1', 'te', 'తెలుగు'));
  assert.notEqual(firstKey, createAudioCacheKey('sloka-1', 'hi', 'తెలుగు'));
  assert.notEqual(firstKey, createAudioCacheKey('sloka-1', 'te', 'మారిన అనువాదం'));
  assert.notEqual(firstKey, createAudioCacheKey('sloka-2', 'te', 'తెలుగు'));
});

test('rejects unauthenticated requests and does not generate audio', async () => {
  let generated = false;
  const { dependencies } = makeDependencies({
    generateAudio: async () => { generated = true; return Buffer.from('audio'); },
  });
  await withTtsServer(dependencies, async url => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slokaId: 'sloka-1', language: 'en' }),
    });
    assert.equal(response.status, 401);
    assert.equal(generated, false);
  });
});

test('rejects invalid languages and unpublished sloka IDs', async () => {
  let generated = 0;
  const { dependencies } = makeDependencies({
    generateAudio: async () => { generated += 1; return Buffer.from('audio'); },
  });
  await withTtsServer(dependencies, async url => {
    const request = (body: unknown) => fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const invalidLanguage = await request({ slokaId: 'sloka-1', language: 'sa' });
    assert.equal(invalidLanguage.status, 400);

    const invalidSlokaId = await request({ slokaId: 'missing-sloka', language: 'en' });
    assert.equal(invalidSlokaId.status, 404);

    const invalidIdFormat = await request({ slokaId: '../private', language: 'en' });
    assert.equal(invalidIdFormat.status, 400);
    assert.equal(generated, 0);
  });
});

test('rejects missing translations without synthesizing or speaking non-translation fields', async () => {
  let generated = false;
  const { dependencies } = makeDependencies({
    fetchSlokaJson: async () => ({ sanskrit: 'Sanskrit', languages: { en: { meaning: 'meaning only' } } }),
    generateAudio: async () => { generated = true; return Buffer.from('audio'); },
  });
  await withTtsServer(dependencies, async url => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ slokaId: 'sloka-1', language: 'en' }),
    });
    assert.equal(response.status, 422);
    assert.equal(generated, false);
  });
});

test('authenticated request sends only the selected translation and serves cached audio', async () => {
  let generated = 0;
  let spokenText = '';
  let spokenLanguage = '';
  const { dependencies, cache } = makeDependencies({
    generateAudio: async (text, languageCode) => {
      generated += 1;
      spokenText = text;
      spokenLanguage = languageCode;
      return Buffer.from('mock-wav');
    },
  });
  await withTtsServer(dependencies, async url => {
    const request = () => fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ slokaId: 'sloka-1', language: 'te', text: 'untrusted client text' }),
    });
    const first = await request();
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('content-type'), 'audio/wav');
    assert.equal(await first.text(), 'mock-wav');
    const second = await request();
    assert.equal(second.status, 200);
    assert.equal(await second.text(), 'mock-wav');
    assert.equal(generated, 1);
    assert.equal(cache.size, 1);
    assert.equal(spokenText, 'తెలుగు అనువాదం');
    assert.equal(spokenLanguage, 'te-IN');
  });
});

test('concurrent requests share one upstream generation', async () => {
  let generated = 0;
  const { dependencies } = makeDependencies({
    generateAudio: async () => {
      generated += 1;
      await new Promise(resolve => setTimeout(resolve, 25));
      return Buffer.from('shared-audio');
    },
  });
  await withTtsServer(dependencies, async url => {
    const request = () => fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ slokaId: 'sloka-1', language: 'en' }),
    });
    const responses = await Promise.all([request(), request()]);
    assert.deepEqual(responses.map(response => response.status), [200, 200]);
    await Promise.all(responses.map(response => response.arrayBuffer()));
    assert.equal(generated, 1);
  });
});

test('returns a safe client error when Sarvam fails', async () => {
  const { dependencies } = makeDependencies({
    generateAudio: async () => { throw new Error('upstream-secret-details'); },
  });
  await withTtsServer(dependencies, async url => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ slokaId: 'sloka-1', language: 'en' }),
    });
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.match(body, /temporarily unavailable/);
    assert.doesNotMatch(body, /upstream-secret-details/);
  });
});

test('reports Sarvam failures without exposing response details or credentials', async () => {
  await assert.rejects(
    synthesizeSarvamAudio('translation', 'en-IN', 'server-secret', async () => new Response('private error', { status: 500 })),
    /HTTP 500/,
  );
  let requestBody: Record<string, unknown> = {};
  let subscriptionKey: string | null = null;
  const audio = await synthesizeSarvamAudio('translation only', 'en-IN', 'server-secret', async (_url, init) => {
    subscriptionKey = new Headers(init?.headers).get('api-subscription-key');
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ audios: [Buffer.from('mock-wav').toString('base64')] });
  });
  assert.equal(audio.toString(), 'mock-wav');
  assert.equal(subscriptionKey, 'server-secret');
  assert.deepEqual(requestBody, {
    text: 'translation only',
    model: 'bulbul:v3',
    speaker: 'priya',
    language_code: 'en-IN',
    pace: 0.9,
    speech_sample_rate: 22050,
    output_audio_codec: 'wav',
  });
});
