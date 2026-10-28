/**
 * What the Today tab shows (spec §10.1). Pure helpers over program + content.
 */
import type { EduCard, StapleItem, TestGroup } from '../data/content/schema.ts';
import { addDays, diffDays, type DayKey } from './dates.ts';
import type { Diet } from './plan.ts';
import { projectSchedule, type ProgramState, type ProjectedDay } from './program.ts';
import { seededRandom } from './rng.ts';

/** Today's place in the program, as projected (dose / rest / calm / personal / paused). */
export function dayKind(program: ProgramState, day: DayKey): ProjectedDay {
  return projectSchedule(program, day, 1)[day] ?? { type: 'personal' };
}

/** The next day a new (real) test begins, after `day`, within `horizon` days. */
export function nextTestStart(
  program: ProgramState,
  day: DayKey,
  horizon = 42,
): { group: TestGroup; day: DayKey } | null {
  const proj = projectSchedule(program, addDays(day, 1), horizon);
  for (const [d, p] of Object.entries(proj)) {
    if (p.type === 'dose' && p.dose === 1 && p.kind !== 'control')
      return { group: p.group, day: d };
  }
  return null;
}

function seeded<T>(items: readonly T[], seed: string, n: number): T[] {
  const rnd = seededRandom(seed);
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]!);
  }
  return out;
}

export type StapleFilter = {
  phase: 'calm' | 'testing' | 'personal';
  profile: ProgramState['profile'];
  gentle: boolean;
  diet: Diet;
  allergens: readonly string[];
};

/** Breakfast and lunch ideas that fit the phase, profile, diet and allergies (2 each, stable per day). */
export function pickStaples(
  items: readonly StapleItem[],
  f: StapleFilter,
  day: DayKey,
  perKind = 2,
): { breakfast: StapleItem[]; lunch: StapleItem[] } {
  const fits = (s: StapleItem) =>
    s.phases.includes(f.phase) &&
    (f.diet === 'none' || s.diets.includes(f.diet)) &&
    !s.allergens.some((a) => f.allergens.includes(a)) &&
    (f.gentle ||
      f.phase === 'personal' ||
      ((f.profile === 'reflux' || s.calmSafeGut) && (f.profile === 'fodmap' || s.calmSafeReflux)));
  return {
    breakfast: seeded(
      items.filter((s) => s.kind === 'breakfast' && fits(s)),
      `${day}b`,
      perKind,
    ),
    lunch: seeded(
      items.filter((s) => s.kind === 'lunch' && fits(s)),
      `${day}l`,
      perKind,
    ),
  };
}

/** Unlock progress for education cards: onboarding < calm day N < testing day N < personal day N. */
function unlocked(card: EduCard, program: ProgramState, day: DayKey): boolean {
  if (!card.profiles.includes(program.profile)) return false;
  switch (card.unlock) {
    case 'onboarding':
      return true;
    case 'calm':
      return program.phase !== 'setup' && program.calmDaysDone >= card.unlockDay;
    case 'testing': {
      if (!program.calmEndedOn) return false;
      return diffDays(program.calmEndedOn, day) >= card.unlockDay;
    }
    case 'personal':
      return program.phase === 'personal';
  }
}

/** One education card a day: the earliest unlocked card not yet dismissed. */
export function cardOfTheDay(
  cards: readonly EduCard[],
  program: ProgramState,
  day: DayKey,
  dismissed: readonly string[],
): EduCard | null {
  const order = { onboarding: 0, calm: 1, testing: 2, personal: 3 } as const;
  return (
    cards
      .filter((c) => !dismissed.includes(c.id) && unlocked(c, program, day))
      .sort((a, b) => order[a.unlock] - order[b.unlock] || a.unlockDay - b.unlockDay)[0] ?? null
  );
}
