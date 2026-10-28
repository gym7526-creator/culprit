import { onboardingCopy } from '@/copy';
import type { Focus } from '@/engines/onboarding';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { useSkinEnabled } from '@/features/skin/skinStore';
import { Text } from '@/components';

const c = onboardingCopy.focus;

export default function FocusStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('focus');
  const skin = useSkinEnabled();
  const options = (['stomach', 'skin', 'both'] as const).map((value) => ({
    value,
    ...c.options[value],
  }));
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<Focus>
        options={options}
        value={answers.focus}
        onPick={(focus) => goNext({ focus })}
      />
      {!skin && (answers.focus === 'skin' || answers.focus === 'both') ? (
        <Text variant="callout" color="textSecondary">
          {c.skinSoon}
        </Text>
      ) : null}
    </OnboardingScreen>
  );
}
