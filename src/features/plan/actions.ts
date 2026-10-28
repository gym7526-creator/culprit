/**
 * Plan actions for the main app: keep a plan for today, re-plan when the program moves, swap,
 * eating out, shuffle and the 2-week toggle. Reads the stores directly so screens stay thin.
 */
import { track } from '@/analytics';
import { content } from '@/data/content';
import { diffDays, type DayKey } from '@/engines/dates';
import {
  applySwap,
  generatePlan,
  planGroceries,
  type PlanInput,
  type WeekPlan,
} from '@/engines/plan';
import { roundCents } from '@/engines/price';
import { advance, personalRules, projectSchedule } from '@/engines/program';
import type { CheckIn, TestGroup } from '@/engines/types';
import { activePlan, cookHistory, nextPlanStart, testNightsMatch } from '@/engines/week';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { planInputFor } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { storeOptions, withBestStore } from '@/features/stores/pick';
import { bestStore } from '@/engines/stores';

export function allPlans(): WeekPlan[] {
  return Object.values(useAppStore.getState().plans);
}

/** The planner input for a saved (or new) plan, from the current answers, program and feedback. */
export function inputFor(
  weekStart: DayKey,
  nights: 7 | 14,
  extras: Partial<PlanInput> = {},
): PlanInput | null {
  const app = useAppStore.getState();
  const program = app.program;
  if (!program) return null;
  const answers = useOnboardingStore.getState().answers;
  const seed = usePrefsStore.getState().installId;
  const existing = app.plans[weekStart];
  return planInputFor(answers, program, weekStart, seed, {
    nights,
    history: cookHistory(allPlans(), weekStart),
    feedback: app.feedback,
    ownedPantry: answers.pantry.filter((p) => !app.pantryMissing.includes(p)),
    eatingOut: existing?.nights.filter((n) => n.status === 'eating_out').map((n) => n.day) ?? [],
    shuffle: app.shuffles[weekStart] ?? 0,
    personal: program.phase === 'personal' ? personalRules(program) : undefined,
    ...extras,
  });
}

function nightsOf(plan: WeekPlan): 7 | 14 {
  return plan.nights.length > 7 ? 14 : 7;
}

function withTotals(input: PlanInput, plan: WeekPlan): WeekPlan {
  const total = planGroceries(input, plan).total;
  return {
    ...plan,
    total,
    budget: input.budget,
    overBudgetBy: total > input.budget ? roundCents(total - input.budget) : null,
  };
}

/** Re-plans every night from `from` on, keeping earlier nights as they were. */
export function replanFrom(
  plan: WeekPlan,
  from: DayKey,
  extras: Partial<PlanInput> = {},
): WeekPlan | null {
  const input = inputFor(plan.weekStart, extras.nights ?? nightsOf(plan), extras);
  if (!input) return null;
  const fresh = generatePlan(input);
  const nights = fresh.nights.map((n) => {
    const old = plan.nights.find((o) => o.day === n.day);
    return old && diffDays(from, n.day) < 0 ? old : n;
  });
  return withTotals(input, { ...fresh, nights });
}

/** Moves the program forward and makes sure a plan exists for today. Call on launch and day change. */
export function syncProgramAndPlan(today: DayKey, hour: number): void {
  const app = useAppStore.getState();
  if (!app.program) return;
  const checkins = new Map<DayKey, CheckIn>(Object.entries(app.checkins));
  const program = advance(app.program, {
    checkins,
    tests: content.tests.tests,
    now: { day: today, hour },
  });
  if (program !== app.program) app.setProgram(program);

  const plans = allPlans();
  const start = nextPlanStart(plans, today);
  if (start) {
    const input = inputFor(start, app.twoWeek ? 14 : 7);
    if (!input) return;
    const answers = useOnboardingStore.getState().answers;
    const best = withBestStore(answers, input, generatePlan(input));
    if (best.chainId && best.chainId !== answers.chainId)
      useOnboardingStore.getState().update({ chainId: best.chainId });
    app.savePlan(best.plan);
    track({ name: 'plan_generated' });
    return;
  }
  // Re-plan the rest of the week if the program's test nights moved.
  const current = activePlan(plans, today);
  if (!current) return;
  const projection = projectSchedule(program, current.weekStart, nightsOf(current));
  const projected = Object.fromEntries(
    Object.entries(projection).flatMap(([d, p]) =>
      p.type === 'dose' && p.kind !== 'control' ? [[d, p.group]] : [],
    ),
  ) as Record<DayKey, TestGroup>;
  const from = diffDays(current.weekStart, today) > 0 ? today : current.weekStart;
  if (!testNightsMatch(current, projected, from)) {
    const next = replanFrom(current, from);
    if (next) app.savePlan(next);
  }
}

