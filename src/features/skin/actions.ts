import { content } from '@/data/content';
import type { DayKey } from '@/engines/dates';
import { ageFrom } from '@/engines/onboarding';
import { priceContext } from '@/engines/price';
import { buildRoutine, createSkinProgram, type Routine, type SkinScore } from '@/engines/skin';
import { clockNow } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';

import { useSkinStore } from './skinStore';

/** Region multiplier (from the ZIP) × the skincare retailer's store-brand index. */
export function skinPriceIndex(): number {
  const { zip } = useOnboardingStore.getState().answers;
  const region = priceContext(zip ?? '', 'other', content.regions, content.chains).regionMultiplier;
  const retailerId = useSkinStore.getState().answers.retailerId;
  const retailer = content.skincare.retailers.find((r) => r.id === retailerId);
  return region * (retailer?.index ?? 1);
}

export function retailerName(): string {
  const id = useSkinStore.getState().answers.retailerId;
  return content.skincare.retailers.find((r) => r.id === id)?.name ?? '';
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
