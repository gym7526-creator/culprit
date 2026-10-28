import { Text } from '@/components';
import { format, onboardingCopy } from '@/copy';
import type { SuspectChip } from '@/engines/onboarding';
import { ChipChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.suspects;

/** O7b: suspects the user knows are fine become test skips, with a confirmation line. */
export default function KnownFineStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('known-fine');
  const options = answers.suspects
    .filter((s) => s !== 'no_idea')
    .map((value) => ({ value, label: c.options[value] }));
  const picked = answers.knownFine.map((k) => c.options[k].toLowerCase()).join(', ');
  return (
    <OnboardingScreen
      title={c.knownFineTitle}
      subtitle={c.knownFineSubtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: answers.knownFine.length === 0 ? onboardingCopy.skip : onboardingCopy.continue,
        onPress: () => goNext(),
      }}
    >
      <ChipChoice<SuspectChip>
        options={options}
        values={answers.knownFine}
        onToggle={(s) => update({ knownFine: toggle(answers.knownFine, s) })}
      />
      {answers.knownFine.length > 0 ? (
        <Text variant="callout" color="textSecondary">
          {format(c.confirmSkip, { items: picked })}
        </Text>
      ) : null}
    </OnboardingScreen>
  );
}
