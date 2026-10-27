/**
 * Derives every recipe tag from the ingredient master (spec §5.2). Tags are NEVER taken from the
 * recipe author or an LLM. Pure and deterministic.
 */
import {
  FODMAP_GROUPS,
  type Allergen,
  type DietTag,
  type FodmapGroup,
  type Ingredient,
  type Level,
  type RecipeDerived,
  type RecipeSource,
  type RefluxTag,
} from '../../src/data/content/schema.ts';

import { toGrams } from './units.ts';

/** Reflux "moderate-fat cap": grams of fat per serving above which a dinner isn't calm-safe for reflux. */
export const REFLUX_FAT_CAP_G = 25;

const RANK: Record<Level, number> = { none: 0, low: 1, moderate: 2, high: 3 };
const ALL_DIETS: DietTag[] = ['vegan', 'vegetarian', 'pescatarian'];

/** Level of one ingredient at the per-serving amount, honouring its safe-serving threshold. */
export function effectiveLevel(ing: Ingredient, group: FodmapGroup, gramsPerServing: number): Level {
  const level = ing.fodmap[group];
  if (RANK[level] >= RANK.moderate && ing.fodmapSafeServingG !== undefined && gramsPerServing <= ing.fodmapSafeServingG) {
    return 'low';
  }
  return level;
}

export function deriveRecipe(recipe: RecipeSource, ingredients: ReadonlyMap<string, Ingredient>): RecipeDerived {
  const fodmapMax = Object.fromEntries(FODMAP_GROUPS.map((g) => [g, 'none' as Level])) as Record<FodmapGroup, Level>;
  const reflux = new Set<RefluxTag>();
  const allergens = new Set<Allergen>();
  let diets = new Set<DietTag>(ALL_DIETS);
  let fatG = 0;
  let highGlycemic = false;
  const proteinGrams = new Map<string, number>();

  for (const ri of recipe.ingredients) {
    const ing = ingredients.get(ri.ingredientId);
    if (!ing) throw new Error(`${recipe.id}: unknown ingredient "${ri.ingredientId}"`);
    const grams = toGrams(ri.qty, ri.unit, ing);
    const perServing = grams / recipe.servingsBase;

    for (const g of FODMAP_GROUPS) {
      const lvl = effectiveLevel(ing, g, perServing);
      if (RANK[lvl] > RANK[fodmapMax[g]]) fodmapMax[g] = lvl;
    }
    ing.reflux.forEach((t) => reflux.add(t));
    ing.allergens.forEach((a) => allergens.add(a));
    diets = new Set([...diets].filter((d) => ing.diets.includes(d)));
    fatG += (grams * ing.fatPer100g) / 100;
    if (ing.skin.includes('high_glycemic')) highGlycemic = true;
    if (ing.protein) proteinGrams.set(ing.protein, (proteinGrams.get(ing.protein) ?? 0) + grams);
  }

  const fatPerServingG = Math.round((fatG / recipe.servingsBase) * 10) / 10;
  const calmSafeGut = FODMAP_GROUPS.every((g) => RANK[fodmapMax[g]] <= RANK.low);
  const refluxTags = [...reflux].sort();
  const mainProtein = [...proteinGrams.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    fodmapMax,
    refluxTags,
    allergens: [...allergens].sort(),
    diets: ALL_DIETS.filter((d) => diets.has(d)),
    calmSafeGut,
    calmSafeReflux: refluxTags.length === 0 && fatPerServingG <= REFLUX_FAT_CAP_G,
    lowGlycemic: !highGlycemic,
    mainProtein,
    fatPerServingG,
    glutenFree: !allergens.has('wheat'),
  };
}
