/**
 * Trigger scoring (spec §6.3). Pure and deterministic.
 *
 * baseline   = mean of the last 5 valid (non-unusual) calm/rest scores before the test; SD alongside.
 * per dose d = window max(score[doseDay], score[doseDay + 1]) (next day only if it isn't the next
 *              dose day); delta = window − baseline.
 * reaction   = delta ≥ 2, or delta ≥ 1 with a matching symptom chip in the window.
 * outcome    = reaction at dose 1 → trigger; dose 2 or 3 → partial; none → tolerated.
 * confidence = HIGH / MEDIUM / LOW by how many quality checks fail (noisy baseline, unusual days in
 *              the window, a nearby placebo reaction). LOW + borderline delta → unclear.
 */
import { format } from '../copy/format.ts';
import { resultCopy } from '../copy/results.ts';
import { addDays, diffDays, type DayKey } from './dates.ts';
import type { CheckIn, CheckInMap, Symptom, TestGroup, TestKind } from './types.ts';

export const BASELINE_DAYS = 5;
export const MIN_BASELINE_DAYS = 3;
export const NOISY_BASELINE_SD = 0.8;
export const REACTION_DELTA = 2;
export const CHIP_REACTION_DELTA = 1;
/** A placebo reaction within this many points of a test's delta makes that test LOW confidence. */
export const SIMILAR_CONTROL_DELTA = 1;

export type Outcome = 'trigger' | 'partial' | 'tolerated' | 'unclear' | 'self_reported';
export type Confidence = 'high' | 'medium' | 'low';

export type ScoredTest = {
  id: string;
  group: TestGroup;
  kind: TestKind;
  /** Days each dose was actually eaten, in order (1 to 3 entries). */
  doseDays: DayKey[];
  /** Human portions for doses 1–3, for the explanation. */
  portions: readonly string[];
  matchingSymptoms: readonly string[];
};

export type ControlSignal = { day: DayKey; reacted: boolean; delta: number | null };

