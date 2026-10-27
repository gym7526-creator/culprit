/**
 * Grocery list builder (spec §6.5). Sums ingredient needs across the plan (scaled to the household),
 * picks the cheapest combination of whole packs per ingredient, crosses off pantry staples the user
 * owns and groups lines in store-walk order.
 */
import { format } from '../copy/format.ts';
import { groceryCopy } from '../copy/grocery.ts';
import type { Aisle, Ingredient, PackUnit, Recipe, RecipeUnit } from '../data/content/schema.ts';
import { budgetStatus, type BudgetStatus } from './budget.ts';
import { packPrice, roundCents, type PriceContext } from './price.ts';
import { toPackUnit } from './units.ts';

/** Store-walk order. */
export const AISLE_ORDER: readonly Aisle[] = [
  'produce',
  'bakery',
  'meat_seafood',
  'dairy',
  'frozen',
  'pantry',
  'international',
  'spices',
  'beverages',
];

/** Larger searches fall back to a greedy choice to stay fast. */
const MAX_PACK_COMBINATIONS = 20_000;

export type Need = { ingredientId: string; qty: number; unit: RecipeUnit; usedBy: string };

export type PackChoice = { packIndex: number; count: number };

export type GroceryLine = {
  ingredientId: string;
  name: string;
  aisle: Aisle;
  /** Total needed, in the pack unit. */
  need: number;
  unit: PackUnit;
  packs: PackChoice[];
  packLabel: string;
  priceEst: number;
  /** Recipe ids (or "test:<group>") that use this item. */
  usedBy: string[];
  /** Owned pantry staple: crossed off and not counted in the total. */
  pantry: boolean;
};

export type CustomItem = { id: string; name: string };

export type GroceryList = {
  sections: { aisle: Aisle; lines: GroceryLine[] }[];
  custom: CustomItem[];
  total: number;
  budget: number;
  status: BudgetStatus;
};

/** Cheapest whole-pack combination covering `need` (pack sizes in the same unit). */
export function cheapestPacks(need: number, packs: readonly { size: number; price: number }[]): { choice: PackChoice[]; cost: number } {
  if (need <= 0 || packs.length === 0) return { choice: [], cost: 0 };
  let best: { choice: PackChoice[]; cost: number; over: number } | null = null;
  let explored = 0;

  const search = (i: number, covered: number, cost: number, counts: number[]) => {
    if (explored++ > MAX_PACK_COMBINATIONS) return;
    if (covered >= need - 1e-9) {
      const over = covered - need;
      if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && over < best.over)) {
        best = {
          cost,
          over,
          choice: counts.map((count, packIndex) => ({ packIndex, count })).filter((c) => c.count > 0),
        };
      }
      return;
    }
    if (i >= packs.length) return;
    const p = packs[i]!;
    const maxCount = Math.ceil((need - covered) / p.size);
    for (let n = maxCount; n >= 0; n--) {
      if (best && cost + n * p.price > best.cost + 1e-9) continue;
      counts[i] = n;
      search(i + 1, covered + n * p.size, cost + n * p.price, counts);
    }
    counts[i] = 0;
  };
  search(0, 0, 0, packs.map(() => 0));

  if (best) return { choice: (best as { choice: PackChoice[] }).choice, cost: roundCents((best as { cost: number }).cost) };
  // Greedy fallback: cheapest price per unit, as many as needed.
  let bi = 0;
  packs.forEach((p, i) => {
    if (p.price / p.size < packs[bi]!.price / packs[bi]!.size) bi = i;
  });
  const count = Math.ceil(need / packs[bi]!.size);
  return { choice: [{ packIndex: bi, count }], cost: roundCents(count * packs[bi]!.price) };
}

/** "2 × 16 oz", "1 × 12 ct", "1 × 64 fl oz". US units for display. */
export function packLabel(size: number, unit: PackUnit, count: number): string {
  let s: string;
  if (unit === 'each') s = format(groceryCopy.sizeCount, { n: size });
  else if (unit === 'ml') {
    s = size >= 3700 ? format(groceryCopy.sizeGal, { n: Math.round((size / 3785.41) * 10) / 10 }) : format(groceryCopy.sizeFlOz, { n: Math.round(size / 29.5735) });
  } else {
    const oz = size / 28.3495;
    s = oz >= 32 && Math.abs(oz / 16 - Math.round(oz / 16)) < 0.1
      ? format(groceryCopy.sizeLb, { n: Math.round(oz / 16) })
      : format(groceryCopy.sizeOz, { n: Math.round(oz * 10) / 10 });
  }
  return format(groceryCopy.packCount, { count, size: s });
}

