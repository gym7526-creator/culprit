import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.redFlagNotice;

/** Continue only after "I understand" (spec §2). */
export default function RedFlagNotice() {
  const { goNext } = useOnboardingNav('red-flag-notice');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="red-flag-notice"
      primary={{
        label: c.cta,
        onPress: () => goNext({ redFlagsAcknowledged: true }),
        testID: 'red-flag-understand',
      }}
    />
  );
}
