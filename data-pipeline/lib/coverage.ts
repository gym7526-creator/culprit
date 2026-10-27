/**
 * Content validation: integrity checks + the library coverage rules from spec §5.2.
 * Pure: takes parsed content, returns errors, warnings and a printable report.
 */
import {
  CUISINES,
  TEST_GROUPS,
  type ChainsFile,
  type EduCard,
  type Ingredient,
  type PricesFile,
  type Recipe,
  type RegionsFile,
  type StapleItem,
  type TestGroup,
  type TestsFile,
} from '../../src/data/content/schema.ts';

import { deriveRecipe } from './derive.ts';

export type Content = {
  ingredients: Ingredient[];
  recipes: Recipe[];
  tests: TestsFile;
  staples: StapleItem[];
  cards: EduCard[];
  prices: PricesFile;
  regions: RegionsFile;
  chains: ChainsFile;
};

export type CoverageResult = { errors: string[]; warnings: string[]; report: string[] };

/** Thresholds (spec §5.2 and §5.6). */
export const RULES = {
  recipesMin: 150,
  calmSafeGut: 70,
  calmSafeReflux: 50,
  calmSafeBoth: 35,
  vegetarian: 25,
  vegan: 10,
  kidFriendly: 30,
  quick20: 40,
  perCuisine: 5,
  withTestSlot: 60,
  hostsPerTestGroup: 3,
  ingredientsTarget: 350,
  cardsMin: 25,
} as const;

export const REQUIRED_CHAINS = [
  'walmart',
  'aldi',
  'kroger',
  'target',
  'heb',
  'publix',
  'albertsons_safeway',
  'meijer',
  'wegmans',
  'whole_foods',
  'trader_joes',
  'costco',
  'other',
] as const;

function dupes(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) out.add(id);
    seen.add(id);
  }
  return [...out];
}

