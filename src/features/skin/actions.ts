import { content } from '@/data/content';
import type { DayKey } from '@/engines/dates';
import { ageFrom } from '@/engines/onboarding';
import { priceContext } from '@/engines/price';
import { buildRoutine, createSkinProgram, type Routine, type SkinScore } from '@/engines/skin';
import { clockNow } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';

import { useSkinStore } from './skinStore';

/** Region × store index for the user's ZIP and chain (same pricing as groceries). */
export function skinPriceIndex(): number {
  const { zip, chainId } = useOnboardingStore.getState().answers;
  const ctx = priceContext(zip ?? '', chainId ?? 'other', content.regions, content.chains);
  return ctx.regionMultiplier * ctx.chainIndex;
}

export function currentRoutine(): Routine {
  const s = useSkinStore.getState();
  return buildRoutine(content.skincare, s.answers, skinPriceIndex(), s.program?.treatmentId);
}

/** Creates the skin program from the setup answers (the first change starts after a 2-week baseline). */
export function buildSkinProgram(): void {
  const { today, year } = clockNow();
  const birthYear = useOnboardingStore.getState().answers.birthYear;
  const age = birthYear ? ageFrom(birthYear, year) : 0;
  const s = useSkinStore.getState();
  s.setProgram(createSkinProgram(content.skincare, s.answers, today, age));
}

export function submitSkinCheckin(day: DayKey, score: SkinScore): void {
  useSkinStore.getState().saveCheckin({ day, score });
}
