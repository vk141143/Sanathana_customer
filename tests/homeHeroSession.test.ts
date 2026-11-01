import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  homeHeroSessionReducer,
  INITIAL_HOME_HERO_SESSION,
} from '../src/lib/homeHeroSession';

test('successful login arms one playback and consumes it before the Home view can remount', () => {
  const afterLogin = homeHeroSessionReducer(INITIAL_HOME_HERO_SESSION, {
    type: 'authenticated',
    reducedMotion: false,
  });
  assert.deepEqual(afterLogin, { animationPending: true, revealPhase: 'pending' });

  const afterHomeMount = homeHeroSessionReducer(afterLogin, { type: 'animation-started' });
  assert.deepEqual(afterHomeMount, { animationPending: false, revealPhase: 'pending' });

  const afterNavigationAway = homeHeroSessionReducer(afterHomeMount, { type: 'left-home' });
  assert.deepEqual(afterNavigationAway, { animationPending: false, revealPhase: 'settled' });
  assert.equal(afterNavigationAway.animationPending, false, 'returning to Home cannot start another playback');
});

test('verified registration followed by sign-in gets one playback; refresh does not re-arm it', () => {
  const afterRegistrationSignIn = homeHeroSessionReducer(INITIAL_HOME_HERO_SESSION, {
    type: 'authenticated',
    reducedMotion: false,
  });
  assert.equal(afterRegistrationSignIn.animationPending, true);

  const afterPlayback = homeHeroSessionReducer(afterRegistrationSignIn, { type: 'reveal-completed' });
  assert.deepEqual(afterPlayback, { animationPending: false, revealPhase: 'revealing' });
  assert.deepEqual(INITIAL_HOME_HERO_SESSION, { animationPending: false, revealPhase: 'settled' });
});

test('a later successful authentication starts a fresh one-time playback', () => {
  const complete = homeHeroSessionReducer(INITIAL_HOME_HERO_SESSION, { type: 'left-home' });
  const afterNewLogin = homeHeroSessionReducer(complete, {
    type: 'authenticated',
    reducedMotion: false,
  });
  assert.deepEqual(afterNewLogin, { animationPending: true, revealPhase: 'pending' });
});

test('reduced-motion authentication shows the settled dashboard without replaying reveal motion', () => {
  const state = homeHeroSessionReducer(INITIAL_HOME_HERO_SESSION, {
    type: 'authenticated',
    reducedMotion: true,
  });
  assert.deepEqual(state, { animationPending: true, revealPhase: 'settled' });
});

test('the golden mandala circles are removed while the Krishna hero sequence remains', () => {
  const homeView = readFileSync(new URL('../src/components/HomeView.tsx', import.meta.url), 'utf8');
  const heroSequence = readFileSync(new URL('../src/components/HomeHeroSequence.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(homeView, /<HomeHeroSequence/);
  assert.match(homeView, /heroBannerImage \|\| !runHeroAnimation/);
  assert.match(homeView, /playAnimation={runHeroAnimation}/);
  assert.match(heroSequence, /HOME_HERO_FRAME_SOURCES\[HOME_HERO_FRAME_SOURCES\.length - 1\]/);
  assert.doesNotMatch(homeView, /function HomeMandala|<HomeMandala\s*\/>/);
  assert.doesNotMatch(styles, /home-sacred-mandala|home-mandala-(?:rotation|stroke)/);
  assert.match(styles, /\.home-divine-glow\s*\{/);
});