export function checkContent(c: Content): CoverageResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const report: string[] = [];
  const need = (label: string, have: number, min: number) => {
    const ok = have >= min;
    report.push(
      `${ok ? '✓' : '✗'} ${label.padEnd(34)} ${String(have).padStart(4)}  (need ≥ ${min})`,
    );
    if (!ok) errors.push(`Coverage: ${label} is ${have}, needs at least ${min}`);
  };

  // ---------------------------------------------------------------- ingredients
  const ingMap = new Map(c.ingredients.map((i) => [i.id, i]));
  dupes(c.ingredients.map((i) => i.id)).forEach((d) =>
    errors.push(`Duplicate ingredient id: ${d}`),
  );
  for (const ing of c.ingredients) {
    for (const s of ing.swaps ?? []) {
      if (!ingMap.has(s)) errors.push(`Ingredient ${ing.id}: swap "${s}" does not exist`);
    }
  }

  // ---------------------------------------------------------------- recipes
  dupes(c.recipes.map((r) => r.id)).forEach((d) => errors.push(`Duplicate recipe id: ${d}`));
  for (const r of c.recipes) {
    for (const ri of r.ingredients) {
      if (!ingMap.has(ri.ingredientId))
        errors.push(`Recipe ${r.id}: unknown ingredient "${ri.ingredientId}"`);
    }
    try {
      const fresh = deriveRecipe(r, ingMap);
      if (JSON.stringify(fresh) !== JSON.stringify(r.derived)) {
        errors.push(`Recipe ${r.id}: derived tags are stale or hand-edited (re-run content:build)`);
      }
    } catch (e) {
      errors.push(`Recipe ${r.id}: ${(e as Error).message}`);
    }
  }

  const rs = c.recipes;
  const count = (pred: (r: Recipe) => boolean) => rs.filter(pred).length;
  report.push('Recipes');
  need('total dinners', rs.length, RULES.recipesMin);
  need(
    'calm-safe (gut)',
    count((r) => r.derived.calmSafeGut),
    RULES.calmSafeGut,
  );
  need(
    'calm-safe (reflux)',
    count((r) => r.derived.calmSafeReflux),
    RULES.calmSafeReflux,
  );
  need(
    'calm-safe (both)',
    count((r) => r.derived.calmSafeGut && r.derived.calmSafeReflux),
    RULES.calmSafeBoth,
  );
  need(
    'vegetarian',
    count((r) => r.derived.diets.includes('vegetarian')),
    RULES.vegetarian,
  );
  need(
    'vegan',
    count((r) => r.derived.diets.includes('vegan')),
    RULES.vegan,
  );
  need(
    'kid-friendly',
    count((r) => r.kidFriendly),
    RULES.kidFriendly,
  );
  need(
    '20 minutes or less',
    count((r) => r.minutes <= 20),
    RULES.quick20,
  );
  need(
    'with a test slot',
    count((r) => r.testSlot !== undefined),
    RULES.withTestSlot,
  );
  for (const cu of CUISINES)
    need(
      `cuisine: ${cu}`,
      count((r) => r.cuisine === cu),
      RULES.perCuisine,
    );
  report.push(
    `  gluten-free: ${count((r) => r.derived.glutenFree)}   low-glycemic: ${count((r) => r.derived.lowGlycemic)}`,
  );

  // ---------------------------------------------------------------- tests
  const testIds = c.tests.tests.map((t) => t.id);
  dupes(testIds).forEach((d) => errors.push(`Duplicate test: ${d}`));
  for (const g of TEST_GROUPS) {
    if (!testIds.includes(g)) errors.push(`Test library is missing group "${g}"`);
  }
  for (const t of c.tests.tests) {
    for (const d of t.doses) {
      if (t.hostType !== 'timing' && (!d.ingredientId || d.qty === undefined || !d.unit)) {
        errors.push(`Test ${t.id}: dose "${d.portion}" needs ingredientId, qty and unit`);
      }
      if (d.ingredientId && !ingMap.has(d.ingredientId))
        errors.push(`Test ${t.id}: unknown ingredient "${d.ingredientId}"`);
    }
  }
  for (const ctl of c.tests.controls) {
    if (!ingMap.has(ctl.ingredientId))
      errors.push(`Control ${ctl.id}: unknown ingredient "${ctl.ingredientId}"`);
  }
  for (const g of [...c.tests.order.fodmap, ...c.tests.order.reflux]) {
    if (!testIds.includes(g)) errors.push(`Test order references undefined test "${g}"`);
  }

  report.push('Test hosting (dinners that can carry each test)');
  const slotted = rs.filter((r) => r.testSlot);
  for (const t of c.tests.tests) {
    const hosts =
      t.hostType === 'addon'
        ? slotted.filter((r) => r.testSlot?.canHost.includes(t.id as TestGroup)).length
        : slotted.length; // side dishes and timing tests fit any slotted dinner
    need(`test: ${t.id} (${t.hostType})`, hosts, RULES.hostsPerTestGroup);
  }

  // ---------------------------------------------------------------- staples, cards
  for (const kind of ['breakfast', 'lunch', 'snack'] as const) {
    const n = c.staples.filter((s) => s.kind === kind && s.calmSafeGut && s.calmSafeReflux).length;
    if (n < 2) errors.push(`Staples: need at least 2 calm-safe ${kind} ideas, have ${n}`);
  }
  dupes(c.staples.map((s) => s.id)).forEach((d) => errors.push(`Duplicate staple id: ${d}`));
  dupes(c.cards.map((s) => s.id)).forEach((d) => errors.push(`Duplicate card id: ${d}`));
  report.push('Other content');
  need('education cards', c.cards.length, RULES.cardsMin);
  report.push(
    `  staples: ${c.staples.length}   tests: ${c.tests.tests.length}   controls: ${c.tests.controls.length}`,
  );

  // ---------------------------------------------------------------- prices, regions, chains
  const priced = new Set(c.prices.entries.map((e) => e.ingredientId));
  for (const ing of c.ingredients)
    if (!priced.has(ing.id)) errors.push(`Prices: no entry for ${ing.id}`);
  const ranges = [...c.regions.zip3].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < ranges.length; i++) {
    const [lo, hi, st] = ranges[i]!;
    if (lo > hi) errors.push(`ZIP3 range ${lo}-${hi} is reversed`);
    const prev = ranges[i - 1];
    if (prev && lo <= prev[1]) errors.push(`ZIP3 ranges overlap at ${lo}`);
    if (!(st in c.regions.stateToRegion))
      errors.push(`ZIP3 ${lo}-${hi}: state ${st} has no region`);
  }
  const chainIds = c.chains.chains.map((ch) => ch.id);
  for (const req of REQUIRED_CHAINS)
    if (!chainIds.includes(req)) errors.push(`Chains: missing "${req}"`);
  const blsMatched = c.prices.entries.filter((e) => e.method === 'bls').length;
  report.push(
    `  ingredients: ${c.ingredients.length} (target ~${RULES.ingredientsTarget})   prices from BLS: ${blsMatched}   chains: ${chainIds.length}`,
  );
  if (c.ingredients.length < RULES.ingredientsTarget) {
    warnings.push(
      `Ingredient master has ${c.ingredients.length} items; the spec target is ~${RULES.ingredientsTarget}.`,
    );
  }

  return { errors, warnings, report };
}
