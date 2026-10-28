import { useMemo } from 'react';

import { content } from '@/data/content';
import { checkinTarget, streak } from '@/engines/checkin';
import { caseSolved } from '@/engines/report';
import { dayKind } from '@/engines/today';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';

export type Moments = {
  checkin: { day: string; isYesterday: boolean; testDay: boolean } | null;
  /** Today's check-in already logged (for the collapsed card). */
  loggedToday: boolean;
  streak: number;
  /** Completed tests whose verdict hasn't been seen. */
  unrevealed: { id: string; group: string; name: string }[];
  calmDone: boolean;
  solved: boolean;
};

/** Check-in card target, streak and pending reveals for Today. */
export function useMoments(forceCheckin = false): Moments | null {
  const { today, hour } = useClock();
  const program = useAppStore((s) => s.program);
  const checkins = useAppStore((s) => s.checkins);
  const revealed = useAppStore((s) => s.revealed);
  const celebrated = useAppStore((s) => s.celebrated);
  return useMemo(() => {
    if (!program) return null;
    const target = checkinTarget(
      { day: today, hour },
      checkins,
      program.calmStartedOn,
      forceCheckin,
    );
    const kind = target ? dayKind(program, target) : null;
    return {
      checkin: target
        ? {
            day: target,
            isYesterday: target !== today,
            testDay: kind?.type === 'dose' || program.current?.doseDays.includes(target) === true,
          }
        : null,
      loggedToday: checkins[today] !== undefined,
      streak: streak(checkins, today),
      unrevealed: program.completed
        .filter((t) => t.result && t.kind !== 'control' && !revealed.includes(t.id))
        .map((t) => ({
          id: t.id,
          group: t.group,
          name: content.tests.tests.find((d) => d.id === t.group)?.name ?? t.group,
        })),
      calmDone: program.calmEndedOn !== null && !celebrated.includes('calm_complete'),
      solved: caseSolved(program) && !celebrated.includes('case_solved'),
    };
  }, [program, checkins, revealed, celebrated, today, hour, forceCheckin]);
}
