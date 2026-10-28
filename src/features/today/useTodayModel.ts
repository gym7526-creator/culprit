import { useMemo } from 'react';

import { format, todayCopy } from '@/copy';
import { content, recipeMap } from '@/data/content';
import type { Recipe, TestDefinition } from '@/data/content/schema';
import { diffDays, type DayKey } from '@/engines/dates';
import type { PlannedNight, WeekPlan } from '@/engines/plan';
import { todayInfo, type ProgramState } from '@/engines/program';
import { cardOfTheDay, dayKind, nextTestStart, pickStaples } from '@/engines/today';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';
import { useActivePlan } from '@/features/plan/hooks';

export type PillTone = 'calm' | 'testing' | 'plan';

export type TodayModel = {
  today: DayKey;
  program: ProgramState;
  plan: WeekPlan | null;
  /** Tonight, or tomorrow's first night before the plan starts. */
  night: PlannedNight | null;
  isTomorrow: boolean;
  recipe: Recipe | null;
  pill: { text: string; tone: PillTone };
  test: { def: TestDefinition; dose: number; portion: string; detail: string } | null;
  ring: number;
  next: string | null;
  staples: ReturnType<typeof pickStaples>;
  card: ReturnType<typeof cardOfTheDay>;
};

const testName = (id: string) => content.tests.tests.find((t) => t.id === id)?.name ?? id;

export function useTodayModel(): TodayModel | null {
  const { today } = useClock();
  const program = useAppStore((s) => s.program);
  const dismissed = useAppStore((s) => s.dismissedCards);
  const answers = useOnboardingStore((s) => s.answers);
  const plan = useActivePlan();

  return useMemo(() => {
    if (!program) return null;
    const isTomorrow = plan ? diffDays(today, plan.weekStart) > 0 : false;
    const nightDay = isTomorrow && plan ? plan.weekStart : today;
    const night = plan?.nights.find((n) => n.day === nightDay) ?? null;
    const recipe = night?.recipeId ? (recipeMap.get(night.recipeId) ?? null) : null;

    const info = todayInfo(program, today);
    const kind = dayKind(program, today);
    let pill: TodayModel['pill'];
    if (program.gentle) pill = { text: todayCopy.phase.gentle, tone: 'plan' };
    else if (kind.type === 'paused') pill = { text: todayCopy.phase.paused, tone: 'plan' };
    else if (kind.type === 'personal') pill = { text: todayCopy.phase.personal, tone: 'plan' };
    else if (kind.type === 'calm')
      pill = {
        text: format(todayCopy.phase.calm, { day: kind.calmDay, total: info.calmTarget }),
        tone: 'calm',
      };
    else if (kind.type === 'dose')
      pill = {
        text: format(todayCopy.phase.testing, {
          group: testName(kind.group),
          dose: kind.dose,
          total: 3,
        }),
        tone: 'testing',
      };
    else if (program.phase === 'setup')
      pill = { text: todayCopy.phase.startsTomorrow, tone: 'calm' };
    else pill = { text: todayCopy.phase.rest, tone: 'testing' };

    let test: TodayModel['test'] = null;
    if (kind.type === 'dose' && kind.kind !== 'control' && !isTomorrow) {
      const def = content.tests.tests.find((t) => t.id === kind.group);
      const dose = def?.doses[kind.dose - 1];
      if (def && dose) {
        const how =
          def.hostType === 'addon' && recipe
            ? format(todayCopy.testInDinner, { dish: recipe.title.toLowerCase() })
            : def.hostType === 'timing'
              ? todayCopy.testTiming
              : todayCopy.testSide;
        test = {
          def,
          dose: kind.dose,
          portion: dose.portion,
          detail: format(todayCopy.testDetail, { portion: dose.portion, how }),
        };
      }
    }

    const nextT = nextTestStart(program, today);
    const next = program.gentle
      ? null
      : nextT
        ? format(todayCopy.nextTest, {
            group: testName(nextT.group),
            day:
              diffDays(today, nextT.day) <= 6
                ? weekdayName(nextT.day)
                : nextT.day.slice(5).replace('-', '/'),
          })
        : program.phase === 'personal'
          ? todayCopy.allDone
          : null;

    const phase =
      program.phase === 'personal' || program.gentle
        ? 'personal'
        : program.phase === 'testing'
          ? 'testing'
          : 'calm';
    return {
      today,
      program,
      plan,
      night,
      isTomorrow,
      recipe,
      pill,
      test,
      ring: info.progress,
      next,
      staples: pickStaples(
        content.staples,
        {
          phase,
          profile: program.profile,
          gentle: program.gentle,
          diet: answers.diet ?? 'none',
          allergens: answers.allergens,
        },
        today,
      ),
      card: cardOfTheDay(content.cards, program, today, dismissed),
    };
  }, [program, plan, today, dismissed, answers]);
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function weekdayName(day: DayKey): string {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number);
  return WEEKDAYS[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7]!;
}
