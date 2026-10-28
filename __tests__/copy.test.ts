import * as copy from '@/copy';
import { common, format, formatMoney } from '@/copy';

/** Spec §2 language rules. Matched case-insensitively against every string in /src/copy. */
const BANNED: readonly RegExp[] = [
  /\bdiagnos/i,
  /\bcure[sd]?\b/i,
  /\btreat(s|ed|ing|ment)?\b/i,
  /heal your gut/i,
  /\bguarantee/i,
  /\bcalorie/i,
  /weight[- ]loss/i,
  /\blose weight\b/i,
];

/** The medical disclaimer must say what Culprit doesn't do. */
const ALLOWED = new Set<string>([common.disclaimer]);

function collectStrings(value: unknown, path: string, out: [string, string][]): void {
  if (typeof value === 'string') {
    out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`, out);
  }
}

describe('copy language rules', () => {
  const strings: [string, string][] = [];
  collectStrings(copy, 'copy', strings);

  it('collects the copy module', () => {
    expect(strings.length).toBeGreaterThan(50);
  });

  it('contains no banned medical / diet language', () => {
    const offenders = strings.filter(
      // Source URLs (spec §17) are addresses, not app copy.
      ([, text]) =>
        !ALLOWED.has(text) && !/^https?:\/\//.test(text) && BANNED.some((re) => re.test(text)),
    );
    expect(offenders).toEqual([]);
  });

  it('keeps the exact disclaimer from the spec', () => {
    expect(common.disclaimer).toBe(
      "Culprit is a wellness tool that helps you spot food patterns. It is not medical advice and doesn't diagnose or treat any condition. Talk to a doctor about ongoing symptoms.",
    );
  });
});

describe('format', () => {
  it('fills placeholders', () => {
    expect(format('Day {day} of {total}', { day: 2, total: 3 })).toBe('Day 2 of 3');
  });
  it('leaves unknown placeholders visible', () => {
    expect(format('{a} {b}', { a: 'x' })).toBe('x {b}');
  });
});

describe('formatMoney', () => {
  it('formats cents', () => {
    expect(formatMoney(112.4)).toBe('$112.40');
  });
  it('formats whole budgets', () => {
    expect(formatMoney(130, true)).toBe('$130');
  });
});
