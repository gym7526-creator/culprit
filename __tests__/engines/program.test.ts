import testsJson from '../../assets/data/tests.json';
import { TestsFile } from '@/data/content/schema';
import { addDays } from '@/engines/dates';
import {
  advance,
  buildQueue,
  CALM_MAX_DAYS,
  createProgram,
  groupStatus,
  isDayReady,
  markSelfReported,
  pauseProgram,
  personalRules,
  projectSchedule,
  requestRetest,
  resumeProgram,
  todayInfo,
  type CreateOptions,
  type ProgramState,
} from '@/engines/program';
import type { CheckIn, Score } from '@/engines/types';

const T = TestsFile.parse(testsJson);
const TODAY = '2026-04-01';
const DAY1 = addDays(TODAY, 1); // calm day 1

const baseOpts: CreateOptions = {
  profile: 'fodmap',
  refluxFirst: false,
  knownFine: [],
  selfReported: [],
  celiac: false,
  age: 30,
  alcoholOptIn: false,
  seed: 'user-1',
  today: TODAY,
  gentle: false,
  initialSeverity: 3,
};

function make(over: Partial<CreateOptions> = {}): ProgramState {
  return createProgram(T.order, T.tests, { ...baseOpts, ...over });
}

type DayFn = (day: string, s: ProgramState) => Partial<CheckIn> | null;

/** Simulates `days` days from calm day 1, checking in each evening and advancing the next morning. */
function simulate(s0: ProgramState, days: number, fn: DayFn, checkins = new Map<string, CheckIn>()) {
  let s = s0;
  for (let i = 0; i < days; i++) {
    const day = addDays(DAY1, i);
    const c = fn(day, s);
    if (c) checkins.set(day, { day, score: 0, symptoms: [], unusual: [], testFoodTaken: null, ...c });
    s = advance(s, { checkins, tests: T.tests, now: { day: addDays(day, 1), hour: 13 } });
  }
  return { s, checkins };
}

const always = (score: Score): DayFn => () => ({ score });

describe('queue', () => {
  it('follows the fodmap order with one placebo per 4 tests', () => {
    const q = buildQueue(T.order, T.tests, baseOpts);
    const real = q.filter((x) => x.kind === 'real').map((x) => x.group);
    expect(real).toEqual(['wheat', 'onion', 'garlic', 'mannitol', 'gos', 'lactose', 'fructose', 'sorbitol']);
    expect(q.filter((x) => x.kind === 'control')).toHaveLength(2);
    expect(q[0]?.kind).toBe('real');
  });

  it('is deterministic per seed', () => {
    expect(buildQueue(T.order, T.tests, baseOpts)).toEqual(buildQueue(T.order, T.tests, baseOpts));
  });

  it('skips wheat for celiac, known-fine and self-reported foods', () => {
    const q = buildQueue(T.order, T.tests, { ...baseOpts, celiac: true, knownFine: ['lactose'], selfReported: ['onion'] });
    const groups = q.map((x) => x.group);
    expect(groups).not.toContain('wheat');
    expect(groups).not.toContain('lactose');
    expect(groups).not.toContain('onion');
  });

  it('only includes alcohol for 21+ users who opt in', () => {
    const reflux = { ...baseOpts, profile: 'reflux' as const };
    expect(buildQueue(T.order, T.tests, reflux).map((x) => x.group)).not.toContain('alcohol');
    expect(buildQueue(T.order, T.tests, { ...reflux, alcoholOptIn: true, age: 20 }).map((x) => x.group)).not.toContain('alcohol');
    expect(buildQueue(T.order, T.tests, { ...reflux, alcoholOptIn: true, age: 21 }).map((x) => x.group)).toContain('alcohol');
  });

  it('interleaves mixed profiles starting with the main symptom', () => {
    const q = buildQueue(T.order, T.tests, { ...baseOpts, profile: 'mixed', refluxFirst: true }).filter((x) => x.kind === 'real');
    expect(q.slice(0, 4).map((x) => x.group)).toEqual(['coffee', 'wheat', 'tomato', 'onion']);
  });
});

