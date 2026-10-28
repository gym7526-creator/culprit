import { onboardingCopy } from '@/copy';
import type { Symptom } from '@/engines/types';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

export default function MainSymptomStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('main-symptom');
  const options = answers.symptoms.map((value) => ({
    value,
    label: onboardingCopy.symptoms.options[value],
  }));
  return (
    <OnboardingScreen title={onboardingCopy.mainSymptom.title} progress={progress} onBack={goBack}>
      <SingleChoice<Symptom>
        options={options}
        value={answers.mainSymptom}
        onPick={(mainSymptom) => goNext({ mainSymptom })}
      />
    </OnboardingScreen>
  );
}
