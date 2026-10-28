/**
 * Paywall rules (spec §9). Pure: prices always come from the store offering, never from here.
 */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
/** The welcome offer appears this long after the paywall was first closed. */
export const WELCOME_OFFER_DELAY_MS = DAY_MS;
/** Never show the paywall on its own more than once a day. */
export const NAG_INTERVAL_MS = DAY_MS;

/** ISO 8601 period ("P3D", "P1W", "P1M", "P1Y") → days. Months count as 30, years as 365. */
export function periodDays(period: string | null | undefined): number | null {
  if (!period) return null;
  const m = /^P(\d+)([DWMY])$/.exec(period);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  return unit === 'D' ? n : unit === 'W' ? n * 7 : unit === 'M' ? n * 30 : n * 365;
}

/** Rounded "save X%" of an annual plan against twelve monthly payments. Null if no saving. */
export function savingsPercent(annualPrice: number, monthlyPrice: number): number | null {
  if (annualPrice <= 0 || monthlyPrice <= 0) return null;
  const pct = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  return pct > 0 ? pct : null;
}

/** Local currency string for a per-month price, used only when the store doesn't give one. */
export function formatPrice(amount: number, currencyCode: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      Math.floor(amount * 100) / 100,
    );
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export type PaywallMemory = {
  /** Epoch ms of the first time the paywall was closed without buying. */
  firstClosedAt: number | null;
  welcomeOfferShownAt: number | null;
  /** Last time the app showed a paywall on its own (not from a tap). */
  lastAutoShownAt: number | null;
};

export const emptyPaywallMemory: PaywallMemory = {
  firstClosedAt: null,
  welcomeOfferShownAt: null,
  lastAutoShownAt: null,
};

/** One-time welcome offer: 24 h after the first close, shown once, and not on a day we already nagged. */
export function welcomeOfferDue(m: PaywallMemory, now: number): boolean {
  if (m.firstClosedAt === null || m.welcomeOfferShownAt !== null) return false;
  if (now - m.firstClosedAt < WELCOME_OFFER_DELAY_MS) return false;
  return m.lastAutoShownAt === null || now - m.lastAutoShownAt >= NAG_INTERVAL_MS;
}

/** When a free trial ends, given its start (epoch ms) and length. */
export function trialEndsAt(startedAt: number, trialDays: number): number {
  return startedAt + trialDays * DAY_MS;
}
