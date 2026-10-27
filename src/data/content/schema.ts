/**
 * Content schemas (spec §5). Shared by the build pipeline (/data-pipeline) and the app.
 * Everything in /assets/data is validated against these at build time; the build fails otherwise.
 *
 * Imported by Node directly (type stripping), so: no enums, no namespaces, only `zod` as an import.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------------------------

export const LEVELS = ['none', 'low', 'moderate', 'high'] as const;
export const Level = z.enum(LEVELS);
export type Level = z.infer<typeof Level>;

export const FODMAP_GROUPS = [
  'fructan',
  'gos',
  'lactose',
  'fructose',
  'sorbitol',
  'mannitol',
] as const;
export const FodmapGroup = z.enum(FODMAP_GROUPS);
export type FodmapGroup = z.infer<typeof FodmapGroup>;

export const AISLES = [
  'produce',
  'bakery',
  'meat_seafood',
  'dairy',
  'frozen',
  'pantry',
  'international',
  'spices',
  'beverages',
] as const;
export const Aisle = z.enum(AISLES);
export type Aisle = z.infer<typeof Aisle>;

export const REFLUX_TAGS = [
  'caffeine',
  'alcohol',
  'chocolate',
  'mint',
  'citrus',
  'tomato',
  'high_fat',
  'fried',
  'spicy',
  'carbonation',
] as const;
export const RefluxTag = z.enum(REFLUX_TAGS);
export type RefluxTag = z.infer<typeof RefluxTag>;

export const SKIN_TAGS = ['dairy_milk', 'whey', 'high_glycemic'] as const;
export const SkinTag = z.enum(SKIN_TAGS);
export type SkinTag = z.infer<typeof SkinTag>;

export const ALLERGENS = [
  'milk',
  'egg',
  'fish',
  'shellfish',
  'tree_nut',
  'peanut',
  'wheat',
  'soy',
  'sesame',
] as const;
export const Allergen = z.enum(ALLERGENS);
export type Allergen = z.infer<typeof Allergen>;

export const DIET_TAGS = ['vegan', 'vegetarian', 'pescatarian'] as const;
export const DietTag = z.enum(DIET_TAGS);
export type DietTag = z.infer<typeof DietTag>;

export const PACK_UNITS = ['g', 'ml', 'each'] as const;
export const PackUnit = z.enum(PACK_UNITS);
export type PackUnit = z.infer<typeof PackUnit>;

export const RECIPE_UNITS = ['g', 'ml', 'each', 'tbsp', 'tsp', 'cup'] as const;
export const RecipeUnit = z.enum(RECIPE_UNITS);
export type RecipeUnit = z.infer<typeof RecipeUnit>;

export const EQUIPMENT = [
  'stovetop',
  'oven',
  'air_fryer',
  'slow_cooker',
  'instant_pot',
  'grill',
  'sheet_pan',
] as const;
export const Equipment = z.enum(EQUIPMENT);
export type Equipment = z.infer<typeof Equipment>;

export const CUISINES = [
  'american',
  'mexican',
  'italian',
  'asian',
  'mediterranean',
  'sheet_pan',
  'bowls',
  'soups',
] as const;
export const Cuisine = z.enum(CUISINES);
export type Cuisine = z.infer<typeof Cuisine>;

/** Reintroduction test groups (spec §5.4). `control` = placebo check. */
export const FODMAP_TEST_GROUPS = [
  'wheat',
  'onion',
  'garlic',
  'gos',
  'lactose',
  'fructose',
  'sorbitol',
  'mannitol',
] as const;
export const REFLUX_TEST_GROUPS = [
  'coffee',
  'tomato',
  'fatty',
  'spicy',
  'late_dinner',
  'chocolate',
  'citrus',
  'carbonation',
  'mint',
  'alcohol',
] as const;
export const TEST_GROUPS = [...FODMAP_TEST_GROUPS, ...REFLUX_TEST_GROUPS, 'control'] as const;
export const TestGroup = z.enum(TEST_GROUPS);
export type TestGroup = z.infer<typeof TestGroup>;

const id = z.string().regex(/^[a-z0-9_]+$/, 'ids are snake_case');
const url = z.string().url();

// ---------------------------------------------------------------------------------------------
// 5.1 Ingredients
// ---------------------------------------------------------------------------------------------

export const Pack = z.object({
  size: z.number().positive(),
  unit: PackUnit,
  basePriceUSD: z.number().positive(),
  storeBrand: z.boolean(),
});
export type Pack = z.infer<typeof Pack>;

export const FodmapProfile = z.object({
  fructan: Level,
  gos: Level,
  lactose: Level,
  fructose: Level,
  sorbitol: Level,
  mannitol: Level,
});
export type FodmapProfile = z.infer<typeof FodmapProfile>;