describe('calm phase', () => {
  it('starts tomorrow', () => {
    const s = make();
    expect(s.phase).toBe('setup');
    expect(s.calmStartedOn).toBe(DAY1);
  });

  it('ends on day 14 when the last 3 days were calm', () => {
    const { s } = simulate(make(), 14, always(0));
    expect(s.phase).toBe('testing');
    expect(s.calmDaysDone).toBe(14);
    expect(s.calmOutcome).toBe('settled');
    expect(s.current?.startedOn).toBe(addDays(DAY1, 14));
  });

  it('never ends before day 14', () => {
    const { s } = simulate(make(), 13, always(0));
    expect(s.phase).toBe('calm');
  });

  it('waits after day 14 for a 3-day calm streak', () => {
    const fn: DayFn = (d) => ({ score: d < addDays(DAY1, 19) ? 2 : 0 });
    const { s } = simulate(make(), 22, fn);
    expect(s.phase).toBe('testing');
    expect(s.calmEndedOn).toBe(addDays(DAY1, 21));
  });

  it('stops at day 28 no matter what and flags no improvement', () => {
    const { s } = simulate(make(), 40, always(3));
    expect(s.calmDaysDone).toBe(CALM_MAX_DAYS);
    expect(s.calmOutcome).toBe('max_days');
    expect(s.calmImproved).toBe(false);
  });

  it('unusual days do not count toward the calm streak', () => {
    const fn: DayFn = (d) => (d === addDays(DAY1, 13) ? { score: 0, unusual: ['sick'] } : { score: 0 });
    const { s } = simulate(make(), 14, fn);
    expect(s.phase).toBe('calm');
  });
});

describe('testing', () => {
  const calmThen = (after: (offset: number, s: ProgramState) => Partial<CheckIn> | null): DayFn => (d, s) => {
    const offset = Math.round((Date.parse(d) - Date.parse(addDays(DAY1, 14))) / 86_400_000);
    return offset < 0 ? { score: 1 } : after(offset, s);
  };

  it('runs a tolerated test over 3 doses, rests 1 day, then starts the next', () => {
    const { s } = simulate(make(), 14 + 5, calmThen(() => ({ score: 1 })));
    const first = s.completed[0]!;
    expect(first.group).toBe('wheat');
    expect(first.doseDays).toHaveLength(3);
    expect(first.result?.outcome).toBe('tolerated');
    expect(s.current?.group).toBe(make().queue[1]?.group);
    expect(s.current?.startedOn).toBe(addDays(DAY1, 14 + 4));
  });

  it('stops early on a same-night reaction and rests until two good days', () => {
    const { s } = simulate(make(), 14 + 4, calmThen((o) => ({ score: o === 0 ? 4 : o === 1 ? 3 : 1 })));
    const first = s.completed[0]!;
    expect(first.doseDays).toHaveLength(1);
    expect(first.result?.outcome).toBe('trigger');
    expect(s.dayLog[addDays(DAY1, 15)]).toBe('rest');
    expect(s.dayLog[addDays(DAY1, 16)]).toBe('rest');
    // Day 16 (score 3) was not a good day, so the next test starts after days 17 and 18.
    expect(s.current?.startedOn).toBe(addDays(DAY1, 14 + 4));
  });

  it('repeats the dose when the test food was not eaten', () => {
    const { s } = simulate(make(), 14 + 4, calmThen((o) => ({ score: 1, testFoodTaken: o === 1 ? false : null })));
    expect(s.completed[0]?.doseDays).toHaveLength(3);
    expect(s.completed[0]?.endedOn).toBe(addDays(DAY1, 14 + 3));
  });

  it('extends the test by a day when a dose-night check-in is missing', () => {
    const { s } = simulate(make(), 14 + 4, calmThen((o) => (o === 0 ? null : { score: 1 })));
    expect(s.completed[0]?.doseDays).toEqual([addDays(DAY1, 15), addDays(DAY1, 16), addDays(DAY1, 17)]);
  });

  it('reaches the personal phase when every test is done', () => {
    const { s } = simulate(make(), 80, always(1));
    expect(s.phase).toBe('personal');
    expect(s.queue).toHaveLength(0);
    expect(groupStatus(s, 'garlic')).toBe('cleared');
    expect(todayInfo(s, addDays(DAY1, 80)).progress).toBe(1);
  });

  it('is idempotent', () => {
    const { s, checkins } = simulate(make(), 20, always(1));
    const ctx = { checkins, tests: T.tests, now: { day: addDays(DAY1, 20), hour: 13 } };
    expect(advance(advance(s, ctx), ctx)).toEqual(advance(s, ctx));
  });
});

