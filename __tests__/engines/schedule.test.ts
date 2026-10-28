import { addDays } from '@/engines/dates';
import {
  fromMinutes,
  isQuiet,
  scheduleNotifications,
  toMinutes,
  type ScheduleInput,
} from '@/engines/schedule';

const TUE = '2026-05-05';
const ALL = { checkin: true, tests: true, plan: true, trial: true, milestones: true };

function input(over: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    now: { day: TUE, time: '09:00' },
    horizonDays: 7,
    checkInTime: '20:30',
    checkedInDays: new Set(),
    testNights: {},
    sundayPlan: null,
    trialEnds: null,
    milestones: [],
    enabled: ALL,
    ...over,
  };
}

describe('time helpers', () => {
  it('converts and detects quiet hours', () => {
    expect(toMinutes('20:30')).toBe(1230);
    expect(fromMinutes(1275)).toBe('21:15');
    expect(fromMinutes(-30)).toBe('23:30');
    expect(isQuiet('22:00')).toBe(true);
    expect(isQuiet('07:59')).toBe(true);
    expect(isQuiet('08:00')).toBe(false);
    expect(isQuiet('21:59')).toBe(false);
  });
});

describe('check-in nudges', () => {
  it('schedules the check-in and one follow-up 45 minutes later each day', () => {
    const n = scheduleNotifications(input());
    const today = n.filter((x) => x.day === TUE);
    expect(today.map((x) => [x.kind, x.time])).toEqual([
      ['checkin', '20:30'],
      ['checkin_followup', '21:15'],
    ]);
    expect(n.filter((x) => x.kind === 'checkin')).toHaveLength(7);
  });

  it('never sends more than 2 check-in nudges a day', () => {
    const perDay = new Map<string, number>();
    for (const x of scheduleNotifications(input())) {
      if (x.kind.startsWith('checkin')) perDay.set(x.day, (perDay.get(x.day) ?? 0) + 1);
    }
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(2);
  });

  it('skips days already checked in', () => {
    const n = scheduleNotifications(input({ checkedInDays: new Set([TUE]) }));
    expect(n.some((x) => x.day === TUE && x.kind.startsWith('checkin'))).toBe(false);
  });

  it('keeps a late chosen check-in time but drops a follow-up that lands in quiet hours', () => {
    const n = scheduleNotifications(input({ checkInTime: '21:45' })).filter((x) => x.day === TUE);
    expect(n.map((x) => x.kind)).toEqual(['checkin']);
  });

  it('does not schedule anything in the past', () => {
    const n = scheduleNotifications(input({ now: { day: TUE, time: '20:45' } }));
    expect(n.find((x) => x.day === TUE)?.kind).toBe('checkin_followup');
  });
});

describe('other notifications', () => {
  it('test heads-up at 4 pm', () => {
    const day = addDays(TUE, 1);
    const n = scheduleNotifications(
      input({ testNights: { [day]: { portion: '¼ clove garlic', dish: 'stir-fry' } } }),
    );
    expect(n.find((x) => x.kind === 'test_heads_up')).toMatchObject({
      day,
      time: '16:00',
      body: '🧪 Tonight’s test: ¼ clove garlic in your stir-fry.',
    });
  });

  it('Sunday plan drop at 10 am', () => {
    const n = scheduleNotifications(
      input({ sundayPlan: { count: 5, total: '$108.20', store: 'Walmart' } }),
    );
    expect(n.find((x) => x.kind === 'sunday_plan')).toMatchObject({
      day: '2026-05-10',
      time: '10:00',
      body: 'Your week is ready: 5 dinners, $108.20 at Walmart (est.).',
    });
  });

  it('trial reminder 24 h before the trial ends', () => {
    const n = scheduleNotifications(input({ trialEnds: { day: addDays(TUE, 3), time: '15:00' } }));
    expect(n.find((x) => x.kind === 'trial_ending')).toMatchObject({
      day: addDays(TUE, 2),
      time: '15:00',
    });
  });

  it('moves a trial reminder out of quiet hours to the evening before', () => {
    const n = scheduleNotifications(input({ trialEnds: { day: addDays(TUE, 3), time: '06:30' } }));
    expect(n.find((x) => x.kind === 'trial_ending')).toMatchObject({
      day: addDays(TUE, 1),
      time: '21:00',
    });
  });

  it('milestones fire right away, or at 8 am during quiet hours', () => {
    const day = scheduleNotifications(input({ milestones: [{ kind: 'calm_complete' }] }));
    expect(day.find((x) => x.kind === 'calm_complete')).toMatchObject({ day: TUE, time: '09:01' });
    const night = scheduleNotifications(
      input({
        now: { day: TUE, time: '23:10' },
        milestones: [{ kind: 'result_ready', group: 'Garlic' }],
      }),
    );
    expect(night.find((x) => x.kind === 'result_ready')).toMatchObject({
      day: addDays(TUE, 1),
      time: '08:00',
      body: 'Garlic test complete. Tap to see the verdict.',
    });
  });

  it('respects per-type toggles', () => {
    const n = scheduleNotifications(
      input({
        enabled: { ...ALL, checkin: false },
        sundayPlan: { count: 5, total: '$1', store: 'X' },
      }),
    );
    expect(n.some((x) => x.kind.startsWith('checkin'))).toBe(false);
    expect(n.some((x) => x.kind === 'sunday_plan')).toBe(true);
  });

  it('returns notifications in time order', () => {
    const n = scheduleNotifications(input({ testNights: { [TUE]: { portion: 'x', dish: 'y' } } }));
    expect(n.slice(0, 3).map((x) => x.kind)).toEqual([
      'test_heads_up',
      'checkin',
      'checkin_followup',
    ]);
  });
});
