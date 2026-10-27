/** FODMAP level helpers shared by tag derivation (pipeline) and the plan engine. */
import type { FodmapGroup, Ingredient, Level } from '../data/content/schema.ts';

export const LEVEL_RANK: Record<Level, number> = { none: 0, low: 1, moderate: 2, high: 3 };

/** Level of one ingredient at the per-serving amount, honouring its safe-serving threshold. */
export function effectiveLevel(ing: Ingredient, group: FodmapGroup, gramsPerServing: number): Level {
  const level = ing.fodmap[group];
  if (
    LEVEL_RANK[level] >= LEVEL_RANK.moderate &&
    ing.fodmapSafeServingG !== undefined &&
    gramsPerServing <= ing.fodmapSafeServingG
  ) {
    return 'low';
  }
  return level;
}
