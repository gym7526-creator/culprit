import chainsJson from '../../assets/data/chains.json';
import cardsJson from '../../assets/data/cards.json';
import ingredientsJson from '../../assets/data/ingredients.json';
import pricesJson from '../../assets/data/prices.json';
import recipesJson from '../../assets/data/recipes.json';
import regionsJson from '../../assets/data/regions.json';
import staplesJson from '../../assets/data/staples.json';
import testsJson from '../../assets/data/tests.json';
import { checkContent, type Content } from '../../data-pipeline/lib/coverage';
import {
  CardsFile,
  ChainsFile,
  Ingredient,
  PricesFile,
  Recipe,
  RegionsFile,
  Staples,
  TestsFile,
} from '@/data/content/schema';
import { z } from 'zod';

function bundled(): Content {
  return {
    ingredients: z.array(Ingredient).parse(ingredientsJson),
    recipes: z.array(Recipe).parse(recipesJson),
    tests: TestsFile.parse(testsJson),
    staples: Staples.parse(staplesJson).items,
    cards: CardsFile.parse(cardsJson).cards,
    prices: PricesFile.parse(pricesJson),
    regions: RegionsFile.parse(regionsJson),
    chains: ChainsFile.parse(chainsJson),
  };
}

describe('bundled content', () => {
  it('passes schema validation and every coverage rule', () => {
    const { errors } = checkContent(bundled());
    expect(errors).toEqual([]);
  });

  it('never claims a BLS price without a fetched period', () => {
    for (const e of bundled().prices.entries) {
      if (e.method === 'bls') expect(e.blsPeriod).toBeTruthy();
    }
  });

  it('keeps the calm phase within 14–28 days', () => {
    const t = bundled().tests.protocol;
    expect(t.calmMinDays).toBe(14);
    expect(t.calmMaxDays).toBe(28);
  });

  it('gates the alcohol test to 21+ and opt-in', () => {
    const alcohol = bundled().tests.tests.find((t) => t.id === 'alcohol');
    expect(alcohol).toMatchObject({ minAge: 21, optIn: true });
  });

  it('only cites sources from the spec list', () => {
    const allowed = ['gloshospitals.nhs.uk', 'healio.com', 'gi.org', 'fodmapeveryday.com'];
    for (const c of bundled().cards) {
      if (c.sourceUrl) expect(allowed.some((d) => c.sourceUrl?.includes(d))).toBe(true);
    }
  });
});

describe('checkContent catches problems', () => {
  it('reports stale derived tags, unknown ingredients and unmet coverage', () => {
    const c = bundled();
    const first = c.recipes[0]!;
    const broken: Content = {
      ...c,
      recipes: [
        { ...first, derived: { ...first.derived, calmSafeGut: !first.derived.calmSafeGut } },
        {
          ...first,
          id: 'ghost',
          ingredients: [{ ingredientId: 'unicorn', qty: 1, unit: 'g' }, ...first.ingredients],
        },
      ],
    };
    const { errors } = checkContent(broken);
    expect(errors.some((e) => e.includes('stale or hand-edited'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown ingredient "unicorn"'))).toBe(true);
    expect(errors.some((e) => e.startsWith('Coverage: total dinners'))).toBe(true);
  });

  it('reports overlapping ZIP3 ranges and missing chains', () => {
    const c = bundled();
    const { errors } = checkContent({
      ...c,
      regions: { ...c.regions, zip3: [...c.regions.zip3, [100, 105, 'NY']] },
      chains: { ...c.chains, chains: c.chains.chains.filter((ch) => ch.id !== 'aldi') },
    });
    expect(errors.some((e) => e.includes('overlap'))).toBe(true);
    expect(errors).toContain('Chains: missing "aldi"');
  });

  it('reports a missing test group', () => {
    const c = bundled();
    const { errors } = checkContent({
      ...c,
      tests: { ...c.tests, tests: c.tests.tests.filter((t) => t.id !== 'garlic') },
    });
    expect(errors).toContain('Test library is missing group "garlic"');
  });
});