export const Ingredient = z.object({
  id,
  name: z.string().min(1),
  aisle: Aisle,
  /** Level at a typical serving. General public knowledge, NOT copied from Monash. */
  fodmap: FodmapProfile,
  /**
   * Optional per-serving amount (grams) at or below which a moderate/high item still counts as
   * low (e.g. avocado, canned lentils). Used by tag derivation.
   */
  fodmapSafeServingG: z.number().positive().optional(),
  reflux: z.array(RefluxTag),
  skin: z.array(SkinTag),
  allergens: z.array(Allergen),
  /** The strictest diets this ingredient fits (vegan implies vegetarian + pescatarian). */
  diets: z.array(DietTag),
  swaps: z.array(id).optional(),
  packs: z.array(Pack).min(1),
  pantryStaple: z.boolean().optional(),
  perishableDays: z.number().int().positive().optional(),
  /** Unit conversion for derivation + grocery math. */
  gPerMl: z.number().positive().optional(),
  gEach: z.number().positive().optional(),
  /** Approximate fat per 100 g (internal only, for the reflux moderate-fat cap; never shown). */
  fatPer100g: z.number().min(0).max(100),
  /** Main protein for plan variety scoring. */
  protein: z
    .enum([
      'chicken',
      'turkey',
      'beef',
      'pork',
      'fish',
      'shellfish',
      'egg',
      'tofu',
      'legume',
      'cheese',
    ])
    .optional(),
  note: z.string().optional(),
});
export type Ingredient = z.infer<typeof Ingredient>;

// ---------------------------------------------------------------------------------------------
// 5.2 Recipes
// ---------------------------------------------------------------------------------------------

