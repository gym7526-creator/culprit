/**
 * The app's single source of "now" (spec §6.1: engines get an injected now()). The debug screen's
 * time travel shifts it by whole days.
 */
import { addDays, dayKeyOf, type DayKey } from '@/engines/dates';

import { usePrefsStore } from './prefsStore';

export type Clock = { today: DayKey; hour: number; year: number };

export function clockNow(
  offsetDays = usePrefsStore.getState().devTimeOffsetDays,
  date = new Date(),
): Clock {
  const today = addDays(dayKeyOf(date), offsetDays);
  return { today, hour: date.getHours(), year: Number(today.slice(0, 4)) };
}

export function useClock(): Clock {
  const offset = usePrefsStore((s) => s.devTimeOffsetDays);
  return clockNow(offset);
}
