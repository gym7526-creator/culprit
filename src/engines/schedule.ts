/**
 * Local notification scheduler (spec §6.7). Pure: given the current state, returns every
 * notification that should be pending. The app cancels all and re-schedules this list whenever the
 * plan, the program or a check-in changes.
 *
 * - Nightly check-in at the chosen time, plus one follow-up 45 minutes later if still not checked in
 *   (never more than 2 check-in nudges a day).
 * - Test-day heads-up at 4 pm. Sunday plan drop at 10 am. Trial reminder 24 h before it ends.
 * - Quiet hours 10 pm–8 am, except the check-in time the user chose.
 */
import { format } from '../copy/format.ts';
import { notificationCopy } from '../copy/notifications.ts';
import { addDays, diffDays, weekday, type DayKey } from './dates.ts';

export const QUIET_START_MIN = 22 * 60;
export const QUIET_END_MIN = 8 * 60;
export const FOLLOW_UP_MIN = 45;
export const TEST_HEADS_UP = '16:00';
export const SUNDAY_PLAN = '10:00';
export const TRIAL_LEAD_MIN = 24 * 60;
/** Where a reminder that lands in quiet hours is moved to (the evening before it). */
export const QUIET_FALLBACK = '21:00';

export type NotificationKind =
  | 'checkin'
  | 'checkin_followup'
  | 'test_heads_up'
  | 'sunday_plan'
  | 'trial_ending'
  | 'calm_complete'
  | 'result_ready'
  | 'case_solved';

export type ScheduledNotification = {
  id: string;
  kind: NotificationKind;
  day: DayKey;
  /** "HH:mm" local time */
  time: string;
  body: string;
};

export type ScheduleInput = {
  now: { day: DayKey; time: string };
  horizonDays: number;
  checkInTime: string;
  checkedInDays: ReadonlySet<DayKey>;
  testNights: Readonly<Record<DayKey, { portion: string; dish: string }>>;
  sundayPlan: { count: number; total: string; store: string } | null;
  trialEnds: { day: DayKey; time: string } | null;
  milestones: readonly ({ kind: 'calm_complete' | 'case_solved' } | { kind: 'result_ready'; group: string })[];
  enabled: { checkin: boolean; tests: boolean; plan: boolean; trial: boolean; milestones: boolean };
};

export function toMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

export function fromMinutes(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function isQuiet(time: string): boolean {
  const m = toMinutes(time);
  return m >= QUIET_START_MIN || m < QUIET_END_MIN;
}

/** Absolute minutes since `origin` 00:00, for ordering and "is it in the future". */
function absMinutes(origin: DayKey, day: DayKey, time: string): number {
  return diffDays(origin, day) * 1440 + toMinutes(time);
}

/** Moves a quiet-hours time to the evening before it (21:00 the same or previous day). */
function outOfQuietHours(day: DayKey, time: string): { day: DayKey; time: string } {
  if (!isQuiet(time)) return { day, time };
  return toMinutes(time) >= QUIET_START_MIN ? { day, time: QUIET_FALLBACK } : { day: addDays(day, -1), time: QUIET_FALLBACK };
}

export function scheduleNotifications(input: ScheduleInput): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  const nowAbs = absMinutes(input.now.day, input.now.day, input.now.time);
  const push = (n: ScheduledNotification) => {
    if (absMinutes(input.now.day, n.day, n.time) > nowAbs) out.push(n);
  };

  for (let i = 0; i < input.horizonDays; i++) {
    const day = addDays(input.now.day, i);

    if (input.enabled.checkin && !input.checkedInDays.has(day)) {
      push({ id: `checkin:${day}`, kind: 'checkin', day, time: input.checkInTime, body: notificationCopy.checkIn });
      const follow = fromMinutes(toMinutes(input.checkInTime) + FOLLOW_UP_MIN);
      // The follow-up must stay on the same evening and outside quiet hours.
      if (!isQuiet(follow) && toMinutes(follow) > toMinutes(input.checkInTime)) {
        push({ id: `followup:${day}`, kind: 'checkin_followup', day, time: follow, body: notificationCopy.checkInFollowUp });
      }
    }

    const test = input.testNights[day];
    if (input.enabled.tests && test) {
      push({
        id: `test:${day}`,
        kind: 'test_heads_up',
        day,
        time: TEST_HEADS_UP,
        body: format(notificationCopy.testHeadsUp, { portion: test.portion, dish: test.dish }),
      });
    }

    if (input.enabled.plan && input.sundayPlan && weekday(day) === 6) {
      push({
        id: `plan:${day}`,
        kind: 'sunday_plan',
        day,
        time: SUNDAY_PLAN,
        body: format(notificationCopy.sundayPlan, input.sundayPlan),
      });
    }
  }

  if (input.enabled.trial && input.trialEnds) {
    const at = absMinutes(input.now.day, input.trialEnds.day, input.trialEnds.time) - TRIAL_LEAD_MIN;
    const day = addDays(input.now.day, Math.floor(at / 1440));
    const moved = outOfQuietHours(day, fromMinutes(at));
    push({ id: 'trial', kind: 'trial_ending', day: moved.day, time: moved.time, body: notificationCopy.trialEnding });
  }

  if (input.enabled.milestones) {
    // Milestones fire right away (one minute out), or at 8 am if it's quiet hours now.
    const soonAbs = nowAbs + 1;
    const soonDay = addDays(input.now.day, Math.floor(soonAbs / 1440));
    const soon = fromMinutes(soonAbs);
    const when = isQuiet(soon)
      ? { day: toMinutes(soon) >= QUIET_START_MIN ? addDays(soonDay, 1) : soonDay, time: fromMinutes(QUIET_END_MIN) }
      : { day: soonDay, time: soon };
    input.milestones.forEach((m, idx) => {
      const body =
        'group' in m
          ? format(notificationCopy.resultReady, { group: m.group })
          : m.kind === 'calm_complete'
            ? notificationCopy.calmComplete
            : notificationCopy.caseSolved;
      push({ id: `milestone:${m.kind}:${idx}`, kind: m.kind, day: when.day, time: when.time, body });
    });
  }

  return out.sort(
    (a, b) => absMinutes(input.now.day, a.day, a.time) - absMinutes(input.now.day, b.day, b.time) || a.id.localeCompare(b.id),
  );
}
