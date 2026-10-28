import { addDays, rangeDays } from '@/engines/dates';
import {
  computeBaseline,
  mean,
  nearestControl,
  scoreTest,
  selfReportedResult,
  stdDev,
  toControlSignal,
  type ControlSignal,
  type ScoredTest,
} from '@/engines/scoring';
import type { CheckIn, Score, Symptom, UnusualReason } from '@/engines/types';

const START = '2026-03-01';
/** Calm days 1–10 before the test. */
const CALM = rangeDays(START, 10);
const T1 = addDays(START, 10); // first dose day

function ci(
  day: string,
  score: Score,
  extra: { symptoms?: Symptom[]; unusual?: UnusualReason[]; taken?: boolean | null } = {},
): CheckIn {
  return {
    day,
    score,
    symptoms: extra.symptoms ?? [],
    unusual: extra.unusual ?? [],
    testFoodTaken: extra.taken ?? null,
  };
}

/** Builds a check-in map: calm days at `calm` score, then the given scores from T1 onward. */
function history(calm: Score | Score[], after: (Score | CheckIn | null)[]): Map<string, CheckIn> {
  const m = new Map<string, CheckIn>();
  CALM.forEach((d, i) =>
    m.set(d, ci(d, Array.isArray(calm) ? (calm[i % calm.length] as Score) : calm)),
  );
  after.forEach((s, i) => {
    const d = addDays(T1, i);
    if (s === null) return;
    m.set(d, typeof s === 'number' ? ci(d, s) : { ...s, day: d });
  });
  return m;
}

const PORTIONS = ['¼ clove garlic', '½ clove garlic', '¾ clove garlic'];

function garlicTest(
  doseDays = [T1, addDays(T1, 1), addDays(T1, 2)],
  kind: ScoredTest['kind'] = 'real',
): ScoredTest {
  return {
    id: 't1',
    group: 'garlic',
    kind,
    doseDays,
    portions: PORTIONS,
    matchingSymptoms: ['bloating', 'gas', 'pain'],
  };
}

describe('baseline', () => {
  it('uses the mean of the last 5 valid calm days', () => {
    const m = history([1, 1, 1, 1, 1, 0, 0, 0, 0, 0], []);
    expect(computeBaseline(CALM, m, T1)).toEqual({ baseline: 0, sd: 0, n: 5 });
  });

  it('skips unusual days', () => {
    const m = history(1, []);
    m.set(CALM[9]!, ci(CALM[9]!, 4, { unusual: ['sick'] }));
    expect(computeBaseline(CALM, m, T1)?.baseline).toBe(1);
  });

  it('ignores days on or after the test start', () => {
    const m = history(1, [4, 4]);
    expect(computeBaseline([...CALM, T1], m, T1)?.baseline).toBe(1);
  });

  it('returns null with fewer than 3 valid days', () => {
    const m = new Map<string, CheckIn>([
      [CALM[0]!, ci(CALM[0]!, 1)],
      [CALM[1]!, ci(CALM[1]!, 1)],
    ]);
    expect(computeBaseline(CALM, m, T1)).toBeNull();
  });

  it('computes mean and population SD', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });
});

