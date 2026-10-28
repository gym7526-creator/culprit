import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { isStep } from '@/features/onboarding/flow';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';
import { usePrefsStore } from '@/features/prefsStore';

/** Entry: resume onboarding where the user left off, or go on to the paywall / app. */
export default function Index() {
  const [hydrated, setHydrated] = useState(usePrefsStore.persist.hasHydrated());
  const completed = usePrefsStore((s) => s.onboardingCompleted);
  const step = usePrefsStore((s) => s.onboardingStep);

  useEffect(() => {
    if (hydrated) return;
    return usePrefsStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  if (!hydrated) return null; // native splash stays up
  if (completed) return <Redirect href="/(paywall)" />;
  // The loader can't be resumed mid-way; restart it from the consent screen.
  const resume = step && isStep(step) ? (step === 'building' ? 'how-it-works' : step) : 'welcome';
  return <Redirect href={onboardingHref(resume)} />;
}
