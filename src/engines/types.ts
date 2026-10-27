/** Types shared by the engines. Pure TypeScript; no React. */
import type { TestGroup } from '../data/content/schema.ts';
import type { DayKey } from './dates.ts';

export type Profile = 'fodmap' | 'reflux' | 'mixed';

export type Score = 0 | 1 | 2 | 3 | 4;

export const SYMPTOMS = ['bloating', 'gas', 'pain', 'heartburn', 'diarrhea', 'constipation', 'nausea'] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export const UNUSUAL_REASONS = ['sick', 'period', 'stressed', 'travel', 'alcohol', 'poor_sleep'] as const;
export type UnusualReason = (typeof UNUSUAL_REASONS)[number];

/** One evening check-in (spec §6.2). Missing days are simply absent, never assumed. */
export type CheckIn = {
  day: DayKey;
  score: Score;
  symptoms: Symptom[];
  unusual: UnusualReason[];
  /** Only asked on test days. null = not answered (treated as "yes"). */
  testFoodTaken: boolean | null;
};

export type CheckInMap = ReadonlyMap<DayKey, CheckIn>;

export type TestKind = 'real' | 'control' | 'retest';

export type { DayKey, TestGroup };
