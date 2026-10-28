/**
 * Debug CLI: simulates a program end to end with the real engines and content, and prints a
 * day-by-day timeline with weekly plans, prices and results.
 *
 * Usage: npm run engine:simulate -- [--weeks 4] [--profile fodmap|reflux|mixed] [--seed demo]
 *
 * Synthetic check-ins: calm and rest days score 1 ("Good"); garlic is a trigger (bad on the first
 * dose night), onion is fine in small amounts (bad on the second dose night); everything else and
 * every placebo stays at 1.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Ingredient, Recipe, TestsFile } from '../../src/data/content/schema.ts';
import { addDays, startOfWeek, type DayKey } from '../../src/engines/dates.ts';
import { generatePlan, planGroceries, type Safety } from '../../src/engines/plan.ts';
import {
  advance,
  createProgram,
  latestResults,
  projectSchedule,
  type ProgramState,
} from '../../src/engines/program.ts';
import type { CheckIn, Profile, Score } from '../../src/engines/types.ts';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const weeks = Number(arg('weeks', '4'));
const profile = arg('profile', 'fodmap') as Profile;
const seed = arg('seed', 'demo');

const dataDir = join(import.meta.dirname, '..', '..', 'assets', 'data');
const read = <T>(f: string): T => JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as T;
const ingredients = read<Ingredient[]>('ingredients.json');
const recipes = read<Recipe[]>('recipes.json');
const tests = read<TestsFile>('tests.json');
const ingMap = new Map(ingredients.map((i) => [i.id, i]));
const recipeTitle = new Map(recipes.map((r) => [r.id, r.title]));
const FACES = ['😌', '🙂', '😐', '😣', '😫'];
const money = (n: number) => `$${n.toFixed(2)}`;

const TODAY: DayKey = '2026-11-01';
let state: ProgramState = createProgram(tests.order, tests.tests, {
  profile,
  refluxFirst: profile === 'mixed',
  knownFine: [],
  selfReported: [],
  celiac: false,
  age: 32,
  alcoholOptIn: false,
  seed,
  today: TODAY,
  gentle: false,
  initialSeverity: 3,
});

const checkins = new Map<DayKey, CheckIn>();
const history: { recipeId: string; day: DayKey }[] = [];
const safety: Safety =
  profile === 'fodmap' ? 'calm_gut' : profile === 'reflux' ? 'calm_reflux' : 'calm_both';

function syntheticScore(s: ProgramState, day: DayKey): Score {
  const cur = s.current;
  if (!cur || cur.startedOn > day) return 1;
  const dose = cur.doseDays.length + 1;
  if (cur.group === 'garlic' && dose === 1) return 3;
  if (cur.group === 'onion' && dose === 2) return 3;
  return 1;
}

console.log(`\nCulprit program simulation · ${profile} profile · ${weeks} weeks · seed "${seed}"`);
console.log(
  `Queue: ${state.queue.map((q) => (q.kind === 'control' ? 'placebo' : q.group)).join(' → ')}\n`,
);

const start = addDays(TODAY, 1);
for (let w = 0; w < weeks; w++) {
  const weekStart = startOfWeek(addDays(start, w * 7));
  const projection = projectSchedule(state, weekStart, 7);
  const testNights = Object.fromEntries(
    Object.entries(projection).flatMap(([d, p]) =>
      p.type === 'dose' && p.kind !== 'control' ? [[d, p.group]] : [],
    ),
  );
  const planInput = {
    recipes,
    ingredients: ingMap,
    tests: tests.tests,
    weekStart,
    nights: 7 as const,
    cookDays: [0, 1, 2, 3, 4],
    eatingOut: [],
    household: 2,
    kids: false,
    maxMinutes: 45,
    equipment: [],
    diet: 'none' as const,
    allergens: [],
    dislikes: [],
    glutenFree: false,
    safety,
    testNights,
    budget: 110,
    prices: { chainId: 'walmart', regionMultiplier: 0.96, chainIndex: 0.9, overrides: {} },
    ownedPantry: ['salt', 'black_pepper', 'olive_oil', 'vegetable_oil'],
    bedtime: '23:00',
    refluxTiming: profile !== 'fodmap',
    history,
    feedback: {},
    seed,
  };
  const t0 = performance.now();
  const plan = generatePlan(planInput);
  const ms = performance.now() - t0;
  const list = planGroceries(planInput, plan);
  console.log(
    `── Week of ${weekStart} · ${plan.nights.filter((n) => n.status === 'cook').length} dinners · ${money(plan.total)} est. at Walmart (budget ${money(plan.budget)}${plan.overBudgetBy ? `, over by ${money(plan.overBudgetBy)}` : ''}) · ${list.sections.reduce((n, s) => n + s.lines.length, 0)} list items · planned in ${ms.toFixed(0)} ms`,
  );

  for (const night of plan.nights) {
    const day = night.day;
    if (day < start) continue;
    const before = state;
    const score = syntheticScore(state, day);
    checkins.set(day, {
      day,
      score,
      symptoms: score >= 3 ? ['bloating'] : [],
      unusual: [],
      testFoodTaken: null,
    });
    state = advance(state, {
      checkins,
      tests: tests.tests,
      now: { day: addDays(day, 1), hour: 13 },
    });
    if (night.recipeId) history.push({ recipeId: night.recipeId, day });

    const type = state.dayLog[day];
    const cur = before.current && before.current.startedOn <= day ? before.current : null;
    const what =
      type === 'calm'
        ? `calm day ${state.calmDaysDone}`
        : type === 'dose' && cur
          ? `${cur.kind === 'control' ? 'placebo' : cur.group} dose ${Math.min(3, cur.doseDays.length + 1)}`
          : (type ?? state.phase);
    const dinner = night.recipeId
      ? recipeTitle.get(night.recipeId)
      : night.status === 'not_cooking'
        ? '(not cooking)'
        : '(eating out)';
    console.log(
      `  ${day}  ${what.padEnd(18)} ${FACES[score]}  ${dinner}${night.testGroup ? `  🧪 ${night.testGroup}` : ''}${night.eatBy ? `  eat by ${night.eatBy}` : ''}`,
    );

    for (const t of state.completed) {
      const prev = before.completed.find((x) => x.id === t.id);
      if (t.result && !prev?.result) {
        const label = t.kind === 'control' ? 'placebo' : t.group;
        console.log(
          `      → ${label}: ${t.result.outcome.toUpperCase()} (${t.result.confidence ?? 'n/a'}) · ${t.result.explanation}`,
        );
      }
    }
    if (before.phase !== state.phase)
      console.log(`      ★ phase: ${before.phase} → ${state.phase}`);
  }
  console.log('');
}

console.log('Results so far:');
const results = latestResults(state);
if (results.size === 0) console.log('  (none yet — still in the calm phase or the first test)');
for (const [group, r] of results)
  console.log(`  ${group.padEnd(10)} ${r.outcome.padEnd(10)} safe dose ${r.safeDose}/3`);
console.log(
  `\nPhase: ${state.phase}. Tests left: ${state.queue.length}${state.current ? ` (+${state.current.group} in progress)` : ''}.`,
);
