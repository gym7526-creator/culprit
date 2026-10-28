/**
 * Onboarding logic (spec §2, §8): profile detection, age gating, defaults, and turning answers into
 * program and plan inputs. Pure; screens only collect answers.
 */
import type { Allergen, Equipment, TestGroup } from '../data/content/schema.ts';
import type { Diet, Safety } from './plan.ts';
import type { Profile, Symptom } from './types.ts';

export const SUSPECT_CHIPS = [
  'dairy',
  'bread_pasta',
  'onion',
  'garlic',
  'beans',
  'coffee',
  'spicy',
  'fried',
  'fruit',
  'alcohol',
  'fizzy',
  'no_idea',
] as const;
export type SuspectChip = (typeof SUSPECT_CHIPS)[number];

export const TRIED_OPTIONS = [
  'no_dairy',
  'gluten_free',
  'low_fodmap',
  'antacids',
  'probiotics',
  'nothing',
] as const;
export type TriedOption = (typeof TRIED_OPTIONS)[number];

export const RED_FLAGS = [
  'blood_in_stool',
  'black_stool',
  'weight_loss',
  'swallowing',
  'vomiting',
  'chest_pain',
  'fever_pain',
  'after_50',
  'family_history',
  'celiac_ibd',
] as const;
export type RedFlag = (typeof RED_FLAGS)[number];

export const PANTRY_STAPLES = [
  'olive_oil',
  'salt',
  'black_pepper',
  'white_rice',
  'rolled_oats',
  'pasta',
  'soy_sauce',
  'apple_cider_vinegar',
  'cumin',
  'paprika',
  'oregano_dried',
] as const;

export const SELECTABLE_EQUIPMENT: readonly Equipment[] = [
  'air_fryer',
  'slow_cooker',
  'instant_pot',
  'grill',
];

export type Frequency = 'daily' | 'few_week' | 'weekly' | 'less';
export type Timing = 'after_eating' | 'hours_later' | 'night' | 'morning' | 'no_pattern';
export type Focus = 'stomach' | 'skin' | 'both';
export type YesNoSkip = 'yes' | 'no' | 'skip';

/** Everything onboarding collects. Health answers are stored in SQLite, never sent anywhere. */
export type Answers = {
  focus: Focus | null;
  birthYear: number | null;
  symptoms: Symptom[];
  mainSymptom: Symptom | null;
  frequency: Frequency | null;
  timing: Timing | null;
  impact: number | null;
  suspects: SuspectChip[];
  knownFine: SuspectChip[];
  tried: TriedOption[];
  /** Which red flags were picked is never stored, only that the notice was acknowledged. */
  redFlagsAcknowledged: boolean;
  eatingDisorder: YesNoSkip | null;
  gentleMode: boolean;
  pregnant: YesNoSkip | null;
  diet: Diet | null;
  allergens: Allergen[];
  dislikes: string[];
  celiac: boolean;
  household: number;
  kids: boolean;
  cookDays: number[];
  maxMinutes: 15 | 30 | 45 | null;
  equipment: Equipment[];
  zip: string | null;
  chainId: string | null;
  budget: number | null;
  pantry: string[];
  bedtime: string;
  checkInTime: string;
  notifications: 'granted' | 'denied' | 'later' | null;
  source: string | null;
  consent: boolean;
  /** Typed name when the store is "Other / local store" (priced at the average index). */
  storeName: string | null;
  /** Every store they shop at ("My stores"); `chainId` is the one the grocery list is priced for. */
  stores: string[];
  /** Let Culprit pick the cheapest of `stores` for each list (off after a manual switch). */
  storeAuto: boolean;
  alcoholOptIn: boolean;
};

export const emptyAnswers: Answers = {
  focus: null,
  birthYear: null,
  symptoms: [],
  mainSymptom: null,
  frequency: null,
  timing: null,
  impact: null,
  suspects: [],
  knownFine: [],
  tried: [],
  redFlagsAcknowledged: false,
  eatingDisorder: null,
  gentleMode: false,
  pregnant: null,
  diet: null,
  allergens: [],
  dislikes: [],
  celiac: false,
  household: 2,
  kids: false,
  cookDays: [0, 1, 2, 3, 4],
  maxMinutes: null,
  equipment: [],
  zip: null,
  chainId: null,
  budget: null,
  pantry: [],
  bedtime: '23:00',
  checkInTime: '20:30',
  notifications: null,
  source: null,
  consent: false,
  storeName: null,
  stores: [],
  storeAuto: true,
  alcoholOptIn: false,
};

// -------------------------------------------------------------------------------------------- age

export type AgeGate = 'blocked' | 'teen' | 'adult';

export function ageFrom(birthYear: number, currentYear: number): number {
  // Without a birthday we can't be exact; use the age reached this year minus one to be conservative.
  return currentYear - birthYear - 1;
}

/** Under 13 blocked (COPPA); 13–17 no elimination program; 18+ everything (spec §2). */
export function ageGate(age: number): AgeGate {
  if (age < 13) return 'blocked';
  if (age < 18) return 'teen';
  return 'adult';
}

