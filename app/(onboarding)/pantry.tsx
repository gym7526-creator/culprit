import { onboardingCopy } from '@/copy';
import { PANTRY_STAPLES } from '@/engines/onboarding';
import { ChipChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.pantry;
type StapleId = (typeof PANTRY_STAPLES)[number];

export default function PantryStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('pantry');
  const options = PANTRY_STAPLES.map((value) => ({ value, label: c.names[value] }));
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext() }}
    >
      <ChipChoice<StapleId>
        options={options}
        values={answers.pantry as StapleId[]}
        onToggle={(s) => update({ pantry: toggle(answers.pantry, s) })}
      />
    </OnboardingScreen>
  );
}
