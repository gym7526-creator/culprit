/** Fills `{name}` placeholders. Unknown placeholders are left as-is so missing data is visible in dev. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** "$112.40". Pass `whole` for budget-style amounts ("$130"). */
export function formatMoney(amount: number, whole = false): string {
  return (whole ? usdWhole : usd).format(amount);
}

/** "20:30" → "8:30 pm". */
export function formatClock(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "2026-10-28" → "Wednesday, Oct 28" (or "Wed" / "Wed 28" with `short`). */
export function formatDay(day: string, style: 'long' | 'short' | 'weekday' = 'long'): string {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  if (style === 'weekday') return WEEKDAYS_SHORT[wd]!;
  if (style === 'short') return `${WEEKDAYS_SHORT[wd]} ${d}`;
  return `${WEEKDAYS[wd]}, ${MONTHS[m - 1]} ${d}`;
}

/** Recipe quantities: 0.5 → "½", 1.25 → "1¼", 2 → "2". */
export function formatQty(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  const fractions: [number, string][] = [
    [0.125, '⅛'],
    [0.25, '¼'],
    [0.333, '⅓'],
    [0.5, '½'],
    [0.667, '⅔'],
    [0.75, '¾'],
  ];
  if (frac < 0.06) return String(whole);
  if (frac > 0.94) return String(whole + 1);
  const [, glyph] = fractions.reduce((best, f) =>
    Math.abs(f[0] - frac) < Math.abs(best[0] - frac) ? f : best,
  );
  return whole > 0 ? `${whole}${glyph}` : glyph;
}
