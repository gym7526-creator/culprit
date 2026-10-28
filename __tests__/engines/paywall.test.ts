import {
  DAY_MS,
  emptyPaywallMemory,
  formatPrice,
  periodDays,
  savingsPercent,
  trialEndsAt,
  welcomeOfferDue,
} from '@/engines/paywall';

describe('paywall rules', () => {
  it('parses store periods', () => {
    expect(periodDays('P3D')).toBe(3);
    expect(periodDays('P1W')).toBe(7);
    expect(periodDays('P1M')).toBe(30);
    expect(periodDays('P1Y')).toBe(365);
    expect(periodDays('bogus')).toBeNull();
    expect(periodDays(null)).toBeNull();
  });

  it('computes the annual saving against monthly', () => {
    expect(savingsPercent(39.99, 9.99)).toBe(67);
    expect(savingsPercent(120, 9.99)).toBeNull();
    expect(savingsPercent(0, 9.99)).toBeNull();
  });

  it('formats a fallback price without rounding up', () => {
    expect(formatPrice(39.99 / 12, 'USD', 'en-US')).toBe('$3.33');
  });

  it('offers the welcome offer once, 24 h after the first close', () => {
    const t0 = 1_000_000;
    const m = { ...emptyPaywallMemory, firstClosedAt: t0 };
    expect(welcomeOfferDue(emptyPaywallMemory, t0)).toBe(false);
    expect(welcomeOfferDue(m, t0 + DAY_MS - 1)).toBe(false);
    expect(welcomeOfferDue(m, t0 + DAY_MS)).toBe(true);
    expect(welcomeOfferDue({ ...m, welcomeOfferShownAt: t0 + DAY_MS }, t0 + 3 * DAY_MS)).toBe(
      false,
    );
  });

  it('never nags twice in a day', () => {
    const t0 = 1_000_000;
    const m = { ...emptyPaywallMemory, firstClosedAt: t0, lastAutoShownAt: t0 + DAY_MS };
    expect(welcomeOfferDue(m, t0 + DAY_MS + 1000)).toBe(false);
    expect(welcomeOfferDue(m, t0 + 2 * DAY_MS)).toBe(true);
  });

  it('computes the trial end', () => {
    expect(trialEndsAt(0, 3)).toBe(3 * DAY_MS);
  });
});
