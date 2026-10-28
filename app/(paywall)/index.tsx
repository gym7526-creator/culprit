import { useRouter } from 'expo-router';

import { onboardingCopy, paywallCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';

/** Placeholder until the RevenueCat paywall lands in Phase 4. */
export default function PaywallPlaceholder() {
  const router = useRouter();
  return (
    <InfoScreen
      emoji={paywallCopy.placeholder.emoji}
      title={paywallCopy.placeholder.title}
      body={paywallCopy.placeholder.body}
      testID="paywall-placeholder"
      primary={{
        label: paywallCopy.placeholder.back,
        onPress: () => router.replace(onboardingHref('first-week')),
      }}
      secondary={{
        label: onboardingCopy.welcome.cta,
        onPress: () => router.replace(onboardingHref('welcome')),
      }}
    />
  );
}