describe('late check-ins', () => {
  const none = new Map<string, CheckIn>();
  it('waits for yesterday until noon', () => {
    expect(isDayReady('2026-04-01', { day: '2026-04-02', hour: 11 }, none)).toBe(false);
    expect(isDayReady('2026-04-01', { day: '2026-04-02', hour: 12 }, none)).toBe(true);
  });
  it('processes a day immediately once it has a check-in', () => {
    const m = new Map<string, CheckIn>([['2026-04-01', { day: '2026-04-01', score: 1, symptoms: [], unusual: [], testFoodTaken: null }]]);
    expect(isDayReady('2026-04-01', { day: '2026-04-01', hour: 21 }, m)).toBe(true);
  });
  it('never processes the future', () => {
    expect(isDayReady('2026-04-03', { day: '2026-04-02', hour: 23 }, none)).toBe(false);
  });
});

describe('pause and resume', () => {
  it('freezes calm days while paused', () => {
    let { s, checkins } = simulate(make(), 5, always(0));
    s = pauseProgram(s, addDays(DAY1, 5));
    ({ s } = simulate(s, 10, always(0), checkins));
    expect(s.calmDaysDone).toBe(5);
    expect(s.dayLog[addDays(DAY1, 6)]).toBe('paused');
  });

  it('requeues an interrupted test and needs 2 good days after resuming', () => {
    let { s, checkins } = simulate(make(), 15, always(1)); // calm 14 + first dose
    expect(s.current?.doseDays).toHaveLength(1);
    s = pauseProgram(s, addDays(DAY1, 15));
    expect(s.current).toBeNull();
    expect(s.queue[0]?.group).toBe('wheat');
    s = resumeProgram(s, addDays(DAY1, 15)); // resume the same day
    ({ s } = simulate(s, 18, always(1), checkins));
    // Day 15 is the resume day, day 16 the second good day, so wheat restarts on day 17.
    expect(s.current?.group).toBe('wheat');
    expect(s.current?.startedOn).toBe(addDays(DAY1, 17));
  });
});

describe('retests and self-reports', () => {
  it('a retest sends the personal phase back to testing', () => {
    const { s } = simulate(make(), 80, always(1));
    const r = requestRetest(s, 'garlic');
    expect(r.phase).toBe('testing');
    expect(r.queue).toEqual([{ group: 'garlic', kind: 'retest' }]);
    expect(requestRetest(r, 'garlic').queue).toHaveLength(1);
  });

  it('self-reported foods leave the queue and count as triggers', () => {
    const s = markSelfReported(make(), 'onion');
    expect(s.queue.map((q) => q.group)).not.toContain('onion');
    expect(groupStatus(s, 'onion')).toBe('self_reported');
    expect(personalRules(s).triggers).toContain('onion');
  });

  it('gentle mode skips elimination entirely', () => {
    const s = make({ gentle: true });
    expect(s.phase).toBe('personal');
    expect(s.queue).toHaveLength(0);
    expect(projectSchedule(s, TODAY, 3)[TODAY]).toEqual({ type: 'personal' });
  });
});

describe('projection', () => {
  it('projects calm days, then 3 doses and a rest day per test', () => {
    const s = make();
    const p = projectSchedule(s, DAY1, 20);
    expect(p[DAY1]).toEqual({ type: 'calm', calmDay: 1 });
    expect(p[addDays(DAY1, 13)]).toEqual({ type: 'calm', calmDay: 14 });
    expect(p[addDays(DAY1, 14)]).toEqual({ type: 'dose', group: 'wheat', kind: 'real', dose: 1 });
    expect(p[addDays(DAY1, 16)]).toEqual({ type: 'dose', group: 'wheat', kind: 'real', dose: 3 });
    expect(p[addDays(DAY1, 17)]).toEqual({ type: 'rest' });
    const second = s.queue[1]!;
    expect(p[addDays(DAY1, 18)]).toEqual({ type: 'dose', group: second.group, kind: second.kind, dose: 1 });
  });
});
