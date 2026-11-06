import { GRACE_PERIOD_HOURS, DAILY_COMPLETION_THRESHOLD } from '../../services/sadhana/progressConfig';
import type { SadhanaProgress } from '../../services/sadhana/progressTypes';

// Matches the existing engine's logical day; changing its timezone is a separate migration.
export function engineDay(now = new Date()) {
  return new Date(now.getTime() - (now.getHours() < GRACE_PERIOD_HOURS ? 86400000 : 0)).toISOString().slice(0, 10);
}
export function currentSnapshot(progress: Partial<SadhanaProgress> | null, today = engineDay()) {
  if (!progress) return null;
  return progress.today_date === today ? progress : {
    ...progress, today_meditation_done: false, today_japa_done: false,
    today_mantra_done: false, today_gratitude_done: false, today_xp: 0,
    today_completion_percentage: 0,
  };
}
export function dateBefore(date: string, days = 1) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}
export function streakFromDates(dates: string[], today: string) {
  const completed = new Set(dates);
  let date = completed.has(today) ? today : dateBefore(today), streak = 0;
  while (completed.has(date)) { streak++; date = dateBefore(date); }
  return streak;
}
export function currentStreak(progress: Partial<SadhanaProgress> | null, today = engineDay()) {
  if (!progress) return null;
  if (!progress.last_completed_date) return progress.current_streak === 0 ? 0 : null;
  return [today, dateBefore(today)].includes(progress.last_completed_date) ? progress.current_streak ?? null : 0;
}
export const completionThreshold = DAILY_COMPLETION_THRESHOLD * 100;
