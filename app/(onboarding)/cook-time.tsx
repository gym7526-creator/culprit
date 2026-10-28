import { onboardingCopy } from '@/copy';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.cookTime;

export default function CookTimeStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('cook-time');
  const options = ([15, 30, 45] as const).map((value) => ({ value, ...c.options[value] }));
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<15 | 30 | 45>
        options={options}
        value={answers.maxMinutes}
        onPick={(maxMinutes) => goNext({ maxMinutes })}
      />
    </OnboardingScreen>
  );
}
