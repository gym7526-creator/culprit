import * as Notifications from 'expo-notifications';
import { Platform, Share } from 'react-native';

import { resetAnalytics, track } from '@/analytics';
import { content, ingredientMap } from '@/data/content';
import { diffDays } from '@/engines/dates';
import { testsToSkip, type Answers } from '@/engines/onboarding';
import { pauseProgram, resumeProgram } from '@/engines/program';
import { activePlan } from '@/engines/week';
import { settingsCopy } from '@/copy';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { allPlans, replanFrom, syncProgramAndPlan } from '@/features/plan/actions';
import { usePrefsStore } from '@/features/prefsStore';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { purchases } from '@/purchases';

/** Re-plans the current week from today (keeps nights already past). */
export function replanCurrentWeek(): void {
  const { today } = clockNow();
  const plan = activePlan(allPlans(), today);
  if (!plan) return;
  const from = diffDays(plan.weekStart, today) > 0 ? today : plan.weekStart;
  const next = replanFrom(plan, from);
  if (next) useAppStore.getState().savePlan(next);
}

export function savePreferences(patch: Partial<Answers>): void {
  useOnboardingStore.getState().update(patch);
  // A new diet or allergy can rule out upcoming food tests (never ones already done or running).
  const a = useOnboardingStore.getState().answers;
  const app = useAppStore.getState();
  if (app.program) {
    const skip = testsToSkip(a.diet ?? 'none', a.allergens, content.tests.tests, ingredientMap);
    const queue = app.program.queue.filter((q) => q.kind === 'control' || !skip.includes(q.group));
    if (queue.length !== app.program.queue.length) app.setProgram({ ...app.program, queue });
  }
  replanCurrentWeek();
}

export function setPaused(paused: boolean): void {
  const app = useAppStore.getState();
  if (!app.program) return;
  const { today, hour } = clockNow();
  app.setProgram(paused ? pauseProgram(app.program, today) : resumeProgram(app.program, today));
  if (paused) track({ name: 'program_paused' });
  syncProgramAndPlan(today, hour);
  replanCurrentWeek();
}

export function restartProgram(): void {
  const { today } = clockNow();
  const answers = useOnboardingStore.getState().answers;
  const week = buildFirstWeek(answers, today, usePrefsStore.getState().installId || 'seed');
  const { feedback, pantryMissing, twoWeek } = useAppStore.getState();
  useAppStore.getState().resetAll();
  useAppStore.setState({
    program: week.program,
    plans: { [week.plan.weekStart]: week.plan },
    feedback,
    pantryMissing,
    twoWeek,
  });
}

/** Everything Culprit stores about you, as JSON (spec §10.6). Shared through the system sheet. */
export function exportJson(): string {
  const app = useAppStore.getState();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      contentVersion: content.manifest.contentVersion,
      answers: useOnboardingStore.getState().answers,
      program: app.program,
      checkins: app.checkins,
      plans: app.plans,
      feedback: app.feedback,
      skin: useSkinStore.getState(),
    },
    null,
    2,
  );
}

export async function exportData(): Promise<void> {
  await Share.share({ title: settingsCopy.exportTitle, message: exportJson() });
}

/**
 * "Delete all my data" (spec §14): wipes health data, prefs, the RevenueCat anonymous user and the
 * analytics id. The subscription itself stays with Apple, so the cached entitlement is kept.
 */
export async function deleteAllData(): Promise<void> {
  const isPro = useSubscriptionStore.getState().isPro;
  useAppStore.getState().resetAll();
  useSkinStore.getState().reset();
  useOnboardingStore.getState().reset();
  usePrefsStore.getState().resetPrefs();
  useSubscriptionStore.getState().reset();
  useSubscriptionStore.getState().setPro(isPro);
  resetAnalytics();
  try {
    await purchases().reset();
  } catch {
    // Offline: RevenueCat keeps only an anonymous id; it's reset next time.
  }
  if (Platform.OS !== 'web')
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
