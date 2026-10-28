/**
 * Paywall copy (spec §9). Prices are placeholders filled from the store offering with format():
 * never hardcode an amount here.
 */
export const paywallCopy = {
  close: 'Close',
  continue: 'Continue',
  steps: 'Step {current} of {total}',
  p1: {
    title: 'Try Culprit free.',
    benefits: [
      'A new gut-friendly plan every week',
      'Priced at your store, under your budget',
      'Find your triggers with one tap a day',
      'Your personal results, forever',
    ],
    noPayment: 'No payment due now.',
    noPaymentNoTrial: 'Cancel anytime in Settings.',
  },
  p2: {
    title: 'How your free trial works',
    timeline: [
      { emoji: '🔓', when: 'Today', text: 'Full access to your plan.' },
      { emoji: '🔔', when: 'Day {reminderDay}', text: 'We’ll remind you before your trial ends.' },
      {
        emoji: '💳',
        when: 'Day {endDay}',
        text: 'Your subscription starts. Cancel anytime before.',
      },
    ],
  },
  p3: {
    title: 'Choose your plan',
    annual: 'Yearly',
    monthly: 'Monthly',
    perYear: '{price}/year',
    perMonth: '{price}/month',
    perMonthUnder: '{price}/mo',
    badgeTrial: '{days} DAYS FREE · SAVE {pct}%',
    badgeSave: 'SAVE {pct}%',
    ctaTrial: 'Start my free trial',
    ctaSubscribe: 'Subscribe',
    fineTrial:
      '{days} days free, then {price}/year. Auto-renews until canceled. Cancel anytime in Settings.',
    fineAnnual: '{price}/year. Auto-renews until canceled. Cancel anytime in Settings.',
    fineMonthly: '{price}/month. Auto-renews until canceled. Cancel anytime in Settings.',
    selected: 'Selected',
  },
  welcome: {
    title: 'A welcome gift',
    body: 'Your first year of Culprit for {intro}, one time only. Then {price}/year.',
    cta: 'Claim my offer',
    fine: '{intro} for the first year, then {price}/year. Auto-renews until canceled. Cancel anytime in Settings.',
    noThanks: 'No thanks',
  },
  footer: { restore: 'Restore Purchases', terms: 'Terms', privacy: 'Privacy' },
  success: {
    title: 'You’re in.',
    body: 'Your calm start begins tomorrow.',
    cta: 'Let’s go',
  },
  restore: {
    found: 'Welcome back! Your subscription is active.',
    none: 'No active subscription found for this Apple ID.',
    failed: 'Couldn’t reach the store. Check your connection and try again.',
  },
  errors: {
    offering: 'Couldn’t load plans. Check your connection and try again.',
    purchase: 'The purchase didn’t go through. You haven’t been charged.',
  },
  devStore: 'Test store: no real payment',
} as const;
