import { Card, Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.edNotice;

/** Eating-disorder safeguard (spec §2): recommend a professional, offer gentle mode (no elimination). */
export default function EdNotice() {
  const { goNext } = useOnboardingNav('ed-notice');
  return (
    <InfoScreen
      emoji={c.emoji}
      title={c.title}
      body={c.body}
      testID="ed-notice"
      primary={{
        label: c.gentleCta,
        onPress: () => goNext({ gentleMode: true }),
        testID: 'gentle-mode',
      }}
      secondary={{ label: c.proCta, onPress: () => goNext({ gentleMode: false }) }}
    >
      <Card tone="alt">
        <Text variant="bodyStrong">{c.gentleTitle}</Text>
        <Text variant="callout" color="textSecondary">
          {c.gentleBody}
        </Text>
      </Card>
    </InfoScreen>
  );
}
