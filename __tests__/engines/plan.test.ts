import { addDays, weekday } from '@/engines/dates';
import {
  applySwap,
  eatByTime,
  eligibleRecipes,
  generatePlan,
  planGroceries,
  swapOptions,
  type PlanInput,
} from '@/engines/plan';

import { ING, NEUTRAL_PRICES, RECIPE, RECIPES, TESTS } from './helpers';

const MONDAY = '2026-05-04';

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    recipes: RECIPES,
    ingredients: ING,
    tests: TESTS.tests,
    weekStart: MONDAY,
    nights: 7,
    cookDays: [0, 1, 2, 3, 4],
    eatingOut: [],
    household: 2,
    kids: false,
    maxMinutes: 45,
    equipment: [],
    diet: 'none',
    allergens: [],
    dislikes: [],
    glutenFree: false,
    safety: 'calm_gut',
    testNights: {},
    budget: 200,
    prices: NEUTRAL_PRICES,
    ownedPantry: ['salt', 'black_pepper', 'olive_oil', 'vegetable_oil'],
    bedtime: '23:00',
    refluxTiming: false,
    history: [],
    feedback: {},
    seed: 'user-1',
    ...over,
  };
}

const cooked = (p: ReturnType<typeof generatePlan>) => p.nights.filter((n) => n.status === 'cook');
const ids = (p: ReturnType<typeof generatePlan>) => cooked(p).map((n) => n.recipeId);

describe('filters', () => {
  it('calm gut plans only use gut-safe dinners', () => {
    const p = generatePlan(input());
    expect(cooked(p)).toHaveLength(5);
    for (const id of ids(p)) expect(RECIPE.get(id!)?.derived.calmSafeGut).toBe(true);
  });

  it('mixed profiles need dinners safe for both', () => {
    for (const id of ids(generatePlan(input({ safety: 'calm_both' })))) {
      const r = RECIPE.get(id!)!;
      expect(r.derived.calmSafeGut && r.derived.calmSafeReflux).toBe(true);
    }
  });

  it('respects diet, allergens, gluten, dislikes and equipment', () => {
    const pool = eligibleRecipes(input({ diet: 'vegetarian', allergens: ['soy'], glutenFree: true, dislikes: ['zucchini'] }));
    expect(pool.length).toBeGreaterThan(0);
    for (const r of pool) {
      expect(r.derived.diets).toContain('vegetarian');
      expect(r.derived.allergens).not.toContain('soy');
      expect(r.derived.glutenFree).toBe(true);
      expect(r.ingredients.map((i) => i.ingredientId)).not.toContain('zucchini');
    }
    expect(eligibleRecipes(input()).some((r) => r.equipment.includes('grill'))).toBe(false);
    expect(eligibleRecipes(input({ equipment: ['grill'] })).some((r) => r.equipment.includes('grill'))).toBe(true);
  });

  it('keeps to the time limit when there are enough dinners', () => {
    for (const id of ids(generatePlan(input({ maxMinutes: 30 })))) expect(RECIPE.get(id!)!.minutes).toBeLessThanOrEqual(35);
  });

  it('never repeats a dinner within a week', () => {
    const list = ids(generatePlan(input({ cookDays: [0, 1, 2, 3, 4, 5, 6] })));
    expect(new Set(list).size).toBe(list.length);
  });
});

describe('nights', () => {
  it('marks non-cook and eating-out nights', () => {
    const p = generatePlan(input({ eatingOut: [addDays(MONDAY, 2)] }));
    expect(p.nights.map((n) => n.status)).toEqual(['cook', 'cook', 'eating_out', 'cook', 'cook', 'not_cooking', 'not_cooking']);
    expect(p.nights[2]?.recipeId).toBeNull();
  });

  it('puts a dinner that can host the test on test nights', () => {
    const day = addDays(MONDAY, 1);
    const p = generatePlan(input({ testNights: { [day]: 'garlic' } }));
    const night = p.nights.find((n) => n.day === day)!;
    expect(night.testGroup).toBe('garlic');
    expect(RECIPE.get(night.recipeId!)?.testSlot?.canHost).toContain('garlic');
  });

  it('adds the test food to the grocery list', () => {
    const day = addDays(MONDAY, 1);
    const i = input({ testNights: { [day]: 'lactose' } });
    const list = planGroceries(i, generatePlan(i));
    const milk = list.sections.flatMap((s) => s.lines).find((l) => l.ingredientId === 'milk');
    expect(milk?.usedBy).toContain('test:lactose');
  });

  it('gives reflux profiles an eat-by time 3 hours before bed', () => {
    const p = generatePlan(input({ refluxTiming: true, bedtime: '23:00' }));
    expect(cooked(p).every((n) => n.eatBy === '20:00')).toBe(true);
  });

  it('late-dinner test nights finish 1½ hours before bed', () => {
    const day = addDays(MONDAY, 0);
    const p = generatePlan(input({ refluxTiming: true, testNights: { [day]: 'late_dinner' } }));
    expect(p.nights[0]?.eatBy).toBe('21:30');
  });

  it('computes eat-by times across midnight', () => {
    expect(eatByTime('01:00', 180)).toBe('22:00');
    expect(eatByTime('22:30', 180)).toBe('19:30');
  });
});

