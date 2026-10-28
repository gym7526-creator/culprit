/**
 * Synthetic check-ins for the debug screen and end-to-end tests (spec §10.7). Pure.
 *
 * - clear: calm/rest days "Good"; the first FODMAP suspect (garlic, or coffee for reflux) reacts on
 *   dose 1, the second (onion, or tomato) on dose 2; everything else is fine.
 * - noisy: scores wander between Great and Bad at random, nothing clear.
 * - control_reaction: like clear, but the placebo also produces a reaction.
 */
import type { TestDefinition, TestGroup } from '../data/content/schema.ts';
import { addDays, type DayKey } from './dates.ts';
import { advance, type ProgramState } from './program.ts';
import { seededRandom } from './rng.ts';
import type { CheckIn, Score } from './types.ts';

export type SimPattern = 'clear' | 'noisy' | 'control_reaction';

export const SIM_TRIGGER: readonly TestGroup[] = ['garlic', 'coffee'];
export const SIM_PARTIAL: readonly TestGroup[] = ['onion', 'tomato'];

function score(s: ProgramState, day: DayKey, pattern: SimPattern, rnd: () => number): Score {
  if (pattern === 'noisy') return Math.min(3, Math.floor(rnd() * 4)) as Score;
  const cur = s.current;
  if (!cur || cur.startedOn > day) return 1;
  const dose = cur.doseDays.length + 1;
  if (cur.kind === 'control') return pattern === 'control_reaction' ? 3 : 1;
  if (SIM_TRIGGER.includes(cur.group) && dose === 1) return 3;
  if (SIM_PARTIAL.includes(cur.group) && dose === 2) return 3;
  return 1;
}

/** Logs `days` days of check-ins from `from`, advancing the program after each one. */
export function simulateProgram(
  start: ProgramState,
  tests: readonly TestDefinition[],
  from: DayKey,
  days: number,
  pattern: SimPattern,
  existing: Readonly<Record<DayKey, CheckIn>> = {},
  seed = 'sim',
): { program: ProgramState; checkins: Record<DayKey, CheckIn> } {
  const rnd = seededRandom(seed);
  const map = new Map<DayKey, CheckIn>(Object.entries(existing));
  let program = start;
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    const sc = score(program, day, pattern, rnd);
    map.set(day, {
      day,
      score: sc,
      symptoms: sc >= 3 ? ['bloating', 'heartburn'] : [],
      unusual: [],
      testFoodTaken: null,
    });
    program = advance(program, { checkins: map, tests, now: { day: addDays(day, 1), hour: 13 } });
  }
  return { program, checkins: Object.fromEntries(map) };
}
