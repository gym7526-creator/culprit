export const common = {
  appName: 'Culprit',
  tagline: 'Find the foods wrecking your stomach, without logging a thing.',

  /**
   * Shown in onboarding (one line + link), Settings, and on the results report (spec §2).
   * This is the ONLY place the words "diagnose" / "treat" may appear; see __tests__/copy.test.ts.
   */
  disclaimer:
    "Culprit is a wellness tool that helps you spot food patterns. It is not medical advice and doesn't diagnose or treat any condition. Talk to a doctor about ongoing symptoms.",
  disclaimerShort: 'Not medical advice.',
  disclaimerLink: 'Read more',

  estimateSuffix: 'est.',
  priceEstimateInfoTitle: 'About these prices',
  priceEstimateInfoBody:
    'Based on typical regular prices in your region, not live store prices. Tap any item to set your own price.',

  continue: 'Continue',
  back: 'Back',
  close: 'Close',
  done: 'Done',
  cancel: 'Cancel',
  loading: 'Loading',
  retry: 'Try again',
  somethingWentWrong: 'Something went wrong.',
} as const;