/** Ingredient needs for a set of dinners, scaled from each recipe's base servings to the household. */
export function needsForRecipes(recipes: readonly Recipe[], household: number): Need[] {
  return recipes.flatMap((r) =>
    r.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      qty: (ri.qty * household) / r.servingsBase,
      unit: ri.unit,
      usedBy: r.id,
    })),
  );
}

export function buildGroceryList(
  needs: readonly Need[],
  ingredients: ReadonlyMap<string, Ingredient>,
  ctx: PriceContext,
  opts: { ownedPantry: readonly string[]; budget: number; custom?: CustomItem[] },
): GroceryList {
  // Sum per ingredient in its first pack's unit.
  const totals = new Map<string, { need: number; usedBy: Set<string> }>();
  for (const n of needs) {
    const ing = ingredients.get(n.ingredientId);
    if (!ing) continue;
    const unit = ing.packs[0]!.unit;
    const amount = toPackUnit(n.qty, n.unit, ing, unit);
    const t = totals.get(ing.id) ?? { need: 0, usedBy: new Set<string>() };
    t.need += amount;
    t.usedBy.add(n.usedBy);
    totals.set(ing.id, t);
  }

  const lines: GroceryLine[] = [];
  for (const [id, t] of totals) {
    const ing = ingredients.get(id)!;
    const unit = ing.packs[0]!.unit;
    const options = ing.packs
      .map((p, packIndex) => ({ p, packIndex }))
      .filter(({ p }) => p.unit === unit);
    const priced = options.map(({ p, packIndex }) => ({ size: p.size, price: packPrice(p, id, packIndex, ctx), packIndex }));
    const { choice, cost } = cheapestPacks(t.need, priced);
    const mapped = choice.map((c) => ({ packIndex: priced[c.packIndex]!.packIndex, count: c.count }));
    const pantry = opts.ownedPantry.includes(id);
    lines.push({
      ingredientId: id,
      name: ing.name,
      aisle: ing.aisle,
      need: Math.round(t.need * 100) / 100,
      unit,
      packs: mapped,
      packLabel: mapped.map((c) => packLabel(ing.packs[c.packIndex]!.size, unit, c.count)).join(' + '),
      priceEst: pantry ? 0 : cost,
      usedBy: [...t.usedBy].sort(),
      pantry,
    });
  }

  const sections = AISLE_ORDER.map((aisle) => ({
    aisle,
    lines: lines
      .filter((l) => l.aisle === aisle)
      .sort((a, b) => Number(a.pantry) - Number(b.pantry) || a.name.localeCompare(b.name)),
  })).filter((s) => s.lines.length > 0);

  const total = roundCents(lines.reduce((sum, l) => sum + l.priceEst, 0));
  return { sections, custom: opts.custom ?? [], total, budget: opts.budget, status: budgetStatus(total, opts.budget) };
}

/** Plain-text export for "Share list". */
export function listAsText(list: GroceryList, formatMoney: (n: number) => string): string {
  const out: string[] = [format(groceryCopy.shareHeader, { total: formatMoney(list.total) }), ''];
  const owned: string[] = [];
  for (const s of list.sections) {
    const buy = s.lines.filter((l) => !l.pantry);
    owned.push(...s.lines.filter((l) => l.pantry).map((l) => l.name));
    if (buy.length === 0) continue;
    out.push(groceryCopy.aisles[s.aisle]);
    for (const l of buy) out.push(format(groceryCopy.shareLine, { name: l.name, packs: l.packLabel }));
    out.push('');
  }
  if (list.custom.length > 0) {
    out.push(groceryCopy.aisles.custom, ...list.custom.map((c) => `☐ ${c.name}`), '');
  }
  if (owned.length > 0) out.push(format(groceryCopy.sharePantry, { items: owned.join(', ') }));
  return out.join('\n').trim();
}
