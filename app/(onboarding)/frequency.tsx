import { onboardingCopy } from '@/copy';
import type { Frequency } from '@/engines/onboarding';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.frequency;

export default function FrequencyStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('frequency');
  const options = (['daily', 'few_week', 'weekly', 'less'] as const).map((value) => ({
    value,
    ...c.options[value],
  }));
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<Frequency>
        options={options}
        value={answers.frequency}
        onPick={(frequency) => goNext({ frequency })}
      />
    </OnboardingScreen>
  );
}
