import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { SlokaAudioControl } from '../src/components/SlokaAudioControl';
import { normalizeSlokaMetadata } from '../src/lib/slokaMetadata';
import {
  getSlokaAudioReference,
  hasSlokaAudio,
  resolveSlokaAudioUrl,
  SlokaAudioPlayer,
  slokaAudioPlayer,
} from '../src/lib/slokaAudio';
import type { SlokaAudioSource } from '../src/lib/slokaAudio';

class FakeAudio {
  src = '';
  preload = '';
  paused = true;
  ended = false;
  onplaying: HTMLAudioElement['onplaying'] = null;
  onwaiting: HTMLAudioElement['onwaiting'] = null;
  onpause: HTMLAudioElement['onpause'] = null;
  onended: HTMLAudioElement['onended'] = null;
  onerror: HTMLAudioElement['onerror'] = null;
  removed = false;

  play(): Promise<void> {
    this.paused = false;
    this.onplaying?.call(this as unknown as GlobalEventHandlers, new Event('playing'));
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
    this.onpause?.call(this as unknown as GlobalEventHandlers, new Event('pause'));
  }

  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
    this.removed = true;
  }

  load(): void {}

  finish(): void {
    this.ended = true;
    this.paused = true;
    this.onended?.call(this as unknown as GlobalEventHandlers, new Event('ended'));
  }
}

const audioPath: SlokaAudioSource = { audioR2Path: 'sloka-audio/BG/1/1.wav' };

test('maps canonical Sloka audio fields without dropping the existing record data', () => {
  const sloka = normalizeSlokaMetadata({
    id: 'sloka-1',
    chapter_id: 'chapter-1',
    verse_number: 1,
    verse_id: 'BG.1.1',
    json_url: 'https://content.example/BG/1/1.json',
    audio_url: '',
    audio_r2_key: '',
    audio_r2_path: 'sloka-audio/BG/1/1.wav',
    audio_status: 'ready',
  });
  assert.equal(sloka.id, 'sloka-1');
  assert.equal(sloka.json_url, 'https://content.example/BG/1/1.json');
  assert.equal(sloka.audio_r2_path, 'sloka-audio/BG/1/1.wav');
  assert.equal(sloka.audio_status, 'ready');
  assert.equal(sloka.audio_url, null);
  assert.equal(sloka.audio_r2_key, null);
});

test('shows audio for ready records and hides records without a source or successful status', () => {
  assert.equal(hasSlokaAudio(audioPath, 'ready'), true);
  assert.equal(hasSlokaAudio(audioPath, 'uploaded'), true);
  assert.equal(hasSlokaAudio({}, 'ready'), false);
  assert.equal(hasSlokaAudio(audioPath, 'processing'), false);
  assert.equal(hasSlokaAudio(audioPath, null), false);
});

test('uses a public HTTPS audio_url first and falls back to the R2 path or key', () => {
  assert.equal(
    getSlokaAudioReference({
      audioUrl: 'https://media.example/custom/1.wav',
      audioR2Path: 'sloka-audio/BG/1/1.wav',
    }),
    'https://media.example/custom/1.wav',
  );
  assert.equal(
    getSlokaAudioReference({ audioUrl: 'http://invalid.example/1.wav', audioR2Key: 'sloka-audio/BG/1/1.wav' }),
    'sloka-audio/BG/1/1.wav',
  );
  assert.equal(getSlokaAudioReference({ audioR2Key: '/sloka-audio/BG/1/1.wav' }), '/sloka-audio/BG/1/1.wav');
});

test('resolves object keys against an R2 base with normalized slashes', () => {
  assert.equal(
    resolveSlokaAudioUrl('/sloka-audio/BG/1/1.wav', 'https://media.example/'),
    'https://media.example/sloka-audio/BG/1/1.wav',
  );
  assert.equal(
    resolveSlokaAudioUrl('sloka-audio/BG/1/1.wav', 'https://media.example'),
    'https://media.example/sloka-audio/BG/1/1.wav',
  );
});

test('resolves the admin-configured Bhagavad Gita audio key against the shared R2 host', () => {
  assert.equal(
    resolveSlokaAudioUrl(
      'sloka-audio/BG/1/1.wav',
      'https://pub-5ac331aed8ed455b8efc7bde5ffd54bf.r2.dev/',
    ),
    'https://pub-5ac331aed8ed455b8efc7bde5ffd54bf.r2.dev/sloka-audio/BG/1/1.wav',
  );
});

test('accepts a public HTTPS audio URL directly without requiring an R2 base', () => {
  assert.equal(
    resolveSlokaAudioUrl('https://media.example/sloka-audio/BG/1/1.wav'),
    'https://media.example/sloka-audio/BG/1/1.wav',
  );
  assert.throws(
    () => resolveSlokaAudioUrl('http://media.example/1.wav'),
    /public HTTPS/,
  );
  assert.throws(
    () => resolveSlokaAudioUrl('sloka-audio/BG/1/1.wav'),
    /delivery is not configured/,
  );
});

