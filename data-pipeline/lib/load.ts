/** Reads and schema-validates the bundled content in /assets/data. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CardsFile,
  ChainsFile,
  Ingredient,
  Manifest,
  PricesFile,
  Recipe,
  RegionsFile,
  Staples,
  TestsFile,
} from '../../src/data/content/schema.ts';
import { z } from 'zod';

import type { Content } from './coverage.ts';

export const DATA_DIR = join(import.meta.dirname, '..', '..', 'assets', 'data');

function read<T>(file: string, schema: z.ZodType<T>): T {
  const raw: unknown = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`${file} failed schema validation:\n  ${first.join('\n  ')}`);
  }
  return parsed.data;
}

export function loadContent(): Content & { manifest: z.infer<typeof Manifest> } {
  return {
    ingredients: read('ingredients.json', z.array(Ingredient)),
    recipes: read('recipes.json', z.array(Recipe)),
    tests: read('tests.json', TestsFile),
    staples: read('staples.json', Staples).items,
    cards: read('cards.json', CardsFile).cards,
    prices: read('prices.json', PricesFile),
    regions: read('regions.json', RegionsFile),
    chains: read('chains.json', ChainsFile),
    manifest: read('manifest.json', Manifest),
  };
}
