/**
 * Finds the closest licensed stock photo for each recipe on Pexels (free for commercial use, no
 * attribution required, but we credit anyway), downloads it into assets/photos and regenerates
 * src/data/photos.ts.
 *
 *   PEXELS_API_KEY=... npm run content:photos            # only recipes without a photo
 *   PEXELS_API_KEY=... npm run content:photos -- --all   # re-pick every photo
 *
 * Get a free key at https://www.pexels.com/api/. Review the picks before shipping: search results
 * are a starting point, and a photo that doesn't match the dish should be replaced via
 * data-pipeline/source/photo-overrides.json ({ "<recipeId>": <pexelsPhotoId> }).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const recipesPath = join(root, 'assets', 'data', 'recipes.json');
const photosDir = join(root, 'assets', 'photos');
const creditsPath = join(root, 'data-pipeline', 'source', 'photo-credits.json');
const overridesPath = join(root, 'data-pipeline', 'source', 'photo-overrides.json');
const outPath = join(root, 'src', 'data', 'photos.ts');

type Credit = { photographer: string; url: string; pexelsId: number; query: string };
type PexelsPhoto = {
  id: number;
  url: string;
  photographer: string;
  src: { medium: string; large: string };
};

const key = process.env.PEXELS_API_KEY;
const all = process.argv.includes('--all');

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

async function pexels<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.pexels.com/v1/${path}`, {
    headers: { Authorization: key ?? '' },
  });
  if (!res.ok) throw new Error(`Pexels ${res.status} for ${path}`);
  return (await res.json()) as T;
}

/** "Ginger chicken rice bowls" → "ginger chicken rice bowl food". */
function queryFor(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} food`;
}

async function pick(recipeId: string, title: string, overrides: Record<string, number>) {
  const override = overrides[recipeId];
  if (override)
    return {
      photo: await pexels<PexelsPhoto>(`photos/${override}`),
      query: `override:${override}`,
    };
  const query = queryFor(title);
  const res = await pexels<{ photos: PexelsPhoto[] }>(
    `search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
  );
  return { photo: res.photos[0] ?? null, query };
}

function writeModule(credits: Record<string, Credit>): void {
  const ids = Object.keys(credits).sort();
  const lines = ids.map(
    (id) =>
      `  ${JSON.stringify(id)}: {\n    source: require('../../assets/photos/${id}.jpg'),\n    credit: ${JSON.stringify(`${credits[id]!.photographer} on Pexels`)},\n    url: ${JSON.stringify(credits[id]!.url)},\n  },`,
  );
  const body = `import type { ImageSourcePropType } from 'react-native';

/**
 * Licensed stock photos per recipe, written by \`npm run content:photos\` (Pexels API, free for
 * commercial use). Recipes without a photo use the gradient + emoji style. Credits are shown on the
 * recipe screen and listed in Settings → Data attribution. Do not edit by hand.
 */
export type RecipePhoto = { source: ImageSourcePropType; credit: string; url: string };

/* eslint-disable @typescript-eslint/no-require-imports */
export const recipePhotos: Readonly<Record<string, RecipePhoto>> = {
${lines.join('\n')}
};
`;
  writeFileSync(outPath, body);
}

async function main(): Promise<void> {
  if (!key) {
    console.error('Set PEXELS_API_KEY (free at https://www.pexels.com/api/).');
    process.exit(1);
  }
  mkdirSync(photosDir, { recursive: true });
  const recipes = JSON.parse(readFileSync(recipesPath, 'utf8')) as { id: string; title: string }[];
  const credits = readJson<Record<string, Credit>>(creditsPath, {});
  const overrides = readJson<Record<string, number>>(overridesPath, {});
  let added = 0;
  for (const r of recipes) {
    const file = join(photosDir, `${r.id}.jpg`);
    if (!all && credits[r.id] && existsSync(file) && !overrides[r.id]) continue;
    try {
      const { photo, query } = await pick(r.id, r.title, overrides);
      if (!photo) {
        console.warn(`No photo for ${r.id} (${query})`);
        continue;
      }
      const img = await fetch(photo.src.medium);
      if (!img.ok) throw new Error(`download ${img.status}`);
      writeFileSync(file, Buffer.from(await img.arrayBuffer()));
      credits[r.id] = {
        photographer: photo.photographer,
        url: photo.url,
        pexelsId: photo.id,
        query,
      };
      added++;
      console.log(`✓ ${r.id} ← ${photo.photographer} (${photo.url})`);
      // Pexels allows 200 requests/hour on the free tier.
      await new Promise((ok) => setTimeout(ok, 400));
    } catch (e) {
      console.warn(`✗ ${r.id}: ${(e as Error).message}`);
    }
  }
  writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`);
  writeModule(credits);
  console.log(`Done: ${added} new photos, ${Object.keys(credits).length} total.`);
}

void main();
