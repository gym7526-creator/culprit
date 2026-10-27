/**
 * Maps ingredients to reintroduction test groups, and decides which recipes a personal plan may
 * include (spec §2 restriction limits: only confirmed triggers are limited, and only above the dose
 * that caused symptoms).
 */
import type { Ingredient, Recipe, TestDefinition, TestGroup } from '../data/content/schema.ts';
import { effectiveLevel, LEVEL_RANK } from './fodmap.ts';
import type { PersonalRules } from './program.ts';
import { toGrams } from './units.ts';

const REFLUX_TO_GROUP: Partial<Record<Ingredient['reflux'][number], TestGroup>> = {
  tomato: 'tomato',
  high_fat: 'fatty',
  fried: 'fatty',
  spicy: 'spicy',
  citrus: 'citrus',
  chocolate: 'chocolate',
  caffeine: 'coffee',
  mint: 'mint',
  carbonation: 'carbonation',
  alcohol: 'alcohol',
};

/** Test groups an ingredient carries at a given per-serving amount (FODMAPs above "low"). */
export function triggerGroupsOf(ing: Ingredient, gramsPerServing: number): TestGroup[] {
  const out = new Set<TestGroup>();
  const above = (g: Parameters<typeof effectiveLevel>[1]) =>
    LEVEL_RANK[effectiveLevel(ing, g, gramsPerServing)] > LEVEL_RANK.low;

  if (above('fructan')) {
    if (ing.allergens.includes('wheat')) out.add('wheat');
    else if (ing.id.includes('garlic')) out.add('garlic');
    else if (/onion|shallot|leek/.test(ing.id)) out.add('onion');
    else {
      // Mixed products (regular broth, jarred sauces, hummus) usually carry both.
      out.add('onion');
      out.add('garlic');
    }
  }
  if (above('gos')) out.add('gos');
  if (above('lactose')) out.add('lactose');
  if (above('fructose')) out.add('fructose');
  if (above('sorbitol')) out.add('sorbitol');
  if (above('mannitol')) out.add('mannitol');
  for (const tag of ing.reflux) {
    const g = REFLUX_TO_GROUP[tag];
    if (g) out.add(g);
  }
  return [...out];
}

/** Grams per serving of each test group a recipe contains. */
export function recipeGroupAmounts(recipe: Recipe, ingredients: ReadonlyMap<string, Ingredient>): Map<TestGroup, number> {
  const out = new Map<TestGroup, number>();
  for (const ri of recipe.ingredients) {
    const ing = ingredients.get(ri.ingredientId);
    if (!ing) continue;
    const perServing = toGrams(ri.qty, ri.unit, ing) / recipe.servingsBase;
    for (const g of triggerGroupsOf(ing, perServing)) out.set(g, (out.get(g) ?? 0) + perServing);
  }
  return out;
}

/** Grams of the test food at dose level 1–3 (null for timing tests). */
export function doseGrams(
  test: TestDefinition,
  level: 1 | 2 | 3,
  ingredients: ReadonlyMap<string, Ingredient>,
): number | null {
  const d = test.doses[level - 1];
  if (!d?.ingredientId || d.qty === undefined || !d.unit) return null;
  const ing = ingredients.get(d.ingredientId);
  return ing ? toGrams(d.qty, d.unit, ing) : null;
}

/** Whether a recipe fits a personal plan given the user's results. */
export function allowedInPersonalPlan(
  recipe: Recipe,
  rules: PersonalRules,
  tests: readonly TestDefinition[],
  ingredients: ReadonlyMap<string, Ingredient>,
): boolean {
  const amounts = recipeGroupAmounts(recipe, ingredients);
  for (const g of rules.triggers) if (amounts.has(g)) return false;
  for (const { group, safeDose } of rules.partial) {
    const grams = amounts.get(group);
    if (grams === undefined) continue;
    const test = tests.find((t) => t.id === group);
    const limit = test ? doseGrams(test, safeDose, ingredients) : null;
    if (limit === null || grams > limit) return false;
  }
  return true;
}
