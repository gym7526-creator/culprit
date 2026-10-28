import { useMemo } from 'react';

import { content } from '@/data/content';
import type { WeekPlan } from '@/engines/plan';
import { planGroceries } from '@/engines/plan';
import { storeGroups } from '@/engines/price';
import { bestSplit, type SplitPlan, type StoreOption } from '@/engines/stores';
import { useAppStore } from '@/features/appStore';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePlanInput } from '@/features/plan/hooks';

import { inputAt, storeOptions } from './pick';

export type StoreChoice = {
  current: string | null;
  auto: boolean;
  /** The user's stores, then a few more near them, ranked for this list. */
  mine: StoreOption[];
  near: StoreOption[];
  split: SplitPlan | null;
  splitOn: boolean;
};

const NEAR_EXTRA = 6;

/** Store options and the two-store split offer for this week's list. */
export function useStoreChoice(plan: WeekPlan | null): StoreChoice | null {
  const input = usePlanInput(plan);
  const answers = useOnboardingStore((s) => s.answers);
  const splitOn = useAppStore((s) => (plan ? (s.splitWeeks[plan.weekStart] ?? false) : false));

  return useMemo(() => {
    if (!plan || !input) return null;
    const mine = storeOptions(input, plan, answers, answers.stores);
    const g = storeGroups(answers.zip ?? '', content.regions, content.chains);
    const extra = [...g.near, ...g.nationwide]
      .map((c) => c.id)
      .filter((id) => !answers.stores.includes(id))
      .slice(0, NEAR_EXTRA);
    const near = storeOptions(input, plan, answers, extra);

    // Split offer: per-line prices at each of the user's stores that can sell those lines.
    let split: SplitPlan | null = null;
    if (answers.stores.length >= 2) {
      const priceAt = new Map<string, Record<string, number>>();
      const aisleOf = new Map<string, string>();
      for (const id of answers.stores) {
        for (const sec of planGroceries(inputAt(input, answers, id), plan).sections) {
          for (const l of sec.lines) {
            if (l.pantry) continue;
            aisleOf.set(l.ingredientId, sec.aisle);
            priceAt.set(l.ingredientId, {
              ...(priceAt.get(l.ingredientId) ?? {}),
              [id]: l.priceEst,
            });
          }
        }
      }
      const best = mine.find((o) => o.total !== null);
      split = bestSplit(
        content.chains.chains,
        answers.stores,
        [...priceAt.entries()].map(([id, p]) => ({
          id,
          aisle: aisleOf.get(id) as never,
          priceAt: p,
        })),
        best && best.total !== null ? { chainId: best.chainId, total: best.total } : null,
      );
    }
    return {
      current: answers.chainId,
      auto: answers.storeAuto,
      mine,
      near,
      split,
      splitOn: splitOn && split !== null,
    };
  }, [plan, input, answers, splitOn]);
}
