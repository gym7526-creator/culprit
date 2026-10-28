import { onboardingCopy } from '@/copy';
import { SUSPECT_CHIPS, toggleExclusive, type SuspectChip } from '@/engines/onboarding';
import { ChipChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.suspects;

export default function SuspectsStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('suspects');
  const options = SUSPECT_CHIPS.map((value) => ({ value, label: c.options[value] }));
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: answers.suspects.length === 0 ? onboardingCopy.skip : onboardingCopy.continue,
        // Known-fine can only contain current suspects.
        onPress: () =>
          goNext({ knownFine: answers.knownFine.filter((k) => answers.suspects.includes(k)) }),
      }}
    >
      <ChipChoice<SuspectChip>
        options={options}
        values={answers.suspects}
        onToggle={(s) => update({ suspects: toggleExclusive(answers.suspects, s, 'no_idea') })}
      />
    </OnboardingScreen>
  );
}
