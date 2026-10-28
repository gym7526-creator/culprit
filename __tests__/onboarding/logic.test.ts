import {
  ageFrom,
  ageGate,
  asksPregnancy,
  defaultBudget,
  detectProfile,
  emptyAnswers,
  programOptions,
  readyToBuild,
  safetyFor,
  setAsideGroups,
  suspectGroups,
  type Answers,
} from '@/engines/onboarding';
import { isVisible, nextStep, prevStep, progressOf, STEPS } from '@/features/onboarding/flow';

const YEAR = 2026;
const a = (over: Partial<Answers> = {}): Answers => ({ ...emptyAnswers, ...over });

describe('age rules (spec §2)', () => {
  it('blocks under 13, gates 13–17, allows 18+', () => {
    expect(ageGate(12)).toBe('blocked');
    expect(ageGate(13)).toBe('teen');
    expect(ageGate(17)).toBe('teen');
    expect(ageGate(18)).toBe('adult');
  });

  it('computes a conservative age from birth year', () => {
    expect(ageFrom(2008, YEAR)).toBe(17); // could be 18 later this year; treat as 17
    expect(ageGate(ageFrom(2013, YEAR))).toBe('blocked');
  });

  it('asks about pregnancy only for adults 18–55', () => {
    expect(asksPregnancy(17)).toBe(false);
    expect(asksPregnancy(30)).toBe(true);
    expect(asksPregnancy(56)).toBe(false);
  });
});

describe('profile', () => {
  it('detects fodmap, reflux and mixed', () => {
    expect(detectProfile(['bloating', 'gas'])).toBe('fodmap');
    expect(detectProfile(['heartburn'])).toBe('reflux');
    expect(detectProfile(['heartburn', 'bloating'])).toBe('mixed');
    expect(detectProfile([])).toBe('fodmap');
  });

  it('maps profiles to calm safety', () => {
    expect(safetyFor('fodmap')).toBe('calm_gut');
    expect(safetyFor('reflux')).toBe('calm_reflux');
    expect(safetyFor('mixed')).toBe('calm_both');
  });

  it('lists what is set aside during calm', () => {
    expect(setAsideGroups('fodmap')).toContain('garlic');
    expect(setAsideGroups('reflux')).toContain('coffee');
  });
});

describe('defaults and mapping', () => {
  it('defaults the budget from household size', () => {
    expect(defaultBudget(1)).toBe(60);
    expect(defaultBudget(2)).toBe(90);
    expect(defaultBudget(3)).toBe(115);
    expect(defaultBudget(4)).toBe(140);
    expect(defaultBudget(8)).toBe(240);
  });

  it('maps suspect chips to test groups', () => {
    expect(suspectGroups(['dairy', 'fruit', 'no_idea']).sort()).toEqual([
      'fructose',
      'lactose',
      'sorbitol',
    ]);
  });

  it('builds program options from answers', () => {
    const o = programOptions(
      a({
        birthYear: 1990,
        symptoms: ['heartburn', 'bloating'],
        mainSymptom: 'heartburn',
        knownFine: ['dairy'],
        celiac: true,
        alcoholOptIn: true,
        impact: 3,
      }),
      YEAR,
      'seed',
    );
    expect(o).toMatchObject({
      profile: 'mixed',
      refluxFirst: true,
      knownFine: ['lactose'],
      celiac: true,
      age: 35,
      alcoholOptIn: true,
      initialSeverity: 3,
    });
  });

  it('never opts a 20-year-old into the alcohol test', () => {
    expect(programOptions(a({ birthYear: 2005, alcoholOptIn: true }), YEAR, 's').alcoholOptIn).toBe(
      false,
    );
  });

  it('knows when there is enough to build a plan', () => {
    expect(readyToBuild(a())).toBe(false);
    expect(
      readyToBuild(
        a({
          birthYear: 1990,
          symptoms: ['gas'],
          diet: 'none',
          maxMinutes: 30,
          zip: '30301',
          chainId: 'walmart',
          budget: 90,
          consent: true,
        }),
      ),
    ).toBe(true);
  });
});

describe('flow', () => {
  it('skips the main-symptom question with a single symptom', () => {
    expect(nextStep('symptoms', a({ symptoms: ['gas'] }), YEAR)).toBe('frequency');
    expect(nextStep('symptoms', a({ symptoms: ['gas', 'heartburn'] }), YEAR)).toBe('main-symptom');
  });

  it('skips known-fine without real suspects', () => {
    expect(nextStep('suspects', a({ suspects: ['no_idea'] }), YEAR)).toBe('tried');
    expect(nextStep('suspects', a({ suspects: ['coffee'] }), YEAR)).toBe('known-fine');
  });

  it('shows pregnancy only when relevant', () => {
    expect(isVisible('pregnancy', a({ birthYear: 1995 }), YEAR)).toBe(true);
    expect(isVisible('pregnancy', a({ birthYear: 1960 }), YEAR)).toBe(false);
  });

  it('branch screens continue after their parent step', () => {
    expect(nextStep('red-flag-notice', a(), YEAR)).toBe('eating-disorder');
    expect(nextStep('ed-notice', a({ birthYear: 1990 }), YEAR)).toBe('pregnancy');
  });

  it('back skips hidden steps', () => {
    expect(prevStep('frequency', a({ symptoms: ['gas'] }), YEAR)).toBe('symptoms');
  });

  it('has a progress bar on question steps only', () => {
    expect(progressOf('welcome', a(), YEAR)).toBeNull();
    const p = progressOf('focus', a(), YEAR)!;
    expect(p.current).toBe(1);
    expect(p.total).toBeGreaterThan(20);
    expect(progressOf('how-it-works', a(), YEAR)?.current).toBe(p.total);
  });

  it('ends with the first week and save screens', () => {
    expect(STEPS.slice(-3)).toEqual(['building', 'first-week', 'save-progress']);
    expect(nextStep('save-progress', a(), YEAR)).toBeNull();
  });
});
