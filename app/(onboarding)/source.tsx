import { onboardingCopy } from '@/copy';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.source;
type SourceId = keyof typeof c.options;

/** O18. TikTok first. The answer becomes an analytics user property (not health data). */
export default function SourceStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('source');
  const options = (Object.keys(c.options) as SourceId[]).map((value) => ({
    value,
    label: c.options[value],
  }));
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<SourceId>
        options={options}
        value={answers.source as SourceId | null}
        onPick={(source) => goNext({ source })}
      />
    </OnboardingScreen>
  );
}
