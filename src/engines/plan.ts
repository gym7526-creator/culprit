/**
 * Weekly plan generator (spec §6.4). Pure and deterministic: the same inputs and seed always give the
 * same plan; "Shuffle week" bumps `shuffle`.
 *
 * 1. Filter recipes by phase safety, diet, allergens, gluten, dislikes, equipment and time.
 *    Test nights only take dinners that can host that night's test food.
 * 2. Score each (night, recipe): estimated cost + variety, recency, feedback, kids, two-week
 *    perishables, a bonus for sharing perishables, and a small seeded jitter.
 * 3. Greedy assignment (test nights first), then pairwise-swap local search.
 * 4. Price the real grocery list; if over budget, weight cost harder and retry, else report the gap
 *    with two concrete suggestions.
 */
import type {
  Allergen,
  Equipment,
  Ingredient,
  Recipe,
  TestDefinition,
  TestGroup,
} from '../data/content/schema.ts';
import { addDays, diffDays, weekday, type DayKey } from './dates.ts';
import { buildGroceryList, needsForRecipes, type GroceryList } from './grocery.ts';
import { packPrice, roundCents, type PriceContext } from './price.ts';
import type { PersonalRules } from './program.ts';
import { hashString } from './rng.ts';
import { parseTime, toTime } from './time.ts';
import { allowedInPersonalPlan } from './triggers.ts';
import { toPackUnit } from './units.ts';

export type Safety = 'calm_gut' | 'calm_reflux' | 'calm_both' | 'personal' | 'gentle';
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'pescatarian';

/** Always assumed available; other equipment must be selected in onboarding. */
export const BASE_EQUIPMENT: readonly Equipment[] = ['stovetop', 'oven', 'sheet_pan'];
export const TIME_TOLERANCE_MIN = 5;
export const RECENT_DAYS = 28;
export const REFLUX_GAP_MIN = 180;
export const LATE_DINNER_GAP_MIN = 90;

/** Penalties and bonuses, in "dollars" so they trade off directly against cost. */
export const WEIGHTS = {
  sameProteinAdjacent: 4,
  sameCuisineAdjacent: 3,
  recent: 6,
  disliked: 25,
  liked: -3,
  notKidFriendly: 3,
  perishableInWeekTwo: 1.5,
  sharedPerishable: -1.2,
  sharedPerishableCap: -4,
  jitter: 1.5,
} as const;

export type PlanInput = {
  recipes: readonly Recipe[];
  ingredients: ReadonlyMap<string, Ingredient>;
  tests: readonly TestDefinition[];
  weekStart: DayKey;
  nights: 7 | 14;
  /** 0 = Monday … 6 = Sunday. */
  cookDays: readonly number[];
  eatingOut: readonly DayKey[];
  household: number;
  kids: boolean;
  maxMinutes: number;
  equipment: readonly Equipment[];
  diet: Diet;
  allergens: readonly Allergen[];
  dislikes: readonly string[];
  glutenFree: boolean;
  safety: Safety;
  personal?: PersonalRules;
  testNights: Readonly<Record<DayKey, TestGroup>>;
  budget: number;
  prices: PriceContext;
  ownedPantry: readonly string[];
  /** "HH:mm" */
  bedtime: string;
  refluxTiming: boolean;
  history: readonly { recipeId: string; day: DayKey }[];
  feedback: Readonly<Record<string, 1 | -1>>;
  seed: string;
  shuffle?: number;
};

export type NightStatus = 'cook' | 'not_cooking' | 'eating_out';

export type PlannedNight = {
  day: DayKey;
  status: NightStatus;
  recipeId: string | null;
  testGroup: TestGroup | null;
  /** "HH:mm" or null when no timing rule applies. */
  eatBy: string | null;
};

export type PlanSuggestion =
  | { kind: 'swap'; day: DayKey; from: string; to: string; saves: number }
  | { kind: 'skip_night'; day: DayKey; saves: number };

