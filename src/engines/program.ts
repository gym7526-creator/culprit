/**
 * Program engine (spec §6.1): SETUP → CALM → TESTING ⇄ rest → PERSONAL.
 *
 * Deterministic and time-based: `advance()` replays days up to an injected `now`, so the debug menu
 * can time-travel. The state is plain JSON (stored in SQLite).
 *
 * - CALM lasts at least 14 days, ends early after day 14 once 3 calm days in a row score ≤ 1, and
 *   never runs past day 28.
 * - TESTING runs one test at a time: up to 3 dose days (a missed check-in or "didn't eat it" repeats
 *   the dose), stops early on a same-night reaction, then rests until 2 days in a row score at or
 *   below baseline + 1 (at least 1 rest day) before the next test.
 * - PERSONAL once the queue is empty. Retests send it back to TESTING.
 * - Pause freezes everything; resuming needs 2 good days before the next test starts.
 */
import type { TestDefinition, TestsFile } from '../data/content/schema.ts';
import { addDays, diffDays, type DayKey } from './dates.ts';
import { seededRandom } from './rng.ts';
import {
  computeBaseline,
  mean,
  scoreTest,
  selfReportedResult,
  toControlSignal,
  type TestResult,
} from './scoring.ts';
import type { CheckInMap, Profile, Score, TestGroup, TestKind } from './types.ts';

export const CALM_MIN_DAYS = 14;
export const CALM_MAX_DAYS = 28;
export const CALM_SETTLED_STREAK = 3;
export const CALM_SETTLED_SCORE = 1;
export const DOSES_PER_TEST = 3;
/** Give up on a test after this many dose nights (repeats included). */
export const MAX_DOSE_ATTEMPTS = 6;
export const REST_GOOD_DAYS = 2;
export const REST_TOLERANCE = 1;
/** Late check-ins for yesterday are accepted until this local hour. */
export const LATE_CHECKIN_HOUR = 12;

export type Phase = 'setup' | 'calm' | 'testing' | 'personal';
export type DayType = 'calm' | 'dose' | 'rest' | 'paused' | 'personal';
export type QueueItem = { group: TestGroup; kind: TestKind };

export type ActiveTest = {
  id: string;
  group: TestGroup;
  kind: TestKind;
  startedOn: DayKey;
  doseDays: DayKey[];
  attempts: number;
};

export type CompletedTest = {
  id: string;
  group: TestGroup;
  kind: TestKind;
  startedOn: DayKey;
  endedOn: DayKey;
  doseDays: DayKey[];
  /** null until the day after the last dose has been processed. */
  result: TestResult | null;
};

export type ProgramState = {
  version: 1;
  phase: Phase;
  profile: Profile;
  /** Eating-disorder safeguard: no elimination, balanced plans only. */
  gentle: boolean;
  initialSeverity: Score;
  calmStartedOn: DayKey | null;
  calmDaysDone: number;
  calmEndedOn: DayKey | null;
  calmOutcome: 'settled' | 'max_days' | null;
  calmImproved: boolean | null;
  queue: QueueItem[];
  current: ActiveTest | null;
  completed: CompletedTest[];
  selfReported: TestGroup[];
  knownFine: TestGroup[];
  pauses: { from: DayKey; to: DayKey | null }[];
  lastResumedOn: DayKey | null;
  dayLog: Record<DayKey, DayType>;
  processedThrough: DayKey | null;
  nextId: number;
};

export type QueueOptions = {
  profile: Profile;
  /** For mixed profiles: start with reflux tests when the main symptom is heartburn or nausea. */
  refluxFirst: boolean;
  knownFine: readonly TestGroup[];
  selfReported: readonly TestGroup[];
  celiac: boolean;
  age: number;
  alcoholOptIn: boolean;
  seed: string;
  /** Groups whose test foods don't fit the user's diet or allergies (see `testsToSkip`). */
  skip?: readonly TestGroup[];
};

export type CreateOptions = QueueOptions & {
  today: DayKey;
  gentle: boolean;
  initialSeverity: Score;
};

export type Now = { day: DayKey; hour: number };

export type AdvanceContext = {
  checkins: CheckInMap;
  tests: readonly TestDefinition[];
  now: Now;
};

// ------------------------------------------------------------------------------------------- queue

function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]!);
    if (i < b.length) out.push(b[i]!);
  }
  return out;
}

