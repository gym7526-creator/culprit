import { useRouter } from 'expo-router';

import { Text } from '@/components';
import { onboardingCopy, skinCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { useSkinEnabled } from '@/features/skin/skinStore';

const c = onboardingCopy.teen;

/** 13–17: no elimination program (spec §2). Skin mode for teens arrives in Phase 8. */
export default function Teen() {
  const router = useRouter();
  const { goBack } = useOnboardingNav('teen');
  // 13–17 can use skin mode: routine and product changes only, no diet experiments.
  const skin = useSkinEnabled();
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="teen-block"
      primary={
        skin
          ? {
              label: skinCopy.teenCta,
              onPress: () => router.push('/skin-setup/concern'),
              testID: 'teen-skin',
            }
          : { label: c.back, onPress: goBack }
      }
      secondary={skin ? { label: c.back, onPress: goBack } : undefined}
    >
      {skin ? null : (
        <Text variant="callout" color="textSecondary" align="center">
          {c.skinNote}
        </Text>
      )}
    </InfoScreen>
  );
}
