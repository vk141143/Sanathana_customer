// ============================================================
// SADHANA PROGRESS ENGINE — PUBLIC API
// Import everything from here in your screens:
//   import { recordPractice, loadProgress, getCurrentLevel } from '../services/sadhana';
// ============================================================

export {
  // Core action
  recordPractice,

  // DB helpers
  loadProgress,
  saveProgress,

  // Pure calculation helpers (no DB)
  calculateXP,
  calculateLevel,
  calculateDailyProgress,
  getCurrentLevel,
  getNextLevel,
  getRemainingXP,
  updateStreak,
  resetStreak,
  updateMilestones,
} from './SadhanaProgressEngine';

export type {
  SadhanaProgress,
  PracticeCompletionInput,
  DailyProgress,
  LevelInfo,
  MilestoneAchievement,
  PracticeResult,
  PracticeType,
} from './progressTypes';

export {
  PRACTICE_WEIGHTS,
  BASE_XP,
  MIN_XP,
  XP_MULTIPLIERS,
  DEFAULT_XP_MULTIPLIER,
  LEVELS,
  STREAK_MILESTONES,
  DAILY_COMPLETION_THRESHOLD,
  MANTRA_MIN_LISTEN_RATIO,
  GRACE_PERIOD_HOURS,
} from './progressConfig';