/** Test order (spec §5.4) with skips, safety gates and one placebo per block of real tests. */
export function buildQueue(
  order: TestsFile['order'],
  tests: readonly TestDefinition[],
  o: QueueOptions,
): QueueItem[] {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const allowed = (g: TestGroup) => {
    const t = byId.get(g);
    if (!t || o.knownFine.includes(g) || o.selfReported.includes(g)) return false;
    if (t.skipForCeliac && o.celiac) return false;
    if (o.skip?.includes(g)) return false;
    if (t.minAge !== undefined && o.age < t.minAge) return false;
    if (t.optIn && !(g === 'alcohol' && o.alcoholOptIn)) return false;
    return true;
  };
  const fodmap = order.fodmap.filter(allowed);
  const reflux = order.reflux.filter(allowed);
  const groups =
    o.profile === 'fodmap'
      ? fodmap
      : o.profile === 'reflux'
        ? reflux
        : o.refluxFirst
          ? interleave(reflux, fodmap)
          : interleave(fodmap, reflux);

  const rand = seededRandom(`${o.seed}:controls`);
  const out: QueueItem[] = [];
  for (let i = 0; i < groups.length; i += order.controlEvery) {
    const block: QueueItem[] = groups
      .slice(i, i + order.controlEvery)
      .map((group) => ({ group, kind: 'real' }));
    // Never first in the whole program, and only for full blocks.
    if (block.length === order.controlEvery) {
      const at = 1 + Math.floor(rand() * (block.length - 1));
      block.splice(at, 0, { group: 'control', kind: 'control' });
    }
    out.push(...block);
  }
  return out;
}

export function createProgram(
  order: TestsFile['order'],
  tests: readonly TestDefinition[],
  o: CreateOptions,
): ProgramState {
  const base: ProgramState = {
    version: 1,
    phase: o.gentle ? 'personal' : 'setup',
    profile: o.profile,
    gentle: o.gentle,
    initialSeverity: o.initialSeverity,
    // "Your calm start begins tomorrow."
    calmStartedOn: o.gentle ? null : addDays(o.today, 1),
    calmDaysDone: 0,
    calmEndedOn: null,
    calmOutcome: null,
    calmImproved: null,
    queue: o.gentle ? [] : buildQueue(order, tests, o),
    current: null,
    completed: [],
    selfReported: [...o.selfReported],
    knownFine: [...o.knownFine],
    pauses: [],
    lastResumedOn: null,
    dayLog: {},
    processedThrough: o.gentle ? o.today : null,
    nextId: 1,
  };
  return base;
}

// ----------------------------------------------------------------------------------------- helpers

function isPaused(s: ProgramState, day: DayKey): boolean {
  return s.pauses.some(
    (p) => diffDays(p.from, day) >= 0 && (p.to === null || diffDays(day, p.to) > 0),
  );
}

/** Calm and rest days: the days a baseline may be drawn from. */
export function baselineCandidates(s: ProgramState): DayKey[] {
  return Object.entries(s.dayLog)
    .filter(([, t]) => t === 'calm' || t === 'rest')
    .map(([d]) => d)
    .sort();
}

function startNextTest(s: ProgramState, startOn: DayKey): ProgramState {
  const [next, ...rest] = s.queue;
  if (!next) return s;
  return {
    ...s,
    queue: rest,
    current: {
      id: `t${s.nextId}`,
      group: next.group,
      kind: next.kind,
      startedOn: startOn,
      doseDays: [],
      attempts: 0,
    },
    nextId: s.nextId + 1,
  };
}

function scoreCompleted(s: ProgramState, ctx: AdvanceContext, done: CompletedTest): TestResult {
  const def = ctx.tests.find((t) => t.id === done.group);
  const controls = s.completed
    .filter((c) => c.kind === 'control' && c.result && c.doseDays[0])
    .map((c) => toControlSignal(c.result!, c.doseDays[0]!));
  return scoreTest(
    {
      id: done.id,
      group: done.group,
      kind: done.kind,
      doseDays: done.doseDays,
      portions: def?.doses.map((d) => d.portion) ?? [],
      matchingSymptoms: def?.matchingSymptoms ?? [],
    },
    ctx.checkins,
    baselineCandidates(s),
    controls,
  );
}

function sameNightReaction(
  s: ProgramState,
  ctx: AdvanceContext,
  test: ActiveTest,
  day: DayKey,
): boolean {
  const c = ctx.checkins.get(day);
  const base = computeBaseline(baselineCandidates(s), ctx.checkins, test.startedOn);
  if (!c || !base) return false;
  const def = ctx.tests.find((t) => t.id === test.group);
  const chip = c.symptoms.some((sym) => def?.matchingSymptoms.includes(sym));
  const delta = c.score - base.baseline;
  return delta >= 2 || (delta >= 1 && chip);
}

