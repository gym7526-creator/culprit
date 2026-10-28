import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { track } from '@/analytics';
import type { Answers } from '@/engines/onboarding';
import { useClock } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';

import { isStep, nextStep, prevStep, progressOf, type Branch, type Step } from './flow';

export function onboardingHref(step: Step | Branch): Href {
  return `/(onboarding)/${step}` as Href;
}

/**
 * Navigation + answers for one onboarding screen. Records the step for resume-on-relaunch and fires
 * `onboarding_step_viewed` (no answer data).
 */
export function useOnboardingNav(step: Step | Branch) {
  const router = useRouter();
  const answers = useOnboardingStore((s) => s.answers);
  const update = useOnboardingStore((s) => s.update);
  const setResume = usePrefsStore((s) => s.setOnboardingStep);
  const { year, today } = useClock();

  useEffect(() => {
    track({ name: 'onboarding_step_viewed', props: { step } });
    setResume(step);
  }, [step, setResume]);

  const goTo = useCallback((s: Step | Branch) => router.push(onboardingHref(s)), [router]);

  /** Moves to the next applicable step, using `patch` merged into the answers to decide. */
  const goNext = useCallback(
    (patch: Partial<Answers> = {}) => {
      const merged = { ...useOnboardingStore.getState().answers, ...patch };
      if (Object.keys(patch).length > 0) update(patch);
      const next = nextStep(step, merged, year);
      if (next) goTo(next);
    },
    [step, update, year, goTo],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const prev = isStep(step) ? prevStep(step, useOnboardingStore.getState().answers, year) : null;
    if (prev) router.replace(onboardingHref(prev));
  }, [router, step, year]);

  const progress = isStep(step) ? progressOf(step, answers, year) : null;

  return { answers, update, goNext, goBack, goTo, year, today, progress };
}