export type WeekPlan = {
  weekStart: DayKey;
  nights: PlannedNight[];
  total: number;
  budget: number;
  overBudgetBy: number | null;
  suggestions: PlanSuggestion[];
};

// ------------------------------------------------------------------------------------- filtering

function dietOk(r: Recipe, diet: Diet): boolean {
  return diet === 'none' || r.derived.diets.includes(diet);
}

function safetyOk(r: Recipe, input: PlanInput): boolean {
  switch (input.safety) {
    case 'calm_gut':
      return r.derived.calmSafeGut;
    case 'calm_reflux':
      return r.derived.calmSafeReflux;
    case 'calm_both':
      return r.derived.calmSafeGut && r.derived.calmSafeReflux;
    case 'personal':
      return input.personal
        ? allowedInPersonalPlan(r, input.personal, input.tests, input.ingredients)
        : true;
    case 'gentle':
      return true;
  }
}

/** Recipes that pass every hard filter except time. */
export function eligibleRecipes(input: PlanInput): Recipe[] {
  const equipment = new Set([...BASE_EQUIPMENT, ...input.equipment]);
  const dislikes = new Set(input.dislikes);
  return input.recipes.filter(
    (r) =>
      safetyOk(r, input) &&
      dietOk(r, input.diet) &&
      !r.derived.allergens.some((a) => input.allergens.includes(a)) &&
      (!input.glutenFree || r.derived.glutenFree) &&
      !r.ingredients.some((i) => dislikes.has(i.ingredientId)) &&
      r.equipment.every((e) => equipment.has(e)),
  );
}

function canHost(r: Recipe, group: TestGroup, tests: readonly TestDefinition[]): boolean {
  const t = tests.find((x) => x.id === group);
  if (!t || t.hostType !== 'addon') return true; // side dishes and timing tests fit any dinner
  return r.testSlot?.canHost.includes(group) ?? false;
}

// ---------------------------------------------------------------------------------------- costing

type RecipeFacts = { cost: number; perishables: Set<string>; protein: string | null };

function recipeFacts(r: Recipe, input: PlanInput): RecipeFacts {
  let cost = 0;
  const perishables = new Set<string>();
  for (const ri of r.ingredients) {
    const ing = input.ingredients.get(ri.ingredientId);
    if (!ing) continue;
    if (ing.perishableDays !== undefined && ing.perishableDays <= 7) perishables.add(ing.id);
    if (input.ownedPantry.includes(ing.id)) continue;
    // Pro-rata cost at the best unit price: a fair proxy while choosing; the real total uses whole packs.
    const unit = ing.packs[0]!.unit;
    let best = Infinity;
    ing.packs.forEach((p, i) => {
      if (p.unit === unit) best = Math.min(best, packPrice(p, ing.id, i, input.prices) / p.size);
    });
    const qty = toPackUnit((ri.qty * input.household) / r.servingsBase, ri.unit, ing, unit);
    cost += qty * best;
  }
  return { cost, perishables, protein: r.derived.mainProtein };
}

/** Pro-rata cost of one dinner for the household (shown per dinner card, "est."). */
export function recipeCostEstimate(r: Recipe, input: PlanInput): number {
  return roundCents(recipeFacts(r, input).cost);
}

// ---------------------------------------------------------------------------------------- scoring

type Slot = { day: DayKey; index: number; testGroup: TestGroup | null };

class Planner {
  readonly slots: Slot[];
  readonly facts = new Map<string, RecipeFacts>();
  readonly pool: Recipe[];
  readonly byId: Map<string, Recipe>;
  readonly input: PlanInput;
  readonly seed: string;
  private weight = 1;
  /** Memoised unary scores per (slot index, recipe id); cleared when the cost weight changes. */
  private unary = new Map<string, number>();

  get costWeight(): number {
    return this.weight;
  }

  set costWeight(w: number) {
    this.weight = w;
    this.unary.clear();
  }

