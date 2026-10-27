/** Unit conversion shared by tag derivation (and mirrored by the grocery engine in Phase 2). */
import type { Ingredient, RecipeUnit } from '../../src/data/content/schema.ts';

export const ML_PER: Record<'tbsp' | 'tsp' | 'cup', number> = { tbsp: 15, tsp: 5, cup: 240 };

/** Grams for a recipe quantity. Throws when a conversion is impossible (caught by the validator). */
export function toGrams(qty: number, unit: RecipeUnit, ing: Ingredient): number {
  switch (unit) {
    case 'g':
      return qty;
    case 'ml':
      return qty * (ing.gPerMl ?? 1);
    case 'tbsp':
    case 'tsp':
    case 'cup':
      return qty * ML_PER[unit] * (ing.gPerMl ?? 1);
    case 'each':
      if (ing.gEach === undefined) {
        throw new Error(`"${ing.id}" is used by count but has no gEach`);
      }
      return qty * ing.gEach;
  }
}
