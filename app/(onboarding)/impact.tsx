import { Slider } from '@/components';
import { onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.impact;

export default function ImpactStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('impact');
  const value = answers.impact ?? 2;
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext({ impact: value }) }}
    >
      <Slider
        label={c.label}
        value={value}
        min={0}
        max={4}
        step={1}
        onChange={(impact) => update({ impact })}
        formatValue={(v) => `${c.faces[v] ?? ''}  ${c.levels[v] ?? ''}`}
        marks={c.faces}
        testID="impact-slider"
      />
    </OnboardingScreen>
  );
}
