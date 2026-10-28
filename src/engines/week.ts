/**
 * Which saved plan covers a day, and when the next one should start (spec §10.1–10.2). Pure.
 */
import { addDays, diffDays, type DayKey } from './dates.ts';
import type { WeekPlan } from './plan.ts';
import type { TestGroup } from './types.ts';

export function planEnd(plan: WeekPlan): DayKey {
  return addDays(plan.weekStart, plan.nights.length - 1);
}

export function planCovering(plans: readonly WeekPlan[], day: DayKey): WeekPlan | null {
  return (
    plans.find((p) => diffDays(p.weekStart, day) >= 0 && diffDays(day, planEnd(p)) >= 0) ?? null
  );
}

/** The plan to show for `day`: the one covering it, else the next one that hasn't started. */
export function activePlan(plans: readonly WeekPlan[], day: DayKey): WeekPlan | null {
  const covering = planCovering(plans, day);
  if (covering) return covering;
  const upcoming = plans
    .filter((p) => diffDays(day, p.weekStart) > 0)
    .sort((a, b) => diffDays(b.weekStart, a.weekStart));
  return upcoming[0] ?? null;
}

/**
 * Start day for a new plan: today when nothing covers today or later. Returns null when a plan
 * already covers `day` or starts after it.
 */
export function nextPlanStart(plans: readonly WeekPlan[], day: DayKey): DayKey | null {
  return activePlan(plans, day) ? null : day;
}

/** Recently cooked dinners, for the planner's recency score. */
export function cookHistory(
  plans: readonly WeekPlan[],
  before: DayKey,
): { recipeId: string; day: DayKey }[] {
  return plans.flatMap((p) =>
    p.nights
      .filter((n) => n.status === 'cook' && n.recipeId && diffDays(n.day, before) > 0)
      .map((n) => ({ recipeId: n.recipeId!, day: n.day })),
  );
}

/**
 * Whether the saved plan's test nights still match the program's projection. When the program
 * moves (a missed check-in repeats a dose, a reaction ends a test early), the rest of the week is
 * re-planned from today.
 */
export function testNightsMatch(
  plan: WeekPlan,
  projected: Readonly<Record<DayKey, TestGroup>>,
  from: DayKey,
): boolean {
  return plan.nights
    .filter((n) => diffDays(from, n.day) >= 0)
    .every((n) => (n.status === 'eating_out' ? true : (projected[n.day] ?? null) === n.testGroup));
}
