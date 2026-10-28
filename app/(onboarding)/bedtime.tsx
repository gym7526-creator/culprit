import { Card, Text, TimePicker } from '@/components';
import { onboardingCopy } from '@/copy';
import { detectProfile } from '@/engines/onboarding';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.bedtime;

export default function BedtimeStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('bedtime');
  const reflux = detectProfile(answers.symptoms) !== 'fodmap';
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext() }}
    >
      <TimePicker
        label={c.label}
        value={answers.bedtime}
        onChange={(bedtime) => update({ bedtime })}
      />
      {reflux ? (
        <Card tone="alt">
          <Text variant="callout">{c.refluxNote}</Text>
        </Card>
      ) : null}
    </OnboardingScreen>
  );
}
