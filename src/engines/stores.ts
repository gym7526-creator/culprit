/**
 * Multi-store logic: what each store sells, category price levels, and picking the best store (or a
 * two-store split) for a shopping list, all from bundled data. Pure; no network.
 */
import type { Aisle, ChainsFile, Coverage, SellKey, StoreType } from '../data/content/schema.ts';
import { roundCents } from './price.ts';

type Chain = ChainsFile['chains'][number];

/**
 * What each store type sells. "limited" means some items, not reliably: a list can only be sent to a
 * store that fully covers every aisle on it (no lentils from Walgreens).
 */
export const TYPE_COVERAGE: Record<StoreType, Record<SellKey, Coverage>> = {
  supermarket: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'limited',
  },
  bigbox: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'full',
  },
  discount: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'limited',
  },
  warehouse: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'limited',
  },
  natural: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'limited',
  },
  international: {
    produce: 'full',
    bakery: 'full',
    meat_seafood: 'full',
    dairy: 'full',
    frozen: 'full',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'limited',
  },
  drugstore: {
    produce: 'none',
    bakery: 'limited',
    meat_seafood: 'none',
    dairy: 'limited',
    frozen: 'limited',
    pantry: 'limited',
    international: 'none',
    spices: 'none',
    beverages: 'full',
    skincare: 'full',
  },
  dollar: {
    produce: 'none',
    bakery: 'limited',
    meat_seafood: 'none',
    dairy: 'limited',
    frozen: 'limited',
    pantry: 'limited',
    international: 'none',
    spices: 'limited',
    beverages: 'full',
    skincare: 'full',
  },
  online: {
    produce: 'none',
    bakery: 'limited',
    meat_seafood: 'none',
    dairy: 'none',
    frozen: 'none',
    pantry: 'full',
    international: 'full',
    spices: 'full',
    beverages: 'full',
    skincare: 'full',
  },
};

/**
 * Category price adjustments by type, multiplied with the chain's overall index. Estimates: warehouse
 * clubs are cheapest on shelf-stable bulk, international markets on international staples and
 * spices, drugstores and dollar stores dearer per unit on food.
 */
export const TYPE_AISLE_INDEX: Record<StoreType, Partial<Record<Aisle, number>>> = {
  supermarket: {},
  bigbox: {},
  discount: {},
  // Fresh items only come in bulk packs at clubs: a small weekly amount effectively costs more.
  warehouse: {
    pantry: 0.92,
    spices: 0.85,
    frozen: 0.95,
    beverages: 0.92,
    produce: 1.3,
    meat_seafood: 1.2,
    dairy: 1.1,
    bakery: 1.1,
  },
  natural: { produce: 0.97 },
  international: { international: 0.8, spices: 0.8, produce: 0.92, pantry: 0.95 },
  drugstore: { pantry: 1.25, dairy: 1.25, frozen: 1.2, bakery: 1.2, beverages: 1.15 },
  dollar: { pantry: 1.1, dairy: 1.15, frozen: 1.1, bakery: 1.05, spices: 1.1 },
  online: { pantry: 1.05, spices: 0.95, international: 0.95 },
};

/** Store-brand skincare price level by type (drugstore = 1.00). */
export const TYPE_SKIN_INDEX: Record<StoreType, number> = {
  supermarket: 1.0,
  bigbox: 0.88,
  discount: 0.9,
  warehouse: 0.8,
  natural: 1.2,
  international: 1.0,
  drugstore: 1.05,
  dollar: 0.85,
  online: 0.9,
};

export function coverage(chain: Chain, key: SellKey): Coverage {
  return chain.sells?.[key] ?? TYPE_COVERAGE[chain.type][key];
}

export function sellsSkincare(chain: Chain): boolean {
  return coverage(chain, 'skincare') !== 'none';
}

export function skinIndex(chain: Chain): number {
  return chain.skinIndex ?? TYPE_SKIN_INDEX[chain.type];
}

/** Per-aisle multipliers for a chain (type defaults, then the chain's own overrides). */
export function aisleIndexFor(chain: Chain | undefined): Partial<Record<Aisle, number>> {
  if (!chain) return {};
  return { ...TYPE_AISLE_INDEX[chain.type], ...(chain.aisleIndex ?? {}) };
}

