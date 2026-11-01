export type HomeRevealPhase = 'pending' | 'revealing' | 'settled';

export interface HomeHeroSessionState {
  animationPending: boolean;
  revealPhase: HomeRevealPhase;
}

export type HomeHeroSessionAction =
  | { type: 'authenticated'; reducedMotion: boolean }
  | { type: 'animation-started' }
  | { type: 'reveal-completed' }
  | { type: 'left-home' }
  | { type: 'signed-out' };

export const INITIAL_HOME_HERO_SESSION: HomeHeroSessionState = {
  animationPending: false,
  revealPhase: 'settled',
};

export function homeHeroSessionReducer(
  state: HomeHeroSessionState,
  action: HomeHeroSessionAction,
): HomeHeroSessionState {
  switch (action.type) {
    case 'authenticated':
      return {
        animationPending: true,
        revealPhase: action.reducedMotion ? 'settled' : 'pending',
      };
    case 'animation-started':
      return { ...state, animationPending: false };
    case 'reveal-completed':
      return { ...state, animationPending: false, revealPhase: 'revealing' };
    case 'left-home':
      return { animationPending: false, revealPhase: 'settled' };
    case 'signed-out':
      return INITIAL_HOME_HERO_SESSION;
  }
}
