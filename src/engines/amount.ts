/**
 * Recipe amounts for display (US kitchen units). Pure.
 */
import type { RecipeUnit } from '../data/content/schema.ts';

const G_PER_OZ = 28.3495;
const ML_PER_CUP = 236.6;

function nice(n: number): number {
  if (n >= 10) return Math.round(n);
  return Math.round(n * 4) / 4;
}

export type Amount = {
  qty: number;
  unit: 'g' | 'oz' | 'lb' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'each';
};

/** Scales an amount and converts metric weights/volumes to US units cooks expect. */
export function displayAmount(qty: number, unit: RecipeUnit, scale = 1): Amount {
  const q = qty * scale;
  switch (unit) {
    case 'g': {
      const oz = q / G_PER_OZ;
      return oz >= 16 ? { qty: nice(oz / 16), unit: 'lb' } : { qty: nice(oz), unit: 'oz' };
    }
    case 'ml': {
      const cups = q / ML_PER_CUP;
      if (cups >= 0.25) return { qty: nice(cups), unit: 'cup' };
      const tbsp = q / 14.79;
      return tbsp >= 1 ? { qty: nice(tbsp), unit: 'tbsp' } : { qty: nice(q / 4.93), unit: 'tsp' };
    }
    default:
      return { qty: nice(q), unit };
  }
}

/** Servings scale factor, from the recipe's base servings to the household. */
export function servingScale(servingsBase: number, servings: number): number {
  return servings / servingsBase;
}