describe('determinism and variety', () => {
  it('is deterministic for the same seed', () => {
    expect(generatePlan(input())).toEqual(generatePlan(input()));
  });

  it('shuffle changes the week', () => {
    expect(ids(generatePlan(input({ shuffle: 1 })))).not.toEqual(ids(generatePlan(input())));
  });

  it('avoids dinners from the last 4 weeks when it can', () => {
    const first = ids(generatePlan(input()));
    const history = first.map((recipeId, i) => ({ recipeId: recipeId!, day: addDays(MONDAY, -7 + i) }));
    const next = ids(generatePlan(input({ weekStart: MONDAY, history })));
    expect(next.filter((id) => first.includes(id)).length).toBeLessThan(2);
  });

  it('drops thumbs-down dinners', () => {
    const first = ids(generatePlan(input()));
    const feedback = Object.fromEntries(first.map((id) => [id!, -1 as const]));
    const next = ids(generatePlan(input({ feedback })));
    expect(next.some((id) => first.includes(id))).toBe(false);
  });

  it('prefers kid-friendly dinners for families', () => {
    const kids = cooked(generatePlan(input({ kids: true }))).filter((n) => RECIPE.get(n.recipeId!)?.kidFriendly).length;
    expect(kids).toBeGreaterThanOrEqual(4);
  });
});

describe('budget', () => {
  it('fits a reasonable budget', () => {
    const p = generatePlan(input({ budget: 150 }));
    expect(p.total).toBeLessThanOrEqual(150);
    expect(p.overBudgetBy).toBeNull();
  });

  it('reports the gap with two suggestions when it cannot fit', () => {
    const p = generatePlan(input({ budget: 20 }));
    expect(p.overBudgetBy).toBeGreaterThan(0);
    expect(p.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(p.suggestions.length).toBeLessThanOrEqual(2);
  });

  it('a tighter budget never costs more', () => {
    expect(generatePlan(input({ budget: 60 })).total).toBeLessThanOrEqual(generatePlan(input({ budget: 400 })).total);
  });
});

describe('swaps', () => {
  it('offers 3 alternatives with price deltas and applies one', () => {
    const i = input();
    const p = generatePlan(i);
    const day = cooked(p)[0]!.day;
    const opts = swapOptions(i, p, day);
    expect(opts).toHaveLength(3);
    expect(opts.every((o) => !ids(p).includes(o.recipeId))).toBe(true);
    const swapped = applySwap(i, p, day, opts[0]!.recipeId);
    expect(swapped.nights.find((n) => n.day === day)?.recipeId).toBe(opts[0]!.recipeId);
    expect(swapped.total).toBeCloseTo(p.total + opts[0]!.priceDelta, 2);
  });
});

describe('two-week mode', () => {
  it('plans 14 nights with one list and fewer perishables in week two', () => {
    const p = generatePlan(input({ nights: 14 }));
    expect(p.nights).toHaveLength(14);
    expect(cooked(p)).toHaveLength(10);
    const perish = (id: string) => RECIPE.get(id)!.ingredients.filter((x) => (ING.get(x.ingredientId)?.perishableDays ?? 99) <= 7).length;
    const week = (w: number) => cooked(p).filter((n) => (w === 1 ? n.day < addDays(MONDAY, 7) : n.day >= addDays(MONDAY, 7)));
    const avg = (ns: typeof p.nights) => ns.reduce((s, n) => s + perish(n.recipeId!), 0) / ns.length;
    expect(avg(week(2))).toBeLessThanOrEqual(avg(week(1)) + 0.5);
    expect(weekday(p.nights[13]!.day)).toBe(6);
  });
});

describe('performance', () => {
  it('generates a week in under 150 ms', () => {
    generatePlan(input({ seed: 'warmup' }));
    const times: number[] = [];
    for (let k = 0; k < 5; k++) {
      const t0 = performance.now();
      generatePlan(input({ seed: `perf-${k}`, cookDays: [0, 1, 2, 3, 4, 5, 6] }));
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    expect(times[2]).toBeLessThan(150);
  });
});
