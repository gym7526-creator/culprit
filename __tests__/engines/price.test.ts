import chainsJson from '../../assets/data/chains.json';
import regionsJson from '../../assets/data/regions.json';
import { ChainsFile, RegionsFile, type Pack } from '@/data/content/schema';
import {
  chainsForZip,
  overrideKey,
  packPrice,
  priceContext,
  roundCents,
  zipToRegion,
  zipToState,
} from '@/engines/price';

const regions = RegionsFile.parse(regionsJson);
const chains = ChainsFile.parse(chainsJson);
const pack: Pack = { size: 12, unit: 'each', basePriceUSD: 3.49, storeBrand: true };

describe('rounding', () => {
  it('rounds half up to cents without float drift', () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(2.675)).toBe(2.68);
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
    expect(roundCents(3.141)).toBe(3.14);
  });
});

describe('packPrice', () => {
  it('applies the region multiplier and chain index', () => {
    const ctx = { chainId: 'walmart', regionMultiplier: 1.08, chainIndex: 0.9, overrides: {} };
    expect(packPrice(pack, 'eggs', 0, ctx)).toBe(roundCents(3.49 * 1.08 * 0.9));
  });

  it('applies a user override last, per store', () => {
    const ctx = { chainId: 'aldi', regionMultiplier: 1.08, chainIndex: 0.85, overrides: { [overrideKey('aldi', 'eggs', 0)]: 2.5 } };
    expect(packPrice(pack, 'eggs', 0, ctx)).toBe(2.5);
    expect(packPrice(pack, 'eggs', 0, { ...ctx, chainId: 'walmart' })).toBe(roundCents(3.49 * 1.08 * 0.85));
  });
});

describe('ZIP lookup', () => {
  it.each([
    ['30301', 'GA', 'south'],
    ['10001', 'NY', 'northeast'],
    ['60614', 'IL', 'midwest'],
    ['94103', 'CA', 'west'],
    ['73301', 'TX', 'south'],
    ['02139', 'MA', 'northeast'],
  ])('%s → %s (%s)', (zip, state, region) => {
    expect(zipToState(zip, regions)).toBe(state);
    expect(zipToRegion(zip, regions)).toBe(region);
  });

  it('rejects malformed and unknown ZIPs', () => {
    expect(zipToState('3030', regions)).toBeNull();
    expect(zipToState('abcde', regions)).toBeNull();
    expect(zipToState('00001', regions)).toBeNull();
  });

  it('prices unknown ZIPs at the national average', () => {
    expect(priceContext('00001', 'kroger', regions, chains).regionMultiplier).toBe(1);
    expect(priceContext('94103', 'whole_foods', regions, chains)).toMatchObject({ regionMultiplier: 1.06, chainIndex: 1.3 });
    expect(priceContext('94103', 'nope', regions, chains).chainIndex).toBe(1);
  });
});

describe('chain ordering', () => {
  it('puts state chains first and Other last', () => {
    const tx = chainsForZip('73301', regions, chains).map((c) => c.id);
    expect(tx[0]).toBe('heb');
    expect(tx[tx.length - 1]).toBe('other');
    const fl = chainsForZip('33101', regions, chains).map((c) => c.id);
    expect(fl[0]).toBe('publix');
  });
});
