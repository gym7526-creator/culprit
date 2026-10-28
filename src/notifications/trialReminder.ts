import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { dayKeyOf } from '@/engines/dates';
import { trialEndsAt } from '@/engines/paywall';
import { scheduleNotifications } from '@/engines/schedule';

const ID = 'trial';

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** The local date the "trial ends tomorrow" reminder fires (24 h before, out of quiet hours). */
export function trialReminderDate(
  startedAt: number,
  trialDays: number,
  now = Date.now(),
): Date | null {
  const ends = new Date(trialEndsAt(startedAt, trialDays));
  const nowDate = new Date(now);
  const [n] = scheduleNotifications({
    now: { day: dayKeyOf(nowDate), time: hhmm(nowDate) },
    horizonDays: trialDays + 2,
    checkInTime: '20:30',
    checkedInDays: new Set(),
    testNights: {},
    sundayPlan: null,
    trialEnds: { day: dayKeyOf(ends), time: hhmm(ends) },
    milestones: [],
    enabled: { checkin: false, tests: false, plan: false, trial: true, milestones: false },
  });
  if (!n) return null;
  const [y, m, d] = n.day.split('-').map(Number);
  const [h, min] = n.time.split(':').map(Number);
  const at = new Date(y!, m! - 1, d!, h!, min!);
  return at.getTime() > now ? at : null;
}

/** Schedules (or replaces) the day-2 trial reminder. Silently skipped without permission. */
export async function scheduleTrialReminder(startedAt: number, trialDays: number, body: string) {
  if (Platform.OS === 'web') return;
  const date = trialReminderDate(startedAt, trialDays);
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    if (!date) return;
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { body, data: { type: 'trial_ending' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    // No permission or not supported: the trial still works, the reminder just doesn't fire.
  }
}
