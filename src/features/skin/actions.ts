import { content } from '@/data/content';
import type { DayKey } from '@/engines/dates';
import { ageFrom } from '@/engines/onboarding';
import { priceContext, storeGroups } from '@/engines/price';
import { coverage, sellsSkincare, skinIndex } from '@/engines/stores';
import { buildRoutine, createSkinProgram, type Routine, type SkinScore } from '@/engines/skin';
import { clockNow } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';

import { useSkinStore } from './skinStore';

/** Region multiplier (from the ZIP) × the skincare retailer's store-brand index. */
export function skinPriceIndex(): number {
  const { zip } = useOnboardingStore.getState().answers;
  const region = priceContext(zip ?? '', 'other', content.regions, content.chains).regionMultiplier;
  const chain = content.chains.chains.find((c) => c.id === skinStoreId());
  return region * (chain ? skinIndex(chain) : 1);
}

/** The skincare store: the user's pick, else the cheapest of their stores that sells skincare. */
export function skinStoreId(): string | null {
  const picked = useSkinStore.getState().answers.retailerId;
  if (picked) return picked;
  const mine = useOnboardingStore
    .getState()
    .answers.stores.map((id) => content.chains.chains.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined && sellsSkincare(c))
    .sort((a, b) => skinIndex(a) - skinIndex(b));
  return mine[0]?.id ?? null;
}

export function retailerName(): string {
  return content.chains.chains.find((c) => c.id === skinStoreId())?.name ?? '';
}

/** Stores that sell skincare: the user's own stores first, then near them, then nationwide. */
export function skincareStores(): { id: string; name: string; note: string; mine: boolean }[] {
  const { zip, stores } = useOnboardingStore.getState().answers;
  const g = storeGroups(zip ?? '', content.regions, content.chains);
  const all = [...g.near, ...g.nationwide, ...g.more].filter(sellsSkincare);
  // Your stores first, then places with a full skincare aisle (drugstores, big-box, online), then the rest.
  const full = (c: (typeof all)[number]) => coverage(c, 'skincare') === 'full';
  const mineFirst = [
    ...all.filter((c) => stores.includes(c.id)),
    ...all.filter((c) => !stores.includes(c.id) && full(c)),
    ...all.filter((c) => !stores.includes(c.id) && !full(c)),
  ];
  return mineFirst.slice(0, 14).map((c) => ({
    id: c.id,
    name: c.name,
    note: [
      c.storeBrand ? `Store brand: ${c.storeBrand}` : null,
      c.type === 'online' ? 'Online, ships to you' : null,
    ]
      .filter(Boolean)
      .join(' · '),
    mine: stores.includes(c.id),
  }));
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
