import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { content, recipeMap } from '@/data/content';
import type { Recipe, TestDose } from '@/data/content/schema';
import { isValidDayKey } from '@/engines/dates';
import type { PlannedNight } from '@/engines/plan';
import { dayKind } from '@/engines/today';
import { useAppStore } from '@/features/appStore';

/** A recipe plus, when opened from a plan night, that night (test dose, eat-by time). */
export function useRecipeNight(): {
  recipe: Recipe | null;
  night: PlannedNight | null;
  testDose: (TestDose & { name: string; dose: number }) | null;
} {
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const plans = useAppStore((s) => s.plans);
  const program = useAppStore((s) => s.program);
  return useMemo(() => {
    const recipe = recipeMap.get(String(id)) ?? null;
    const dayKey = day && isValidDayKey(day) ? day : null;
    const night =
      dayKey === null
        ? null
        : (Object.values(plans)
            .flatMap((p) => p.nights)
            .find((n) => n.day === dayKey && n.recipeId === recipe?.id) ?? null);
    let testDose = null;
    if (night?.testGroup && program) {
      const kind = dayKind(program, night.day);
      const def = content.tests.tests.find((t) => t.id === night.testGroup);
      const doseNo = kind.type === 'dose' ? kind.dose : 1;
      const dose = def?.doses[doseNo - 1];
      if (def && dose) testDose = { ...dose, name: def.name, dose: doseNo };
    }
    return { recipe, night, testDose };
  }, [id, day, plans, program]);
}
