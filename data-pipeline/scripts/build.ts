/**
 * Builds /assets/data from the authored sources: validates every item against its schema, derives
 * recipe tags from the ingredient master, writes versioned JSON, then runs the validator.
 * Usage: npm run content:build
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import {
  CardsFile,
  ChainsFile,
  Ingredient,
  PricesFile,
  Recipe,
  RecipeSource,
  RegionsFile,
  SkincareFile,
  Staples,
  TestsFile,
} from '../../src/data/content/schema.ts';
import { applyBls, regionMultipliers, type BlsSnapshot } from '../lib/bls.ts';
import { checkContent } from '../lib/coverage.ts';
import { deriveRecipe } from '../lib/derive.ts';
import { DATA_DIR } from '../lib/load.ts';
import { cards } from '../source/cards.ts';
import { extraIngredients } from '../source/ingredients-extra.ts';
import { freshIngredients } from '../source/ingredients-fresh.ts';
import { shelfIngredients } from '../source/ingredients-shelf.ts';
import { blsCandidates, chains, pricesFor, regions as regionsSource } from '../source/places.ts';
import { recipesCalmBoth } from '../source/recipes-calm-both.ts';
import { recipesCalmGut } from '../source/recipes-calm-gut.ts';
import { recipesCalmReflux } from '../source/recipes-calm-reflux.ts';
import { recipesEveryday } from '../source/recipes-everyday.ts';
import { skincare } from '../source/skincare.ts';
import { staples } from '../source/staples.ts';
import { testsFile } from '../source/tests.ts';

const authoredIngredients = z
  .array(Ingredient)
  .parse([...freshIngredients, ...shelfIngredients, ...extraIngredients])
  .sort((a, b) => a.id.localeCompare(b.id));

// Apply the latest BLS snapshot if `npm run content:prices` has been run.
const today = new Date().toISOString().slice(0, 10);
const blsPath = join(import.meta.dirname, '..', 'source', 'bls-prices.json');
const snapshot: BlsSnapshot | null = existsSync(blsPath)
  ? (JSON.parse(readFileSync(blsPath, 'utf8')) as BlsSnapshot)
  : null;
const estimated = pricesFor(
  authoredIngredients.map((i) => i.id),
  today,
);
const { ingredients, prices } = snapshot
  ? applyBls(authoredIngredients, estimated, snapshot)
  : { ingredients: authoredIngredients, prices: estimated };
const regions = snapshot
  ? {
      ...regionsSource,
      multipliers: regionMultipliers(
        Object.values(blsCandidates).map((c) => c.series),
        snapshot,
        regionsSource.multipliers,
      ),
    }
  : regionsSource;

const ingMap = new Map(ingredients.map((i) => [i.id, i]));

const sources = z
  .array(RecipeSource)
  .parse([...recipesCalmBoth, ...recipesCalmGut, ...recipesCalmReflux, ...recipesEveryday]);
const recipes = z
  .array(Recipe)
  .parse(sources.map((r) => ({ ...r, derived: deriveRecipe(r, ingMap) })));

const files: Record<string, unknown> = {
  'ingredients.json': ingredients,
  'recipes.json': recipes,
  'tests.json': TestsFile.parse(testsFile),
  'staples.json': Staples.parse({ items: staples }),
  'cards.json': CardsFile.parse({ cards }),
  'prices.json': PricesFile.parse(prices),
  'regions.json': RegionsFile.parse(regions),
  'chains.json': ChainsFile.parse(chains),
  'skincare.json': SkincareFile.parse(skincare),
};

// Content version = hash of the content (excluding dates), so it only changes when content does.
const hashInput = JSON.stringify({
  ...files,
  'prices.json': { ...(files['prices.json'] as object), updatedAt: '' },
});
const contentVersion = `1.${createHash('sha256').update(hashInput).digest('hex').slice(0, 8)}`;

mkdirSync(DATA_DIR, { recursive: true });
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(DATA_DIR, name), `${JSON.stringify(data, null, 1)}\n`);
}
writeFileSync(
  join(DATA_DIR, 'manifest.json'),
  `${JSON.stringify(
    {
      contentVersion,
      builtAt: today,
      counts: {
        ingredients: ingredients.length,
        recipes: recipes.length,
        tests: testsFile.tests.length,
        staples: staples.length,
        cards: cards.length,
        skinProducts: skincare.products.length,
      },
      attribution: [],
    },
    null,
    1,
  )}\n`,
);

const result = checkContent({
  ingredients,
  recipes,
  tests: testsFile,
  staples,
  cards,
  prices: files['prices.json'] as z.infer<typeof PricesFile>,
  regions,
  chains,
});
console.log(`Built content ${contentVersion} → assets/data`);
if (result.errors.length > 0) {
  console.error(`\n${result.errors.length} problem(s):\n  ${result.errors.join('\n  ')}`);
  process.exit(1);
}
console.log('Run `npm run content:validate` for the full coverage report.');
