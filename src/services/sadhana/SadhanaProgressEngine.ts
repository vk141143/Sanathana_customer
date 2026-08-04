// ============================================================
// SADHANA PROGRESS ENGINE
// Pure business logic — no UI, no React, no side effects.
// Every screen calls this service to record practice completions.
// ============================================================

import { supabase } from '../../lib/supabase';
import {
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
import type {
  SadhanaProgress,
  PracticeCompletionInput,
  DailyProgress,
  LevelInfo,
  MilestoneAchievement,
  PracticeResult,
} from './progressTypes';

// ── Date helpers ─────────────────────────────────────────────

/**
 * Returns the "logical date" for the current moment.
 * If the wall-clock hour is within the grace period (e.g. 0–2 AM),
 * we treat it as belonging to the previous calendar day so users
 * doing late-night practice don't lose their streak.
 */
function getLogicalDateISO(): string {
  const now = new Date();
  const hourUTC = now.getUTCHours(); // use local hours for grace period
  const hourLocal = now.getHours();

  if (hourLocal < GRACE_PERIOD_HOURS) {
    // Shift back one day
    const yesterday = new Date(now.getTime() - 86400000);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

function yesterdayISO(fromDate: string): string {
  const d = new Date(fromDate + 'T12:00:00Z'); // noon UTC avoids DST edge cases
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── XP multiplier lookup ─────────────────────────────────────
function getXPMultiplier(levelNumber: number): number {
  return XP_MULTIPLIERS[levelNumber] ?? DEFAULT_XP_MULTIPLIER;
}

// ── calculateXP ──────────────────────────────────────────────
export function calculateXP(
  practice: PracticeCompletionInput['practice'],
  levelNumber: number,
): number {
  const base       = BASE_XP[practice];
  const multiplier = getXPMultiplier(levelNumber);
  return Math.max(MIN_XP, Math.round(base * multiplier));
}

// ── calculateLevel ───────────────────────────────────────────
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (const def of LEVELS) {
    if (totalXP >= def.xpRequired) level = def.level;
    else break;
  }
  return level;
}

// ── getCurrentLevel ──────────────────────────────────────────
export function getCurrentLevel(totalXP: number): LevelInfo {
  const levelNumber = calculateLevel(totalXP);
  const currentDef  = LEVELS.find(l => l.level === levelNumber)!;
  const nextDef     = LEVELS.find(l => l.level === levelNumber + 1);

  const xpForThisLevel = currentDef.xpRequired;
  const xpForNextLevel = nextDef?.xpRequired ?? 0;
  const xpRemaining    = nextDef ? Math.max(0, xpForNextLevel - totalXP) : 0;

  const rangeSize       = nextDef ? xpForNextLevel - xpForThisLevel : 1;
  const earned          = totalXP - xpForThisLevel;
  const progressPercent = nextDef
    ? Math.min(100, Math.round((earned / rangeSize) * 100))
    : 100;

  return {
    levelNumber,
    levelName:      currentDef.name,
    currentXP:      totalXP,
    xpForThisLevel,
    xpForNextLevel,
    xpRemaining,
    progressPercent,
  };
}

// ── getNextLevel ─────────────────────────────────────────────
export function getNextLevel(totalXP: number): LevelInfo | null {
  const currentNumber = calculateLevel(totalXP);
  const nextDef       = LEVELS.find(l => l.level === currentNumber + 1);
  if (!nextDef) return null;
  return getCurrentLevel(nextDef.xpRequired);
}

// ── getRemainingXP ───────────────────────────────────────────
export function getRemainingXP(totalXP: number): number {
  return getCurrentLevel(totalXP).xpRemaining;
}

// ── calculateDailyProgress ───────────────────────────────────
export function calculateDailyProgress(progress: SadhanaProgress): DailyProgress {
  const meditationWeight = progress.today_meditation_done ? PRACTICE_WEIGHTS.meditation : 0;
  const japaWeight       = progress.today_japa_done       ? PRACTICE_WEIGHTS.japa       : 0;
  const mantraWeight     = progress.today_mantra_done     ? PRACTICE_WEIGHTS.mantra     : 0;
  const gratitudeWeight  = progress.today_gratitude_done  ? PRACTICE_WEIGHTS.gratitude  : 0;

  const total        = meditationWeight + japaWeight + mantraWeight + gratitudeWeight;
  const totalPercent = Math.round(total * 100);

  return {
    meditationWeight,
    japaWeight,
    mantraWeight,
    gratitudeWeight,
    totalPercent,
    isComplete: total >= DAILY_COMPLETION_THRESHOLD,
  };
}

// ── updateStreak ─────────────────────────────────────────────
export function updateStreak(
  currentStreak:     number,
  longestStreak:     number,
  lastCompletedDate: string | null,
): { currentStreak: number; longestStreak: number; lastCompletedDate: string } {
  const logicalToday = getLogicalDateISO();
  const logicalYesterday = yesterdayISO(logicalToday);

  let newStreak: number;

  if (lastCompletedDate === logicalToday) {
    // Already counted for this logical day — no change
    newStreak = currentStreak;
  } else if (lastCompletedDate === logicalYesterday) {
    // Consecutive logical day — extend streak
    newStreak = currentStreak + 1;
  } else {
    // Gap or first time — start fresh
    newStreak = 1;
  }

  return {
    currentStreak:     newStreak,
    longestStreak:     Math.max(longestStreak, newStreak),
    lastCompletedDate: logicalToday,
  };
}

// ── resetStreak ──────────────────────────────────────────────
export function resetStreak(): { currentStreak: number; lastCompletedDate: null } {
  return { currentStreak: 0, lastCompletedDate: null };
}

// ── updateMilestones ─────────────────────────────────────────
export function updateMilestones(
  currentStreak:   number,
  alreadyAchieved: number[],
): MilestoneAchievement[] {
  return STREAK_MILESTONES
    .filter(days => currentStreak >= days)
    .map(days => ({
      days,
      isNew: !alreadyAchieved.includes(days),
    }));
}

// ── loadProgress ─────────────────────────────────────────────
export async function loadProgress(userId: string): Promise<SadhanaProgress | null> {
  const { data, error } = await supabase
    .from('sadhana_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[SadhanaEngine] loadProgress error:', error.message);
    return null;
  }
  return data as SadhanaProgress | null;
}

// ── saveProgress ─────────────────────────────────────────────
export async function saveProgress(
  progress: Partial<SadhanaProgress> & { user_id: string },
): Promise<SadhanaProgress | null> {
  const { data, error } = await supabase
    .from('sadhana_progress')
    .upsert(
      { ...progress, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) {
    console.error('[SadhanaEngine] saveProgress error:', error.message);
    return null;
  }
  return data as SadhanaProgress;
}

// ── buildFreshProgress ───────────────────────────────────────
// Returns a zeroed-out progress object for a brand-new user.
function buildFreshProgress(userId: string, logicalToday: string): SadhanaProgress {
  return {
    id:                          '',
    user_id:                     userId,
    current_xp:                  0,
    level_number:                1,
    level_name:                  LEVELS[0].name,
    current_streak:              0,
    longest_streak:              0,
    last_completed_date:         null,
    today_date:                  logicalToday,
    today_xp:                    0,
    today_meditation_done:       false,
    today_japa_done:             false,
    today_mantra_done:           false,
    today_gratitude_done:        false,
    today_completion_percentage: 0,
    completion_percentage:       0,
    total_xp:                    0,
    highest_level:               1,
    total_meditation_sessions:   0,
    total_meditation_minutes:    0,
    total_japa_count:            0,
    total_mantra_sessions:       0,
    total_audio_minutes:         0,
    total_gratitude_entries:     0,
    milestones_achieved:         [],
    created_at:                  new Date().toISOString(),
    updated_at:                  new Date().toISOString(),
  };
}

// ── resetTodayFields ─────────────────────────────────────────
// Resets only today's snapshot fields. Lifetime stats untouched.
function resetTodayFields(
  progress:     SadhanaProgress,
  logicalToday: string,
): SadhanaProgress {
  return {
    ...progress,
    today_date:                  logicalToday,
    today_xp:                    0,
    today_meditation_done:       false,
    today_japa_done:             false,
    today_mantra_done:           false,
    today_gratitude_done:        false,
    today_completion_percentage: 0,
    completion_percentage:       0,
  };
}

// ── recordPractice ───────────────────────────────────────────
// Main entry point. Call this from any screen when a practice completes.
export async function recordPractice(
  input: PracticeCompletionInput,
): Promise<PracticeResult | null> {
  const { userId, practice, durationMinutes, japaCount, listenRatio } = input;

  // ── 1. Mantra guard: only reward if listened enough ───────
  if (practice === 'mantra') {
    const ratio = listenRatio ?? 0;
    if (ratio < MANTRA_MIN_LISTEN_RATIO) {
      console.info(
        `[SadhanaEngine] Mantra listen ratio ${ratio} < ${MANTRA_MIN_LISTEN_RATIO} — no XP.`,
      );
      return null;
    }
  }

  // ── 2. Resolve logical date (respects grace period) ───────
  const logicalToday = getLogicalDateISO();

  // ── 3. Load existing progress ─────────────────────────────
  let progress = await loadProgress(userId);

  // ── 4. Bootstrap if first time ────────────────────────────
  if (!progress) {
    progress = buildFreshProgress(userId, logicalToday);
  }

  // ── 5. Reset today's fields if logical date has changed ───
  if (progress.today_date !== logicalToday) {
    progress = resetTodayFields(progress, logicalToday);
  }

  // ── 6. Prevent double-counting same practice today ────────
  const alreadyDoneKey = `today_${practice}_done` as keyof SadhanaProgress;
  if (progress[alreadyDoneKey] === true) {
    console.info(`[SadhanaEngine] ${practice} already recorded for ${logicalToday}.`);
    const levelInfo = getCurrentLevel(progress.current_xp);
    const daily     = calculateDailyProgress(progress);
    return {
      xpAwarded:     0,
      newTotalXP:    progress.current_xp,
      leveledUp:     false,
      newLevel:      levelInfo,
      dailyProgress: daily,
      streakUpdated: false,
      newMilestones: [],
    };
  }

  // ── 7. Calculate XP ───────────────────────────────────────
  const xpAwarded  = calculateXP(practice, progress.level_number);
  const newTotalXP = progress.current_xp + xpAwarded;
  const newTodayXP = (progress.today_xp ?? 0) + xpAwarded;

  // ── 8. Level up check ─────────────────────────────────────
  const oldLevel     = progress.level_number;
  const newLevelInfo = getCurrentLevel(newTotalXP);
  const leveledUp    = newLevelInfo.levelNumber > oldLevel;

  // ── 9. Build updates object ───────────────────────────────
  const updates: Partial<SadhanaProgress> = {
    // XP & level
    current_xp:   newTotalXP,
    level_number: newLevelInfo.levelNumber,
    level_name:   newLevelInfo.levelName,
    // Today XP
    today_xp: newTodayXP,
    // Mark practice done
    [`today_${practice}_done`]: true,
    // Lifetime XP always mirrors current_xp
    total_xp: newTotalXP,
    // Highest level ever
    highest_level: Math.max(progress.highest_level ?? 1, newLevelInfo.levelNumber),
  };

  // ── 10. Update lifetime practice totals ───────────────────
  if (practice === 'meditation') {
    updates.total_meditation_sessions = (progress.total_meditation_sessions ?? 0) + 1;
    if (durationMinutes) {
      updates.total_meditation_minutes =
        (progress.total_meditation_minutes ?? 0) + durationMinutes;
    }
  } else if (practice === 'japa') {
    updates.total_japa_count = (progress.total_japa_count ?? 0) + (japaCount ?? 1);
  } else if (practice === 'mantra') {
    updates.total_mantra_sessions = (progress.total_mantra_sessions ?? 0) + 1;
    if (durationMinutes) {
      updates.total_audio_minutes = (progress.total_audio_minutes ?? 0) + durationMinutes;
    }
  } else if (practice === 'gratitude') {
    updates.total_gratitude_entries = (progress.total_gratitude_entries ?? 0) + 1;
  }

  // ── 11. Recalculate daily completion ──────────────────────
  const merged = { ...progress, ...updates } as SadhanaProgress;
  const daily  = calculateDailyProgress(merged);

  updates.today_completion_percentage = daily.totalPercent;
  updates.completion_percentage       = daily.totalPercent; // backward-compat

  // ── 12. Streak + milestones (only when day becomes complete)
  let streakUpdated                    = false;
  let newMilestones: MilestoneAchievement[] = [];

  if (daily.isComplete) {
    const streakResult = updateStreak(
      progress.current_streak,
      progress.longest_streak,
      progress.last_completed_date,
    );

    streakUpdated = streakResult.currentStreak !== progress.current_streak
      || progress.last_completed_date !== streakResult.lastCompletedDate;

    updates.current_streak      = streakResult.currentStreak;
    updates.longest_streak      = streakResult.longestStreak;
    updates.last_completed_date = streakResult.lastCompletedDate;

    // Milestones
    const allMilestones = updateMilestones(
      streakResult.currentStreak,
      progress.milestones_achieved ?? [],
    );
    newMilestones = allMilestones.filter(m => m.isNew);

    if (newMilestones.length > 0) {
      updates.milestones_achieved = [
        ...(progress.milestones_achieved ?? []),
        ...newMilestones.map(m => m.days),
      ];
    }
  }

  // ── 13. Persist to Supabase ───────────────────────────────
  await saveProgress({ ...merged, ...updates, user_id: userId });

  return {
    xpAwarded,
    newTotalXP,
    leveledUp,
    newLevel:      newLevelInfo,
    dailyProgress: daily,
    streakUpdated,
    newMilestones,
  };
}
