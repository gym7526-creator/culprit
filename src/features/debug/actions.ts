import { content } from '@/data/content';
import { addDays, diffDays, type DayKey } from '@/engines/dates';
import { emptyAnswers, type Answers } from '@/engines/onboarding';
import { simulateProgram, type SimPattern } from '@/engines/simulate';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { syncProgramAndPlan } from '@/features/plan/actions';
import { usePrefsStore } from '@/features/prefsStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';

/** Dev only (spec §10.7). */
export const DEMO_ANSWERS: Answers = {
  ...emptyAnswers,
  focus: 'stomach',
  birthYear: 1992,
  symptoms: ['bloating', 'gas', 'heartburn'],
  mainSymptom: 'bloating',
  diet: 'none',
  maxMinutes: 30,
  zip: '60614',
  chainId: 'kroger',
  budget: 90,
  consent: true,
};

/** A fresh demo user who just subscribed. */
export function seedDemoUser(): void {
  const { today } = clockNow();
  useOnboardingStore.setState({ answers: DEMO_ANSWERS });
  const week = buildFirstWeek(DEMO_ANSWERS, today, usePrefsStore.getState().installId || 'demo');
  useAppStore.getState().resetAll();
  useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
  usePrefsStore.getState().completeOnboarding();
  useSubscriptionStore.getState().setPro(true);
}

/** Logs `days` simulated check-ins from the first unlogged day and moves the app clock with them. */
export function simulateDays(days: number, pattern: SimPattern): void {
  const app = useAppStore.getState();
  if (!app.program) return;
  const { today } = clockNow();
  const logged = Object.keys(app.checkins).sort();
  const from: DayKey =
    logged.length > 0
      ? addDays(logged[logged.length - 1]!, 1)
      : (app.program.calmStartedOn ?? today);
  const sim = simulateProgram(
    app.program,
    content.tests.tests,
    from,
    days,
    pattern,
    app.checkins,
    `${from}${pattern}`,
  );
  useAppStore.setState({ program: sim.program, checkins: sim.checkins });
  // Land on the day after the last simulated check-in, so it reads as "this morning".
  const target = addDays(from, days);
  usePrefsStore.getState().shiftDevTime(diffDays(today, target));
  const now = clockNow();
  syncProgramAndPlan(now.today, 9);
}
