import { content } from '@/data/content';
import { addDays } from '@/engines/dates';
import { checkinTarget, streak } from '@/engines/checkin';
import { createProgram, type ProgramState } from '@/engines/program';
import {
  caseCounts,
  caseReport,
  caseSolved,
  shareLine,
  suspectBoard,
  testChart,
  trend,
} from '@/engines/report';
import { simulateProgram } from '@/engines/simulate';
import type { Profile } from '@/engines/types';

const DAY0 = '2026-11-01';

function start(profile: Profile): ProgramState {
  return createProgram(content.tests.order, content.tests.tests, {
    profile,
    refluxFirst: false,
    knownFine: [],
    selfReported: [],
    celiac: false,
    age: 32,
    alcoholOptIn: false,
    seed: 'demo',
    today: DAY0,
    gentle: false,
    initialSeverity: 3,
  });
}

const name = (g: string) => content.tests.tests.find((t) => t.id === g)?.name ?? g;

describe('a simulated 8-week program', () => {
  const { program, checkins } = simulateProgram(
    start('fodmap'),
    content.tests.tests,
    addDays(DAY0, 1),
    56,
    'clear',
  );
  const report = caseReport(program);

  it('finishes the calm phase and tests several foods', () => {
    expect(program.calmEndedOn).not.toBeNull();
    expect(
      program.completed.filter((t) => t.kind !== 'control' && t.result).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it('finds garlic as a trigger and onion as OK in small amounts', () => {
    const tested = program.completed.map((t) => t.group);
    if (tested.includes('garlic')) {
      expect(report.triggers.map((r) => r.group)).toContain('garlic');
      expect(report.triggers.find((r) => r.group === 'garlic')!.reactionDose).toBe(1);
    }
    if (tested.includes('onion')) {
      const onion = report.partial.find((r) => r.group === 'onion');
      expect(onion?.reactionDose).toBe(2);
      expect(onion?.safeDose).toBe(1);
    }
    expect(tested.includes('garlic') || tested.includes('onion')).toBe(true);
  });

  it('clears everything else with high confidence', () => {
    for (const r of report.cleared) {
      expect(['garlic', 'onion']).not.toContain(r.group);
      expect(r.confidence).toBe('high');
    }
    expect(report.cleared.length).toBeGreaterThan(0);
    for (const c of report.controls) expect(c.reacted).toBe(false);
  });

  it('builds the board, counts, trend and charts', () => {
    const board = suspectBoard(program);
    const counts = caseCounts(board);
    expect(counts.cleared).toBe(report.cleared.length);
    expect(counts.triggers).toBe(report.triggers.length);
    expect(counts.partial).toBe(report.partial.length);
    expect(board.length).toBe(
      counts.cleared + counts.triggers + counts.partial + counts.unclear + counts.toGo,
    );
    const pts = trend(checkins, addDays(DAY0, 1), addDays(DAY0, 56));
    expect(pts).toHaveLength(56);
    expect(pts.every((p) => p.score !== null && p.smooth !== null)).toBe(true);
    const first = program.completed.find((t) => t.kind !== 'control' && t.result)!;
    const chart = testChart(program, first.id, checkins)!;
    expect(chart.days.filter((d) => d.dose !== null)).toHaveLength(first.doseDays.length);
    expect(chart.baseline).toBe(1);
  });

  it('writes a share line with only the outcomes', () => {
    const line = shareLine(report, name, 'small amounts');
    if (report.triggers.length) expect(line).toContain('❌');
    expect(line).toContain('✅');
  });

  it('solves the case when the queue runs out', () => {
    const long = simulateProgram(
      start('reflux'),
      content.tests.tests,
      addDays(DAY0, 1),
      120,
      'clear',
    );
    expect(caseSolved(long.program)).toBe(true);
    const r = caseReport(long.program);
    expect(r.triggers.map((x) => x.group)).toContain('coffee');
    expect(r.partial.map((x) => x.group)).toContain('tomato');
  });

  it('lowers confidence when the placebo reacts', () => {
    const sim = simulateProgram(
      start('fodmap'),
      content.tests.tests,
      addDays(DAY0, 1),
      70,
      'control_reaction',
    );
    const r = caseReport(sim.program);
    expect(r.controls.some((c) => c.reacted)).toBe(true);
    const all = [...r.cleared, ...r.triggers, ...r.partial, ...r.unclear];
    expect(all.some((x) => x.failedChecks.includes('control_reaction'))).toBe(true);
  });

  it('a noisy pattern lowers confidence on some results', () => {
    const sim = simulateProgram(
      start('fodmap'),
      content.tests.tests,
      addDays(DAY0, 1),
      70,
      'noisy',
    );
    const r = caseReport(sim.program);
    const all = [...r.cleared, ...r.triggers, ...r.partial, ...r.unclear];
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((x) => x.confidence !== 'high' || x.outcome === 'unclear')).toBe(true);
  });
});

describe('check-in timing', () => {
  const c = (day: string) => ({
    day,
    score: 1 as const,
    symptoms: [],
    unusual: [],
    testFoodTaken: null,
  });
  it('opens at 5 pm and allows yesterday until noon', () => {
    expect(checkinTarget({ day: '2026-11-03', hour: 16 }, {}, '2026-11-01')).toBeNull();
    expect(checkinTarget({ day: '2026-11-03', hour: 17 }, {}, '2026-11-01')).toBe('2026-11-03');
    expect(checkinTarget({ day: '2026-11-03', hour: 9 }, {}, '2026-11-01')).toBe('2026-11-02');
    expect(
      checkinTarget(
        { day: '2026-11-03', hour: 9 },
        { '2026-11-02': c('2026-11-02') },
        '2026-11-01',
      ),
    ).toBeNull();
    expect(checkinTarget({ day: '2026-11-03', hour: 13 }, {}, '2026-11-01', true)).toBe(
      '2026-11-03',
    );
    expect(checkinTarget({ day: '2026-11-01', hour: 18 }, {}, '2026-11-02')).toBeNull();
  });
  it('counts the streak', () => {
    const all = { '2026-11-01': c('2026-11-01'), '2026-11-02': c('2026-11-02') };
    expect(streak(all, '2026-11-02')).toBe(2);
    expect(streak(all, '2026-11-03')).toBe(2);
    expect(streak(all, '2026-11-04')).toBe(0);
  });
});
