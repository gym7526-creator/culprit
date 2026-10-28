import { recipeMap } from '@/data/content';
import { addDays, diffDays } from '@/engines/dates';
import { emptyAnswers, type Answers } from '@/engines/onboarding';
import { swapOptions } from '@/engines/plan';
import { activePlan } from '@/engines/week';
import { useAppStore } from '@/features/appStore';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import {
  allPlans,
  inputFor,
  setEatingOut,
  setTwoWeek,
  shuffleWeek,
  swapDinner,
  syncProgramAndPlan,
} from '@/features/plan/actions';

const DAY0 = '2026-10-28';
const answers: Answers = {
  ...emptyAnswers,
  birthYear: 1990,
  symptoms: ['bloating', 'gas'],
  mainSymptom: 'bloating',
  diet: 'none',
  maxMinutes: 30,
  zip: '60614',
  chainId: 'kroger',
  budget: 90,
  consent: true,
};

beforeEach(() => {
  useAppStore.getState().resetAll();
  useOnboardingStore.setState({ answers });
  const week = buildFirstWeek(answers, DAY0, 'seed');
  useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
});

describe('a simulated week in the main app', () => {
  it('keeps a plan every day and rolls to a new week', () => {
    const seen = new Set<string>();
    for (let i = 0; i <= 15; i++) {
      const day = addDays(DAY0, i);
      syncProgramAndPlan(day, 19);
      const plan = activePlan(allPlans(), day);
      expect(plan).not.toBeNull();
      if (i > 0) expect(diffDays(plan!.weekStart, day)).toBeGreaterThanOrEqual(0);
      seen.add(plan!.weekStart);
      // Calm phase: every cooked dinner stays gut-safe.
      for (const n of plan!.nights.filter((x) => x.recipeId && !x.testGroup)) {
        expect(recipeMap.get(n.recipeId!)!.derived.calmSafeGut).toBe(true);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    expect(useAppStore.getState().program!.calmDaysDone).toBeGreaterThan(0);
  });

  it('swaps a dinner and updates the total', () => {
    const plan = allPlans()[0]!;
    const night = plan.nights.find((n) => n.status === 'cook')!;
    const input = inputFor(plan.weekStart, 7)!;
    const [opt] = swapOptions(input, plan, night.day, 3);
    swapDinner(plan, night.day, opt!.recipeId);
    const after = useAppStore.getState().plans[plan.weekStart]!;
    expect(after.nights.find((n) => n.day === night.day)!.recipeId).toBe(opt!.recipeId);
    expect(after.total).toBeCloseTo(plan.total + opt!.priceDelta, 1);
  });

  it('marks eating out and back', () => {
    const plan = allPlans()[0]!;
    const night = plan.nights.find((n) => n.status === 'cook' && !n.testGroup)!;
    setEatingOut(plan, night.day, true);
    let after = useAppStore.getState().plans[plan.weekStart]!;
    expect(after.nights.find((n) => n.day === night.day)!.status).toBe('eating_out');
    expect(after.total).toBeLessThanOrEqual(plan.total);
    setEatingOut(after, night.day, false);
    after = useAppStore.getState().plans[plan.weekStart]!;
    const back = after.nights.find((n) => n.day === night.day)!;
    expect(back.status).toBe('cook');
    expect(back.recipeId).not.toBeNull();
  });

  it('shuffles only the rest of the week', () => {
    const plan = allPlans()[0]!;
    const today = addDays(plan.weekStart, 3);
    shuffleWeek(plan, today);
    const after = useAppStore.getState().plans[plan.weekStart]!;
    for (const n of after.nights.filter((x) => diffDays(x.day, today) > 0)) {
      expect(n.recipeId).toBe(plan.nights.find((o) => o.day === n.day)!.recipeId);
    }
    expect(useAppStore.getState().shuffles[plan.weekStart]).toBe(1);
  });

  it('switches to a 2-week plan', () => {
    const plan = allPlans()[0]!;
    setTwoWeek(plan, DAY0, true);
    const after = useAppStore.getState().plans[plan.weekStart]!;
    expect(after.nights).toHaveLength(14);
    expect(useAppStore.getState().twoWeek).toBe(true);
  });
});

describe('my stores', () => {
  it('prices the week at the cheapest store that sells everything, and switching is limited to stores that can', () => {
    const { storeOptions } = jest.requireActual(
      '@/features/stores/pick',
    ) as typeof import('@/features/stores/pick');
    const multi = {
      ...answers,
      stores: ['jewel_osco', 'aldi', 'walgreens'],
      chainId: 'jewel_osco',
      storeAuto: true,
    };
    useOnboardingStore.setState({ answers: multi });
    const week = buildFirstWeek(multi, DAY0, 'seed');
    expect(week.chainId).toBe('aldi');
    const input = inputFor(week.plan.weekStart, 7)!;
    const opts = storeOptions(input, week.plan, multi, multi.stores);
    const walgreens = opts.find((o) => o.chainId === 'walgreens')!;
    expect(walgreens.total).toBeNull();
    expect(walgreens.missing).toContain('produce');
  });
});
