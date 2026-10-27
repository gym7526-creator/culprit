/**
 * Applies BLS Average Price Data to the ingredient master (spec §5.5). Pure; the network fetch lives
 * in scripts/fetch-bls.ts and writes data-pipeline/source/bls-prices.json, which the build applies.
 */
import type { Ingredient, PricesFile, Region, RegionsFile } from '../../src/data/content/schema.ts';

export type BlsUnit = 'lb' | 'dozen' | 'gal' | 'each';

/** One fetched observation per series id. */
export type BlsSnapshot = {
  fetchedAt: string;
  observations: Record<string, { value: number; period: string }>;
};

/** BLS averages are mostly name-brand-weighted; store brands typically sit a bit lower. */
export const STORE_BRAND_FACTOR = 0.9;

const PER_UNIT: Record<BlsUnit, { unit: 'g' | 'ml' | 'each'; amount: number }> = {
  lb: { unit: 'g', amount: 453.592 },
  gal: { unit: 'ml', amount: 3785.41 },
  dozen: { unit: 'each', amount: 12 },
  each: { unit: 'each', amount: 1 },
};

/** BLS area codes for the US city average and the four Census regions. */
export const AREA: Record<'us' | Region, string> = {
  us: '0000',
  northeast: '0100',
  midwest: '0200',
  south: '0300',
  west: '0400',
};

/** "APU0000708111" → "APU0300708111" for the South. */
export function regionalSeries(series: string, region: Region): string {
  return `APU${AREA[region]}${series.slice(7)}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Returns ingredients with BLS-based pack prices and the matching price entries. */
export function applyBls(
  ingredients: readonly Ingredient[],
  prices: PricesFile,
  snapshot: BlsSnapshot,
): { ingredients: Ingredient[]; prices: PricesFile } {
  const byId = new Map(prices.entries.map((e) => [e.ingredientId, e]));
  const out = ingredients.map((ing) => {
    const entry = byId.get(ing.id);
    if (!entry?.blsSeries || !entry.blsUnit) return ing;
    const obs = snapshot.observations[entry.blsSeries];
    if (!obs) return ing;
    const conv = PER_UNIT[entry.blsUnit];
    const packs = ing.packs.map((p) => {
      if (p.unit !== conv.unit) return p;
      const price = round2(
        (obs.value / conv.amount) * p.size * (p.storeBrand ? STORE_BRAND_FACTOR : 1),
      );
      return price > 0 ? { ...p, basePriceUSD: price } : p;
    });
    if (packs.some((p, i) => p !== ing.packs[i])) {
      byId.set(ing.id, { ...entry, method: 'bls', blsPeriod: obs.period, note: undefined });
    }
    return { ...ing, packs };
  });
  return {
    ingredients: out,
    prices: {
      ...prices,
      updatedAt: snapshot.fetchedAt.slice(0, 10),
      entries: prices.entries.map((e) => {
        const next = byId.get(e.ingredientId) ?? e;
        const { note, ...rest } = next;
        return note === undefined ? rest : next;
      }),
    },
  };
}

/** Region multiplier = mean of (regional price / national price) across series with both. */
export function regionMultipliers(
  seriesIds: readonly string[],
  snapshot: BlsSnapshot,
  fallback: RegionsFile['multipliers'],
): RegionsFile['multipliers'] {
  const result = { ...fallback };
  for (const region of ['northeast', 'midwest', 'south', 'west'] as const) {
    const ratios: number[] = [];
    for (const s of seriesIds) {
      const us = snapshot.observations[s]?.value;
      const rg = snapshot.observations[regionalSeries(s, region)]?.value;
      if (us && rg) ratios.push(rg / us);
    }
    if (ratios.length >= 3) {
      result[region] = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100;
    }
  }
  return result;
}
