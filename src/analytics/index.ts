/**
 * Analytics facade (spec §13). PostHog is wired in Phase 7; until then events are no-ops (logged in
 * dev). NEVER pass health data: no symptoms, scores, results or safety answers.
 */
export type AnalyticsEvent =
  | { name: 'app_opened' }
  | { name: 'onboarding_step_viewed'; props: { step: string } }
  | { name: 'onboarding_completed' }
  | { name: 'plan_preview_viewed' }
  | { name: 'plan_generated' }
  | { name: 'paywall_viewed'; props: { step: string; offering: string } }
  | { name: 'paywall_closed'; props: { step: string } }
  | { name: 'trial_started'; props: { product: string } }
  | { name: 'purchase_completed'; props: { product: string } }
  | { name: 'purchase_restored' }
  | { name: 'welcome_offer_viewed' };

const sink: AnalyticsEvent[] = [];

export function track(event: AnalyticsEvent): void {
  sink.push(event);
  if (sink.length > 50) sink.shift();
}

/** Recent events, for the debug screen and tests. */
export function recentEvents(): readonly AnalyticsEvent[] {
  return sink;
}
