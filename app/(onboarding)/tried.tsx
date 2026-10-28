import { onboardingCopy } from '@/copy';
import { toggleExclusive, TRIED_OPTIONS, type TriedOption } from '@/engines/onboarding';
import { MultiChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.tried;

export default function TriedStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('tried');
  const options = TRIED_OPTIONS.map((value) => ({ value, ...c.options[value] }));
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: answers.tried.length === 0 ? onboardingCopy.skip : onboardingCopy.continue,
        onPress: () => goNext(),
      }}
    >
      <MultiChoice<TriedOption>
        options={options}
        values={answers.tried}
        onToggle={(v) => update({ tried: toggleExclusive(answers.tried, v, 'nothing') })}
      />
    </OnboardingScreen>
  );
}
