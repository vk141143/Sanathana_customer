// ============================================================
// SADHANA PROGRESS ENGINE — TYPES
// ============================================================

export type PracticeType = 'meditation' | 'japa' | 'mantra' | 'gratitude';

// ── What gets stored in Supabase ─────────────────────────────
export interface SadhanaProgress {
  id:       string;
  user_id:  string;

  // ── XP & Level ───────────────────────────────────────────
  current_xp:   number;
  level_number: number;
  level_name:   string;

  // ── Streak ───────────────────────────────────────────────
  current_streak:      number;
  longest_streak:      number;
  last_completed_date: string | null; // ISO date 'YYYY-MM-DD'

  // ── Today's snapshot (reset each logical day) ────────────
  today_date:                  string;
  today_xp:                    number;
  today_meditation_done:       boolean;
  today_japa_done:             boolean;
  today_mantra_done:           boolean;
  today_gratitude_done:        boolean;
  today_completion_percentage: number;
  today_perfect_day:           boolean; // all 4 practices done

  // kept for backward-compat
  completion_percentage: number;

  // ── Lifetime totals (never reset) ────────────────────────
  total_xp:                  number;
  highest_level:             number;
  total_meditation_sessions: number;
  total_meditation_minutes:  number;
  total_japa_count:          number;
  total_mantra_sessions:     number;
  total_audio_minutes:       number;
  total_gratitude_entries:   number;

  // ── Streak freeze (reserved for future) ──────────────────
  available_freezes: number;
  used_freezes:      number;
  last_freeze_date:  string | null;

  // ── Milestones (array of achieved streak-day counts) ─────
  milestones_achieved: number[];

  created_at: string;
  updated_at: string;
}

// ── Input for recording a completed practice ─────────────────
export interface PracticeCompletionInput {
  userId:           string;
  practice:         PracticeType;
  practiceName?:    string;  // human-readable label e.g. "Morning Meditation"
  durationMinutes?: number;
  japaCount?:       number;
  listenRatio?:     number;  // mantra: 0.0–1.0
}

// ── Computed daily progress ───────────────────────────────────
export interface DailyProgress {
  meditationWeight: number;
  japaWeight:       number;
  mantraWeight:     number;
  gratitudeWeight:  number;
  totalPercent:     number;
  isComplete:       boolean;
  isPerfectDay:     boolean; // all 4 done
}

// ── Level info helpers ────────────────────────────────────────
export interface LevelInfo {
  levelNumber:     number;
  levelName:       string;
  currentXP:       number;
  xpForThisLevel:  number;
  xpForNextLevel:  number;
  xpRemaining:     number;
  progressPercent: number;
}

// ── Temple / level progress (for UI) ─────────────────────────
export interface TempleProgress {
  currentTemple:    string;
  nextTemple:       string | null;
  currentXP:        number;
  requiredXP:       number;  // XP needed to reach next temple
  remainingXP:      number;
  completionPercent: number; // 0–100 within current temple
}

// ── Milestone event ───────────────────────────────────────────
export interface MilestoneAchievement {
  days:  number;
  isNew: boolean;
}

// ── Engine event types ────────────────────────────────────────
export type EngineEventType =
  | 'LEVEL_UP'
  | 'NEW_TEMPLE'
  | 'STREAK_UPDATED'
  | 'MILESTONE_UNLOCKED'
  | 'PERFECT_DAY'
  | 'FIRST_PRACTICE'
  | 'NEW_BADGE'
  | 'ACHIEVEMENT_UNLOCKED';

export interface EngineEvent {
  type:    EngineEventType;
  payload: Record<string, unknown>;
}

// ── Achievement identifiers ───────────────────────────────────
export type AchievementId =
  | 'FIRST_MEDITATION'
  | 'FIRST_JAPA'
  | 'FIRST_MANTRA'
  | 'FIRST_GRATITUDE'
  | 'FIRST_PERFECT_DAY'
  | '3_DAY_STREAK'
  | '7_DAY_STREAK'
  | '14_DAY_STREAK'
  | '21_DAY_STREAK'
  | '30_DAY_STREAK'
  | '50_DAY_STREAK'
  | '100_DAY_STREAK'
  | '365_DAY_STREAK'
  | '100_JAPA'
  | '1000_JAPA'
  | '10_MEDITATION'
  | '30_MEDITATION'
  | 'PERFECT_WEEK'
  | 'LEVEL_2'
  | 'LEVEL_5'
  | 'LEVEL_10';

