import { onboardingCopy } from '@/copy';
import type { Timing } from '@/engines/onboarding';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.timing;

export default function TimingStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('timing');
  const options = (['after_eating', 'hours_later', 'night', 'morning', 'no_pattern'] as const).map(
    (value) => ({ value, ...c.options[value] }),
  );
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<Timing>
        options={options}
        value={answers.timing}
        onPick={(timing) => goNext({ timing })}
      />
    </OnboardingScreen>
  );
}
