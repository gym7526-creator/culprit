/**
 * Bundled content (spec §5), built and validated by the data pipeline. Loaded once into memory;
 * the build guarantees the shapes, so no runtime parsing is needed here.
 */
import cardsJson from '../../../assets/data/cards.json';
import chainsJson from '../../../assets/data/chains.json';
import ingredientsJson from '../../../assets/data/ingredients.json';
import manifestJson from '../../../assets/data/manifest.json';
import recipesJson from '../../../assets/data/recipes.json';
import regionsJson from '../../../assets/data/regions.json';
import skincareJson from '../../../assets/data/skincare.json';
import staplesJson from '../../../assets/data/staples.json';
import testsJson from '../../../assets/data/tests.json';

import type {
  ChainsFile,
  EduCard,
  Ingredient,
  Manifest,
  Recipe,
  RegionsFile,
  SkincareFile,
  StapleItem,
  TestsFile,
} from './schema';

// JSON imports widen tuples and enums; the pipeline has already validated these shapes.
export const content = {
  manifest: manifestJson as unknown as Manifest,
  ingredients: ingredientsJson as unknown as Ingredient[],
  recipes: recipesJson as unknown as Recipe[],
  tests: testsJson as unknown as TestsFile,
  staples: (staplesJson as unknown as { items: StapleItem[] }).items,
  cards: (cardsJson as unknown as { cards: EduCard[] }).cards,
  regions: regionsJson as unknown as RegionsFile,
  chains: chainsJson as unknown as ChainsFile,
  skincare: skincareJson as unknown as SkincareFile,
};

export const ingredientMap: ReadonlyMap<string, Ingredient> = new Map(
  content.ingredients.map((i) => [i.id, i]),
);
export const recipeMap: ReadonlyMap<string, Recipe> = new Map(
  content.recipes.map((r) => [r.id, r]),
);
