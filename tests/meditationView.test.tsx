import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { normalizeSadhanaPractice } from '../src/services/sadhana/practiceCatalog';

test('Meditation renders Sadhana content, switches language, and persists explicit session actions', async () => {
  const row = normalizeSadhanaPractice({ id: 'meditation', name: 'Quiet', slug: 'quiet', category: 'meditation', is_active: true,
    completion_rule: 'audio_completed', practice_mode: 'guided_audio', duration_minutes: 5,
    guided_audio_url: 'https://media.example/guided.mp3', ambient_audio_url: 'https://media.example/ambient.mp3',
    category_config: { meditation_style: 'guided', begin_instructions: 'Sit comfortably', end_instructions: 'Open your eyes',
      breathing_guidance: 'Breathe slowly', localized_content: { en: { instructions: 'English instructions' }, te: { instructions: 'Reviewed Telugu instructions' } } },
  })!;
  const actions: string[] = [];
  let session: any = { id: 'session', practice_id: row.id, status: 'in_progress', version: 0,
    planned_duration_seconds: 300, active_duration_seconds: 0 };
  const api = {
    getLibrary: async () => ({ practices: [row], recommendations: [], stages: [], categories: [] }),
    getHistory: async () => ({ sessions: [], preferences: { bell_enabled: false } }),
    startSession: async () => { actions.push('start'); return session; },
    sessionAction: async (_id: string, input: any) => {
      actions.push(input.action);
      session = { ...session, version: session.version + 1, status: input.action === 'pause' ? 'paused' : input.action === 'complete' ? 'completed' : 'in_progress' };
      return { session, xp_awarded: 0 };
    },
  };
  (globalThis as any).__meditationTestApi = api;
  const compiled = await build({ entryPoints: ['src/components/MeditationView.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    plugins: [{ name: 'meditation-test-services', setup(builder) {
      builder.onResolve({ filter: /^(firebase\/auth|.*\/lib\/firebase|.*\/services\/meditationApi)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'firebase/auth'
        ? 'export const onAuthStateChanged = (_, listener) => { listener({uid: "owner"}); return () => {}; };'
        : args.path.endsWith('/meditationApi') ? 'export const meditationApi = globalThis.__meditationTestApi;'
        : 'export const auth = {};', loader: 'js' }));
    } }],
  });
  const module = { exports: {} as any };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  const View = module.exports.MeditationView;
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  dom.window.HTMLMediaElement.prototype.pause = () => {};
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const button = (label: string) => Array.from(container.querySelectorAll('button')).find(item => item.textContent === label)!;
  try {
    await act(async () => root.render(<View initialPractice={row} preferredLanguage="en" />));
    assert.match(container.textContent!, /Sit comfortably|Breathe slowly/);
    assert.match(container.textContent!, /English instructions/);
    assert.deepEqual(actions, []);
    await act(async () => root.render(<View initialPractice={row} preferredLanguage="te" />));
    assert.match(container.textContent!, /Reviewed Telugu instructions/);
    await act(async () => button('Begin meditation').click());
    assert.deepEqual(actions, ['start']);
    assert.equal(container.querySelectorAll('audio').length, 2);
    assert.equal(container.querySelector('audio[aria-label="Ambient audio"]')?.hasAttribute('loop'), true);
    assert.equal(button('Complete'), undefined);
    await act(async () => button('Pause').click());
    await act(async () => button('Resume').click());
    assert.ok(button('Pause'));
    await act(async () => container.querySelector('audio[aria-label="Guided audio"]')!.dispatchEvent(new dom.window.Event('ended')));
    assert.deepEqual(actions, ['start', 'pause', 'resume']);
    await act(async () => button('Complete').click());
    assert.deepEqual(actions, ['start', 'pause', 'resume', 'complete']);
    assert.match(container.textContent!, /Open your eyes/);
    row.category_config.meditation_style = 'silent';
    row.completion_rule = 'manual';
    session = { ...session, status: 'in_progress' };
    await act(async () => root.render(<View key="silent" initialPractice={row} />));
    await act(async () => button('Begin meditation').click());
    assert.equal(container.querySelector('audio[aria-label="Guided audio"]'), null);
    assert.ok(container.querySelector('audio[aria-label="Ambient audio"]'));
    assert.ok(button('Complete'));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    delete (globalThis as any).__meditationTestApi;
  }
});
