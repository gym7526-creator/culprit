import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storeLabel } from '@/features/stores/storeName';
import { content, recipeMap } from '@/data/content';
import { dayKeyOf, type DayKey } from '@/engines/dates';
import { trialEndsAt } from '@/engines/paywall';
import { caseSolved } from '@/engines/report';
import {
  scheduleNotifications,
  type ScheduleInput,
  type ScheduledNotification,
} from '@/engines/schedule';
import { dayKind } from '@/engines/today';
import { activePlan } from '@/engines/week';
import { formatMoney, notificationCopy } from '@/copy';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';

const HORIZON_DAYS = 7;

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Milestone key → schedule entry, for the ones not sent yet. */
type Milestone = ScheduleInput['milestones'][number] & { key: string };

/** Everything that should be pending right now, from the stores (pure apart from reading them). */
export function currentSchedule(now = new Date()): {
  list: ScheduledNotification[];
  milestones: Milestone[];
} {
  const app = useAppStore.getState();
  const prefs = usePrefsStore.getState();
  const answers = useOnboardingStore.getState().answers;
  const sub = useSubscriptionStore.getState();
  const { today } = clockNow(prefs.devTimeOffsetDays, now);
  const program = app.program;
  const plans = Object.values(app.plans);

  const testNights: Record<DayKey, { portion: string; dish: string }> = {};
  for (const p of plans) {
    for (const n of p.nights) {
      if (!n.testGroup || !program || n.day < today) continue;
      const kind = dayKind(program, n.day);
      const def = content.tests.tests.find((t) => t.id === n.testGroup);
      const dose = def?.doses[(kind.type === 'dose' ? kind.dose : 1) - 1];
      const dish = n.recipeId ? recipeMap.get(n.recipeId)?.title.toLowerCase() : undefined;
      if (dose && dish) testNights[n.day] = { portion: dose.portion, dish };
    }
  }

  const plan = activePlan(plans, today);
  const milestones: Milestone[] = [];
  if (program) {
    if (program.calmEndedOn && program.phase !== 'calm')
      milestones.push({ key: 'calm_complete', kind: 'calm_complete' });
    for (const t of program.completed) {
      if (t.result && t.kind !== 'control') {
        const name = content.tests.tests.find((d) => d.id === t.group)?.name ?? t.group;
        milestones.push({ key: `result:${t.id}`, kind: 'result_ready', group: name });
      }
    }
    if (caseSolved(program)) milestones.push({ key: 'case_solved', kind: 'case_solved' });
  }
  const fresh = milestones.filter((m) => !app.notified.includes(m.key));

  const trialEnds =
    sub.isPro && sub.trialStartedAt && sub.trialDays
      ? new Date(trialEndsAt(sub.trialStartedAt, sub.trialDays))
      : null;

  const list = scheduleNotifications({
    now: { day: today, time: hhmm(now) },
    horizonDays: HORIZON_DAYS,
    checkInTime: answers.checkInTime,
    checkedInDays: new Set(Object.keys(app.checkins)),
    testNights,
    sundayPlan: plan
      ? {
          count: plan.nights.filter((n) => n.status === 'cook').length,
          total: formatMoney(plan.total),
          store: storeLabel(answers),
        }
      : null,
    trialEnds:
      trialEnds && trialEnds > now ? { day: dayKeyOf(trialEnds), time: hhmm(trialEnds) } : null,
    milestones: fresh,
    enabled: {
      ...prefs.notify,
      // Program notifications only make sense once there's a program to follow.
      checkin: prefs.notify.checkin && program !== null && sub.isPro,
      tests: prefs.notify.tests && program !== null && sub.isPro,
      plan: prefs.notify.plan && sub.isPro,
    },
  });
  // Skin-only users get the skin check-in at their skin time instead.
  const skin = useSkinStore.getState();
  if (!program && skin.program && sub.isPro && prefs.notify.checkin) {
    const skinList = scheduleNotifications({
      now: { day: today, time: hhmm(now) },
      horizonDays: HORIZON_DAYS,
      checkInTime: skin.answers.checkInTime,
      checkedInDays: new Set(Object.keys(skin.checkins)),
      testNights: {},
      sundayPlan: null,
      trialEnds: null,
      milestones: [],
      enabled: { checkin: true, tests: false, plan: false, trial: false, milestones: false },
    }).map((n) =>
      n.kind === 'checkin' ? { ...n, id: `skin-${n.id}`, body: notificationCopy.skinCheckIn } : n,
    );
    list.push(...skinList.filter((n) => n.kind === 'checkin'));
  }
  return { list, milestones: fresh };
}

function toDate(n: ScheduledNotification, offsetDays: number): Date {
  const [y, m, d] = n.day.split('-').map(Number);
  const [h, min] = n.time.split(':').map(Number);
  // Dev time travel shifts "today"; real notifications fire on the real calendar.
  return new Date(y!, m! - 1, d! - offsetDays, h!, min!);
}

let running: Promise<void> | null = null;
let queued = false;

/**
 * Cancels every pending local notification and schedules the current list (spec §6.7). Safe to call
 * often: calls are serialised and coalesced. Does nothing without permission or on web.
 */
export async function syncNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (running) {
    queued = true;
    return running;
  }
  running = (async () => {
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) return;
      const { list, milestones } = currentSchedule();
      await Notifications.cancelAllScheduledNotificationsAsync();
      const offset = usePrefsStore.getState().devTimeOffsetDays;
      for (const n of list) {
        const date = toDate(n, offset);
        if (date.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { body: n.body, data: { type: n.kind } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
        });
      }
      const sent = list.filter(
        (n) => n.kind === 'calm_complete' || n.kind === 'result_ready' || n.kind === 'case_solved',
      );
      if (sent.length > 0) useAppStore.getState().markNotified(milestones.map((m) => m.key));
    } catch {
      // Scheduling is best-effort; the in-app cards still show everything.
    } finally {
      running = null;
      if (queued) {
        queued = false;
        void syncNotifications();
      }
    }
  })();
  return running;
}

/** Where a tapped notification should land. */
export function routeForNotification(type: unknown): string {
  switch (type) {
    case 'checkin':
    case 'checkin_followup':
      // Skin-only users land on the Skin tab (Today redirects there).
      return '/?checkin=1';
    case 'test_heads_up':
      return '/';
    case 'sunday_plan':
      return '/plan';
    case 'result_ready':
    case 'case_solved':
    case 'calm_complete':
      return '/results';
    case 'trial_ending':
      return '/settings';
    default:
      return '/';
  }
}
