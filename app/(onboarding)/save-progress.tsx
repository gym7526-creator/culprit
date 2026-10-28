import { useRouter } from 'expo-router';

import { track } from '@/analytics';
import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { usePrefsStore } from '@/features/prefsStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';

const c = onboardingCopy.saveProgress;

/**
 * O22. Accounts (Sign in with Apple / Google) need a backend and new dependencies, so the MVP keeps
 * everything on the device. With no social login offered, Apple's "Sign in with Apple too" rule
 * doesn't apply yet.
 */
export default function SaveProgress() {
  const router = useRouter();
  useOnboardingNav('save-progress');
  const complete = usePrefsStore((s) => s.completeOnboarding);
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="save-progress"
      primary={{
        label: c.cta,
        testID: 'save-continue',
        onPress: () => {
          complete();
          track({ name: 'onboarding_completed' });
          router.replace(useSubscriptionStore.getState().isPro ? '/(tabs)' : '/(paywall)');
        },
      }}
    />
  );
}
