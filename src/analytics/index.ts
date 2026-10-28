/**
 * Analytics facade (spec §13). Events go to PostHog when `EXPO_PUBLIC_POSTHOG_KEY` is set and the user
 * hasn't opted out; otherwise they only land in the in-memory debug log. NEVER pass health data: no
 * symptoms, scores, results, safety answers or screen names (routes like /test/garlic would leak them).
 */
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import type PostHog from 'posthog-react-native';
export type AnalyticsEvent =
  | { name: 'app_opened' }
  | { name: 'notification_opened'; props: { type: string } }
  | { name: 'program_paused' }
  | { name: 'onboarding_step_viewed'; props: { step: string } }
  | { name: 'onboarding_completed' }
  | { name: 'plan_preview_viewed' }
  | { name: 'plan_generated' }
  | { name: 'paywall_viewed'; props: { step: string; offering: string } }
  | { name: 'paywall_closed'; props: { step: string } }
  | { name: 'trial_started'; props: { product: string } }
  | { name: 'purchase_completed'; props: { product: string } }
  | { name: 'purchase_restored' }
  | { name: 'welcome_offer_viewed' }
  | { name: 'dinner_swapped' }
  | { name: 'eating_out_marked' }
  | { name: 'list_item_checked' }
  | { name: 'list_shared' }
  | { name: 'checkin_submitted' }
  | { name: 'test_started'; props: { group: string } }
  | { name: 'test_completed' }
  | { name: 'retest_requested' }
  | { name: 'share_card_created' }
  | { name: 'pdf_exported' }
  | { name: 'rating_prompt_shown' };

const sink: AnalyticsEvent[] = [];
let client: PostHog | null = null;
let enabled = true;

function posthog(): PostHog | null {
  if (!enabled) return null;
  if (client) return client;
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key || Platform.OS === 'web') return null;
  // Loaded lazily so tests, web previews and keyless builds never start PostHog.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('posthog-react-native') as typeof import('posthog-react-native');
  const PostHogClient = mod.default;
  client = new PostHogClient(key, {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    customStorage: Storage,
    enableSessionReplay: false,
    captureAppLifecycleEvents: false,
  });
  return client;
}

export function track(event: AnalyticsEvent): void {
  sink.push(event);
  if (sink.length > 50) sink.shift();
  const ph = posthog();
  if (ph) ph.capture(event.name, 'props' in event ? event.props : undefined);
}

/** Non-health user properties (spec §13): source, mode, profile type, buckets, chain, phase. */
export type UserProperties = {
  source?: string | null;
  mode?: 'stomach' | 'skin' | 'both' | null;
  profile?: 'fodmap' | 'reflux' | 'mixed';
  household_bucket?: string;
  budget_bucket?: string;
  store_chain?: string | null;
  phase?: string;
};

export function setUserProperties(props: UserProperties): void {
  const ph = posthog();
  if (ph) void ph.register(Object.fromEntries(Object.entries(props).filter(([, v]) => v != null)));
}

export function householdBucket(n: number): string {
  return n <= 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : '5+';
}

export function budgetBucket(n: number): string {
  return n < 75 ? '<75' : n < 125 ? '75-124' : n < 200 ? '125-199' : '200+';
}

/** Settings → "Share anonymous usage data". */
export function setAnalyticsEnabled(on: boolean): void {
  enabled = on;
  if (client) {
    if (on) void client.optIn();
    else void client.optOut();
  }
}

/** "Delete all my data": forget the anonymous analytics id. */
export function resetAnalytics(): void {
  client?.reset();
}

/** Recent events, for the debug screen and tests. */
export function recentEvents(): readonly AnalyticsEvent[] {
  return sink;
}
