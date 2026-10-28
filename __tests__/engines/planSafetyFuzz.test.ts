import { content, ingredientMap, recipeMap } from '@/data/content';
import { ALLERGENS, type Allergen } from '@/data/content/schema';
import { BASE_EQUIPMENT, eligibleRecipes, TIME_TOLERANCE_MIN } from '@/engines/plan';
import {
  emptyAnswers,
  PANTRY_STAPLES,
  SELECTABLE_EQUIPMENT,
  type Answers,
} from '@/engines/onboarding';
import { seededRandom } from '@/engines/rng';
import type { Symptom } from '@/engines/types';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';

const DISLIKES = [
  'mushrooms_button',
  'salmon_fillet',
  'shrimp',
  'tofu_firm',
  'eggplant',
  'cilantro',
  'olives_black',
  'zucchini',
  'bell_pepper_green',
  'pork_chops',
];
const SYMPTOM_SETS: Symptom[][] = [
  ['bloating'],
  ['heartburn'],
  ['bloating', 'heartburn'],
  ['gas', 'diarrhea'],
  ['nausea'],
];
const DIETS = ['none', 'none', 'vegetarian', 'vegan', 'pescatarian'] as const;
const TIMES = [15, 30, 45] as const;

function pick<T>(rnd: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rnd() * xs.length)]!;
}
function some<T>(rnd: () => number, xs: readonly T[], p: number): T[] {
  return xs.filter(() => rnd() < p);
}

describe('every dinner for 40 random people follows every rule', () => {
  const rnd = seededRandom('fuzz');
  const people: Answers[] = Array.from({ length: 40 }, () => ({
    ...emptyAnswers,
    birthYear: 1990,
    symptoms: pick(rnd, SYMPTOM_SETS),
    diet: pick(rnd, DIETS),
    allergens: some(rnd, ALLERGENS, 0.15) as Allergen[],
    dislikes: some(rnd, DISLIKES, 0.25),
    celiac: rnd() < 0.15,
    household: 1 + Math.floor(rnd() * 6),
    kids: rnd() < 0.3,
    maxMinutes: pick(rnd, TIMES),
    equipment: some(rnd, SELECTABLE_EQUIPMENT, 0.3),
    pantry: some(rnd, PANTRY_STAPLES, 0.5),
    zip: '60614',
    chainId: 'kroger',
    stores: ['kroger'],
    budget: 60 + Math.floor(rnd() * 120),
    consent: true,
    gentleMode: rnd() < 0.1,
  }));

  it.each(people.map((p, i) => [i, p] as const))('person %i', (_i, a) => {
    const week = buildFirstWeek(a, '2026-11-01', `p${_i}`);
    const profile = week.program.profile;
    for (const n of week.plan.nights) {
      if (n.status !== 'cook' || !n.recipeId) continue;
      const r = recipeMap.get(n.recipeId)!;
      const where = `${r.id} for person ${_i}`;
      // Allergies and celiac
      for (const al of a.allergens)
        expect([where, r.derived.allergens.includes(al)]).toEqual([where, false]);
      if (a.celiac) expect([where, r.derived.glutenFree]).toEqual([where, true]);
      // Diet
      if (a.diet && a.diet !== 'none')
        expect([where, r.derived.diets.includes(a.diet)]).toEqual([where, true]);
      // Foods they won't eat
      for (const d of a.dislikes)
        expect([where, r.ingredients.some((i) => i.ingredientId === d)]).toEqual([where, false]);
      // Time: only relaxed when too few recipes fit, and then only the quickest others.
      const quick = eligibleRecipes(week.planInput).filter(
        (x) => x.minutes <= (a.maxMinutes ?? 30) + TIME_TOLERANCE_MIN,
      );
      const slots = week.plan.nights.filter((x) => x.status === 'cook').length;
      if (quick.length >= slots)
        expect([where, r.minutes <= (a.maxMinutes ?? 30) + TIME_TOLERANCE_MIN]).toEqual([
          where,
          true,
        ]);
      // Equipment
      for (const e of r.equipment)
        expect([where, [...BASE_EQUIPMENT, ...a.equipment].includes(e)]).toEqual([where, true]);
      // Calm-phase safety for their symptom pattern (gentle mode has no elimination)
      if (!a.gentleMode && !n.testGroup) {
        if (profile !== 'reflux') expect([where, r.derived.calmSafeGut]).toEqual([where, true]);
        if (profile !== 'fodmap') expect([where, r.derived.calmSafeReflux]).toEqual([where, true]);
      }
    }
    // Upcoming food tests never use a food they're allergic to or don't eat.
    for (const q of week.program.queue) {
      const t = content.tests.tests.find((x) => x.id === q.group)!;
      for (const d of t.doses) {
        const ing = d.ingredientId ? ingredientMap.get(d.ingredientId) : undefined;
        if (!ing) continue;
        for (const al of a.allergens)
          expect([q.group, ing.allergens.includes(al)]).toEqual([q.group, false]);
        if (a.diet && a.diet !== 'none')
          expect([q.group, ing.diets.includes(a.diet)]).toEqual([q.group, true]);
      }
    }
  });
});
