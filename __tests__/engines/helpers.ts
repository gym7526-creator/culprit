import ingredientsJson from '../../assets/data/ingredients.json';
import recipesJson from '../../assets/data/recipes.json';
import testsJson from '../../assets/data/tests.json';
import { Ingredient, Recipe, TestsFile } from '@/data/content/schema';
import { z } from 'zod';

export const INGREDIENTS = z.array(Ingredient).parse(ingredientsJson);
export const ING = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const RECIPES = z.array(Recipe).parse(recipesJson);
export const RECIPE = new Map(RECIPES.map((r) => [r.id, r]));
export const TESTS = TestsFile.parse(testsJson);

export const NEUTRAL_PRICES = { chainId: 'kroger', regionMultiplier: 1, chainIndex: 1, overrides: {} };

export function recipe(id: string) {
  const r = RECIPE.get(id);
  if (!r) throw new Error(`missing recipe ${id}`);
  return r;
}
