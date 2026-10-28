import { useEffect } from 'react';

import { useAppStore } from '@/features/appStore';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';

import {
  budgetBucket,
  householdBucket,
  setAnalyticsEnabled,
  setUserProperties,
  track,
} from './index';

/** `app_opened` once per launch, the opt-out switch, and non-health user properties (spec §13). */
export function useAnalyticsBootstrap(): void {
  const enabled = usePrefsStore((s) => s.analyticsEnabled);
  const answers = useOnboardingStore((s) => s.answers);
  const profile = useAppStore((s) => s.program?.profile);
  const phase = useAppStore((s) => s.program?.phase);

  useEffect(() => {
    setAnalyticsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    track({ name: 'app_opened' });
  }, []);

  useEffect(() => {
    setUserProperties({
      source: answers.source,
      mode: answers.focus,
      profile,
      household_bucket: householdBucket(answers.household),
      budget_bucket: answers.budget ? budgetBucket(answers.budget) : undefined,
      store_chain: answers.chainId,
      phase,
    });
  }, [
    answers.source,
    answers.focus,
    answers.household,
    answers.budget,
    answers.chainId,
    profile,
    phase,
  ]);
}
