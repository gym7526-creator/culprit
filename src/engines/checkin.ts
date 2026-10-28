/**
 * Check-in timing rules (spec §6.2, §10.1). Pure.
 */
import { addDays, type DayKey } from './dates.ts';
import type { CheckIn } from './types.ts';

/** The check-in card appears from 5 pm. */
export const CHECKIN_OPENS_HOUR = 17;
/** Yesterday can still be logged until noon. */
export const LATE_UNTIL_HOUR = 12;

/**
 * Which day the check-in card is for right now, or null when there's nothing to log:
 * before noon, yesterday if it's missing; from 5 pm, today if it's missing.
 */
export function checkinTarget(
  now: { day: DayKey; hour: number },
  checkins: Readonly<Record<DayKey, CheckIn>>,
  opensFrom: DayKey | null,
  force = false,
): DayKey | null {
  const yesterday = addDays(now.day, -1);
  const started = (d: DayKey) => opensFrom === null || d >= opensFrom;
  if (now.hour < LATE_UNTIL_HOUR && !checkins[yesterday] && started(yesterday)) return yesterday;
  if ((now.hour >= CHECKIN_OPENS_HOUR || force) && !checkins[now.day] && started(now.day))
    return now.day;
  return null;
}

/** Consecutive checked-in days ending today (or yesterday, if today isn't logged yet). */
export function streak(checkins: Readonly<Record<DayKey, CheckIn>>, today: DayKey): number {
  let day = checkins[today] ? today : addDays(today, -1);
  let n = 0;
  while (checkins[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
