import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.pregnancyNotice;

export default function PregnancyNotice() {
  const { goNext } = useOnboardingNav('pregnancy-notice');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      primary={{ label: c.cta, onPress: () => goNext() }}
    />
  );
}
