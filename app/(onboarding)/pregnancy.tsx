import { onboardingCopy } from '@/copy';
import type { YesNoSkip } from '@/engines/onboarding';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.pregnancy;

export default function PregnancyStep() {
  const { answers, update, goNext, goBack, goTo, progress } = useOnboardingNav('pregnancy');
  const options = (['yes', 'no', 'skip'] as const).map((value) => ({ value, label: c[value] }));
  return (
    <OnboardingScreen title={c.title} progress={progress} onBack={goBack}>
      <SingleChoice<YesNoSkip>
        options={options}
        value={answers.pregnant}
        onPick={(pregnant) => {
          if (pregnant === 'yes') {
            update({ pregnant });
            goTo('pregnancy-notice');
          } else goNext({ pregnant });
        }}
      />
    </OnboardingScreen>
  );
}
