import { parseTime, snapMinute, toTime } from '@/engines/time';

describe('parseTime', () => {
  it.each([
    ['00:00', { hour12: 12, minute: 0, period: 'am' }],
    ['08:05', { hour12: 8, minute: 5, period: 'am' }],
    ['12:00', { hour12: 12, minute: 0, period: 'pm' }],
    ['20:30', { hour12: 8, minute: 30, period: 'pm' }],
    ['23:00', { hour12: 11, minute: 0, period: 'pm' }],
  ])('%s', (input, expected) => {
    expect(parseTime(input)).toEqual(expected);
  });

  it('clamps garbage input', () => {
    expect(parseTime('99:99')).toEqual({ hour12: 11, minute: 59, period: 'pm' });
    expect(parseTime('nope')).toEqual({ hour12: 12, minute: 0, period: 'am' });
  });
});

describe('toTime', () => {
  it('round-trips every 15-minute slot', () => {
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 15, 30, 45]) {
        const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const p = parseTime(t);
        expect(toTime(p.hour12, p.minute, p.period)).toBe(t);
      }
    }
  });
});

describe('snapMinute', () => {
  it('snaps to the nearest step and wraps', () => {
    expect(snapMinute(37, 15)).toBe(30);
    expect(snapMinute(38, 15)).toBe(45);
    expect(snapMinute(55, 15)).toBe(0);
  });
});
