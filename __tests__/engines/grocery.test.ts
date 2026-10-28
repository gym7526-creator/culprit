import { formatMoney } from '@/copy';
import {
  AISLE_ORDER,
  buildGroceryList,
  cheapestPacks,
  listAsText,
  needsForRecipes,
  packLabel,
} from '@/engines/grocery';

import { ING, NEUTRAL_PRICES, recipe } from './helpers';

describe('cheapestPacks', () => {
  it('buys the cheapest combination of whole packs', () => {
    // Need 1500 g; 680 g @ 6.49 or 1361 g @ 11.99 → one big + one small would be dearer than... check.
    const r = cheapestPacks(1500, [
      { size: 680, price: 6.49 },
      { size: 1361, price: 11.99 },
    ]);
    // Options: 3 small = 19.47, 1 big + 1 small = 18.48, 2 big = 23.98.
    expect(r.cost).toBe(18.48);
    expect(r.choice).toEqual([
      { packIndex: 0, count: 1 },
      { packIndex: 1, count: 1 },
    ]);
  });

  it('prefers less waste when the price ties', () => {
    const r = cheapestPacks(10, [
      { size: 12, price: 3 },
      { size: 10, price: 3 },
    ]);
    expect(r.choice).toEqual([{ packIndex: 1, count: 1 }]);
  });

  it('handles nothing needed', () => {
    expect(cheapestPacks(0, [{ size: 1, price: 1 }])).toEqual({ choice: [], cost: 0 });
  });
});

describe('packLabel', () => {
  it('formats US sizes', () => {
    expect(packLabel(454, 'g', 2)).toBe('2 × 1 lb');
    expect(packLabel(340, 'g', 1)).toBe('1 × 12 oz');
    expect(packLabel(1893, 'ml', 1)).toBe('1 × 64 fl oz');
    expect(packLabel(3785, 'ml', 1)).toBe('1 × 1 gal');
    expect(packLabel(12, 'each', 1)).toBe('1 × 12 ct');
  });
});

describe('buildGroceryList', () => {
  const recipes = [
    recipe('ginger_soy_chicken_rice_bowls'),
    recipe('beef_and_broccoli'),
    recipe('chicken_quinoa_bowls'),
  ];

  it('scales needs to the household', () => {
    const needs = needsForRecipes([recipe('beef_and_broccoli')], 2);
    const beef = needs.find((n) => n.ingredientId === 'beef_sirloin');
    expect(beef?.qty).toBe(227); // 454 g for 4 → 227 g for 2
  });

  it('sums shared ingredients and records which dinners use them', () => {
    const list = buildGroceryList(needsForRecipes(recipes, 4), ING, NEUTRAL_PRICES, {
      ownedPantry: [],
      budget: 100,
    });
    const lines = list.sections.flatMap((s) => s.lines);
    const chicken = lines.find((l) => l.ingredientId === 'chicken_breast');
    expect(chicken?.need).toBe(1100);
    expect(chicken?.usedBy).toEqual(['chicken_quinoa_bowls', 'ginger_soy_chicken_rice_bowls']);
  });

  it('groups lines in store-walk order', () => {
    const list = buildGroceryList(needsForRecipes(recipes, 4), ING, NEUTRAL_PRICES, {
      ownedPantry: [],
      budget: 100,
    });
    const order = list.sections.map((s) => AISLE_ORDER.indexOf(s.aisle));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(list.sections[0]?.aisle).toBe('produce');
  });

  it('crosses off owned pantry staples and leaves them out of the total', () => {
    const needs = needsForRecipes(recipes, 4);
    const full = buildGroceryList(needs, ING, NEUTRAL_PRICES, { ownedPantry: [], budget: 100 });
    const owned = buildGroceryList(needs, ING, NEUTRAL_PRICES, {
      ownedPantry: ['white_rice', 'vegetable_oil'],
      budget: 100,
    });
    const rice = owned.sections
      .flatMap((s) => s.lines)
      .find((l) => l.ingredientId === 'white_rice');
    expect(rice?.pantry).toBe(true);
    expect(rice?.priceEst).toBe(0);
    expect(owned.total).toBeLessThan(full.total);
  });

  it('applies region and chain prices', () => {
    const needs = needsForRecipes(recipes, 4);
    const base = buildGroceryList(needs, ING, NEUTRAL_PRICES, { ownedPantry: [], budget: 100 });
    const pricey = buildGroceryList(
      needs,
      ING,
      { ...NEUTRAL_PRICES, chainIndex: 1.3 },
      { ownedPantry: [], budget: 100 },
    );
    expect(pricey.total).toBeGreaterThan(base.total);
  });

  it('reports budget status', () => {
    const needs = needsForRecipes(recipes, 4);
    expect(
      buildGroceryList(needs, ING, NEUTRAL_PRICES, { ownedPantry: [], budget: 500 }).status,
    ).toBe('under');
    expect(
      buildGroceryList(needs, ING, NEUTRAL_PRICES, { ownedPantry: [], budget: 10 }).status,
    ).toBe('over');
  });

  it('exports a shareable text list', () => {
    const list = buildGroceryList(needsForRecipes(recipes, 4), ING, NEUTRAL_PRICES, {
      ownedPantry: ['white_rice'],
      budget: 100,
      custom: [{ id: 'c1', name: 'Paper towels' }],
    });
    const text = listAsText(list, formatMoney);
    expect(text).toMatch(/^Culprit grocery list · \$\d+\.\d{2} est\./);
    expect(text).toContain('Produce');
    expect(text).toContain('☐ Paper towels');
    expect(text).toContain('Already in your kitchen: Long-grain white rice');
  });
});