  constructor(input: PlanInput, seed: string) {
    this.input = input;
    this.seed = seed;
    const cookDays = new Set(input.cookDays);
    const eatingOut = new Set(input.eatingOut);
    this.slots = [];
    for (let i = 0; i < input.nights; i++) {
      const day = addDays(input.weekStart, i);
      if (!cookDays.has(weekday(day)) || eatingOut.has(day)) continue;
      this.slots.push({ day, index: i, testGroup: input.testNights[day] ?? null });
    }
    const eligible = eligibleRecipes(input);
    const timed = eligible.filter((r) => r.minutes <= input.maxMinutes + TIME_TOLERANCE_MIN);
    // Relax the time limit rather than repeat dinners or leave nights empty.
    this.pool = timed.length >= this.slots.length ? timed : eligible;
    this.byId = new Map(this.pool.map((r) => [r.id, r]));
    for (const r of this.pool) this.facts.set(r.id, recipeFacts(r, input));
  }

  fits(slot: Slot, r: Recipe): boolean {
    return slot.testGroup === null || canHost(r, slot.testGroup, this.input.tests);
  }

  candidates(slot: Slot): Recipe[] {
    return this.pool.filter((r) => this.fits(slot, r));
  }

  /** Cost of a recipe on a slot, ignoring neighbours (memoised). */
  unaryScore(slotIndex: number, r: Recipe): number {
    const key = `${slotIndex}|${r.id}`;
    const hit = this.unary.get(key);
    if (hit !== undefined) return hit;
    const score = this.computeUnary(this.slots[slotIndex]!, r);
    this.unary.set(key, score);
    return score;
  }

  private computeUnary(slot: Slot, r: Recipe): number {
    const f = this.facts.get(r.id)!;
    const input = this.input;
    let score = f.cost * this.costWeight;
    const last = input.history
      .filter((h) => h.recipeId === r.id)
      .map((h) => diffDays(h.day, slot.day))
      .filter((d) => d > 0 && d <= RECENT_DAYS);
    if (last.length > 0) score += WEIGHTS.recent * (1 - Math.min(...last) / (RECENT_DAYS + 1));
    const fb = input.feedback[r.id];
    if (fb === -1) score += WEIGHTS.disliked;
    if (fb === 1) score += WEIGHTS.liked;
    if (input.kids && !r.kidFriendly) score += WEIGHTS.notKidFriendly;
    if (input.nights === 14 && slot.index >= 7)
      score += WEIGHTS.perishableInWeekTwo * f.perishables.size;
    score += (hashString(`${this.seed}|${slot.day}|${r.id}`) / 4294967296) * WEIGHTS.jitter;
    return score;
  }

  /** Total objective of an assignment (slot index → recipe id). */
  total(assign: readonly (string | null)[]): number {
    let score = 0;
    const perishCount = new Map<string, number>();
    assign.forEach((id, i) => {
      if (!id) return;
      const r = this.byId.get(id)!;
      score += this.unaryScore(i, r);
      for (const p of this.facts.get(id)!.perishables)
        perishCount.set(p, (perishCount.get(p) ?? 0) + 1);
    });
    // Adjacent (consecutive calendar nights) variety.
    for (let i = 1; i < assign.length; i++) {
      const a = assign[i - 1];
      const b = assign[i];
      if (!a || !b) continue;
      if (diffDays(this.slots[i - 1]!.day, this.slots[i]!.day) !== 1) continue;
      const fa = this.facts.get(a)!;
      const fb = this.facts.get(b)!;
      if (fa.protein && fa.protein === fb.protein) score += WEIGHTS.sameProteinAdjacent;
      if (this.byId.get(a)!.cuisine === this.byId.get(b)!.cuisine)
        score += WEIGHTS.sameCuisineAdjacent;
    }
    // Reward shared perishables (less waste), capped per recipe pair-ish.
    let shared = 0;
    for (const n of perishCount.values()) if (n > 1) shared += (n - 1) * WEIGHTS.sharedPerishable;
    score += Math.max(shared, WEIGHTS.sharedPerishableCap * Math.max(1, assign.length / 2));
    return score;
  }

