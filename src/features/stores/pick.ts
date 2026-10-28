import { content } from '@/data/content';
import type { Aisle } from '@/data/content/schema';
import type { Answers } from '@/engines/onboarding';
import { planGroceries, type PlanInput, type WeekPlan } from '@/engines/plan';
import { priceContext } from '@/engines/price';
import { bestStore, coverage, rankStores, type StoreOption } from '@/engines/stores';
import { generatePlan } from '@/engines/plan';

const chains = content.chains.chains;

/** A first guess before any list exists: the first picked store that sells fresh groceries. */
export function provisionalStore(stores: readonly string[]): string | null {
  const full = stores.find((id) => {
    const c = chains.find((x) => x.id === id);
    return c ? coverage(c, 'produce') === 'full' && coverage(c, 'meat_seafood') === 'full' : false;
  });
  return full ?? stores[0] ?? null;
}

export function inputAt(input: PlanInput, a: Pick<Answers, 'zip'>, chainId: string): PlanInput {
  return { ...input, prices: priceContext(a.zip ?? '', chainId, content.regions, content.chains) };
}

/** Every one of the user's stores ranked for this week's list (blocked ones say what they lack). */
export function storeOptions(
  input: PlanInput,
  plan: WeekPlan,
  a: Pick<Answers, 'zip'>,
  storeIds: readonly string[],
): StoreOption[] {
  const list = planGroceries(input, plan);
  const aisles = list.sections
    .filter((s) => s.lines.some((l) => !l.pantry))
    .map((s) => s.aisle as Aisle);
  return rankStores(
    chains,
    storeIds,
    aisles,
    (id) => planGroceries(inputAt(input, a, id), plan).total,
  );
}

/**
 * With several stores and auto-pick on, prices the week at each store that sells everything on it and
 * re-plans at the cheapest (the menu itself is chosen for that store's prices).
 */
export function withBestStore(
  a: Pick<Answers, 'zip' | 'stores' | 'storeAuto' | 'chainId'>,
  input: PlanInput,
  plan: WeekPlan,
): { plan: WeekPlan; input: PlanInput; chainId: string | null } {
  if (!a.storeAuto || a.stores.length < 2) return { plan, input, chainId: a.chainId };
  const best = bestStore(storeOptions(input, plan, a, a.stores));
  if (!best || best === input.prices.chainId) return { plan, input, chainId: input.prices.chainId };
  const next = inputAt(input, a, best);
  return { plan: generatePlan(next), input: next, chainId: best };
}
