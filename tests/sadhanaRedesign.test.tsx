import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { currentSnapshot, currentStreak, streakFromDates } from '../src/components/sadhana/overview';
import { JapaMalaVisualization } from '../src/components/sadhana/JapaMalaVisualization';
import { GratitudeModal } from '../src/components/GratitudeModal';

test('stale daily flags never carry over and missing progress remains unknown', () => {
  assert.equal(currentSnapshot(null), null);
  const snapshot = currentSnapshot({ today_date: '2026-10-31', today_japa_done: true, today_xp: 10, current_xp: 200 }, '2026-11-01');
  assert.equal(snapshot?.today_japa_done, false);
  assert.equal(snapshot?.today_xp, 0);
  assert.equal(snapshot?.current_xp, 200);
  assert.equal(currentStreak({ current_streak: 9, last_completed_date: '2026-10-30' }, '2026-11-01'), 0);
});
test('practice streak handles duplicate sessions, yesterday grace and gaps', () => {
  assert.equal(streakFromDates(['2026-11-01','2026-11-01','2026-10-31','2026-10-29'], '2026-11-01'), 2);
  assert.equal(streakFromDates(['2026-10-31','2026-10-30'], '2026-11-01'), 2);
  assert.equal(streakFromDates(['2026-10-29'], '2026-11-01'), 0);
});
test('mala is decorative and bounds illumination without modifying counts', () => {
  const zero = renderToStaticMarkup(<JapaMalaVisualization count={0} target={108}/>);
  const half = renderToStaticMarkup(<JapaMalaVisualization count={54} target={108}/>);
  const beyond = renderToStaticMarkup(<JapaMalaVisualization count={216} target={108}/>);
  assert.equal((zero.match(/is-lit/g) ?? []).length, 0);
  assert.equal((half.match(/is-lit/g) ?? []).length, 27);
  assert.equal((beyond.match(/is-lit/g) ?? []).length, 54);
  assert.match(half, /aria-hidden="true"/);
});
test('journal rejects blank input, preserves failed writes, and shows existing history', async () => {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', {url:'http://localhost'});
  Object.assign(globalThis, {window:dom.window, document:dom.window.document, HTMLElement:dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT:true});
  const root = createRoot(document.getElementById('root')!);
  let writes = 0;
  try {
    await act(async () => root.render(<GratitudeModal isOpen onClose={() => {}} entries={[{date:'2026-11-01',blessing:'A quiet morning'}]} onSaveGratitude={() => { writes++; throw new Error('test storage failure'); }}/>));
    assert.match(document.body.textContent!, /A quiet morning/);
    assert.equal(document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, true);
    const input = document.querySelector('textarea')!;
    assert.equal(input.maxLength, 2000);
    // Drive React's value handler directly through its DOM props to avoid jsdom's
    // input-event polyfill, which depends on DOM globals at React import time.
    const propsKey = Object.keys(input).find(key => key.startsWith('__reactProps'))!;
    await act(async () => (input as any)[propsKey].onChange({target:{value:'  Family and friends  '}}));
    await act(async () => document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', {bubbles:true,cancelable:true})));
    assert.equal(writes, 1);
    assert.equal(input.value, '  Family and friends  ');
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /could not be saved/);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