  /** Variety penalty between two dinners on consecutive calendar nights. */
  private pairPenalty(i: number, j: number, a: string | null, b: string | null): number {
    if (!a || !b) return 0;
    if (Math.abs(diffDays(this.slots[i]!.day, this.slots[j]!.day)) !== 1) return 0;
    const fa = this.facts.get(a)!;
    const fb = this.facts.get(b)!;
    let p = 0;
    if (fa.protein && fa.protein === fb.protein) p += WEIGHTS.sameProteinAdjacent;
    if (this.byId.get(a)!.cuisine === this.byId.get(b)!.cuisine) p += WEIGHTS.sameCuisineAdjacent;
    return p;
  }

  /** Score change from neighbours and unary terms only (perishable sharing excluded). */
  private localDelta(assign: readonly (string | null)[], i: number, next: string): number {
    const prev = assign[i] ?? null;
    let d =
      this.unaryScore(i, this.byId.get(next)!) -
      (prev ? this.unaryScore(i, this.byId.get(prev)!) : 0);
    for (const j of [i - 1, i + 1]) {
      if (j < 0 || j >= assign.length) continue;
      d +=
        this.pairPenalty(i, j, next, assign[j] ?? null) -
        this.pairPenalty(i, j, prev, assign[j] ?? null);
    }
    return d;
  }

  /** The most the perishable-sharing bonus could improve by from adding `id`. */
  private maxShareGain(id: string): number {
    return -WEIGHTS.sharedPerishable * this.facts.get(id)!.perishables.size;
  }

  greedy(): (string | null)[] {
    const assign: (string | null)[] = this.slots.map(() => null);
    const used = new Set<string>();
    // Constrained (test) nights first.
    const order = this.slots
      .map((s, i) => i)
      .sort(
        (a, b) =>
          Number(this.slots[b]!.testGroup !== null) - Number(this.slots[a]!.testGroup !== null) ||
          a - b,
      );
    for (const i of order) {
      const slot = this.slots[i]!;
      let best: string | null = null;
      let bestScore = Infinity;
      const base = this.total(assign);
      for (const r of this.candidates(slot)) {
        if (used.has(r.id)) continue;
        // Cheap bound first; only score fully when this candidate could win.
        if (base + this.localDelta(assign, i, r.id) - this.maxShareGain(r.id) >= bestScore)
          continue;
        const trial = [...assign];
        trial[i] = r.id;
        const s = this.total(trial);
        if (s < bestScore) {
          bestScore = s;
          best = r.id;
        }
      }
      // Pool exhausted: allow a repeat rather than an empty night.
      if (!best) best = this.candidates(slot)[0]?.id ?? null;
      assign[i] = best;
      if (best) used.add(best);
    }
    return assign;
  }

  improve(assign: (string | null)[], passes = 2): (string | null)[] {
    let current = [...assign];
    let currentScore = this.total(current);
    for (let pass = 0; pass < passes; pass++) {
      let improved = false;
      // Swap two nights.
      for (let i = 0; i < current.length; i++) {
        for (let j = i + 1; j < current.length; j++) {
          const a = current[i];
          const b = current[j];
          if (!a || !b) continue;
          if (
            !this.fits(this.slots[i]!, this.byId.get(b)!) ||
            !this.fits(this.slots[j]!, this.byId.get(a)!)
          )
            continue;
          const trial = [...current];
          trial[i] = b;
          trial[j] = a;
          const s = this.total(trial);
          if (s < currentScore - 1e-9) {
            current = trial;
            currentScore = s;
            improved = true;
          }
        }
      }
      // Replace one night with an unused recipe.
      for (let i = 0; i < current.length; i++) {
        const used = new Set(current.filter((x): x is string => x !== null));
        for (const r of this.candidates(this.slots[i]!)) {
          if (used.has(r.id)) continue;
          if (this.localDelta(current, i, r.id) - this.maxShareGain(r.id) >= 0) continue;
          const trial = [...current];
          trial[i] = r.id;
          const s = this.total(trial);
          if (s < currentScore - 1e-9) {
            current = trial;
            currentScore = s;
            used.delete(current[i] ?? '');
            used.add(r.id);
            improved = true;
          }
        }
      }
      if (!improved) break;
    }
    return current;
  }
}