test('one player pauses, resumes, completes and replays the selected Sloka', async () => {
  const audios: FakeAudio[] = [];
  const player = new SlokaAudioPlayer(
    'https://media.example',
    () => {
      const audio = new FakeAudio();
      audios.push(audio);
      return audio as unknown as HTMLAudioElement;
    },
  );
  const states: string[] = [];
  const unsubscribe = player.subscribe(() => {
    states.push(`${player.getSnapshot().slokaId}:${player.getSnapshot().status}`);
  });

  await player.toggle('sloka-1', audioPath);
  assert.equal(player.getSnapshot().status, 'playing');
  assert.equal(audios[0].src, 'https://media.example/sloka-audio/BG/1/1.wav');

  await player.toggle('sloka-1', audioPath);
  assert.equal(player.getSnapshot().status, 'paused');
  await player.toggle('sloka-1', audioPath);
  assert.equal(player.getSnapshot().status, 'playing');
  assert.equal(audios.length, 1);

  audios[0].finish();
  assert.equal(player.getSnapshot().status, 'completed');
  assert.equal(audios[0].onended, null);
  await player.toggle('sloka-1', audioPath);
  assert.equal(player.getSnapshot().status, 'playing');
  assert.equal(audios.length, 2);
  assert.ok(states.includes('sloka-1:paused'));
  unsubscribe();
  player.stop();
});

test('plays an explicit public audio URL without fetching API configuration', async () => {
  let fetchCalls = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Audio playback must not fetch configuration.');
  };
  const audio = new FakeAudio();
  try {
    const player = new SlokaAudioPlayer(
      'https://unused.example',
      () => audio as unknown as HTMLAudioElement,
    );
    await player.toggle('sloka-direct', { audioUrl: 'https://audio.example/sloka.wav' });
    assert.equal(fetchCalls, 0);
    assert.equal(audio.src, 'https://audio.example/sloka.wav');
    player.stop();
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('starting another Sloka releases the previous audio and keeps only one active', async () => {
  const audios: FakeAudio[] = [];
  const player = new SlokaAudioPlayer(
    'https://media.example/',
    () => {
      const audio = new FakeAudio();
      audios.push(audio);
      return audio as unknown as HTMLAudioElement;
    },
  );

  await player.toggle('sloka-1', audioPath);
  await player.toggle('sloka-2', { audioR2Path: 'sloka-audio/BG/1/2.wav' });

  assert.equal(audios.length, 2);
  assert.equal(audios[0].paused, true);
  assert.equal(audios[0].src, '');
  assert.equal(audios[0].onplaying, null);
  assert.equal(player.getSnapshot().slokaId, 'sloka-2');
  assert.equal(player.getSnapshot().status, 'playing');
  player.stop('sloka-2');
  assert.equal(player.getSnapshot().status, 'idle');
});

test('late play resolution for a previous Sloka cannot start stale playback', async () => {
  let releaseFirst!: () => void;
  const audios: FakeAudio[] = [];
  const player = new SlokaAudioPlayer('https://media.example', () => {
    const audio = new FakeAudio();
    if (audios.length === 0) {
      audio.play = () => new Promise(resolve => { releaseFirst = resolve; });
    }
    audios.push(audio);
    return audio as unknown as HTMLAudioElement;
  });

  const first = player.toggle('sloka-1', audioPath);
  const second = player.toggle('sloka-2', { audioR2Path: 'sloka-audio/BG/1/2.wav' });
  await second;
  releaseFirst();
  await first;

  assert.equal(audios.length, 2);
  assert.equal(audios[0].src, '');
  assert.equal(player.getSnapshot().slokaId, 'sloka-2');
  assert.equal(audios[1].src, 'https://media.example/sloka-audio/BG/1/2.wav');
  player.stop();
});

test('playback errors become a friendly state and stop releases audio', async () => {
  const audio = new FakeAudio();
  audio.play = () => Promise.reject(new Error('network details'));
  const player = new SlokaAudioPlayer(
    'https://media.example',
    () => audio as unknown as HTMLAudioElement,
  );

  await player.toggle('sloka-1', audioPath);
  assert.equal(player.getSnapshot().status, 'error');
  assert.match(player.getSnapshot().error ?? '', /try again/i);
  assert.doesNotMatch(player.getSnapshot().error ?? '', /network details/);
  assert.equal(audio.src, '');
});

test('listing control keeps card navigation separate and stops shared audio on unmount', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    audio: globalThis.Audio,
    fetch: globalThis.fetch,
    reactAct: (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT,
  };
  const audio = new FakeAudio();
  let fetchCalls = 0;
  let cardClicks = 0;
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Audio: class {
      constructor() {
        return audio as unknown as HTMLAudioElement;
      }
    },
    fetch: async () => {
      fetchCalls += 1;
      throw new Error('Sloka audio must not fetch API configuration.');
    },
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(
        React.createElement(
          'div',
          { onClick: () => { cardClicks += 1; } },
          React.createElement(SlokaAudioControl, {
            slokaId: 'sloka-listing',
            audioSource: { audioUrl: 'https://media.example/sloka-audio/BG/1/1.wav' },
          }),
        ),
      );
    });
    const listenButton = container.querySelector<HTMLButtonElement>('[aria-label="Listen to Sanskrit audio"]');
    assert.ok(listenButton);

    await act(async () => { listenButton.click(); });
    assert.equal(cardClicks, 0);
    assert.equal(audio.src, 'https://media.example/sloka-audio/BG/1/1.wav');
    assert.equal(fetchCalls, 0);
    assert.ok(container.querySelector('[aria-label="Pause Sanskrit audio"]'));

    await act(async () => { root.unmount(); });
    assert.equal(audio.src, '');
    assert.equal(slokaAudioPlayer.getSnapshot().status, 'idle');
  } finally {
    container.remove();
    Object.assign(globalThis, {
      window: previous.window,
      document: previous.document,
      HTMLElement: previous.HTMLElement,
      Audio: previous.audio,
      fetch: previous.fetch,
      IS_REACT_ACT_ENVIRONMENT: previous.reactAct,
    });
    dom.window.close();
  }
});