function goodDay(s: ProgramState, ctx: AdvanceContext, day: DayKey, baseline: number): boolean {
  const c = ctx.checkins.get(day);
  return c !== undefined && c.unusual.length === 0 && c.score <= baseline + REST_TOLERANCE;
}

function calmImproved(s: ProgramState, ctx: AdvanceContext): boolean {
  const scores = Object.entries(s.dayLog)
    .filter(([, t]) => t === 'calm')
    .map(([d]) => ctx.checkins.get(d))
    .filter((c) => c !== undefined && c.unusual.length === 0)
    .slice(-7)
    .map((c) => c!.score);
  if (scores.length === 0) return false;
  return mean(scores) <= Math.max(CALM_SETTLED_SCORE + 0.5, s.initialSeverity - 1);
}

// ------------------------------------------------------------------------------------- day machine

function processDay(state: ProgramState, day: DayKey, ctx: AdvanceContext): ProgramState {
  let s: ProgramState = { ...state, processedThrough: day };

  if (isPaused(s, day)) {
    return { ...s, dayLog: { ...s.dayLog, [day]: 'paused' } };
  }
  if (s.phase === 'setup') {
    if (s.calmStartedOn && diffDays(s.calmStartedOn, day) >= 0) s = { ...s, phase: 'calm' };
    else return s;
  }

  if (s.phase === 'calm') {
    s = { ...s, dayLog: { ...s.dayLog, [day]: 'calm' }, calmDaysDone: s.calmDaysDone + 1 };
    const streakDays = [0, 1, 2].map((i) => addDays(day, -i));
    const settled =
      s.calmDaysDone >= CALM_MIN_DAYS &&
      streakDays.every((d) => {
        const c = ctx.checkins.get(d);
        return (
          s.dayLog[d] === 'calm' &&
          c !== undefined &&
          c.unusual.length === 0 &&
          c.score <= CALM_SETTLED_SCORE
        );
      });
    if (settled || s.calmDaysDone >= CALM_MAX_DAYS) {
      s = {
        ...s,
        phase: s.queue.length > 0 ? 'testing' : 'personal',
        calmEndedOn: day,
        calmOutcome: settled ? 'settled' : 'max_days',
        calmImproved: settled ? true : calmImproved(s, ctx),
      };
      s = startNextTest(s, addDays(day, 1));
    }
    return s;
  }

  if (s.phase === 'testing') {
    const cur = s.current;
    if (cur && diffDays(cur.startedOn, day) >= 0) {
      // Dose day.
      s = { ...s, dayLog: { ...s.dayLog, [day]: 'dose' } };
      const c = ctx.checkins.get(day);
      const eaten = c !== undefined && c.testFoodTaken !== false;
      const next: ActiveTest = {
        ...cur,
        attempts: cur.attempts + 1,
        doseDays: eaten ? [...cur.doseDays, day] : cur.doseDays,
      };
      const reacted = eaten && sameNightReaction(s, ctx, next, day);
      if (reacted || next.doseDays.length >= DOSES_PER_TEST || next.attempts >= MAX_DOSE_ATTEMPTS) {
        const done: CompletedTest = {
          id: next.id,
          group: next.group,
          kind: next.kind,
          startedOn: next.startedOn,
          endedOn: day,
          doseDays: next.doseDays,
          result: null,
        };
        return { ...s, current: null, completed: [...s.completed, done] };
      }
      return { ...s, current: next };
    }

    // Rest day.
    s = { ...s, dayLog: { ...s.dayLog, [day]: 'rest' } };
    // Close any result whose next-day window has now passed.
    const completed = s.completed.map((t) =>
      t.result === null && diffDays(t.endedOn, day) >= 1
        ? { ...t, result: scoreCompleted(s, ctx, t) }
        : t,
    );
    s = { ...s, completed };

    if (cur) return s; // next test already scheduled for a later day
    const last = s.completed[s.completed.length - 1];
    const base = computeBaseline(baselineCandidates(s), ctx.checkins, last ? last.startedOn : day);
    const baseline = base?.baseline ?? CALM_SETTLED_SCORE;
    const prev = addDays(day, -1);
    const afterResume = s.lastResumedOn === null || diffDays(s.lastResumedOn, prev) >= 0;
    const ready = goodDay(s, ctx, day, baseline) && goodDay(s, ctx, prev, baseline) && afterResume;
    if (!ready) return s;
    if (s.queue.length > 0) return startNextTest(s, addDays(day, 1));
    if (s.completed.every((t) => t.result !== null)) return { ...s, phase: 'personal' };
    return s;
  }

  // Personal.
  return { ...s, dayLog: { ...s.dayLog, [day]: 'personal' } };
}

