import { deriveRecipe, effectiveLevel, REFLUX_FAT_CAP_G } from '../../data-pipeline/lib/derive';
import { toGrams } from '../../data-pipeline/lib/units';

import { ing, recipe } from './fixtures';

const rice = ing('rice');
const garlic = ing('garlic', { fodmap: { ...ing('x').fodmap, fructan: 'high' }, gEach: 5 });
const avocado = ing('avocado', {
  fodmap: { ...ing('x').fodmap, sorbitol: 'moderate' },
  fodmapSafeServingG: 30,
  gEach: 150,
  fatPer100g: 15,
});
const chicken = ing('chicken', { diets: [], protein: 'chicken', fatPer100g: 3 });
const salmon = ing('salmon', {
  diets: ['pescatarian'],
  allergens: ['fish'],
  protein: 'fish',
  fatPer100g: 13,
});
const cheese = ing('cheese', {
  diets: ['vegetarian', 'pescatarian'],
  allergens: ['milk'],
  protein: 'cheese',
  fatPer100g: 33,
});
const lemon = ing('lemon', { reflux: ['citrus'], gEach: 100 });
const oil = ing('oil', { fatPer100g: 100, gPerMl: 0.92 });
const bread = ing('bread', { allergens: ['wheat'], skin: ['high_glycemic'], gEach: 30 });
const map = new Map(
  [rice, garlic, avocado, chicken, salmon, cheese, lemon, oil, bread].map((i) => [i.id, i]),
);

describe('toGrams', () => {
  it('converts every unit', () => {
    expect(toGrams(100, 'g', rice)).toBe(100);
    expect(toGrams(100, 'ml', oil)).toBeCloseTo(92);
    expect(toGrams(1, 'tbsp', oil)).toBeCloseTo(13.8);
    expect(toGrams(2, 'tsp', rice)).toBe(10);
    expect(toGrams(1, 'cup', rice)).toBe(240);
    expect(toGrams(2, 'each', garlic)).toBe(10);
  });
  it('throws for counts without a per-item weight', () => {
    expect(() => toGrams(1, 'each', rice)).toThrow(/gEach/);
  });
});

describe('effectiveLevel', () => {
  it('drops moderate/high to low at or under the safe serving', () => {
    expect(effectiveLevel(avocado, 'sorbitol', 30)).toBe('low');
    expect(effectiveLevel(avocado, 'sorbitol', 31)).toBe('moderate');
  });
  it('leaves items without a safe serving alone', () => {
    expect(effectiveLevel(garlic, 'fructan', 1)).toBe('high');
  });
});

describe('deriveRecipe', () => {
  it('marks a plain dinner calm-safe for both profiles', () => {
    const d = deriveRecipe(
      recipe('a', [
        { ingredientId: 'rice', qty: 400, unit: 'g' },
        { ingredientId: 'chicken', qty: 600, unit: 'g' },
      ]),
      map,
    );
    expect(d.calmSafeGut).toBe(true);
    expect(d.calmSafeReflux).toBe(true);
    expect(d.mainProtein).toBe('chicken');
    expect(d.diets).toEqual([]);
    expect(d.glutenFree).toBe(true);
    expect(d.lowGlycemic).toBe(true);
  });

  it('one high-FODMAP ingredient makes it unsafe for the gut', () => {
    const d = deriveRecipe(
      recipe('b', [
        { ingredientId: 'rice', qty: 400, unit: 'g' },
        { ingredientId: 'garlic', qty: 2, unit: 'each' },
      ]),
      map,
    );
    expect(d.calmSafeGut).toBe(false);
    expect(d.fodmapMax.fructan).toBe('high');
  });

  it('respects the per-serving safe amount', () => {
    // 1 avocado (150 g) over 4 servings = 37.5 g each > 30 g → moderate
    const big = deriveRecipe(recipe('c', [{ ingredientId: 'avocado', qty: 1, unit: 'each' }]), map);
    // 0.5 avocado = 18.75 g each → low
    const small = deriveRecipe(
      recipe('d', [{ ingredientId: 'avocado', qty: 0.5, unit: 'each' }]),
      map,
    );
    expect(big.calmSafeGut).toBe(false);
    expect(small.calmSafeGut).toBe(true);
  });

  it('any reflux tag makes it unsafe for reflux', () => {
    const d = deriveRecipe(
      recipe('e', [
        { ingredientId: 'rice', qty: 200, unit: 'g' },
        { ingredientId: 'lemon', qty: 1, unit: 'each' },
      ]),
      map,
    );
    expect(d.refluxTags).toEqual(['citrus']);
    expect(d.calmSafeReflux).toBe(false);
    expect(d.calmSafeGut).toBe(true);
  });

  it('applies the moderate-fat cap', () => {
    const grams = ((REFLUX_FAT_CAP_G + 1) * 4 * 100) / 100; // just over the cap per serving
    const d = deriveRecipe(recipe('f', [{ ingredientId: 'oil', qty: grams, unit: 'g' }]), map);
    expect(d.fatPerServingG).toBeGreaterThan(REFLUX_FAT_CAP_G);
    expect(d.calmSafeReflux).toBe(false);
  });

  it('intersects diets and unions allergens', () => {
    const d = deriveRecipe(
      recipe('g', [
        { ingredientId: 'salmon', qty: 500, unit: 'g' },
        { ingredientId: 'cheese', qty: 50, unit: 'g' },
        { ingredientId: 'bread', qty: 4, unit: 'each' },
      ]),
      map,
    );
    expect(d.diets).toEqual(['pescatarian']);
    expect(d.allergens).toEqual(['fish', 'milk', 'wheat']);
    expect(d.glutenFree).toBe(false);
    expect(d.lowGlycemic).toBe(false);
    expect(d.mainProtein).toBe('fish');
  });

  it('throws on unknown ingredients', () => {
    expect(() =>
      deriveRecipe(
        recipe('h', [
          { ingredientId: 'nope', qty: 1, unit: 'g' },
          { ingredientId: 'rice', qty: 1, unit: 'g' },
        ]),
        map,
      ),
    ).toThrow(/unknown ingredient/);
  });
});