describe('outcomes', () => {
  it('clear trigger: reaction at dose 1', () => {
    const r = scoreTest(garlicTest([T1]), history(1, [3, 2]), CALM);
    expect(r.outcome).toBe('trigger');
    expect(r.reactionDose).toBe(1);
    expect(r.safeDose).toBe(0);
    expect(r.confidence).toBe('high');
  });

  it('partial at dose 2 means the day-1 portion is OK', () => {
    const r = scoreTest(garlicTest([T1, addDays(T1, 1)]), history(1, [1, 3, 1]), CALM);
    expect(r.outcome).toBe('partial');
    expect(r.reactionDose).toBe(2);
    expect(r.safeDose).toBe(1);
  });

  it('partial at dose 3 means the day-2 portion is OK', () => {
    const r = scoreTest(garlicTest(), history(1, [1, 1, 4, 1]), CALM);
    expect(r.outcome).toBe('partial');
    expect(r.reactionDose).toBe(3);
    expect(r.safeDose).toBe(2);
  });

  it('tolerated when all three doses pass', () => {
    const r = scoreTest(garlicTest(), history(1, [1, 2, 1, 1]), CALM);
    expect(r.outcome).toBe('tolerated');
    expect(r.safeDose).toBe(3);
    expect(r.reactionDose).toBeNull();
    expect(r.offerRetest).toBe(false);
  });

  it('counts a next-day reaction toward the dose before it on a rest day', () => {
    // Only one dose eaten (test stopped); the night was fine (1), the next day bad (3).
    const r = scoreTest(garlicTest([T1]), history(1, [1, 3]), CALM);
    expect(r.reactionDose).toBe(1);
    expect(r.outcome).toBe('trigger');
  });

  it('a reaction on the next dose night is attributed to that bigger dose', () => {
    const r = scoreTest(garlicTest([T1, addDays(T1, 1)]), history(1, [1, 3]), CALM);
    expect(r.reactionDose).toBe(2);
    expect(r.outcome).toBe('partial');
  });

  it('a 1-point rise with a matching chip is a reaction', () => {
    const m = history(1, [ci('', 2, { symptoms: ['bloating'] }), 1]);
    const r = scoreTest(garlicTest([T1]), m, CALM);
    expect(r.outcome).toBe('trigger');
  });

  it('a 1-point rise with an unrelated chip is not a reaction', () => {
    const m = history(1, [ci('', 2, { symptoms: ['heartburn'] }), 1, 1, 1]);
    const r = scoreTest(garlicTest(), m, CALM);
    expect(r.outcome).toBe('tolerated');
  });

  it('stops scoring at the first reaction (early stop)', () => {
    const r = scoreTest(garlicTest(), history(1, [4, 1, 4, 1]), CALM);
    expect(r.deltas).toHaveLength(1);
    expect(r.reactionDose).toBe(1);
  });

  it('measures deltas against the baseline, not zero', () => {
    const r = scoreTest(garlicTest(), history(2, [3, 3, 3, 2]), CALM);
    expect(r.deltas).toEqual([1, 1, 1]);
    expect(r.outcome).toBe('tolerated');
  });
});

describe('missing and unusual days', () => {
  it('uses the next day when the dose night is missing', () => {
    const r = scoreTest(garlicTest([T1]), history(1, [null, 3]), CALM);
    expect(r.outcome).toBe('trigger');
  });

  it('is unclear with no check-ins in any window', () => {
    const r = scoreTest(garlicTest([T1]), history(1, []), CALM);
    expect(r.outcome).toBe('unclear');
    expect(r.offerRetest).toBe(true);
  });

  it('is unclear when not all doses could be eaten and no reaction showed', () => {
    const r = scoreTest(garlicTest([T1, addDays(T1, 1)]), history(1, [1, 1, 1]), CALM);
    expect(r.outcome).toBe('unclear');
    expect(r.safeDose).toBe(2);
  });

  it('an unusual day in the window lowers confidence to medium', () => {
    const m = history(1, [ci('', 3, { unusual: ['stressed'] }), 1]);
    const r = scoreTest(garlicTest([T1]), m, CALM);
    expect(r.failedChecks).toContain('unusual_days');
    expect(r.confidence).toBe('medium');
  });

  it('a thin baseline gives an unclear result', () => {
    const m = new Map<string, CheckIn>([
      [CALM[8]!, ci(CALM[8]!, 1)],
      [T1, ci(T1, 4)],
    ]);
    const r = scoreTest(garlicTest([T1]), m, CALM);
    expect(r.outcome).toBe('unclear');
    expect(r.failedChecks).toEqual(['thin_baseline']);
  });
});

