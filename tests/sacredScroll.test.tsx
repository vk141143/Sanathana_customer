import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { SacredScroll } from '../src/components/SacredScroll';

test('manuscript switches content safely without controlling audio during visual changes', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousAct = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.getElementById('root')!;
  const root = createRoot(host);
  let listens = 0;
  let bookmarks = 0;
  const props = {
    verseLabel: 'Verse 1', sanskrit: 'पहली पंक्ति\nदूसरी पंक्ति', transliteration: 'Transliteration',
    language: 'en', languageLabel: 'English', content: {
      translation: 'Translation one', meaning: 'Additional meaning',
      explanation: Array.from({ length: 100 }, (_, i) => `Paragraph ${i}`).join('\n\n'), example: 'Practical example',
    },
    bookmarked: false, onBookmark: () => { bookmarks++; },
    canListen: true, listenToSanskrit: true, onListen: () => { listens++; },
  };
  const render = async (overrides = {}, key = 'verse-1') => {
    await act(async () => root.render(<SacredScroll key={key} {...props} {...overrides} />));
  };
  const click = async (label: string) => {
    const button = Array.from(host.querySelectorAll('button')).find(button =>
      button.getAttribute('aria-label') === label || button.textContent?.trim() === label);
    assert.ok(button, `Button ${label} exists`);
    await act(async () => button.click());
  };
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); }); };
  try {
    await render();
    assert.equal(host.querySelectorAll('.sacred-line').length, 2);
    assert.ok(host.querySelector('.is-horizontal'));
    await click('Explore verse');
    await click('Meaning');
    await click('Explore verse');
    await click('Explanation');
    await settle();
    assert.equal(host.querySelectorAll('article').length, 1);
    assert.ok(host.querySelector('.is-vertical'));
    assert.ok(host.textContent?.includes('Paragraph 99'));
    assert.ok(!host.textContent?.includes('Translation one'));
    assert.equal(listens, 0);
    await render({ language: 'te', languageLabel: 'Telugu', content: { explanation: 'తెలుగు వివరణ' } });
    assert.ok(host.textContent?.includes('తెలుగు వివరణ'));
    assert.ok(!host.textContent?.includes('Paragraph 99'));
    await click('Explore verse');
    await click('Bookmark');
    assert.equal(bookmarks, 1);
    assert.equal(host.querySelector('[aria-label="Explore verse"]')?.getAttribute('aria-expanded'), 'false');
    await click('Explore verse');
    await click('Listen');
    await settle();
    assert.equal(listens, 1);
    assert.ok(host.querySelector('.is-horizontal'));
    await click('Explore verse');
    await click('Real-life Example');
    await settle();
    assert.equal(listens, 1, 'visual changes do not restart audio');
    await click('Return to sloka');
    await settle();
    assert.ok(host.querySelector('.is-horizontal'));
    await render({ verseLabel: 'Verse 2', sanskrit: 'नया श्लोक' }, 'verse-2');
    assert.ok(host.querySelector('.is-horizontal'));
    assert.ok(!host.textContent?.includes('पहली पंक्ति'));
    await click('Explore verse');
    assert.ok(Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Word-by-word'))?.disabled);
    await act(async () => host.querySelector('.sacred-tools')!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(host.querySelector('.sacred-actions'), null);
    // Reduced motion and missing content use the same real view, without a transition wait.
    Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: true }) });
    await render({ language: 'ml', languageLabel: 'Malayalam', content: {} });
    await click('Explore verse');
    await click('Meaning');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.ok(host.textContent?.includes('Meaning not available in Malayalam.'));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, { window: previousWindow, document: previousDocument, IS_REACT_ACT_ENVIRONMENT: previousAct });
  }
});
