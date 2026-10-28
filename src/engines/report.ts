/**
 * Case file data (spec §10.5): suspect board, counts, trend, per-test charts, the solved report and
 * the share line. Pure.
 */
import type { TestGroup } from '../data/content/schema.ts';
import { addDays, diffDays, rangeDays, type DayKey } from './dates.ts';
import { groupStatus, latestResults, type GroupStatus, type ProgramState } from './program.ts';
import type { TestResult } from './scoring.ts';
import type { CheckIn } from './types.ts';

export type BoardItem = {
  group: TestGroup;
  status: GroupStatus | 'known_fine';
  result: TestResult | null;
};

/** Every food in this person's case: tested, in progress, queued, self-reported or known fine. */
export function suspectBoard(p: ProgramState): BoardItem[] {
  const results = latestResults(p);
  const groups: TestGroup[] = [];
  const add = (g: TestGroup) => {
    if (g !== 'control' && !groups.includes(g)) groups.push(g);
  };
  p.completed.forEach((t) => add(t.group));
  if (p.current) add(p.current.group);
  p.queue.forEach((q) => add(q.group));
  p.selfReported.forEach(add);
  const items: BoardItem[] = groups.map((g) => ({
    group: g,
    status: groupStatus(p, g),
    result: results.get(g) ?? null,
  }));
  for (const g of p.knownFine)
    if (!groups.includes(g)) items.push({ group: g, status: 'known_fine', result: null });
  return items;
}

export type CaseCounts = {
  cleared: number;
  triggers: number;
  partial: number;
  unclear: number;
  toGo: number;
};

export function caseCounts(board: readonly BoardItem[]): CaseCounts {
  const c: CaseCounts = { cleared: 0, triggers: 0, partial: 0, unclear: 0, toGo: 0 };
  for (const b of board) {
    if (b.status === 'cleared' || b.status === 'known_fine') c.cleared++;
    else if (b.status === 'trigger' || b.status === 'self_reported') c.triggers++;
    else if (b.status === 'partial') c.partial++;
    else if (b.status === 'unclear') c.unclear++;
    else c.toGo++;
  }
  return c;
}

/** All tests done (the queue is empty and nothing is running). Gentle mode has no case to solve. */
export function caseSolved(p: ProgramState): boolean {
  return !p.gentle && p.phase === 'personal' && p.current === null && p.queue.length === 0;
}

export type TrendPoint = { day: DayKey; score: number | null; smooth: number | null };

/** Daily scores with a trailing 7-day mean (over logged days only). */
export function trend(
  checkins: Readonly<Record<DayKey, CheckIn>>,
  from: DayKey,
  to: DayKey,
): TrendPoint[] {
  const days = rangeDays(from, Math.max(0, diffDays(from, to)) + 1);
  return days.map((day) => {
    const window = rangeDays(addDays(day, -6), 7)
      .map((d) => checkins[d]?.score)
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .map(Number);
    return {
      day,
      score: checkins[day]?.score ?? null,
      smooth: window.length
        ? Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 100) / 100
        : null,
    };
  });
}

export type TestChart = {
  days: { day: DayKey; score: number | null; dose: number | null }[];
  baseline: number | null;
};

/** Scores around one test: two days before the first dose to two days after the last. */
export function testChart(
  p: ProgramState,
  testId: string,
  checkins: Readonly<Record<DayKey, CheckIn>>,
): TestChart | null {
  const t =
    p.completed.find((x) => x.id === testId) ?? (p.current?.id === testId ? p.current : null);
  if (!t || t.doseDays.length === 0) return null;
  const first = t.doseDays[0]!;
  const last = t.doseDays[t.doseDays.length - 1]!;
  const days = rangeDays(addDays(first, -2), diffDays(first, last) + 5).map((day) => ({
    day,
    score: checkins[day]?.score ?? null,
    dose: t.doseDays.includes(day) ? t.doseDays.indexOf(day) + 1 : null,
  }));
  const result = 'result' in t ? t.result : null;
  return { days, baseline: result?.baseline ?? null };
}

export type CaseReport = {
  triggers: TestResult[];
  partial: TestResult[];
  cleared: TestResult[];
  unclear: TestResult[];
  selfReported: TestGroup[];
  knownFine: TestGroup[];
  controls: { day: DayKey; reacted: boolean }[];
};

export function caseReport(p: ProgramState): CaseReport {
  const results = [...latestResults(p).values()];
  return {
    triggers: results.filter((r) => r.outcome === 'trigger'),
    partial: results.filter((r) => r.outcome === 'partial'),
    cleared: results.filter((r) => r.outcome === 'tolerated'),
    unclear: results.filter((r) => r.outcome === 'unclear'),
    selfReported: [...p.selfReported],
    knownFine: [...p.knownFine],
    controls: p.completed
      .filter((t) => t.kind === 'control' && t.result)
      .map((t) => ({
        day: t.doseDays[0] ?? t.startedOn,
        reacted: t.result!.outcome === 'trigger' || t.result!.outcome === 'partial',
      })),
  };
}

/** "Garlic ❌ · Onion (small amounts) 🟡 · Dairy ✅" for the share card. */
export function shareLine(
  report: CaseReport,
  name: (g: TestGroup) => string,
  smallAmounts: string,
): string {
  return [
    ...report.triggers.map((r) => `${name(r.group)} ❌`),
    ...report.partial.map((r) => `${name(r.group)} (${smallAmounts}) 🟡`),
    ...report.cleared.map((r) => `${name(r.group)} ✅`),
  ].join(' · ');
}
