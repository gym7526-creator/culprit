import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { content, recipeMap } from '@/data/content';
import { loadPlan, loadProgram } from '@/data/repositories';
import { planGroceries, recipeCostEstimate, type WeekPlan } from '@/engines/plan';
import { setAsideGroups, detectProfile } from '@/engines/onboarding';
import type { ProgramState } from '@/engines/program';
import type { TestGroup } from '@/engines/types';
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

/** Loads the saved first week (resume-safe) and derives what O21 shows. */
export function usePlanPreview(): { preview: PlanPreview | null; error: boolean } {
  const db = useSQLiteContext();
  const answers = useOnboardingStore((s) => s.answers);
  const seed = usePrefsStore((s) => s.installId);
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const program = await loadProgram(db);
        const weekStart = program?.calmStartedOn ?? null;
        const plan = weekStart ? await loadPlan(db, weekStart) : null;
        if (!program || !plan) throw new Error('No saved plan');
        const input = planInputFor(answers, program, plan.weekStart, seed);
        const list = planGroceries(input, plan);
        const lines = list.sections.flatMap((s) => s.lines).filter((l) => !l.pantry);
        const dinnerCost: Record<string, number> = {};
        for (const n of plan.nights) {
          const r = n.recipeId ? recipeMap.get(n.recipeId) : undefined;
          if (r) dinnerCost[r.id] = recipeCostEstimate(r, input);
        }
        if (!alive) return;
        setPreview({
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
        });
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, answers, seed]);

  return { preview, error };
}