export const RecipeIngredient = z.object({
  ingredientId: id,
  qty: z.number().positive(),
  unit: RecipeUnit,
  /** Shown in the ingredient list, e.g. "thinly sliced". */
  prep: z.string().optional(),
  optional: z.boolean().optional(),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredient>;

export const RecipeStep = z.object({
  text: z.string().min(8),
  timerSec: z.number().int().positive().optional(),
});
export type RecipeStep = z.infer<typeof RecipeStep>;

export const RecipeDerived = z.object({
  fodmapMax: z.record(FodmapGroup, Level),
  refluxTags: z.array(RefluxTag),
  allergens: z.array(Allergen),
  diets: z.array(DietTag),
  calmSafeGut: z.boolean(),
  calmSafeReflux: z.boolean(),
  lowGlycemic: z.boolean(),
  /** Supporting fields for the plan engine (also derived, never hand-edited). */
  mainProtein: z.string().nullable(),
  fatPerServingG: z.number(),
  glutenFree: z.boolean(),
});
export type RecipeDerived = z.infer<typeof RecipeDerived>;

/** What an author writes. Tags are never trusted from the author or an LLM. */
export const RecipeSource = z.object({
  id,
  title: z.string().min(3),
  cuisine: Cuisine,
  minutes: z.number().int().positive().max(240),
  difficulty: z.enum(['easy', 'medium']),
  servingsBase: z.number().int().min(1).max(8),
  equipment: z.array(Equipment).min(1),
  ingredients: z.array(RecipeIngredient).min(2),
  steps: z.array(RecipeStep).min(2),
  kidFriendly: z.boolean(),
  mild: z.boolean(),
  /** Leftovers work as tomorrow's lunch (spec §5.3). */
  leftoverFriendly: z.boolean().optional(),
  testSlot: z.object({ canHost: z.array(TestGroup).min(1) }).optional(),
  /** "<gradientKey>:<emoji>", e.g. "asian:🥢" (MVP image style: gradient + emoji). */
  imageKey: z.string().regex(/^[a-zA-Z]+:.+$/),
});
export type RecipeSource = z.infer<typeof RecipeSource>;

export const Recipe = RecipeSource.extend({ derived: RecipeDerived });
export type Recipe = z.infer<typeof Recipe>;

// ---------------------------------------------------------------------------------------------
// 5.3 Staples (breakfast / lunch / snack ideas)
// ---------------------------------------------------------------------------------------------

export const StaplePhase = z.enum(['calm', 'testing', 'personal']);
export const StapleItem = z.object({
  id,
  kind: z.enum(['breakfast', 'lunch', 'snack']),
  text: z.string().min(5),
  /** Phases this suggestion is appropriate for. */
  phases: z.array(StaplePhase).min(1),
  calmSafeGut: z.boolean(),
  calmSafeReflux: z.boolean(),
  diets: z.array(DietTag),
  allergens: z.array(Allergen),
  snackCategory: z.enum(['crunchy', 'sweet', 'protein', 'fruit']).optional(),
});
export type StapleItem = z.infer<typeof StapleItem>;
export const Staples = z.object({ items: z.array(StapleItem) });

// ---------------------------------------------------------------------------------------------
// 5.4 Tests (reintroduction library)
// ---------------------------------------------------------------------------------------------

export const TestDose = z.object({
  /** Human portion text, e.g. "¼ clove garlic". */
  portion: z.string(),
  /** Machine quantity for grocery math. Absent for timing tests (late dinner). */
  ingredientId: id.optional(),
  qty: z.number().positive().optional(),
  unit: RecipeUnit.optional(),
});
export type TestDose = z.infer<typeof TestDose>;

export const TestDefinition = z.object({
  id: TestGroup,
  name: z.string(),
  kind: z.enum(['fodmap', 'reflux', 'control']),
  /** addon = goes into tonight's dinner; side = eaten alongside/at another time; timing = when you eat. */
  hostType: z.enum(['addon', 'side', 'timing']),
  /** Suspect chips from onboarding O7 that map to this test (for skips / prioritising). */
  suspectChips: z.array(z.string()),
  /** Day 1 / 2 / 3 doses (escalating: 1×, 2×, 3×). */
  doses: z.array(TestDose).length(3),
  howTo: z.string(),
  whyThisAmount: z.string(),
  /** Symptom chips that count as a "matching" reaction (spec §6.3). */
  matchingSymptoms: z.array(z.string()).min(1),
  minAge: z.number().int().optional(),
  optIn: z.boolean().optional(),
  /** Gluten-free / celiac users never get this test. */
  skipForCeliac: z.boolean().optional(),
});
export type TestDefinition = z.infer<typeof TestDefinition>;

export const ControlFood = z.object({
  id,
  portion: z.string(),
  ingredientId: id,
  qty: z.number().positive(),
  unit: RecipeUnit,
});

export const TestOrder = z.object({
  fodmap: z.array(TestGroup),
  reflux: z.array(TestGroup),
  /** Insert one control per this many real tests. */
  controlEvery: z.number().int().positive(),
});

export const TestsFile = z.object({
  protocol: z.object({
    doseDays: z.number().int(),
    calmDaysBetween: z.number().int(),
    calmMinDays: z.number().int(),
    calmMaxDays: z.number().int(),
    source: url,
  }),
  order: TestOrder,
  tests: z.array(TestDefinition),
  controls: z.array(ControlFood).min(1),
});
export type TestsFile = z.infer<typeof TestsFile>;

// ---------------------------------------------------------------------------------------------
// 5.5 Prices, regions, chains
// ---------------------------------------------------------------------------------------------

export const REGIONS = ['northeast', 'midwest', 'south', 'west'] as const;
export const Region = z.enum(REGIONS);
export type Region = z.infer<typeof Region>;

export const PriceEntry = z.object({
  ingredientId: id,
  /** 'estimate' until the BLS refresh script has matched a series. */
  method: z.enum(['estimate', 'bls']),
  blsSeries: z.string().optional(),
  /** The unit the BLS series is priced in, for converting to our packs. */
  blsUnit: z.enum(['lb', 'dozen', 'gal', 'each']).optional(),
  blsPeriod: z.string().optional(),
  note: z.string().optional(),
});

export const PricesFile = z.object({
  updatedAt: z.string(),
  basis: z.string(),
  entries: z.array(PriceEntry),
});
export type PricesFile = z.infer<typeof PricesFile>;

export const RegionsFile = z.object({
  basis: z.string(),
  multipliers: z.record(Region, z.number().positive()),
  stateToRegion: z.record(z.string().length(2), Region),
  /** ZIP3 ranges → state. Inclusive, 3-digit prefixes. */
  zip3: z.array(z.tuple([z.number().int(), z.number().int(), z.string().length(2)])),
});
export type RegionsFile = z.infer<typeof RegionsFile>;

export const Chain = z.object({
  id,
  name: z.string(),
  index: z.number().positive(),
  /** Where it's common, to order the O13 list ("all" = nationwide). */
  regions: z.array(z.union([Region, z.literal('all')])).min(1),
  states: z.array(z.string().length(2)).optional(),
});
export const ChainsFile = z.object({ basis: z.string(), chains: z.array(Chain) });
export type ChainsFile = z.infer<typeof ChainsFile>;

// ---------------------------------------------------------------------------------------------
// 5.6 Education cards
// ---------------------------------------------------------------------------------------------

export const EduCard = z.object({
  id,
  title: z.string(),
  body: z.string().min(40),
  /** Unlock point in the program. */
  unlock: z.enum(['onboarding', 'calm', 'testing', 'personal']),
  unlockDay: z.number().int().min(0),
  profiles: z.array(z.enum(['fodmap', 'reflux', 'mixed'])).min(1),
  sourceUrl: url.optional(),
  sourceLabel: z.string().optional(),
});
export type EduCard = z.infer<typeof EduCard>;
export const CardsFile = z.object({ cards: z.array(EduCard) });

// ---------------------------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------------------------

export const Manifest = z.object({
  contentVersion: z.string(),
  builtAt: z.string(),
  counts: z.record(z.string(), z.number()),
  attribution: z.array(z.string()),
});
export type Manifest = z.infer<typeof Manifest>;