/** Pregnancy question shown for adults of typical childbearing age. */
export function asksPregnancy(age: number): boolean {
  return age >= 18 && age <= 55;
}

// ---------------------------------------------------------------------------------------- profile

const REFLUX_SYMPTOMS: readonly Symptom[] = ['heartburn', 'nausea'];

export function isRefluxSymptom(s: Symptom): boolean {
  return REFLUX_SYMPTOMS.includes(s);
}

/**
 * FODMAP-dominant, reflux-dominant or mixed. A single picked symptom decides; with several, the
 * main symptom picks the side unless both sides are present, which makes it mixed.
 */
export function detectProfile(symptoms: readonly Symptom[]): Profile {
  if (symptoms.length === 0) return 'fodmap';
  const reflux = symptoms.filter(isRefluxSymptom).length;
  if (reflux === symptoms.length) return 'reflux';
  if (reflux === 0) return 'fodmap';
  return 'mixed';
}

export function safetyFor(profile: Profile): Safety {
  return profile === 'fodmap' ? 'calm_gut' : profile === 'reflux' ? 'calm_reflux' : 'calm_both';
}

/** Default weekly budget by household (spec O14: 1 → $60, 2 → $90, 4 → $140), in $5 steps. */
export function defaultBudget(household: number): number {
  const points: [number, number][] = [
    [1, 60],
    [2, 90],
    [4, 140],
  ];
  if (household <= 1) return 60;
  for (let i = 1; i < points.length; i++) {
    const [h0, b0] = points[i - 1]!;
    const [h1, b1] = points[i]!;
    if (household <= h1)
      return Math.round((b0 + ((b1 - b0) * (household - h0)) / (h1 - h0)) / 5) * 5;
  }
  return Math.min(300, 140 + (household - 4) * 25);
}

export const BUDGET_MIN = 40;
export const BUDGET_MAX = 300;
export const BUDGET_STEP = 5;

// --------------------------------------------------------------------------------------- suspects

const SUSPECT_GROUPS: Record<SuspectChip, TestGroup[]> = {
  dairy: ['lactose'],
  bread_pasta: ['wheat'],
  onion: ['onion'],
  garlic: ['garlic'],
  beans: ['gos'],
  coffee: ['coffee'],
  spicy: ['spicy'],
  fried: ['fatty'],
  fruit: ['fructose', 'sorbitol'],
  alcohol: ['alcohol'],
  fizzy: ['carbonation'],
  no_idea: [],
};

export function suspectGroups(chips: readonly SuspectChip[]): TestGroup[] {
  return [...new Set(chips.flatMap((c) => SUSPECT_GROUPS[c]))];
}

/** Groups set aside during the calm phase, for the O21 "Set aside for now" row. */
export function setAsideGroups(profile: Profile): TestGroup[] {
  const gut: TestGroup[] = ['onion', 'garlic', 'wheat', 'gos', 'lactose', 'fructose'];
  const reflux: TestGroup[] = ['coffee', 'tomato', 'fatty', 'spicy', 'citrus'];
  return profile === 'fodmap'
    ? gut
    : profile === 'reflux'
      ? reflux
      : [...gut.slice(0, 4), ...reflux.slice(0, 3)];
}

// --------------------------------------------------------------------------------------- builders

export function programOptions(a: Answers, currentYear: number, seed: string) {
  const age = a.birthYear ? ageFrom(a.birthYear, currentYear) : 0;
  const profile = detectProfile(a.symptoms);
  const main = a.mainSymptom ?? a.symptoms[0] ?? null;
  return {
    profile,
    refluxFirst: main !== null && isRefluxSymptom(main),
    knownFine: suspectGroups(a.knownFine),
    selfReported: [] as TestGroup[],
    celiac: a.celiac,
    age,
    alcoholOptIn: a.alcoholOptIn && age >= 21,
    seed,
    gentle: a.gentleMode,
    initialSeverity: Math.max(0, Math.min(4, Math.round(a.impact ?? 2))) as 0 | 1 | 2 | 3 | 4,
  };
}

/** Whether every required answer for building a plan is present. */
export function readyToBuild(a: Answers): boolean {
  return (
    a.birthYear !== null &&
    a.symptoms.length > 0 &&
    a.diet !== null &&
    a.cookDays.length > 0 &&
    a.maxMinutes !== null &&
    a.zip !== null &&
    (a.chainId !== null || a.stores.length > 0) &&
    a.budget !== null &&
    a.consent
  );
}

/** Toggles `value` in `list`, where `exclusive` (e.g. "No idea", "Nothing yet") clears everything else. */
export function toggleExclusive<T>(list: readonly T[], value: T, exclusive: T): T[] {
  if (value === exclusive) return list.includes(exclusive) ? [] : [exclusive];
  const without = list.filter((x) => x !== exclusive);
  return without.includes(value) ? without.filter((x) => x !== value) : [...without, value];
}