/** Whether a day can be processed yet: it has a check-in, or its late-check-in window has closed. */
export function isDayReady(day: DayKey, now: Now, checkins: CheckInMap): boolean {
  const age = diffDays(day, now.day);
  if (age < 0) return false;
  if (checkins.has(day)) return true;
  return age >= 2 || (age === 1 && now.hour >= LATE_CHECKIN_HOUR);
}

/** Replays every ready day up to `ctx.now`. Idempotent. */
export function advance(state: ProgramState, ctx: AdvanceContext): ProgramState {
  if (state.gentle) return state;
  let s = state;
  let day = s.processedThrough ? addDays(s.processedThrough, 1) : s.calmStartedOn;
  if (!day) return s;
  // Guard against runaway loops (e.g. a far-future clock).
  for (let i = 0; i < 400 && isDayReady(day, ctx.now, ctx.checkins); i++) {
    s = processDay(s, day, ctx);
    day = addDays(day, 1);
  }
  return s;
}

// ---------------------------------------------------------------------------------------- actions

export function pauseProgram(s: ProgramState, day: DayKey): ProgramState {
  if (s.pauses.some((p) => p.to === null)) return s;
  // An interrupted test goes back to the front of the queue and starts over later.
  const queue = s.current
    ? [{ group: s.current.group, kind: s.current.kind }, ...s.queue]
    : s.queue;
  return { ...s, current: null, queue, pauses: [...s.pauses, { from: day, to: null }] };
}

export function resumeProgram(s: ProgramState, day: DayKey): ProgramState {
  if (!s.pauses.some((p) => p.to === null)) return s;
  return {
    ...s,
    pauses: s.pauses.map((p) => (p.to === null ? { ...p, to: day } : p)),
    lastResumedOn: day,
  };
}

export function requestRetest(s: ProgramState, group: TestGroup): ProgramState {
  if (s.queue.some((q) => q.group === group) || s.current?.group === group) return s;
  return {
    ...s,
    phase: s.phase === 'personal' && !s.gentle ? 'testing' : s.phase,
    queue: [...s.queue, { group, kind: 'retest' }],
    selfReported: s.selfReported.filter((g) => g !== group),
  };
}

export function markSelfReported(s: ProgramState, group: TestGroup): ProgramState {
  if (s.selfReported.includes(group)) return s;
  return {
    ...s,
    queue: s.queue.filter((q) => q.group !== group),
    selfReported: [...s.selfReported, group],
  };
}

// ------------------------------------------------------------------------------------------ views

export type GroupStatus =
  'untested' | 'testing' | 'trigger' | 'partial' | 'cleared' | 'unclear' | 'self_reported';

/** Latest result per group (retests replace earlier results). Placebos are excluded. */
export function latestResults(s: ProgramState): Map<TestGroup, TestResult> {
  const out = new Map<TestGroup, TestResult>();
  for (const g of s.selfReported) out.set(g, selfReportedResult(g));
  for (const t of s.completed) {
    if (t.kind !== 'control' && t.result) out.set(t.group, t.result);
  }
  return out;
}

export function groupStatus(s: ProgramState, group: TestGroup): GroupStatus {
  if (s.current?.group === group && s.current.doseDays.length > 0) return 'testing';
  const r = latestResults(s).get(group);
  if (!r)
    return s.completed.some((t) => t.group === group && t.result === null) ? 'testing' : 'untested';
  switch (r.outcome) {
    case 'trigger':
      return 'trigger';
    case 'partial':
      return 'partial';
    case 'tolerated':
      return 'cleared';
    case 'self_reported':
      return 'self_reported';
    default:
      return 'unclear';
  }
}

/** What the plan engine needs in the personal phase. */
export type PersonalRules = {
  triggers: TestGroup[];
  partial: { group: TestGroup; safeDose: 1 | 2 }[];
};

export function personalRules(s: ProgramState): PersonalRules {
  const triggers: TestGroup[] = [];
  const partial: PersonalRules['partial'] = [];
  for (const [group, r] of latestResults(s)) {
    if (r.outcome === 'trigger' || r.outcome === 'self_reported') triggers.push(group);
    else if (r.outcome === 'partial' && (r.safeDose === 1 || r.safeDose === 2))
      partial.push({ group, safeDose: r.safeDose });
  }
  return { triggers, partial };
}

export type TodayInfo = {
  phase: Phase;
  paused: boolean;
  calmDay: number | null;
  calmTarget: number;
  test: {
    group: TestGroup;
    kind: TestKind;
    dose: number;
    totalDoses: number;
    startsOn: DayKey;
  } | null;
  testsDone: number;
  testsTotal: number;
  /** 0..1 for the program ring. */
  progress: number;
};