export function swapDinner(plan: WeekPlan, day: DayKey, recipeId: string): void {
  const input = inputFor(plan.weekStart, nightsOf(plan));
  if (!input) return;
  useAppStore.getState().savePlan(applySwap(input, plan, day, recipeId));
  track({ name: 'dinner_swapped' });
}

export function setEatingOut(plan: WeekPlan, day: DayKey, eatingOut: boolean): void {
  const input = inputFor(plan.weekStart, nightsOf(plan));
  if (!input) return;
  if (eatingOut) {
    const nights = plan.nights.map((n) =>
      n.day === day ? { ...n, status: 'eating_out' as const, recipeId: null, eatBy: null } : n,
    );
    useAppStore.getState().savePlan(withTotals(input, { ...plan, nights }));
    track({ name: 'eating_out_marked' });
    return;
  }
  // Back to cooking: re-plan just that night.
  const cleared = {
    ...plan,
    nights: plan.nights.map((n) => (n.day === day ? { ...n, status: 'cook' as const } : n)),
  };
  useAppStore.getState().savePlan(cleared);
  const fresh = replanFrom(cleared, day);
  if (!fresh) return;
  const pick = fresh.nights.find((n) => n.day === day);
  const nights = cleared.nights.map((n) => (n.day === day && pick ? pick : n));
  useAppStore.getState().savePlan(withTotals(input, { ...cleared, nights }));
}

export function shuffleWeek(plan: WeekPlan, today: DayKey): void {
  const shuffle = useAppStore.getState().bumpShuffle(plan.weekStart);
  const from = diffDays(plan.weekStart, today) > 0 ? today : plan.weekStart;
  const next = replanFrom(plan, from, { shuffle });
  if (next) useAppStore.getState().savePlan(next);
}

export function setTwoWeek(plan: WeekPlan | null, today: DayKey, on: boolean): void {
  useAppStore.getState().setTwoWeek(on);
  if (!plan) return;
  const from = diffDays(plan.weekStart, today) > 0 ? today : plan.weekStart;
  const next = replanFrom(plan, from, { nights: on ? 14 : 7 });
  if (next) useAppStore.getState().savePlan(next);
}

/** Re-prices the current plan for the active store (same dinners, new totals). */
export function repriceCurrentPlan(): void {
  const { today } = clockNow();
  const plan = activePlan(allPlans(), today);
  if (!plan) return;
  const input = inputFor(plan.weekStart, nightsOf(plan));
  if (input) useAppStore.getState().savePlan(withTotals(input, plan));
}

/** Manual store switch from the list (only offered for stores that sell everything on it). */
export function switchStore(chainId: string): void {
  useOnboardingStore.getState().update({ chainId, storeAuto: false });
  repriceCurrentPlan();
}

/** Back to auto: the cheapest of the user's stores that sells everything on this week's list. */
export function autoPickStore(): void {
  const a = useOnboardingStore.getState().answers;
  useOnboardingStore.getState().update({ storeAuto: true });
  const { today } = clockNow();
  const plan = activePlan(allPlans(), today);
  if (!plan) return;
  const input = inputFor(plan.weekStart, nightsOf(plan));
  if (!input) return;
  const best = bestStore(storeOptions(input, plan, a, a.stores));
  if (best) useOnboardingStore.getState().update({ chainId: best });
  repriceCurrentPlan();
}
