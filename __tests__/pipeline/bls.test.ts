import {
  applyBls,
  regionalSeries,
  regionMultipliers,
  STORE_BRAND_FACTOR,
} from '../../data-pipeline/lib/bls';

import { ing } from './fixtures';

const eggs = ing('eggs', {
  packs: [{ size: 12, unit: 'each', basePriceUSD: 3, storeBrand: true }],
});
const milk = ing('milk', {
  packs: [{ size: 3785, unit: 'ml', basePriceUSD: 4, storeBrand: false }],
});
const kale = ing('kale');
const prices = {
  updatedAt: '2026-01-01',
  basis: 'test',
  entries: [
    {
      ingredientId: 'eggs',
      method: 'estimate' as const,
      blsSeries: 'APU0000708111',
      blsUnit: 'dozen' as const,
      note: 'pending',
    },
    {
      ingredientId: 'milk',
      method: 'estimate' as const,
      blsSeries: 'APU0000709112',
      blsUnit: 'gal' as const,
    },
    { ingredientId: 'kale', method: 'estimate' as const },
  ],
};

describe('BLS refresh', () => {
  it('builds regional series ids', () => {
    expect(regionalSeries('APU0000708111', 'south')).toBe('APU0300708111');
    expect(regionalSeries('APU0000FF1101', 'west')).toBe('APU0400FF1101');
  });

  it('converts BLS unit prices to pack prices with the store-brand factor', () => {
    const snap = {
      fetchedAt: '2026-10-01T00:00:00Z',
      observations: {
        APU0000708111: { value: 4, period: '2026-09' },
        APU0000709112: { value: 3.785, period: '2026-09' },
      },
    };
    const out = applyBls([eggs, milk, kale], prices, snap);
    expect(out.ingredients[0]?.packs[0]?.basePriceUSD).toBe(
      Math.round(4 * STORE_BRAND_FACTOR * 100) / 100,
    );
    expect(out.ingredients[1]?.packs[0]?.basePriceUSD).toBeCloseTo(3.78, 2); // name brand: no factor
    expect(out.ingredients[2]).toBe(kale);
    expect(out.prices.entries[0]).toMatchObject({ method: 'bls', blsPeriod: '2026-09' });
    expect(out.prices.entries[0]).not.toHaveProperty('note');
    expect(out.prices.entries[2]?.method).toBe('estimate');
    expect(out.prices.updatedAt).toBe('2026-10-01');
  });

  it('keeps estimates when a series has no data', () => {
    const out = applyBls([eggs], prices, { fetchedAt: '2026-10-01', observations: {} });
    expect(out.ingredients[0]?.packs[0]?.basePriceUSD).toBe(3);
    expect(out.prices.entries[0]?.method).toBe('estimate');
  });

  it('averages regional ratios and needs at least 3 series', () => {
    const ids = ['APU0000A', 'APU0000B', 'APU0000C'];
    const obs: Record<string, { value: number; period: string }> = {};
    for (const s of ids) {
      obs[s] = { value: 2, period: 'p' };
      obs[regionalSeries(s, 'west')] = { value: 2.2, period: 'p' };
      obs[regionalSeries(s, 'south')] = { value: 1.8, period: 'p' };
    }
    obs[regionalSeries('APU0000A', 'midwest')] = { value: 1, period: 'p' };
    const fallback = { northeast: 1.08, midwest: 0.94, south: 0.96, west: 1.06 };
    const m = regionMultipliers(ids, { fetchedAt: '', observations: obs }, fallback);
    expect(m.west).toBe(1.1);
    expect(m.south).toBe(0.9);
    expect(m.midwest).toBe(0.94); // only one series → fallback kept
    expect(m.northeast).toBe(1.08);
  });
});
