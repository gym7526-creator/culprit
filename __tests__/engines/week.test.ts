import type { WeekPlan } from '@/engines/plan';
import {
  activePlan,
  cookHistory,
  nextPlanStart,
  planCovering,
  planEnd,
  testNightsMatch,
} from '@/engines/week';

function plan(
  weekStart: string,
  recipes: (string | null)[],
  tests: Record<number, string> = {},
): WeekPlan {
  const [y, m, d] = weekStart.split('-').map(Number);
  return {
    weekStart,
    nights: recipes.map((r, i) => ({
      day: new Date(Date.UTC(y!, m! - 1, d! + i)).toISOString().slice(0, 10),
      status: r ? 'cook' : 'not_cooking',
      recipeId: r,
      testGroup: (tests[i] as never) ?? null,
      eatBy: null,
    })),
    total: 50,
    budget: 90,
    overBudgetBy: null,
    suggestions: [],
  };
}

const w1 = plan('2026-10-29', ['a', 'b', null, 'c', 'd', null, 'e']);

describe('week selection', () => {
  it('finds the covering plan and its end', () => {
    expect(planEnd(w1)).toBe('2026-11-04');
    expect(planCovering([w1], '2026-11-01')).toBe(w1);
    expect(planCovering([w1], '2026-11-05')).toBeNull();
  });

  it('shows the upcoming plan before it starts', () => {
    expect(activePlan([w1], '2026-10-28')).toBe(w1);
    expect(nextPlanStart([w1], '2026-10-28')).toBeNull();
  });

  it('starts a new plan once the last one ends', () => {
    expect(nextPlanStart([w1], '2026-11-05')).toBe('2026-11-05');
    expect(nextPlanStart([], '2026-11-05')).toBe('2026-11-05');
  });

  it('lists cooked dinners before a day', () => {
    expect(cookHistory([w1], '2026-10-31').map((h) => h.recipeId)).toEqual(['a', 'b']);
  });

  it('detects when test nights moved', () => {
    const p = plan('2026-10-29', ['a', 'b', 'c'], { 1: 'garlic' });
    expect(testNightsMatch(p, { '2026-10-30': 'garlic' }, '2026-10-29')).toBe(true);
    expect(testNightsMatch(p, { '2026-10-31': 'garlic' }, '2026-10-29')).toBe(false);
    expect(testNightsMatch(p, {}, '2026-10-31')).toBe(true);
  });
});
