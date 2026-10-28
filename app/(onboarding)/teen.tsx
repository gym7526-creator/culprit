import { Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.teen;

/** 13–17: no elimination program (spec §2). Skin mode for teens arrives in Phase 8. */
export default function Teen() {
  const { goBack } = useOnboardingNav('teen');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="teen-block"
      primary={{ label: c.back, onPress: goBack }}
    >
      <Text variant="callout" color="textSecondary" align="center">
        {c.skinNote}
      </Text>
    </InfoScreen>
  );
}