export function todayInfo(s: ProgramState, day: DayKey): TodayInfo {
  const realDone = s.completed.filter((t) => t.kind !== 'control').length + s.selfReported.length;
  const realLeft =
    s.queue.filter((q) => q.kind !== 'control').length +
    (s.current && s.current.kind !== 'control' ? 1 : 0);
  const testsTotal = realDone + realLeft;
  const calmShare = s.phase === 'setup' ? 0 : Math.min(1, s.calmDaysDone / CALM_MIN_DAYS);
  const testShare = testsTotal === 0 ? (s.phase === 'personal' ? 1 : 0) : realDone / testsTotal;
  const cur = s.current;
  return {
    phase: s.phase,
    paused: isPaused(s, day),
    calmDay:
      s.phase === 'calm' || s.phase === 'setup'
        ? Math.min(CALM_MAX_DAYS, s.calmDaysDone + (s.phase === 'calm' ? 1 : 0))
        : null,
    calmTarget: CALM_MIN_DAYS,
    test: cur
      ? {
          group: cur.group,
          kind: cur.kind,
          dose: Math.min(DOSES_PER_TEST, cur.doseDays.length + 1),
          totalDoses: DOSES_PER_TEST,
          startsOn: cur.startedOn,
        }
      : null,
    testsDone: realDone,
    testsTotal,
    progress:
      s.phase === 'personal' ? 1 : Math.round((calmShare * 0.25 + testShare * 0.75) * 100) / 100,
  };
}

/** The test group (if any) whose dose is due on `day`, for planning that night's dinner. */
export function testDueOn(s: ProgramState, day: DayKey): TestGroup | null {
  const cur = s.current;
  if (!cur || diffDays(cur.startedOn, day) < 0) return null;
  return cur.group;
}

export type ProjectedDay =
  | { type: 'calm'; calmDay: number }
  | { type: 'dose'; group: TestGroup; kind: TestKind; dose: number }
  | { type: 'rest' }
  | { type: 'personal' }
  | { type: 'paused' };

/**
 * Best-case schedule from `from` for `days` days (no missed check-ins, no reactions, 1 rest day
 * between tests). Used to plan test nights into the week; plans are regenerated whenever the
 * program actually moves.
 */
export function projectSchedule(
  s: ProgramState,
  from: DayKey,
  days: number,
): Record<DayKey, ProjectedDay> {
  const out: Record<DayKey, ProjectedDay> = {};
  if (s.gentle || s.phase === 'personal') {
    for (let i = 0; i < days; i++) out[addDays(from, i)] = { type: 'personal' };
    return out;
  }
  if (s.pauses.some((p) => p.to === null)) {
    for (let i = 0; i < days; i++) out[addDays(from, i)] = { type: 'paused' };
    return out;
  }

  // Build a linear timeline starting at `from`.
  const timeline: ProjectedDay[] = [];
  let calmDone = s.calmDaysDone;
  if (s.phase === 'setup' || s.phase === 'calm') {
    const lead =
      s.phase === 'setup' && s.calmStartedOn ? Math.max(0, diffDays(from, s.calmStartedOn)) : 0;
    for (let i = 0; i < lead; i++) timeline.push({ type: 'rest' });
    while (calmDone < CALM_MIN_DAYS) {
      calmDone++;
      timeline.push({ type: 'calm', calmDay: calmDone });
    }
  }
  const items: { group: TestGroup; kind: TestKind; dosesLeft: number; startOffset: number }[] = [];
  if (s.current) {
    items.push({
      group: s.current.group,
      kind: s.current.kind,
      dosesLeft: DOSES_PER_TEST - s.current.doseDays.length,
      startOffset: Math.max(0, diffDays(from, s.current.startedOn)),
    });
  } else if (s.phase === 'testing') {
    timeline.push({ type: 'rest' }); // waiting for two good days
  }
  for (const q of s.queue)
    items.push({ group: q.group, kind: q.kind, dosesLeft: DOSES_PER_TEST, startOffset: 0 });

  items.forEach((it, idx) => {
    for (let i = timeline.length; i < it.startOffset; i++) timeline.push({ type: 'rest' });
    const doneSoFar = DOSES_PER_TEST - it.dosesLeft;
    for (let d = 0; d < it.dosesLeft; d++) {
      timeline.push({ type: 'dose', group: it.group, kind: it.kind, dose: doneSoFar + d + 1 });
    }
    if (idx < items.length - 1) timeline.push({ type: 'rest' });
  });

  for (let i = 0; i < days; i++) out[addDays(from, i)] = timeline[i] ?? { type: 'personal' };
  return out;
}
