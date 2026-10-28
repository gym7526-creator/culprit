import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { track } from '@/analytics';
import { useAppStore } from '@/features/appStore';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';

/** Closing any paywall step returns to the locked O21 preview (spec §9). */
export function usePaywallClose(step: string) {
  const router = useRouter();
  const closed = useSubscriptionStore((s) => s.paywallClosed);
  return useCallback(() => {
    closed(Date.now());
    track({ name: 'paywall_closed', props: { step } });
    // Skin-only users go back to their locked routine preview.
    const skinOnly =
      useAppStore.getState().program === null && useSkinStore.getState().program !== null;
    router.replace(skinOnly ? '/skin-setup/preview' : onboardingHref('first-week'));
  }, [closed, router, step]);
}
