import { allowedInPersonalPlan, doseGrams, recipeGroupAmounts, triggerGroupsOf } from '@/engines/triggers';

import { ING, recipe, TESTS } from './helpers';

const ing = (id: string) => ING.get(id)!;
const test = (id: string) => TESTS.tests.find((t) => t.id === id)!;

describe('triggerGroupsOf', () => {
  it.each([
    ['garlic', 5, ['garlic']],
    ['onion_yellow', 30, ['onion']],
    ['wheat_bread', 30, ['wheat']],
    ['broth_chicken', 200, ['onion', 'garlic']],
    ['milk', 125, ['lactose']],
    ['crushed_tomatoes', 100, ['tomato']],
    ['bacon', 30, ['fatty']],
    ['chili_flakes', 1, ['spicy']],
    ['honey', 7, ['fructose']],
    ['cauliflower', 40, ['mannitol']],
  ])('%s → %j', (id, grams, groups) => {
    expect(triggerGroupsOf(ing(id), grams).sort()).toEqual([...groups].sort());
  });

  it('respects safe servings', () => {
    expect(triggerGroupsOf(ing('avocado'), 25)).toEqual([]);
    expect(triggerGroupsOf(ing('avocado'), 60)).toEqual(['sorbitol']);
  });

  it('low-FODMAP swaps carry nothing', () => {
    expect(triggerGroupsOf(ing('garlic_infused_oil'), 15)).toEqual([]);
    expect(triggerGroupsOf(ing('green_onion'), 10)).toEqual([]);
  });
});

describe('personal plan rules', () => {
  it('excludes recipes with a confirmed trigger', () => {
    const r = recipe('spaghetti_marinara'); // garlic + marinara (onion/garlic) + wheat pasta
    expect(allowedInPersonalPlan(r, { triggers: ['garlic'], partial: [] }, TESTS.tests, ING)).toBe(false);
    expect(allowedInPersonalPlan(r, { triggers: ['mint'], partial: [] }, TESTS.tests, ING)).toBe(true);
  });

  it('allows a partial group only up to the safe dose', () => {
    const amounts = recipeGroupAmounts(recipe('garlic_herb_roast_chicken'), ING);
    const garlicPerServing = amounts.get('garlic')!; // 6 cloves over 4 servings = 7.5 g
    expect(garlicPerServing).toBeCloseTo(7.5);
    const dose3 = doseGrams(test('garlic'), 3, ING)!; // ¾ clove = 3.75 g
    expect(dose3).toBeCloseTo(3.75);
    expect(
      allowedInPersonalPlan(recipe('garlic_herb_roast_chicken'), { triggers: [], partial: [{ group: 'garlic', safeDose: 2 }] }, TESTS.tests, ING),
    ).toBe(false);
  });

  it('a calm-safe recipe fits every rule set', () => {
    const r = recipe('ginger_soy_chicken_rice_bowls');
    const everything = TESTS.tests.map((t) => t.id).filter((g) => g !== 'control');
    expect(allowedInPersonalPlan(r, { triggers: everything, partial: [] }, TESTS.tests, ING)).toBe(true);
  });

  it('timing tests have no dose weight', () => {
    expect(doseGrams(test('late_dinner'), 1, ING)).toBeNull();
  });
});
