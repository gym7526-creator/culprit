/**
 * Compact authoring helpers for the content sources. Output is validated by the zod schemas in
 * src/data/content/schema.ts during `npm run content:build`.
 */
import type {
  Aisle,
  Allergen,
  DietTag,
  FodmapProfile,
  Ingredient,
  Pack,
  PackUnit,
  RefluxTag,
  SkinTag,
} from '../../src/data/content/schema.ts';

export const VEGAN: DietTag[] = ['vegan', 'vegetarian', 'pescatarian'];
export const VEGETARIAN: DietTag[] = ['vegetarian', 'pescatarian'];
export const PESCATARIAN: DietTag[] = ['pescatarian'];
export const MEAT: DietTag[] = [];

const NONE: FodmapProfile = {
  fructan: 'none',
  gos: 'none',
  lactose: 'none',
  fructose: 'none',
  sorbitol: 'none',
  mannitol: 'none',
};

export type PackTuple = [size: number, unit: PackUnit, priceUSD: number, storeBrand?: boolean];

type Extra = {
  fodmap?: Partial<FodmapProfile>;
  safeG?: number;
  reflux?: RefluxTag[];
  skin?: SkinTag[];
  allergens?: Allergen[];
  swaps?: string[];
  staple?: boolean;
  days?: number;
  gPerMl?: number;
  gEach?: number;
  protein?: Ingredient['protein'];
  note?: string;
};

/** i(id, name, aisle, fatPer100g, diets, packs, extra) */
export function i(
  id: string,
  name: string,
  aisle: Aisle,
  fatPer100g: number,
  diets: DietTag[],
  packs: PackTuple[],
  extra: Extra = {},
): Ingredient {
  const out: Ingredient = {
    id,
    name,
    aisle,
    fodmap: { ...NONE, ...extra.fodmap },
    reflux: extra.reflux ?? [],
    skin: extra.skin ?? [],
    allergens: extra.allergens ?? [],
    diets,
    packs: packs.map(
      ([size, unit, basePriceUSD, storeBrand = true]): Pack => ({ size, unit, basePriceUSD, storeBrand }),
    ),
    fatPer100g,
  };
  if (extra.safeG !== undefined) out.fodmapSafeServingG = extra.safeG;
  if (extra.swaps) out.swaps = extra.swaps;
  if (extra.staple) out.pantryStaple = true;
  if (extra.days !== undefined) out.perishableDays = extra.days;
  if (extra.gPerMl !== undefined) out.gPerMl = extra.gPerMl;
  if (extra.gEach !== undefined) out.gEach = extra.gEach;
  if (extra.protein) out.protein = extra.protein;
  if (extra.note) out.note = extra.note;
  return out;
}
