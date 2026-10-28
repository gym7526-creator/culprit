import { Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.empathy;

/** Empathy beat (not a question). Both stats are sourced in docs/SPEC.md §17. */
export default function Empathy() {
  const { goNext } = useOnboardingNav('empathy');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      primary={{ label: onboardingCopy.continue, onPress: () => goNext() }}
    >
      <Text variant="bodyStrong" align="center">
        {c.kicker}
      </Text>
      <Text variant="caption" color="textSecondary" align="center">
        {c.sources}
      </Text>
    </InfoScreen>
  );
}
