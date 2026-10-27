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
