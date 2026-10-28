import { recipeMap } from '@/data/content';
import { emptyAnswers, type Answers } from '@/engines/onboarding';
import type { Symptom } from '@/engines/types';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';

const TODAY = '2026-10-28';

function answers(symptoms: Symptom[], extra: Partial<Answers> = {}): Answers {
  return {
    ...emptyAnswers,
    birthYear: 1990,
    symptoms,
    mainSymptom: symptoms[0] ?? null,
    diet: 'none',
    maxMinutes: 30,
    zip: '60614',
    chainId: 'kroger',
    budget: 90,
    consent: true,
    ...extra,
  };
}

describe('buildFirstWeek', () => {
  it('builds a calm-gut week for a FODMAP profile, starting tomorrow', () => {
    const w = buildFirstWeek(answers(['bloating', 'gas']), TODAY, 'seed');
    expect(w.plan.weekStart).toBe('2026-10-29');
    expect(w.program.profile).toBe('fodmap');
    const cooked = w.plan.nights.filter((n) => n.status === 'cook' && n.recipeId);
    expect(cooked.length).toBe(5);
    for (const n of cooked) expect(recipeMap.get(n.recipeId!)!.derived.calmSafeGut).toBe(true);
    expect(w.setAside).toContain('onion');
    expect(w.firstSuspects.length).toBeGreaterThan(0);
    expect(w.listItemCount).toBeGreaterThan(0);
    expect(w.plan.total).toBeGreaterThan(0);
  });

  it('builds a calm-reflux week with eat-by times for a reflux profile', () => {
    const w = buildFirstWeek(answers(['heartburn']), TODAY, 'seed');
    expect(w.program.profile).toBe('reflux');
    const cooked = w.plan.nights.filter((n) => n.status === 'cook' && n.recipeId);
    for (const n of cooked) {
      expect(recipeMap.get(n.recipeId!)!.derived.calmSafeReflux).toBe(true);
      expect(n.eatBy).toBeTruthy();
    }
    expect(w.setAside).toContain('coffee');
  });

  it('builds a both-safe week for a mixed profile', () => {
    const w = buildFirstWeek(answers(['bloating', 'heartburn']), TODAY, 'seed');
    expect(w.program.profile).toBe('mixed');
    for (const n of w.plan.nights.filter((x) => x.recipeId)) {
      const d = recipeMap.get(n.recipeId!)!.derived;
      expect(d.calmSafeGut && d.calmSafeReflux).toBe(true);
    }
  });

  it('sets nothing aside in gentle mode', () => {
    const w = buildFirstWeek(answers(['bloating'], { gentleMode: true }), TODAY, 'seed');
    expect(w.program.gentle).toBe(true);
    expect(w.setAside).toEqual([]);
  });

  it('respects diet and is deterministic for a seed', () => {
    const a = answers(['bloating'], { diet: 'vegetarian' });
    const w1 = buildFirstWeek(a, TODAY, 's1');
    const w2 = buildFirstWeek(a, TODAY, 's1');
    expect(w1.plan).toEqual(w2.plan);
    for (const n of w1.plan.nights.filter((x) => x.recipeId)) {
      expect(recipeMap.get(n.recipeId!)!.derived.diets).toContain('vegetarian');
    }
  });
});
