/**
 * Turns onboarding answers into the real program and first-week plan (O20/O21). Pure: callers save
 * the results. The preview is genuinely the user's own plan (spec §8, O21).
 */
import { content, ingredientMap } from '@/data/content';
import { addDays, type DayKey } from '@/engines/dates';
import { planGroceries, generatePlan, type PlanInput, type WeekPlan } from '@/engines/plan';
import {
  detectProfile,
  programOptions,
  safetyFor,
  setAsideGroups,
  type Answers,
} from '@/engines/onboarding';
import { priceContext } from '@/engines/price';
import { createProgram, projectSchedule, type ProgramState } from '@/engines/program';
import type { TestGroup } from '@/engines/types';

export type FirstWeek = {
  program: ProgramState;
  plan: WeekPlan;
  planInput: PlanInput;
  chainName: string;
  setAside: TestGroup[];
  firstSuspects: TestGroup[];
  listItemCount: number;
};

export function planInputFor(
  a: Answers,
  program: ProgramState,
  weekStart: DayKey,
  seed: string,
  extras: Partial<PlanInput> = {},
): PlanInput {
  const profile = detectProfile(a.symptoms);
  const projection = projectSchedule(program, weekStart, 7);
  const testNights = Object.fromEntries(
    Object.entries(projection).flatMap(([day, p]) =>
      p.type === 'dose' && p.kind !== 'control' ? [[day, p.group]] : [],
    ),
  ) as Record<DayKey, TestGroup>;
  return {
    recipes: content.recipes,
    ingredients: ingredientMap,
    tests: content.tests.tests,
    weekStart,
    nights: 7,
    cookDays: a.cookDays,
    eatingOut: [],
    household: a.household,
    kids: a.kids,
    maxMinutes: a.maxMinutes ?? 30,
    equipment: a.equipment,
    diet: a.diet ?? 'none',
    allergens: a.allergens,
    dislikes: a.dislikes,
    glutenFree: a.celiac,
    safety: program.gentle
      ? 'gentle'
      : program.phase === 'personal'
        ? 'personal'
        : safetyFor(profile),
    testNights,
    budget: a.budget ?? 90,
    prices: priceContext(a.zip ?? '', a.chainId ?? 'other', content.regions, content.chains),
    ownedPantry: a.pantry,
    bedtime: a.bedtime,
    refluxTiming: profile !== 'fodmap',
    history: [],
    feedback: {},
    seed,
    ...extras,
  };
}

export function buildFirstWeek(a: Answers, today: DayKey, seed: string): FirstWeek {
  const opts = programOptions(a, Number(today.slice(0, 4)), seed);
  const program = createProgram(content.tests.order, content.tests.tests, { ...opts, today });
  // The calm start (and the first week) begins tomorrow.
  const planInput = planInputFor(a, program, addDays(today, 1), seed);
  const plan = generatePlan(planInput);
  const list = planGroceries(planInput, plan);
  return {
    program,
    plan,
    planInput,
    chainName: content.chains.chains.find((c) => c.id === a.chainId)?.name ?? '',
    setAside: program.gentle ? [] : setAsideGroups(opts.profile),
    firstSuspects: program.queue
      .filter((q) => q.kind === 'real')
      .slice(0, 3)
      .map((q) => q.group),
    listItemCount: list.sections.reduce((n, s) => n + s.lines.filter((l) => !l.pantry).length, 0),
  };
}
