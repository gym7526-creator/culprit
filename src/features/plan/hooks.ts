import { useMemo } from 'react';

import type { GroceryList } from '@/engines/grocery';
import { planGroceries, type PlanInput, type WeekPlan } from '@/engines/plan';
import { activePlan } from '@/engines/week';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';

import { inputFor } from './actions';

/** The plan for today (or the upcoming one before the first night). */
export function useActivePlan(): WeekPlan | null {
  const { today } = useClock();
  const plans = useAppStore((s) => s.plans);
  return useMemo(() => activePlan(Object.values(plans), today), [plans, today]);
}

/** Planner input for a plan; recomputed when answers, program or feedback change. */
export function usePlanInput(plan: WeekPlan | null): PlanInput | null {
  const program = useAppStore((s) => s.program);
  const feedback = useAppStore((s) => s.feedback);
  const pantryMissing = useAppStore((s) => s.pantryMissing);
  const answers = useOnboardingStore((s) => s.answers);
  return useMemo(
    () => (plan ? inputFor(plan.weekStart, plan.nights.length > 7 ? 14 : 7) : null),
    // The store values are read inside inputFor; they're listed so the input refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, program, feedback, pantryMissing, answers],
  );
}

export function useGroceryList(plan: WeekPlan | null): GroceryList | null {
  const input = usePlanInput(plan);
  const custom = useAppStore((s) => (plan ? s.custom[plan.weekStart] : undefined));
  return useMemo(() => {
    if (!plan || !input) return null;
    const list = planGroceries(input, plan);
    return { ...list, custom: custom ?? [] };
  }, [plan, input, custom]);
}
