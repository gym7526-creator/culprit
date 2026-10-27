/** Pure "HH:mm" (24-hour) helpers shared by the time picker and, later, the scheduler. */
export type Period = 'am' | 'pm';

export type Time12 = { hour12: number; minute: number; period: Period };

export function parseTime(value: string): Time12 {
  const [h = '0', m = '0'] = value.split(':');
  const hour24 = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
  const minute = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
  return {
    hour12: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute,
    period: hour24 >= 12 ? 'pm' : 'am',
  };
}

export function toTime(hour12: number, minute: number, period: Period): string {
  const hour24 = (hour12 % 12) + (period === 'pm' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Nearest multiple of `step` minutes, wrapping 60 → 0. */
export function snapMinute(minute: number, step: number): number {
  return (Math.round(minute / step) * step) % 60;
}
