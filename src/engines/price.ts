/**
 * Price engine (spec §6.6): price(pack) = basePriceUSD × regionMultiplier × chainIndex, rounded to
 * cents, with the user's overrides applied last. Every price shown is labelled "est." in the UI.
 */
import type { Aisle, ChainsFile, Pack, Region, RegionsFile } from '../data/content/schema.ts';
import { aisleIndexFor } from './stores.ts';

export type PriceOverrides = Readonly<Record<string, number>>;

export type PriceContext = {
  chainId: string;
  regionMultiplier: number;
  chainIndex: number;
  /** Category price adjustments for this store type (multiplied with chainIndex). */
  aisleIndex?: Partial<Record<Aisle, number>>;
  /** Keyed by overrideKey(chainId, ingredientId, packIndex). */
  overrides: PriceOverrides;
};

/** Rounds to cents without binary-float drift (1.005 → 1.01). */
export function roundCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function overrideKey(chainId: string, ingredientId: string, packIndex: number): string {
  return `${chainId}:${ingredientId}:${packIndex}`;
}

export function packPrice(
  pack: Pack,
  ingredientId: string,
  packIndex: number,
  ctx: PriceContext,
  aisle?: Aisle,
): number {
  const override = ctx.overrides[overrideKey(ctx.chainId, ingredientId, packIndex)];
  if (override !== undefined) return roundCents(override);
  const category = aisle ? (ctx.aisleIndex?.[aisle] ?? 1) : 1;
  return roundCents(pack.basePriceUSD * ctx.regionMultiplier * ctx.chainIndex * category);
}

/** "30301" → "GA" using the bundled ZIP3 table; null for unknown or invalid ZIPs. */
export function zipToState(zip: string, regions: RegionsFile): string | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const z3 = Number(zip.slice(0, 3));
  const hit = regions.zip3.find(([lo, hi]) => z3 >= lo && z3 <= hi);
  return hit ? hit[2] : null;
}

export function zipToRegion(zip: string, regions: RegionsFile): Region | null {
  const state = zipToState(zip, regions);
  return state ? (regions.stateToRegion[state] ?? null) : null;
}

/** Builds a price context from the user's ZIP and chain; unknown ZIPs price at the national average. */
export function priceContext(
  zip: string,
  chainId: string,
  regions: RegionsFile,
  chains: ChainsFile,
  overrides: PriceOverrides = {},
): PriceContext {
  const region = zipToRegion(zip, regions);
  const chain = chains.chains.find((c) => c.id === chainId);
  return {
    chainId,
    regionMultiplier: region ? regions.multipliers[region] : 1,
    chainIndex: chain?.index ?? 1,
    aisleIndex: aisleIndexFor(chain),
    overrides,
  };
}

export type Chain = ChainsFile['chains'][number];
export type StoreGroups = {
  state: string | null;
  near: Chain[];
  nationwide: Chain[];
  more: Chain[];
  other: Chain | null;
};

/**
 * Store picker groups (O13): chains with stores in the user's state, then nationwide chains, then
 * every other chain (still pickable: people travel, shop online or live near a state line).
 */
export function storeGroups(zip: string, regions: RegionsFile, chains: ChainsFile): StoreGroups {
  const state = zipToState(zip, regions);
  const all = chains.chains.filter((c) => c.id !== 'other');
  const isNationwide = (c: Chain) => c.regions.includes('all') && !c.states;
  const near = state
    ? all
        .filter((c) => !isNationwide(c) && c.states?.includes(state))
        // Leading grocers first, then local chains before multi-region ones.
        .sort(
          (a, b) =>
            Number(b.leaderIn?.includes(state) ?? false) -
              Number(a.leaderIn?.includes(state) ?? false) ||
            (a.states?.length ?? 0) - (b.states?.length ?? 0),
        )
    : [];
  const nationwide = all.filter(isNationwide);
  const more = all
    .filter((c) => !near.includes(c) && !nationwide.includes(c))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    state,
    near,
    nationwide,
    more,
    other: chains.chains.find((c) => c.id === 'other') ?? null,
  };
}

/** Flat list in picker order (near you → nationwide → everything else → other). */
export function chainsForZip(zip: string, regions: RegionsFile, chains: ChainsFile): Chain[] {
  const g = storeGroups(zip, regions, chains);
  return [...g.near, ...g.nationwide, ...g.more, ...(g.other ? [g.other] : [])];
}
