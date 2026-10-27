/**
 * Calendar-day helpers on "YYYY-MM-DD" keys. Pure and timezone-proof: all math happens in UTC on
 * the date itself, so a day key means the user's local calendar day wherever it was produced.
 */
export type DayKey = string;

const DAY_MS = 86_400_000;

function toUtc(day: DayKey): number {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid day key: ${day}`);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): DayKey {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Local calendar day for a Date (uses the device's timezone). */
export function dayKeyOf(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(day: DayKey, n: number): DayKey {
  return fromUtc(toUtc(day) + n * DAY_MS);
}

/** b − a in whole days. */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(day: DayKey): number {
  return (new Date(toUtc(day)).getUTCDay() + 6) % 7;
}

/** Monday of the week containing `day`. */
export function startOfWeek(day: DayKey): DayKey {
  return addDays(day, -weekday(day));
}

export function rangeDays(start: DayKey, count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function isValidDayKey(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return fromUtc(toUtc(day)) === day;
}
