import { content, ingredientMap } from '@/data/content';
import { emptyAnswers, testsToSkip, type Answers } from '@/engines/onboarding';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';

const tests = content.tests.tests;
const base: Answers = {
  ...emptyAnswers,
  birthYear: 1990,
  symptoms: ['bloating', 'heartburn'],
  diet: 'none',
  maxMinutes: 30,
  zip: '60614',
  chainId: 'kroger',
  stores: ['kroger'],
  budget: 90,
  consent: true,
};

function queuedGroups(a: Answers): string[] {
  return buildFirstWeek(a, '2026-11-01', 'seed').program.queue.map((q) => q.group);
}

describe('food tests respect diet and allergies', () => {
  it('skips tests whose foods contain a listed allergen', () => {
    expect(testsToSkip('none', ['milk'], tests, ingredientMap)).toContain('lactose');
    expect(testsToSkip('none', ['wheat'], tests, ingredientMap)).toContain('wheat');
    expect(queuedGroups({ ...base, allergens: ['milk'] })).not.toContain('lactose');
  });

  it('skips tests outside the diet: no bacon for vegetarians, no milk or honey for vegans', () => {
    expect(testsToSkip('vegetarian', [], tests, ingredientMap)).toContain('fatty');
    const vegan = testsToSkip('vegan', [], tests, ingredientMap);
    expect(vegan).toEqual(expect.arrayContaining(['lactose', 'fatty']));
    expect(queuedGroups({ ...base, diet: 'vegetarian' })).not.toContain('fatty');
  });

  it('keeps every test for someone with no restrictions, and never drops the placebo', () => {
    expect(testsToSkip('none', [], tests, ingredientMap)).toEqual([]);
    expect(queuedGroups({ ...base, diet: 'vegan', allergens: ['milk', 'wheat'] })).toContain(
      'control',
    );
  });
});