/** Aisles on the list that this store doesn't fully sell. */
export function missingAisles(chain: Chain, aisles: readonly Aisle[]): Aisle[] {
  return [...new Set(aisles)].filter((a) => coverage(chain, a) !== 'full');
}

export type StoreOption = {
  chainId: string;
  /** Whole list total at this store, or null when it can't cover the list. */
  total: number | null;
  missing: Aisle[];
};

/**
 * Ranks the user's stores for a list: stores that sell everything first, cheapest first; stores that
 * can't cover the list come last with what they're missing.
 */
export function rankStores(
  chains: readonly Chain[],
  storeIds: readonly string[],
  aisles: readonly Aisle[],
  totalAt: (chainId: string) => number,
): StoreOption[] {
  const options = storeIds
    .map((id) => chains.find((c) => c.id === id))
    .filter((c): c is Chain => c !== undefined)
    .map((c) => {
      const missing = missingAisles(c, aisles);
      return {
        chainId: c.id,
        missing,
        total: missing.length === 0 ? roundCents(totalAt(c.id)) : null,
      };
    });
  return options.sort((a, b) => {
    if (a.total === null && b.total === null) return 0;
    if (a.total === null) return 1;
    if (b.total === null) return -1;
    return a.total - b.total;
  });
}

/** The store to shop at: the cheapest one that sells everything, else null. */
export function bestStore(options: readonly StoreOption[]): string | null {
  return options.find((o) => o.total !== null)?.chainId ?? null;
}

export type SplitLine = { id: string; aisle: Aisle; priceAt: Readonly<Record<string, number>> };
export type SplitPlan = {
  /** Store per line id. */
  assign: Record<string, string>;
  stores: string[];
  total: number;
  subtotals: Record<string, number>;
  saves: number;
};

/** A split only shows up when it saves at least this much over the best single store. */
export const SPLIT_MIN_SAVING = 8;

/**
 * Best two-store split: each line goes to the cheaper of a pair of stores that fully sells its aisle.
 * Tries every pair of the user's stores (a handful, so this is tiny) and returns the best one if it
 * beats the single best store by SPLIT_MIN_SAVING.
 */
export function bestSplit(
  chains: readonly Chain[],
  storeIds: readonly string[],
  lines: readonly SplitLine[],
  singleBest: { chainId: string; total: number } | null,
): SplitPlan | null {
  const byId = new Map(chains.map((c) => [c.id, c]));
  const ids = storeIds.filter((id) => byId.has(id));
  let best: SplitPlan | null = null;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const pair = [ids[i]!, ids[j]!];
      const assign: Record<string, string> = {};
      const subtotals: Record<string, number> = { [pair[0]!]: 0, [pair[1]!]: 0 };
      let ok = true;
      for (const l of lines) {
        const choices = pair.filter(
          (id) => coverage(byId.get(id)!, l.aisle) === 'full' && l.priceAt[id] !== undefined,
        );
        if (choices.length === 0) {
          ok = false;
          break;
        }
        const pick = choices.reduce((a, b) => (l.priceAt[b]! < l.priceAt[a]! ? b : a));
        assign[l.id] = pick;
        subtotals[pick] = subtotals[pick]! + l.priceAt[pick]!;
      }
      if (!ok) continue;
      // A "split" that sends everything to one store isn't a split.
      if (Object.values(subtotals).some((t) => t === 0)) continue;
      const total = roundCents(Object.values(subtotals).reduce((a, b) => a + b, 0));
      if (!best || total < best.total) {
        best = {
          assign,
          stores: pair,
          total,
          subtotals: Object.fromEntries(
            Object.entries(subtotals).map(([k, v]) => [k, roundCents(v)]),
          ),
          saves: 0,
        };
      }
    }
  }
  if (!best) return null;
  const base = singleBest?.total ?? Infinity;
  best.saves = roundCents(base - best.total);
  return best.saves >= SPLIT_MIN_SAVING ? best : null;
}
