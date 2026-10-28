/**
 * Price engine (spec §6.6): price(pack) = basePriceUSD × regionMultiplier × chainIndex, rounded to
 * cents, with the user's overrides applied last. Every price shown is labelled "est." in the UI.
 */
import type { ChainsFile, Pack, Region, RegionsFile } from '../data/content/schema.ts';

export type PriceOverrides = Readonly<Record<string, number>>;

export type PriceContext = {
  chainId: string;
  regionMultiplier: number;
  chainIndex: number;
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
): number {
  const override = ctx.overrides[overrideKey(ctx.chainId, ingredientId, packIndex)];
  if (override !== undefined) return roundCents(override);
  return roundCents(pack.basePriceUSD * ctx.regionMultiplier * ctx.chainIndex);
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
    overrides,
  };
}

/** Chains for the O13 list: ones common in the user's state/region first, then nationwide, then the rest. */
export function chainsForZip(
  zip: string,
  regions: RegionsFile,
  chains: ChainsFile,
): ChainsFile['chains'] {
  const state = zipToState(zip, regions);
  const region = state ? regions.stateToRegion[state] : undefined;
  const rank = (c: ChainsFile['chains'][number]): number => {
    if (c.id === 'other') return 4;
    if (state && c.states?.includes(state)) return 0;
    if (region && c.regions.includes(region) && !c.states) return 1;
    if (c.regions.includes('all')) return 2;
    return 3;
  };
  return [...chains.chains].sort((a, b) => rank(a) - rank(b));
}
