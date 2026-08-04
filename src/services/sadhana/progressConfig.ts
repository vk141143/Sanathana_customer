// ============================================================
// SADHANA PROGRESS ENGINE — CONFIGURATION
// All values are configurable here. Never hardcode in engine.
// ============================================================

// ── Practice Weights (must sum to 1.0) ──────────────────────
export const PRACTICE_WEIGHTS = {
  meditation: 0.35,
  japa:       0.35,
  mantra:     0.20,
  gratitude:  0.10,
} as const;

// ── Base XP per completed practice ──────────────────────────
export const BASE_XP = {
  meditation: 10,
  japa:       10,
  mantra:      6,
  gratitude:   3,
} as const;

// ── Minimum XP awarded per practice regardless of multiplier ─
export const MIN_XP = 1;

// ── XP Multipliers per level (index = level number, 1-based) ─
// Smooth linear reduction: Level 1 = 1.0x … Level 10 = 0.1x
export const XP_MULTIPLIERS: Record<number, number> = {
  1:  1.0,
  2:  0.9,
  3:  0.8,
  4:  0.7,
  5:  0.6,
  6:  0.5,
  7:  0.4,
  8:  0.3,
  9:  0.2,
  10: 0.1,
};
// Fallback for any level beyond the defined table
export const DEFAULT_XP_MULTIPLIER = 0.1;

// ── Level definitions ────────────────────────────────────────
export interface LevelDefinition {
  level:      number;
  name:       string;
  xpRequired: number; // cumulative XP to reach this level
}

export const LEVELS: LevelDefinition[] = [
  { level: 1,  name: 'Temple Entrance',  xpRequired: 0       },
  { level: 2,  name: 'Sacred Garden',    xpRequired: 100     },
  { level: 3,  name: 'Lotus Courtyard',  xpRequired: 300     },
  { level: 4,  name: 'Temple Hall',      xpRequired: 700     },
  { level: 5,  name: 'Sacred Mandapam',  xpRequired: 1500    },
  { level: 6,  name: 'Inner Corridor',   xpRequired: 3000    },
  { level: 7,  name: 'Divine Sanctum',   xpRequired: 6000    },
  { level: 8,  name: 'Garbhagriha',      xpRequired: 12000   },
  { level: 9,  name: 'Divine Light',     xpRequired: 25000   },
  { level: 10, name: 'Eternal Seeker',   xpRequired: 100000  },
];

// ── Streak milestones (days) ─────────────────────────────────
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100, 365] as const;

// ── Minimum weighted completion to count the day as done ─────
// 0.60 = 60%  (Meditation+Japa=70% ✅  Meditation+Mantra=55% ❌)
export const DAILY_COMPLETION_THRESHOLD = 0.60;

// ── Mantra: minimum listen ratio to award XP ─────────────────
// 0.80 = user must listen to at least 80% of the track
export const MANTRA_MIN_LISTEN_RATIO = 0.80;

// ── Grace period: hours after midnight treated as previous day ─
// e.g. 3 → practices done 12:00 AM–2:59 AM count for yesterday
export const GRACE_PERIOD_HOURS = 3;