// ---------------------------------------------------------------------------------------- output

export function eatByTime(bedtime: string, gapMinutes: number): string {
  const { hour12, minute, period } = parseTime(bedtime);
  const total =
    (((hour12 % 12) + (period === 'pm' ? 12 : 0)) * 60 + minute - gapMinutes + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  return toTime(h24 % 12 === 0 ? 12 : h24 % 12, total % 60, h24 >= 12 ? 'pm' : 'am');
}

function groceryFor(
  input: PlanInput,
  recipeIds: readonly string[],
  byId: ReadonlyMap<string, Recipe>,
): GroceryList {
  const recipes = recipeIds.map((id) => byId.get(id)).filter((r): r is Recipe => r !== undefined);
  const needs = needsForRecipes(recipes, input.household);
  // Test foods (one person's portion per dose night) go on the list too.
  for (const [day, group] of Object.entries(input.testNights)) {
    if (diffDays(input.weekStart, day) < 0 || diffDays(input.weekStart, day) >= input.nights)
      continue;
    const dose = input.tests.find((t) => t.id === group)?.doses[2];
    if (dose?.ingredientId && dose.qty !== undefined && dose.unit) {
      needs.push({
        ingredientId: dose.ingredientId,
        qty: dose.qty,
        unit: dose.unit,
        usedBy: `test:${group}`,
      });
    }
  }
  return buildGroceryList(needs, input.ingredients, input.prices, {
    ownedPantry: input.ownedPantry,
    budget: input.budget,
  });
}

function nightsFrom(
  input: PlanInput,
  planner: Planner,
  assign: readonly (string | null)[],
): PlannedNight[] {
  const cookDays = new Set(input.cookDays);
  const eatingOut = new Set(input.eatingOut);
  const bySlotDay = new Map(planner.slots.map((s, i) => [s.day, assign[i] ?? null]));
  return Array.from({ length: input.nights }, (_, i) => {
    const day = addDays(input.weekStart, i);
    const testGroup = input.testNights[day] ?? null;
    const status: NightStatus = eatingOut.has(day)
      ? 'eating_out'
      : cookDays.has(weekday(day))
        ? 'cook'
        : 'not_cooking';
    const late = testGroup === 'late_dinner';
    return {
      day,
      status,
      recipeId: status === 'cook' ? (bySlotDay.get(day) ?? null) : null,
      testGroup: status === 'cook' ? testGroup : null,
      eatBy:
        status !== 'cook'
          ? null
          : late
            ? eatByTime(input.bedtime, LATE_DINNER_GAP_MIN)
            : input.refluxTiming
              ? eatByTime(input.bedtime, REFLUX_GAP_MIN)
              : null,
    };
  });
}

export function generatePlan(input: PlanInput): WeekPlan {
  const seed = `${input.seed}|${input.weekStart}|${input.shuffle ?? 0}`;
  const planner = new Planner(input, seed);
  let assign = planner.improve(planner.greedy());
  let list = groceryFor(
    input,
    assign.filter((x): x is string => x !== null),
    planner.byId,
  );

  // Over budget: lean harder on cost.
  for (const weight of [3, 8]) {
    if (list.total <= input.budget) break;
    planner.costWeight = weight;
    const next = planner.improve(planner.greedy());
    const nextList = groceryFor(
      input,
      next.filter((x): x is string => x !== null),
      planner.byId,
    );
    if (nextList.total < list.total) {
      assign = next;
      list = nextList;
    }
  }

  const nights = nightsFrom(input, planner, assign);
  const over = list.total > input.budget ? roundCents(list.total - input.budget) : null;
  const plan: WeekPlan = {
    weekStart: input.weekStart,
    nights,
    total: list.total,
    budget: input.budget,
    overBudgetBy: over,
    suggestions: [],
  };
  if (over !== null) plan.suggestions = budgetSuggestions(input, plan);
  return plan;
}

/** Grocery list for a plan (whole packs, test foods included). */
export function planGroceries(input: PlanInput, plan: WeekPlan): GroceryList {
  const byId = new Map(input.recipes.map((r) => [r.id, r]));
  return groceryFor(
    input,
    plan.nights.map((n) => n.recipeId).filter((x): x is string => x !== null),
    byId,
  );
}

/** Up to `n` alternatives for one night, cheapest-objective first, with the change in weekly total. */
export function swapOptions(
  input: PlanInput,
  plan: WeekPlan,
  day: DayKey,
  n = 3,
): { recipeId: string; priceDelta: number }[] {
  const planner = new Planner(input, `${input.seed}|${input.weekStart}|${input.shuffle ?? 0}`);
  const slotIndex = planner.slots.findIndex((s) => s.day === day);
  const slot = planner.slots[slotIndex];
  if (!slot) return [];
  const assign = planner.slots.map(
    (s) => plan.nights.find((x) => x.day === s.day)?.recipeId ?? null,
  );
  const used = new Set(assign.filter((x): x is string => x !== null));
  const ranked = planner
    .candidates(slot)
    .filter((r) => !used.has(r.id))
    .map((r) => {
      const trial = [...assign];
      trial[slotIndex] = r.id;
      return { r, score: planner.total(trial), trial };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n);
  return ranked.map(({ r, trial }) => ({
    recipeId: r.id,
    priceDelta: roundCents(
      groceryFor(
        input,
        trial.filter((x): x is string => x !== null),
        planner.byId,
      ).total - plan.total,
    ),
  }));
}

/** Replaces one night's dinner. */
export function applySwap(
  input: PlanInput,
  plan: WeekPlan,
  day: DayKey,
  recipeId: string,
): WeekPlan {
  const nights = plan.nights.map((n) =>
    n.day === day && n.status === 'cook' ? { ...n, recipeId } : n,
  );
  const next = { ...plan, nights };
  const total = planGroceries(input, next).total;
  return {
    ...next,
    total,
    overBudgetBy: total > input.budget ? roundCents(total - input.budget) : null,
  };
}

function budgetSuggestions(input: PlanInput, plan: WeekPlan): PlanSuggestion[] {
  const out: PlanSuggestion[] = [];
  // 1) The single swap that saves the most.
  let bestSwap: PlanSuggestion | null = null;
  for (const night of plan.nights) {
    if (night.status !== 'cook' || !night.recipeId) continue;
    for (const opt of swapOptions(input, plan, night.day, 5)) {
      if (opt.priceDelta < 0 && (!bestSwap || -opt.priceDelta > bestSwap.saves)) {
        bestSwap = {
          kind: 'swap',
          day: night.day,
          from: night.recipeId,
          to: opt.recipeId,
          saves: roundCents(-opt.priceDelta),
        };
      }
    }
  }
  if (bestSwap) out.push(bestSwap);
  // 2) Skipping the most expensive non-test night (eat leftovers or eat out).
  const byId = new Map(input.recipes.map((r) => [r.id, r]));
  let bestSkip: PlanSuggestion | null = null;
  for (const night of plan.nights) {
    if (night.status !== 'cook' || !night.recipeId || night.testGroup) continue;
    const others = plan.nights
      .filter((x) => x.day !== night.day)
      .map((x) => x.recipeId)
      .filter((x): x is string => x !== null);
    const saves = roundCents(plan.total - groceryFor(input, others, byId).total);
    if (!bestSkip || saves > bestSkip.saves)
      bestSkip = { kind: 'skip_night', day: night.day, saves };
  }
  if (bestSkip) out.push(bestSkip);
  return out.slice(0, 2);
}
