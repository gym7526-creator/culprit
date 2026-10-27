import type { Ingredient, RecipeSource } from '@/data/content/schema';

const none = {
  fructan: 'none',
  gos: 'none',
  lactose: 'none',
  fructose: 'none',
  sorbitol: 'none',
  mannitol: 'none',
} as const;

export function ing(id: string, over: Partial<Ingredient> = {}): Ingredient {
  return {
    id,
    name: id,
    aisle: 'produce',
    fodmap: { ...none },
    reflux: [],
    skin: [],
    allergens: [],
    diets: ['vegan', 'vegetarian', 'pescatarian'],
    packs: [{ size: 100, unit: 'g', basePriceUSD: 1, storeBrand: true }],
    fatPer100g: 0,
    ...over,
  };
}

export function recipe(
  id: string,
  items: RecipeSource['ingredients'],
  over: Partial<RecipeSource> = {},
): RecipeSource {
  return {
    id,
    title: id,
    cuisine: 'american',
    minutes: 20,
    difficulty: 'easy',
    servingsBase: 4,
    equipment: ['stovetop'],
    ingredients: items,
    steps: [{ text: 'Cook everything.' }, { text: 'Serve it warm.' }],
    kidFriendly: false,
    mild: true,
    imageKey: 'american:🍲',
    ...over,
  };
}
