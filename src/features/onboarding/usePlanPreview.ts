import { useMemo } from 'react';

import { content, recipeMap } from '@/data/content';
import { detectProfile, setAsideGroups } from '@/engines/onboarding';
import { planGroceries, recipeCostEstimate, type WeekPlan } from '@/engines/plan';
import type { ProgramState } from '@/engines/program';
import type { TestGroup } from '@/engines/types';
import { useAppStore } from '@/features/appStore';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';

import { planInputFor } from './buildFirstWeek';

export type PlanPreview = {
  plan: WeekPlan;
  program: ProgramState;
  chainName: string;
  setAside: TestGroup[];
  firstSuspects: TestGroup[];
  listItemCount: number;
  listPreview: string[];
  dinnerCost: Record<string, number>;
};

/** The saved first week (resume-safe) and what O21 shows about it. */
export function usePlanPreview(): { preview: PlanPreview | null; error: boolean } {
  const answers = useOnboardingStore((s) => s.answers);
  const seed = usePrefsStore((s) => s.installId);
  const program = useAppStore((s) => s.program);
  const plans = useAppStore((s) => s.plans);

  return useMemo(() => {
    const weekStart = program?.calmStartedOn ?? null;
    const plan = weekStart ? plans[weekStart] : Object.values(plans)[0];
    if (!program || !plan) return { preview: null, error: true };
    try {
      const input = planInputFor(answers, program, plan.weekStart, seed);
      const lines = planGroceries(input, plan)
        .sections.flatMap((s) => s.lines)
        .filter((l) => !l.pantry);
      const dinnerCost: Record<string, number> = {};
      for (const n of plan.nights) {
        const r = n.recipeId ? recipeMap.get(n.recipeId) : undefined;
        if (r) dinnerCost[r.id] = recipeCostEstimate(r, input);
      }
      return {
        error: false,
        preview: {
          plan,
          program,
          chainName: content.chains.chains.find((c) => c.id === answers.chainId)?.name ?? '',
          setAside: program.gentle ? [] : setAsideGroups(detectProfile(answers.symptoms)),
          firstSuspects: program.queue
            .filter((q) => q.kind === 'real')
            .slice(0, 3)
            .map((q) => q.group),
          listItemCount: lines.length,
          listPreview: lines.slice(0, 6).map((l) => `${l.name} · ${l.packLabel}`),
          dinnerCost,
        },
      };
    } catch {
      return { preview: null, error: true };
    }
  }, [answers, seed, program, plans]);
}