describe('confidence', () => {
  it('a noisy baseline (SD > 0.8) is medium confidence', () => {
    const r = scoreTest(garlicTest([T1]), history([0, 2, 0, 2, 0, 2, 0, 2, 0, 2], [4, 1]), CALM);
    expect(r.baselineSD).toBeGreaterThan(0.8);
    expect(r.confidence).toBe('medium');
  });

  it('noisy baseline + unusual day is low confidence', () => {
    const m = history([0, 2, 0, 2, 0, 2, 0, 2, 0, 2], [ci('', 4, { unusual: ['sick'] }), 1]);
    const r = scoreTest(garlicTest([T1]), m, CALM);
    expect(r.confidence).toBe('low');
    expect(r.offerRetest).toBe(true);
  });

  it('a nearby placebo reaction lowers confidence', () => {
    const controls: ControlSignal[] = [{ day: addDays(T1, -5), reacted: true, delta: 0 }];
    const r = scoreTest(garlicTest([T1]), history(1, [4, 1]), CALM, controls);
    expect(r.failedChecks).toContain('control_reaction');
    expect(r.confidence).toBe('medium');
  });

  it('a placebo reaction of similar size makes it low confidence', () => {
    const controls: ControlSignal[] = [{ day: addDays(T1, -5), reacted: true, delta: 2.5 }];
    const r = scoreTest(garlicTest([T1]), history(1, [3, 1]), CALM, controls);
    expect(r.confidence).toBe('low');
  });

  it('a calm placebo does not change confidence', () => {
    const controls: ControlSignal[] = [{ day: addDays(T1, -5), reacted: false, delta: 0 }];
    expect(scoreTest(garlicTest([T1]), history(1, [3, 1]), CALM, controls).confidence).toBe('high');
  });

  it('borderline delta at low confidence is unclear', () => {
    const controls: ControlSignal[] = [{ day: addDays(T1, -3), reacted: true, delta: 1.5 }];
    const r = scoreTest(garlicTest(), history(1, [2, 2, 2, 1]), CALM, controls);
    expect(r.outcome).toBe('unclear');
    expect(r.offerRetest).toBe(true);
  });

  it('picks the closest placebo', () => {
    const a: ControlSignal = { day: addDays(T1, -20), reacted: true, delta: 3 };
    const b: ControlSignal = { day: addDays(T1, 4), reacted: false, delta: 0 };
    expect(nearestControl(T1, [a, b])).toBe(b);
    expect(nearestControl(T1, [])).toBeNull();
  });
});

describe('controls, retests and self-reports', () => {
  it('scores a placebo and turns it into a control signal', () => {
    const r = scoreTest(
      { ...garlicTest([T1], 'control'), group: 'control' },
      history(1, [3, 1]),
      CALM,
    );
    expect(r.reactionDose).toBe(1);
    expect(r.explanation).toMatch(/placebo/);
    expect(toControlSignal(r, T1)).toEqual({ day: T1, reacted: true, delta: 2 });
  });

  it('a placebo is not compared against itself', () => {
    const controls: ControlSignal[] = [{ day: T1, reacted: true, delta: 2 }];
    const r = scoreTest(
      { ...garlicTest([T1], 'control'), group: 'control' },
      history(1, [3, 1]),
      CALM,
      controls,
    );
    expect(r.failedChecks).not.toContain('control_reaction');
  });

  it('a retest is scored the same way', () => {
    const r = scoreTest(garlicTest(undefined, 'retest'), history(1, [1, 1, 1, 1]), CALM);
    expect(r.kind).toBe('retest');
    expect(r.outcome).toBe('tolerated');
  });

  it('self-reported results carry no confidence', () => {
    const r = selfReportedResult('onion');
    expect(r.outcome).toBe('self_reported');
    expect(r.confidence).toBeNull();
  });
});

describe('explanations', () => {
  it('describes a trigger with portion and recovery', () => {
    const r = scoreTest(garlicTest([T1]), history(1, [3, 3, 1]), CALM);
    expect(r.explanation).toBe(
      'Your stomach went from “Good” to “Bad” the night you had ¼ clove garlic, and back to normal 2 days later.',
    );
  });

  it('describes a partial with the safe portion', () => {
    const r = scoreTest(garlicTest([T1, addDays(T1, 1)]), history(1, [1, 4, 1]), CALM);
    expect(r.explanation).toContain('fine with ¼ clove garlic');
    expect(r.explanation).toContain('“Awful”');
    expect(r.explanation).toContain('back to normal the next day');
  });

  it('describes a tolerated test', () => {
    const r = scoreTest(garlicTest(), history(0, [0, 1, 0, 0]), CALM);
    expect(r.explanation).toBe(
      'Your stomach stayed around “Great” through all three days, up to ¾ clove garlic.',
    );
  });
});