export type TestResult = {
  testId: string;
  group: TestGroup;
  kind: TestKind;
  outcome: Outcome;
  /** Highest dose level (0–3) eaten without a reaction. */
  safeDose: 0 | 1 | 2 | 3;
  reactionDose: 1 | 2 | 3 | null;
  confidence: Confidence | null;
  baseline: number | null;
  baselineSD: number | null;
  /** Delta per dose eaten (null when the window had no check-ins). */
  deltas: (number | null)[];
  /** Largest delta seen, for comparing with placebo reactions. */
  maxDelta: number | null;
  failedChecks: ('noisy_baseline' | 'unusual_days' | 'control_reaction' | 'thin_baseline')[];
  offerRetest: boolean;
  explanation: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function isValid(c: CheckIn | undefined): c is CheckIn {
  return c !== undefined && c.unusual.length === 0;
}

export function mean(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population standard deviation. */
export function stdDev(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * Baseline from the last 5 valid check-ins among the candidate calm/rest days (any order).
 * Returns null when fewer than 3 are available.
 */
export function computeBaseline(
  candidateDays: readonly DayKey[],
  checkins: CheckInMap,
  before?: DayKey,
): { baseline: number; sd: number; n: number } | null {
  const scores = [...candidateDays]
    .filter((d) => (before ? diffDays(d, before) > 0 : true))
    .sort()
    .map((d) => checkins.get(d))
    .filter(isValid)
    .slice(-BASELINE_DAYS)
    .map((c) => c.score);
  if (scores.length < MIN_BASELINE_DAYS) return null;
  return { baseline: round2(mean(scores)), sd: round2(stdDev(scores)), n: scores.length };
}

type Window = { score: number | null; chip: boolean; unusual: boolean; days: DayKey[] };

/**
 * The dose night plus the next day, unless the next day is itself the next dose day. In that case a
 * reaction that evening is attributed to the larger dose eaten then, so the smaller portion counts as
 * tolerated (NHS reintroduction guidance). See CLAUDE.md → Decision log.
 */
function doseWindow(
  doseDay: DayKey,
  nextDoseDay: DayKey | undefined,
  checkins: CheckInMap,
  matching: readonly string[],
): Window {
  const next = addDays(doseDay, 1);
  const days = next === nextDoseDay ? [doseDay] : [doseDay, next];
  const entries = days.map((d) => checkins.get(d)).filter((c): c is CheckIn => c !== undefined);
  const scores = entries.map((c) => c.score);
  return {
    score: scores.length > 0 ? Math.max(...scores) : null,
    chip: entries.some((c) => c.symptoms.some((s: Symptom) => matching.includes(s))),
    unusual: entries.some((c) => c.unusual.length > 0),
    days,
  };
}

function isReaction(delta: number, chip: boolean): boolean {
  return delta >= REACTION_DELTA || (delta >= CHIP_REACTION_DELTA && chip);
}

function isBorderline(delta: number | null, chip: boolean): boolean {
  return delta !== null && delta >= CHIP_REACTION_DELTA && delta < REACTION_DELTA && !chip;
}

/** Days from the reaction until the score is back within 0.5 of baseline (looks ahead up to 7 days). */
function recoveryDays(reactionDay: DayKey, baseline: number, checkins: CheckInMap): number | null {
  for (let i = 1; i <= 7; i++) {
    const c = checkins.get(addDays(reactionDay, i));
    if (c && c.score <= baseline + 0.5) return i;
  }
  return null;
}

function label(score: number): string {
  return resultCopy.faceLabels[Math.max(0, Math.min(4, Math.round(score)))] ?? '';
}

function recoveryText(days: number | null): string {
  if (days === null) return resultCopy.recoveryNone;
  if (days === 1) return resultCopy.recoveryOneDay;
  return format(resultCopy.recoveryDays, { days });
}

/** The placebo test closest in time to `day` (by its first dose day). */
export function nearestControl(day: DayKey, controls: readonly ControlSignal[]): ControlSignal | null {
  let best: ControlSignal | null = null;
  for (const c of controls) {
    if (!best || Math.abs(diffDays(c.day, day)) < Math.abs(diffDays(best.day, day))) best = c;
  }
  return best;
}

export function scoreTest(
  test: ScoredTest,
  checkins: CheckInMap,
  baselineCandidates: readonly DayKey[],
  controls: readonly ControlSignal[] = [],
): TestResult {
  const firstDay = test.doseDays[0];
  const base = firstDay ? computeBaseline(baselineCandidates, checkins, firstDay) : null;
  const empty: TestResult = {
    testId: test.id,
    group: test.group,
    kind: test.kind,
    outcome: 'unclear',
    safeDose: 0,
    reactionDose: null,
    confidence: 'low',
    baseline: base?.baseline ?? null,
    baselineSD: base?.sd ?? null,
    deltas: [],
    maxDelta: null,
    failedChecks: [],
    offerRetest: true,
    explanation: '',
  };
  if (!firstDay) return { ...empty, explanation: resultCopy.noData };
  if (!base) return { ...empty, failedChecks: ['thin_baseline'], explanation: resultCopy.noBaseline };

  const windows = test.doseDays.map((d, i) =>
    doseWindow(d, test.doseDays[i + 1], checkins, test.matchingSymptoms),
  );
  const deltas: (number | null)[] = [];
  let reactionIndex = -1;
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i]!;
    const delta = w.score === null ? null : round2(w.score - base.baseline);
    deltas.push(delta);
    if (delta !== null && isReaction(delta, w.chip)) {
      reactionIndex = i;
      break; // stop when a reaction is found
    }
  }
  const known = deltas.filter((d): d is number => d !== null);
  if (known.length === 0) return { ...empty, deltas, explanation: resultCopy.noData };
  const maxDelta = Math.max(...known);
  const scoredWindows = windows.slice(0, deltas.length);

  // Quality checks → confidence.
  const failed: TestResult['failedChecks'] = [];
  if (base.sd > NOISY_BASELINE_SD) failed.push('noisy_baseline');
  if (scoredWindows.some((w) => w.unusual)) failed.push('unusual_days');
  const ctl = test.kind === 'control' ? null : nearestControl(firstDay, controls);
  const similarControl =
    ctl !== null && ctl.reacted && ctl.delta !== null && Math.abs(ctl.delta - maxDelta) <= SIMILAR_CONTROL_DELTA;
  if (ctl?.reacted) failed.push('control_reaction');
  const confidence: Confidence =
    similarControl || failed.length >= 2 ? 'low' : failed.length === 1 ? 'medium' : 'high';

  const reacted = reactionIndex >= 0;
  const reactionDose = reacted ? ((reactionIndex + 1) as 1 | 2 | 3) : null;
  const allThreeEaten = test.doseDays.length >= 3;
  const borderline = !reacted && scoredWindows.some((w, i) => isBorderline(deltas[i] ?? null, w.chip));

  let outcome: Outcome;
  if (reacted) outcome = reactionIndex === 0 ? 'trigger' : 'partial';
  else if (confidence === 'low' && borderline) outcome = 'unclear';
  else if (!allThreeEaten) outcome = 'unclear';
  else outcome = 'tolerated';

  const safeDose = (reacted ? reactionIndex : outcome === 'tolerated' ? 3 : Math.min(2, deltas.length)) as 0 | 1 | 2 | 3;

  // Explanation.
  let explanation: string;
  if (test.kind === 'control') {
    explanation = reacted ? resultCopy.controlReacted : resultCopy.controlCalm;
  } else if (outcome === 'unclear') {
    explanation = resultCopy.unclear;
  } else if (reacted) {
    const w = scoredWindows[reactionIndex]!;
    const peakDay = w.days.find((d) => checkins.get(d)?.score === w.score) ?? w.days[0]!;
    const vars = {
      from: label(base.baseline),
      to: label(w.score ?? base.baseline),
      portion: test.portions[reactionIndex] ?? '',
      safePortion: test.portions[reactionIndex - 1] ?? '',
      recovery: recoveryText(recoveryDays(peakDay, base.baseline, checkins)),
    };
    explanation = format(outcome === 'trigger' ? resultCopy.trigger : resultCopy.partial, vars);
  } else {
    explanation = format(resultCopy.tolerated, {
      from: label(base.baseline),
      portion: test.portions[test.portions.length - 1] ?? '',
    });
  }

  return {
    testId: test.id,
    group: test.group,
    kind: test.kind,
    outcome,
    safeDose,
    reactionDose,
    confidence,
    baseline: base.baseline,
    baselineSD: base.sd,
    deltas,
    maxDelta,
    failedChecks: failed,
    offerRetest: outcome === 'unclear' || confidence === 'low',
    explanation,
  };
}

/** Result for a test the user skipped by saying "I already know this one bothers me". */
export function selfReportedResult(group: TestGroup): TestResult {
  return {
    testId: `self_${group}`,
    group,
    kind: 'real',
    outcome: 'self_reported',
    safeDose: 0,
    reactionDose: null,
    confidence: null,
    baseline: null,
    baselineSD: null,
    deltas: [],
    maxDelta: null,
    failedChecks: [],
    offerRetest: true,
    explanation: resultCopy.selfReported,
  };
}

/** Summarises a scored placebo test for use as a ControlSignal. */
export function toControlSignal(result: TestResult, firstDay: DayKey): ControlSignal {
  return { day: firstDay, reacted: result.reactionDose !== null, delta: result.maxDelta };
}
