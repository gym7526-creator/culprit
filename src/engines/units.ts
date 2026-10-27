/**
 * Unit conversion shared by tag derivation (data-pipeline) and the grocery engine.
 * Type-only imports keep this file runnable by Node directly.
 */
import type { Ingredient, PackUnit, RecipeUnit } from '../data/content/schema.ts';

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

/** Converts a recipe quantity into the given pack unit (g, ml or each). */
export function toPackUnit(qty: number, unit: RecipeUnit, ing: Ingredient, target: PackUnit): number {
  if (target === 'each') {
    if (unit === 'each') return qty;
    if (ing.gEach === undefined) throw new Error(`"${ing.id}" is sold by count but has no gEach`);
    return toGrams(qty, unit, ing) / ing.gEach;
  }
  if (target === 'ml') {
    if (unit === 'ml') return qty;
    if (unit === 'tbsp' || unit === 'tsp' || unit === 'cup') return qty * ML_PER[unit];
    return toGrams(qty, unit, ing) / (ing.gPerMl ?? 1);
  }
  return toGrams(qty, unit, ing);
}
