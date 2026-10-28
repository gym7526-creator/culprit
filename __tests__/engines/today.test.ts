import { content } from '@/data/content';
import { addDays } from '@/engines/dates';
import { createProgram } from '@/engines/program';
import { cardOfTheDay, dayKind, nextTestStart, pickStaples } from '@/engines/today';

const today = '2026-10-28';
function program(profile: 'fodmap' | 'reflux' | 'mixed' = 'fodmap', gentle = false) {
  return createProgram(content.tests.order, content.tests.tests, {
    profile,
    refluxFirst: false,
    knownFine: [],
    selfReported: [],
    celiac: false,
    age: 30,
    alcoholOptIn: false,
    seed: 's',
    today,
    gentle,
    initialSeverity: 2,
  });
}

describe('today helpers', () => {
  it('projects calm days, then the first test', () => {
    const p = program();
    const tomorrow = addDays(today, 1);
    expect(dayKind(p, tomorrow).type).toBe('calm');
    const next = nextTestStart(p, today);
    expect(next).not.toBeNull();
    expect(next!.group).toBe(p.queue.find((q) => q.kind !== 'control')!.group);
  });

  it('has no tests in gentle mode', () => {
    expect(nextTestStart(program('fodmap', true), today)).toBeNull();
  });

  it('picks 2 breakfast + 2 lunch ideas that fit, stable per day', () => {
    const f = {
      phase: 'calm' as const,
      profile: 'fodmap' as const,
      gentle: false,
      diet: 'vegan' as const,
      allergens: ['peanut'],
    };
    const a = pickStaples(content.staples, f, today);
    expect(a.breakfast).toHaveLength(2);
    expect(a.lunch.length).toBeGreaterThan(0);
    for (const s of [...a.breakfast, ...a.lunch]) {
      expect(s.calmSafeGut).toBe(true);
      expect(s.diets).toContain('vegan');
      expect(s.allergens).not.toContain('peanut');
    }
    expect(pickStaples(content.staples, f, today)).toEqual(a);
  });

  it('shows one undismissed card at a time', () => {
    const p = program();
    const first = cardOfTheDay(content.cards, p, today, []);
    expect(first?.unlock).toBe('onboarding');
    const next = cardOfTheDay(content.cards, p, today, [first!.id]);
    expect(next?.id).not.toBe(first!.id);
  });
});
