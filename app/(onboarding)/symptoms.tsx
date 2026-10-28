import { onboardingCopy } from '@/copy';
import { SYMPTOMS, type Symptom } from '@/engines/types';
import { ChipChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.symptoms;

export default function SymptomsStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('symptoms');
  const options = SYMPTOMS.map((value) => ({ value, label: c.options[value] }));
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: answers.symptoms.length === 0,
        onPress: () =>
          goNext({
            mainSymptom:
              answers.symptoms.length === 1
                ? answers.symptoms[0]!
                : answers.symptoms.includes(answers.mainSymptom as Symptom)
                  ? answers.mainSymptom
                  : null,
          }),
      }}
    >
      <ChipChoice<Symptom>
        options={options}
        values={answers.symptoms}
        onToggle={(s) => update({ symptoms: toggle(answers.symptoms, s) })}
      />
    </OnboardingScreen>
  );
}
