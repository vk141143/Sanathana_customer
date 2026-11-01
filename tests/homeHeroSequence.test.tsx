import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  HOME_HERO_FRAME_DURATION_MS,
  HOME_HERO_FRAME_SOURCES,
  HomeHeroSequence,
} from '../src/components/HomeHeroSequence';

class FakeImage {
  static instances: FakeImage[] = [];
  static failFrame20 = false;
  complete = false;
  naturalWidth = 720;
  private source = '';
  private resolveDecode: (() => void) | null = null;

  constructor() {
    FakeImage.instances.push(this);
  }

  set src(value: string) {
    this.source = value;
  }

  get src(): string {
    return this.source;
  }

  decode(): Promise<void> {
    if (this.source.includes('frame_0020') && FakeImage.failFrame20) {
      return Promise.reject(new Error('Frame failed to load.'));
    }

    return new Promise(resolve => {
      this.resolveDecode = () => {
        this.complete = true;
        resolve();
      };
    });
  }

  finishDecode(): void {
    this.resolveDecode?.();
  }
}

function createBrowser(reducedMotion = false) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    Image: globalThis.Image,
    reactAct: (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT,
  };
  let nextFrameId = 0;
  const animationFrames = new Map<number, FrameRequestCallback>();
  const mediaQuery = {
    matches: reducedMotion,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  Object.defineProperty(dom.window, 'matchMedia', { value: () => mediaQuery });
  Object.defineProperty(dom.window, 'requestAnimationFrame', {
    value: (callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      animationFrames.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(dom.window, 'cancelAnimationFrame', {
    value: (id: number) => animationFrames.delete(id),
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Image: FakeImage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  FakeImage.instances = [];
  FakeImage.failFrame20 = false;

  return {
    dom,
    animationFrames,
    restore() {
      Object.assign(globalThis, {
        window: previous.window,
        document: previous.document,
        Image: previous.Image,
        IS_REACT_ACT_ENVIRONMENT: previous.reactAct,
      });
      dom.window.close();
    },
  };
}

async function settlePreload(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

function flushFrame(animationFrames: Map<number, FrameRequestCallback>, timestamp: number): void {
  const [id, callback] = [...animationFrames.entries()][0] ?? [];
  assert.ok(callback);
  animationFrames.delete(id);
  callback(timestamp);
}

test('waits for all decoded images, shows one frame at a time, and retains frame 0040', async () => {
  const browser = createBrowser();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const heroUrl = 'https://example.test/hero.webp';
  let completionCount = 0;
  try {
    await act(async () => {
      root.render(
        <React.StrictMode>
          <HomeHeroSequence
            finalImageUrl={heroUrl}
            onComplete={() => { completionCount += 1; }}
          />
        </React.StrictMode>,
      );
      await settlePreload();
    });

    assert.equal(FakeImage.instances.length, HOME_HERO_FRAME_SOURCES.length + 1);
    assert.deepEqual(FakeImage.instances.slice(0, -1).map(image => image.src), HOME_HERO_FRAME_SOURCES);
    assert.equal(container.querySelectorAll('img').length, 1);
    assert.equal(container.querySelector('img')?.getAttribute('src'), heroUrl);
    assert.equal(browser.animationFrames.size, 0, 'animation waits for decoded frames');
    assert.equal(completionCount, 0, 'completion waits for the full frame sequence');

    await act(async () => {
      FakeImage.instances.slice(0, -1).forEach(image => image.finishDecode());
      await settlePreload();
    });
    assert.equal(browser.animationFrames.size, 0, 'animation also waits for the static hero to decode');

    await act(async () => {
      FakeImage.instances.at(-1)?.finishDecode();
      await settlePreload();
    });
    assert.equal(browser.animationFrames.size, 1);

    act(() => flushFrame(browser.animationFrames, 0));
    assert.equal(container.querySelectorAll('img').length, 1);
    assert.equal(container.querySelector('img')?.getAttribute('src'), HOME_HERO_FRAME_SOURCES[0]);

    act(() => flushFrame(browser.animationFrames, HOME_HERO_FRAME_DURATION_MS));
    assert.equal(container.querySelector('img')?.getAttribute('src'), HOME_HERO_FRAME_SOURCES[1]);

    for (let frame = 2; frame < HOME_HERO_FRAME_SOURCES.length; frame += 1) {
      act(() => flushFrame(browser.animationFrames, frame * HOME_HERO_FRAME_DURATION_MS + 1));
      assert.equal(container.querySelectorAll('img').length, 1);
    }
    assert.equal(container.querySelector('img')?.getAttribute('src'), '/home/frame_0040.jpg');
    assert.equal(completionCount, 0, 'the reveal waits until playback reaches completion');

    act(() => flushFrame(browser.animationFrames, HOME_HERO_FRAME_SOURCES.length * HOME_HERO_FRAME_DURATION_MS + 1));
    assert.equal(container.querySelector('img')?.getAttribute('src'), '/home/frame_0040.jpg');
    assert.equal(browser.animationFrames.size, 0);
    assert.equal(completionCount, 1, 'completion is signaled once after the final frame is retained');

    await act(async () => {
      root.render(
        <React.StrictMode>
          <HomeHeroSequence finalImageUrl={heroUrl} />
        </React.StrictMode>,
      );
      window.dispatchEvent(new browser.dom.window.Event('scroll'));
    });
    assert.equal(container.querySelector('img')?.getAttribute('src'), '/home/frame_0040.jpg');
    assert.equal(FakeImage.instances.length, HOME_HERO_FRAME_SOURCES.length + 1);
    assert.equal(completionCount, 1, 're-rendering does not signal completion again');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    browser.restore();
  }
});

test('reduced motion decodes and displays frame 0040 without animating', async () => {
  const browser = createBrowser(true);
  const heroUrl = 'https://example.test/hero.webp';
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let completionCount = 0;
  try {
    await act(async () => {
      root.render(
        <HomeHeroSequence
          finalImageUrl={heroUrl}
          onComplete={() => { completionCount += 1; }}
        />,
      );
      await settlePreload();
    });
    assert.equal(FakeImage.instances.length, 2);
    assert.equal(container.querySelector('img')?.getAttribute('src'), heroUrl);

    await act(async () => {
      FakeImage.instances.forEach(image => image.finishDecode());
      await settlePreload();
    });
    assert.equal(container.querySelector('img')?.getAttribute('src'), '/home/frame_0040.jpg');
    assert.equal(browser.animationFrames.size, 0);
    assert.equal(completionCount, 1, 'reduced-motion completion is signaled after the final image is ready');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    browser.restore();
  }
});

test('falls back to the existing hero if any frame fails to decode', async () => {
  const browser = createBrowser();
  FakeImage.failFrame20 = true;
  const heroUrl = 'https://example.test/hero.webp';
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let completionCount = 0;
  try {
    await act(async () => {
      root.render(
        <HomeHeroSequence
          finalImageUrl={heroUrl}
          onComplete={() => { completionCount += 1; }}
        />,
      );
      await settlePreload();
    });
    FakeImage.instances
      .filter(image => !image.src.includes('frame_0020'))
      .forEach(image => image.finishDecode());
    await act(async () => { await settlePreload(); });

    assert.equal(container.querySelectorAll('img').length, 1);
    assert.equal(container.querySelector('img')?.getAttribute('src'), heroUrl);
    assert.equal(browser.animationFrames.size, 0);
    assert.equal(completionCount, 1, 'fallback completes the Home UI reveal without looping');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    browser.restore();
  }
});
