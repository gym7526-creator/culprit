import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { track } from '@/analytics';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';

/** Closing any paywall step returns to the locked O21 preview (spec §9). */
export function usePaywallClose(step: string) {
  const router = useRouter();
  const closed = useSubscriptionStore((s) => s.paywallClosed);
  return useCallback(() => {
    closed(Date.now());
    track({ name: 'paywall_closed', props: { step } });
    router.replace(onboardingHref('first-week'));
  }, [closed, router, step]);
}
