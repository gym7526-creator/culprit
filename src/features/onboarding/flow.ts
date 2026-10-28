/**
 * Onboarding step order (spec §8). Pure: which steps apply to these answers, what comes next and how
 * far along the progress bar is. Branch screens (age block, teen, safety notices) aren't in the
 * linear order; the screen that leads to them navigates there explicitly.
 */
import { ageFrom, asksPregnancy, type Answers } from '@/engines/onboarding';

export const STEPS = [
  'welcome',
  'focus',
  'birth-year',
  'symptoms',
  'main-symptom',
  'frequency',
  'timing',
  'impact',
  'empathy',
  'suspects',
  'known-fine',
  'tried',
  'objection',
  'red-flags',
  'eating-disorder',
  'pregnancy',
  'diet',
  'household',
  'cook-nights',
  'cook-time',
  'equipment',
  'zip',
  'store',
  'budget',
  'pantry',
  'bedtime',
  'check-in-time',
  'notifications',
  'source',
  'how-it-works',
  'building',
  'first-week',
  'save-progress',
] as const;
export type Step = (typeof STEPS)[number];

export const BRANCHES = [
  'age-blocked',
  'teen',
  'red-flag-notice',
  'ed-notice',
  'pregnancy-notice',
] as const;
export type Branch = (typeof BRANCHES)[number];

/** Steps without a progress bar. */
const NO_PROGRESS: readonly Step[] = ['welcome', 'building', 'first-week', 'save-progress'];

export function isVisible(step: Step, a: Answers, currentYear: number): boolean {
  switch (step) {
    case 'main-symptom':
      return a.symptoms.length > 1;
    case 'known-fine':
      return a.suspects.some((s) => s !== 'no_idea');
    case 'pregnancy':
      return a.birthYear !== null && asksPregnancy(ageFrom(a.birthYear, currentYear));
    default:
      return true;
  }
}

export function nextStep(current: Step | Branch, a: Answers, currentYear: number): Step | null {
  const from = (BRANCHES as readonly string[]).includes(current)
    ? branchReturn(current as Branch)
    : (current as Step);
  const i = STEPS.indexOf(from);
  for (let j = i + 1; j < STEPS.length; j++) {
    const s = STEPS[j]!;
    if (isVisible(s, a, currentYear)) return s;
  }
  return null;
}

export function prevStep(current: Step, a: Answers, currentYear: number): Step | null {
  const i = STEPS.indexOf(current);
  for (let j = i - 1; j >= 0; j--) {
    const s = STEPS[j]!;
    if (isVisible(s, a, currentYear)) return s;
  }
  return null;
}

/** The linear step a branch screen continues from. */
export function branchReturn(branch: Branch): Step {
  switch (branch) {
    case 'red-flag-notice':
      return 'red-flags';
    case 'ed-notice':
      return 'eating-disorder';
    case 'pregnancy-notice':
      return 'pregnancy';
    default:
      return 'birth-year';
  }
}

/** Progress for the bar: position among visible question steps. */
export function progressOf(
  step: Step,
  a: Answers,
  currentYear: number,
): { current: number; total: number } | null {
  if (NO_PROGRESS.includes(step)) return null;
  const visible = STEPS.filter((s) => !NO_PROGRESS.includes(s) && isVisible(s, a, currentYear));
  return { current: visible.indexOf(step) + 1, total: visible.length };
}

export function isStep(value: string): value is Step {
  return (STEPS as readonly string[]).includes(value);
}
