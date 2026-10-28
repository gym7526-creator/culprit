import { content } from '@/data/content';
import {
  bestSplit,
  bestStore,
  coverage,
  missingAisles,
  rankStores,
  sellsSkincare,
  skinIndex,
} from '@/engines/stores';
import { priceContext, packPrice } from '@/engines/price';

const chains = content.chains.chains;
const chain = (id: string) => chains.find((c) => c.id === id)!;

describe('what stores sell', () => {
  it('knows drugstores have no fresh produce or meat and only some pantry items', () => {
    const w = chain('walgreens');
    expect(coverage(w, 'produce')).toBe('none');
    expect(coverage(w, 'meat_seafood')).toBe('none');
    expect(coverage(w, 'pantry')).toBe('limited');
    expect(coverage(w, 'skincare')).toBe('full');
    expect(missingAisles(w, ['pantry'])).toEqual(['pantry']); // no lentils from Walgreens
  });

  it('lets a supermarket cover a full list and per-chain overrides win', () => {
    expect(missingAisles(chain('wegmans'), ['produce', 'pantry', 'dairy', 'spices'])).toEqual([]);
    expect(coverage(chain('dollar_general'), 'produce')).toBe('limited');
    expect(coverage(chain('trader_joes'), 'skincare')).toBe('limited');
  });

  it('every store has a type, and skincare price levels make sense', () => {
    for (const c of chains) expect(c.type).toBeDefined();
    expect(sellsSkincare(chain('cvs'))).toBe(true);
    expect(skinIndex(chain('walmart'))).toBeLessThan(skinIndex(chain('cvs')));
  });
});

describe('category prices', () => {
  it('prices pantry staples lower at a warehouse club and food higher at a drugstore', () => {
    const pack = { size: 454, unit: 'g' as const, basePriceUSD: 2, storeBrand: true };
    const at = (id: string, aisle: 'pantry' | 'produce') =>
      packPrice(pack, 'x', 0, priceContext('60614', id, content.regions, content.chains), aisle);
    expect(at('costco', 'pantry')).toBeLessThan(at('costco', 'produce'));
    expect(at('walgreens', 'pantry')).toBeGreaterThan(at('jewel_osco', 'pantry'));
  });
});

describe('picking stores', () => {
  const totals: Record<string, number> = { jewel_osco: 80, aldi: 62, walgreens: 40, costco: 70 };

  it('blocks stores that cannot sell the whole list and picks the cheapest of the rest', () => {
    const ranked = rankStores(
      chains,
      ['jewel_osco', 'walgreens', 'aldi'],
      ['produce', 'pantry'],
      (id) => totals[id]!,
    );
    expect(ranked.map((r) => r.chainId)).toEqual(['aldi', 'jewel_osco', 'walgreens']);
    expect(ranked[2]!.total).toBeNull();
    expect(ranked[2]!.missing).toEqual(['produce', 'pantry']);
    expect(bestStore(ranked)).toBe('aldi');
  });

  it('offers a two-store split only when it saves enough', () => {
    const lines = [
      { id: 'rice', aisle: 'pantry' as const, priceAt: { jewel_osco: 10, costco: 4 } },
      { id: 'beans', aisle: 'pantry' as const, priceAt: { jewel_osco: 9, costco: 3 } },
      { id: 'basil', aisle: 'produce' as const, priceAt: { jewel_osco: 2, costco: 6 } },
    ];
    const split = bestSplit(chains, ['jewel_osco', 'costco'], lines, {
      chainId: 'jewel_osco',
      total: 21,
    });
    expect(split?.assign).toEqual({ rice: 'costco', beans: 'costco', basil: 'jewel_osco' });
    expect(split?.saves).toBe(12);
    const small = bestSplit(chains, ['jewel_osco', 'costco'], lines, {
      chainId: 'jewel_osco',
      total: 13,
    });
    expect(small).toBeNull();
  });

  it('never splits to a store that cannot sell a line', () => {
    const lines = [
      { id: 'chicken', aisle: 'meat_seafood' as const, priceAt: { walgreens: 1, jewel_osco: 9 } },
    ];
    expect(
      bestSplit(chains, ['jewel_osco', 'walgreens'], lines, { chainId: 'jewel_osco', total: 30 }),
    ).toBeNull();
  });
});
