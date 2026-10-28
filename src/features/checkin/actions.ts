import { track } from '@/analytics';
import type { DayKey } from '@/engines/dates';
import type { CheckIn } from '@/engines/types';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { syncProgramAndPlan } from '@/features/plan/actions';

/**
 * Saves (or updates) a check-in, then moves the program forward. Analytics get the event only,
 * never the score or symptoms (spec §13).
 */
export function submitCheckin(
  day: DayKey,
  patch: Partial<Omit<CheckIn, 'day'>> & Pick<CheckIn, 'score'>,
): void {
  const app = useAppStore.getState();
  const prev = app.checkins[day];
  const isNew = prev === undefined;
  app.saveCheckin({
    day,
    symptoms: prev?.symptoms ?? [],
    unusual: prev?.unusual ?? [],
    testFoodTaken: prev?.testFoodTaken ?? null,
    ...patch,
  });
  if (isNew) track({ name: 'checkin_submitted' });
  const { today, hour } = clockNow();
  syncProgramAndPlan(today, hour);
}
