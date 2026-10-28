import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { welcomeOfferDue } from '@/engines/paywall';
import { useAppStore } from '@/features/appStore';
import { isStep } from '@/features/onboarding/flow';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';
import { usePrefsStore } from '@/features/prefsStore';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';

function useHydrated(): boolean {
  const [ready, setReady] = useState(
    () => usePrefsStore.persist.hasHydrated() && useSubscriptionStore.persist.hasHydrated(),
  );
  useEffect(() => {
    if (ready) return;
    const check = () =>
      usePrefsStore.persist.hasHydrated() &&
      useSubscriptionStore.persist.hasHydrated() &&
      setReady(true);
    const a = usePrefsStore.persist.onFinishHydration(check);
    const b = useSubscriptionStore.persist.onFinishHydration(check);
    check();
    return () => {
      a();
      b();
    };
  }, [ready]);
  return ready;
}

/**
 * Entry: subscribers go to the app; people who finished onboarding see their locked first week
 * (or the one-time welcome offer); everyone else resumes onboarding where they left off.
 */
export default function Index() {
  const hydrated = useHydrated();
  const completed = usePrefsStore((s) => s.onboardingCompleted);
  const step = usePrefsStore((s) => s.onboardingStep);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const paywall = useSubscriptionStore((s) => s.paywall);
  const hasSkin = useSkinStore((s) => s.program !== null);
  const hasStomach = useAppStore((s) => s.program !== null);
  const skinOnly = hasSkin && !hasStomach;
  const [openedAt] = useState(() => Date.now());

  if (!hydrated) return null; // native splash stays up
  if (isPro) return <Redirect href="/(tabs)" />;
  if (completed) {
    if (skinOnly) return <Redirect href="/skin-setup/preview" />;
    return welcomeOfferDue(paywall, openedAt) ? (
      <Redirect href="/(paywall)/welcome-offer" />
    ) : (
      <Redirect href={onboardingHref('first-week')} />
    );
  }
  // The loader can't be resumed mid-way; restart it from the consent screen.
  const resume = step && isStep(step) ? (step === 'building' ? 'how-it-works' : step) : 'welcome';
  return <Redirect href={onboardingHref(resume)} />;
}