// ── Extended result returned by recordPractice ───────────────
export interface PracticeResult {
  xpAwarded:            number;
  newTotalXP:           number;
  leveledUp:            boolean;
  newLevel:             LevelInfo;
  dailyProgress:        DailyProgress;
  streakUpdated:        boolean;
  newMilestones:        MilestoneAchievement[];
  // New fields
  events:               EngineEvent[];
  unlockedAchievements: AchievementId[];
  isPerfectDay:         boolean;
}

// ── Practice history row ──────────────────────────────────────
export interface PracticeHistoryRow {
  id:                    string;
  user_id:               string;
  practice_type:         PracticeType;
  practice_name:         string;
  duration_minutes:      number | null;
  completion_percentage: number;
  xp_earned:             number;
  level_before:          number;
  level_after:           number;
  streak_before:         number;
  streak_after:          number;
  completed_date:        string; // ISO date
  completed_time:        string; // ISO time HH:MM:SS
  created_at:            string;
}

// ── XP history row ────────────────────────────────────────────
export type XPSource =
  | 'meditation'
  | 'japa'
  | 'mantra'
  | 'gratitude'
  | 'perfect_day_bonus'
  | 'milestone_reward'
  | 'achievement_reward';

export interface XPHistoryRow {
  id:            string;
  user_id:       string;
  source:        XPSource;
  xp_earned:     number;
  level_before:  number;
  level_after:   number;
  total_xp_after: number;
  reason:        string;
  created_at:    string;
}

// ── Weekly summary row ────────────────────────────────────────
export interface WeeklySummaryRow {
  id:                      string;
  user_id:                 string;
  week_number:             number;
  year:                    number;
  completed_days:          number;
  perfect_days:            number;
  total_xp:                number;
  total_meditation_minutes: number;
  total_japa:              number;
  total_mantras:           number;
  total_gratitude:         number;
  created_at:              string;
  updated_at:              string;
}

// ── Monthly summary row ───────────────────────────────────────
export interface MonthlySummaryRow {
  id:                string;
  user_id:           string;
  month:             number; // 1–12
  year:              number;
  completed_days:    number;
  perfect_days:      number;
  best_streak:       number;
  total_xp:          number;
  total_practices:   number;
  meditation_minutes: number;
  japa_count:        number;
  mantra_count:      number;
  gratitude_count:   number;
  created_at:        string;
  updated_at:        string;
}

// ── Analytics return types ────────────────────────────────────
export interface DailyAnalytics {
  date:                 string;
  completionPercent:    number;
  isPerfectDay:         boolean;
  xpEarned:             number;
  practicesCompleted:   PracticeType[];
  meditationMinutes:    number;
  japaCount:            number;
}

export interface WeeklyAnalytics {
  weekNumber:           number;
  year:                 number;
  completedDays:        number;
  perfectDays:          number;
  totalXP:              number;
  consistencyPercent:   number; // completedDays / 7 * 100
  meditationMinutes:    number;
  totalJapa:            number;
}

export interface MonthlyAnalytics {
  month:                number;
  year:                 number;
  completedDays:        number;
  perfectDays:          number;
  bestStreak:           number;
  totalXP:              number;
  consistencyPercent:   number;
  totalPractices:       number;
}

export interface PracticeDistribution {
  meditation: number; // count
  japa:       number;
  mantra:     number;
  gratitude:  number;
  total:      number;
  meditationPercent: number;
  japaPercent:       number;
  mantraPercent:     number;
  gratitudePercent:  number;
}

export interface ConsistencyScore {
  last7Days:  number; // 0–100
  last30Days: number;
  allTime:    number;
  grade:      'S' | 'A' | 'B' | 'C' | 'D';
}
