import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.ageBlocked;

/** Under 13: the app is blocked entirely (COPPA). No answers are kept. */
export default function AgeBlocked() {
  const { update } = useOnboardingNav('age-blocked');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="age-blocked"
      primary={{ label: onboardingCopy.teen.back, onPress: () => update({ birthYear: null }) }}
    />
  );
}
