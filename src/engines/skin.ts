/**
 * Skin mode (spec §12): routine from product archetypes, one change at a time, judged after 6–8
 * weeks with longer windows than the stomach tests. Pure.
 */
import type {
  SkinConcern,
  SkincareFile,
  SkinExperiment,
  SkinProduct,
} from '../data/content/schema.ts';
import { addDays, diffDays, rangeDays, type DayKey } from './dates.ts';
import { roundCents } from './price.ts';

/** "Skin today?": 0 Clear, 1 A few spots, 2 Some breakouts, 3 Bad breakout. */
export type SkinScore = 0 | 1 | 2 | 3;
export type SkinCheckIn = { day: DayKey; score: SkinScore };

export const PRODUCT_TYPES = ['cleanser', 'moisturizer', 'sunscreen', 'treatment'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
export const SKIN_AREAS = ['forehead', 'cheeks', 'chin_jaw', 'back'] as const;
export type SkinArea = (typeof SKIN_AREAS)[number];
export const SKIN_DURATIONS = ['weeks', 'months', 'year', 'years'] as const;
export type SkinDuration = (typeof SKIN_DURATIONS)[number];

export type SkinAnswers = {
  concern: SkinConcern | null;
  areas: SkinArea[];
  duration: SkinDuration | null;
  /** Product types already in use: kept, not bought again. */
  current: ProductType[];
  sensitive: boolean | null;
  /** Monthly skincare budget in USD. */
  budget: number;
  /** Where they buy skincare (skincare.json retailers). */
  retailerId: string | null;
  checkInTime: string;
};

export const emptySkinAnswers: SkinAnswers = {
  concern: null,
  areas: [],
  duration: null,
  current: [],
  sensitive: null,
  budget: 25,
  retailerId: null,
  checkInTime: '21:00',
};

export const SKIN_BUDGET_MIN = 10;
export const SKIN_BUDGET_MAX = 100;
/** Days of routine-only check-ins before the first change (the skin baseline). */
export const SKIN_BASELINE_DAYS = 14;
/** How many days at each end of a window are compared. */
export const SKIN_WINDOW_DAYS = 14;
/** Minimum check-ins inside each window to call a result. */
export const SKIN_MIN_CHECKINS = 7;
/** Mean change (on the 0–3 scale) that counts as a difference. */
export const SKIN_DELTA = 0.5;

/** The evening treatment for a concern: sensitive skin gets a sensitive-friendly one. */
export function chooseTreatment(
  products: readonly SkinProduct[],
  a: SkinAnswers,
): SkinProduct | null {
  const treatments = products.filter((p) => p.step === 'treatment');
  const fits = treatments.filter(
    (p) =>
      (a.concern === null || p.forConcerns.includes(a.concern)) &&
      (!a.sensitive || p.sensitiveFriendly),
  );
  return fits[0] ?? treatments.find((p) => p.sensitiveFriendly) ?? treatments[0] ?? null;
}

export type RoutineStep = { product: SkinProduct; owned: boolean; monthly: number; price: number };
export type Routine = {
  am: RoutineStep[];
  pm: RoutineStep[];
  /** Estimated monthly cost of everything not already owned. */
  monthly: number;
  /** Up-front cost of the packs to buy now. */
  upfront: number;
  budget: number;
  overBudgetBy: number | null;
};

/**
 * Morning: cleanser, moisturizer, sunscreen. Night: cleanser (or the treatment wash), treatment,
 * moisturizer. Prices use the user's region and store index, like groceries.
 */
export function buildRoutine(
  file: SkincareFile,
  a: SkinAnswers,
  priceIndex: number,
  treatmentId?: string | null,
): Routine {
  const by = (step: ProductType) => file.products.find((p) => p.step === step);
  const treatment =
    (treatmentId ? file.products.find((p) => p.id === treatmentId) : null) ??
    chooseTreatment(file.products, a);
  const make = (p: SkinProduct): RoutineStep => {
    const price = roundCents(p.basePriceUSD * priceIndex);
    const owned = a.current.includes(p.step);
    return { product: p, owned, price, monthly: owned ? 0 : roundCents(price / p.monthsPerPack) };
  };
  const cleanser = by('cleanser');
  const moisturizer = by('moisturizer');
  const sunscreen = by('sunscreen');
  const am = [cleanser, moisturizer, sunscreen].filter((p): p is SkinProduct => !!p).map(make);
  // A treatment that is itself a wash replaces the evening cleanser.
  const treatmentIsWash = treatment ? /wash|cleanser/i.test(treatment.name) : false;
  const pm = [treatmentIsWash ? null : cleanser, treatment, moisturizer]
    .filter((p): p is SkinProduct => !!p)
    .map(make);
  const unique = new Map<string, RoutineStep>();
  for (const s of [...am, ...pm]) unique.set(s.product.id, s);
  const monthly = roundCents([...unique.values()].reduce((t, s) => t + s.monthly, 0));
  const upfront = roundCents(
    [...unique.values()].filter((s) => !s.owned).reduce((t, s) => t + s.price, 0),
  );
  return {
    am,
    pm,
    monthly,
    upfront,
    budget: a.budget,
    overBudgetBy: monthly > a.budget ? roundCents(monthly - a.budget) : null,
  };
}

// --------------------------------------------------------------------------------------- program

export type SkinChange = {
  id: string;
  kind: 'product' | 'experiment';
  /** Product id or experiment id. */
  key: string;
  startedOn: DayKey;
};

export type SkinProgram = {
  version: 1;
  startedOn: DayKey;
  treatmentId: string | null;
  /** Diet experiments are 18+ and opt-in. */
  experimentsAllowed: boolean;
  changes: SkinChange[];
  nextId: number;
};

export function createSkinProgram(
  file: SkincareFile,
  a: SkinAnswers,
  today: DayKey,
  age: number,
): SkinProgram {
  const treatment = chooseTreatment(file.products, a);
  return {
    version: 1,
    startedOn: today,
    treatmentId: treatment?.id ?? null,
    experimentsAllowed: age >= 18,
    // The treatment is the first change, after a baseline on the basic routine.
    changes: treatment
      ? [
          {
            id: 's1',
            kind: 'product',
            key: treatment.id,
            startedOn: addDays(today, SKIN_BASELINE_DAYS),
          },
        ]
      : [],
    nextId: 2,
  };
}

/** Total days a change runs before it's judged. */
export function changeLength(file: SkincareFile, c: SkinChange): number {
  if (c.kind === 'product') return file.judgeAfterDays;
  const exp = file.experiments.find((e) => e.id === c.key);
  return exp ? exp.phases.reduce((t, p) => t + p.days, 0) : file.judgeAfterDays;
}

export function changeEnds(file: SkincareFile, c: SkinChange): DayKey {
  return addDays(c.startedOn, changeLength(file, c));
}

/** The change running on `day`, if any (only one at a time). */
export function activeChange(file: SkincareFile, p: SkinProgram, day: DayKey): SkinChange | null {
  return (
    p.changes.find(
      (c) => diffDays(c.startedOn, day) >= 0 && diffDays(day, changeEnds(file, c)) > 0,
    ) ?? null
  );
}

/** Starts a diet experiment once nothing else is running (one change at a time). */
export function startExperiment(
  file: SkincareFile,
  p: SkinProgram,
  experimentId: string,
  today: DayKey,
): SkinProgram {
  const exp = file.experiments.find((e) => e.id === experimentId);
  if (!exp || !p.experimentsAllowed) return p;
  const last = p.changes[p.changes.length - 1];
  const free = last ? changeEnds(file, last) : today;
  const start = diffDays(today, free) > 0 ? free : today;
  return {
    ...p,
    changes: [
      ...p.changes,
      { id: `s${p.nextId}`, kind: 'experiment', key: exp.id, startedOn: start },
    ],
    nextId: p.nextId + 1,
  };
}

/** Swap the evening treatment: it becomes the next change and is judged on its own. */
export function switchTreatment(
  file: SkincareFile,
  p: SkinProgram,
  productId: string,
  today: DayKey,
): SkinProgram {
  const last = p.changes[p.changes.length - 1];
  const running = last && diffDays(today, changeEnds(file, last)) > 0;
  const changes = running && last ? p.changes.slice(0, -1) : p.changes;
  return {
    ...p,
    treatmentId: productId,
    changes: [
      ...changes,
      { id: `s${p.nextId}`, kind: 'product', key: productId, startedOn: today },
    ],
    nextId: p.nextId + 1,
  };
}

// --------------------------------------------------------------------------------------- scoring

export type SkinOutcome =
  'in_progress' | 'not_enough_data' | 'seems_to_help' | 'possibly_worse' | 'no_clear_effect';

export type SkinResult = {
  change: SkinChange;
  outcome: SkinOutcome;
  /** Days into the change and its total length. */
  day: number;
  length: number;
  baseline: number | null;
  after: number | null;
  delta: number | null;
};

function windowMean(
  checkins: Readonly<Record<DayKey, SkinCheckIn>>,
  from: DayKey,
  days: number,
): number | null {
  const scores = rangeDays(from, days)
    .map((d) => checkins[d]?.score)
    .filter((s): s is SkinScore => s !== undefined);
  if (scores.length < SKIN_MIN_CHECKINS) return null;
  return Math.round((scores.reduce((a: number, b) => a + b, 0) / scores.length) * 100) / 100;
}

/**
 * Compares the last two weeks of a change with the two weeks before it started. Milk is read the
 * other way round: the reintroduction weeks against the end of the pause.
 */
export function scoreSkinChange(
  file: SkincareFile,
  c: SkinChange,
  checkins: Readonly<Record<DayKey, SkinCheckIn>>,
  today: DayKey,
): SkinResult {
  const length = changeLength(file, c);
  const day = Math.max(0, diffDays(c.startedOn, today));
  const base: Omit<SkinResult, 'outcome'> = {
    change: c,
    day,
    length,
    baseline: null,
    after: null,
    delta: null,
  };
  if (day < length) return { ...base, outcome: 'in_progress' };

  const exp: SkinExperiment | undefined = file.experiments.find((e) => e.id === c.key);
  const reintro = exp?.phases.find((p) => p.key === 'reintroduce');
  let baseline: number | null;
  let after: number | null;
  if (exp && reintro) {
    const pauseEnd = addDays(c.startedOn, length - reintro.days);
    baseline = windowMean(checkins, addDays(pauseEnd, -SKIN_WINDOW_DAYS), SKIN_WINDOW_DAYS);
    after = windowMean(checkins, pauseEnd, reintro.days);
  } else {
    baseline = windowMean(checkins, addDays(c.startedOn, -SKIN_WINDOW_DAYS), SKIN_WINDOW_DAYS);
    after = windowMean(checkins, addDays(c.startedOn, length - SKIN_WINDOW_DAYS), SKIN_WINDOW_DAYS);
  }
  if (baseline === null || after === null)
    return { ...base, baseline, after, outcome: 'not_enough_data' };
  const delta = Math.round((after - baseline) * 100) / 100;
  const outcome: SkinOutcome =
    delta >= SKIN_DELTA
      ? 'possibly_worse'
      : delta <= -SKIN_DELTA
        ? 'seems_to_help'
        : 'no_clear_effect';
  return { ...base, baseline, after, delta, outcome };
}

export function skinResults(
  file: SkincareFile,
  p: SkinProgram,
  checkins: Readonly<Record<DayKey, SkinCheckIn>>,
  today: DayKey,
): SkinResult[] {
  return p.changes
    .filter((c) => diffDays(c.startedOn, today) >= 0)
    .map((c) => scoreSkinChange(file, c, checkins, today));
}
