import { content } from '@/data/content';
import { addDays } from '@/engines/dates';
import {
  activeChange,
  buildRoutine,
  chooseTreatment,
  createSkinProgram,
  emptySkinAnswers,
  scoreSkinChange,
  skinResults,
  startExperiment,
  switchTreatment,
  type SkinAnswers,
  type SkinCheckIn,
  type SkinScore,
} from '@/engines/skin';

const file = content.skincare;
const T0 = '2026-11-01';
const answers: SkinAnswers = {
  ...emptySkinAnswers,
  concern: 'breakouts',
  sensitive: false,
  budget: 25,
};

function log(
  from: string,
  days: number,
  score: (i: number) => SkinScore,
): Record<string, SkinCheckIn> {
  const out: Record<string, SkinCheckIn> = {};
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    out[day] = { day, score: score(i) };
  }
  return out;
}

describe('skin routine', () => {
  it('picks a treatment by concern and sensitivity', () => {
    expect(chooseTreatment(file.products, answers)!.id).toBe('benzoyl_peroxide_wash');
    expect(
      chooseTreatment(file.products, { ...answers, concern: 'blackheads' })!.forConcerns,
    ).toContain('blackheads');
    expect(chooseTreatment(file.products, { ...answers, sensitive: true })!.sensitiveFriendly).toBe(
      true,
    );
  });

  it('builds AM + PM with sunscreen in the morning and a wash treatment replacing the PM cleanser', () => {
    const r = buildRoutine(file, answers, 1);
    expect(r.am.map((s) => s.product.step)).toEqual(['cleanser', 'moisturizer', 'sunscreen']);
    expect(r.pm.map((s) => s.product.step)).toEqual(['treatment', 'moisturizer']);
    expect(r.monthly).toBeGreaterThan(0);
    expect(r.monthly).toBeLessThanOrEqual(r.budget);
  });

  it('does not charge for products already owned and flags going over budget', () => {
    const owned = buildRoutine(
      file,
      { ...answers, current: ['cleanser', 'moisturizer', 'sunscreen'] },
      1,
    );
    expect(owned.am.every((s) => s.owned)).toBe(true);
    expect(owned.monthly).toBeLessThan(buildRoutine(file, answers, 1).monthly);
    expect(buildRoutine(file, { ...answers, budget: 5 }, 1).overBudgetBy).toBeGreaterThan(0);
  });
});

describe('skin program', () => {
  it('starts the treatment after a 2-week baseline, one change at a time', () => {
    const p = createSkinProgram(file, answers, T0, 30);
    expect(p.changes[0]!.startedOn).toBe(addDays(T0, 14));
    expect(activeChange(file, p, T0)).toBeNull();
    expect(activeChange(file, p, addDays(T0, 20))?.key).toBe('benzoyl_peroxide_wash');
    const q = startExperiment(file, p, 'milk_pause', addDays(T0, 20));
    expect(q.changes[1]!.startedOn).toBe(addDays(T0, 14 + 42));
  });

  it('keeps diet experiments away from under-18s', () => {
    const teen = createSkinProgram(file, answers, T0, 16);
    expect(teen.experimentsAllowed).toBe(false);
    expect(startExperiment(file, teen, 'milk_pause', T0)).toBe(teen);
  });

  it('switching treatment replaces a running change', () => {
    const p = createSkinProgram(file, answers, T0, 30);
    const s = switchTreatment(file, p, 'adapalene_gel', addDays(T0, 20));
    expect(s.changes).toHaveLength(1);
    expect(s.treatmentId).toBe('adapalene_gel');
  });
});

describe('skin scoring', () => {
  const p = createSkinProgram(file, answers, T0, 30);
  const change = p.changes[0]!;
  const start = change.startedOn;

  it('is in progress until 6 weeks have passed', () => {
    const r = scoreSkinChange(file, change, {}, addDays(start, 20));
    expect(r.outcome).toBe('in_progress');
    expect(r.day).toBe(20);
    expect(r.length).toBe(42);
  });

  it('finds a treatment that seems to help', () => {
    const checkins = { ...log(T0, 14, () => 2), ...log(start, 42, (i) => (i < 28 ? 2 : 0)) };
    expect(scoreSkinChange(file, change, checkins, addDays(start, 42)).outcome).toBe(
      'seems_to_help',
    );
  });

  it('flags a product that is possibly breaking you out', () => {
    const checkins = { ...log(T0, 14, () => 1), ...log(start, 42, (i) => (i < 28 ? 1 : 3)) };
    expect(scoreSkinChange(file, change, checkins, addDays(start, 42)).outcome).toBe(
      'possibly_worse',
    );
  });

  it('says no clear effect when nothing moves, and not enough data with gaps', () => {
    const steady = { ...log(T0, 14, () => 1), ...log(start, 42, () => 1) };
    expect(scoreSkinChange(file, change, steady, addDays(start, 42)).outcome).toBe(
      'no_clear_effect',
    );
    const sparse = log(T0, 3, () => 1);
    expect(scoreSkinChange(file, change, sparse, addDays(start, 42)).outcome).toBe(
      'not_enough_data',
    );
  });

  it('reads milk as reintroduction vs the end of the pause', () => {
    const q = startExperiment(file, p, 'milk_pause', addDays(start, 42));
    const milk = q.changes[1]!;
    const checkins = log(milk.startedOn, 42, (i) => (i < 28 ? 1 : 3));
    const r = skinResults(file, q, checkins, addDays(milk.startedOn, 42)).find(
      (x) => x.change.key === 'milk_pause',
    )!;
    expect(r.outcome).toBe('possibly_worse');
  });
});
