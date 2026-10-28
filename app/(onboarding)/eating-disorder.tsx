import { onboardingCopy } from '@/copy';
import type { YesNoSkip } from '@/engines/onboarding';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.eatingDisorder;

export default function EatingDisorderStep() {
  const { answers, update, goNext, goBack, goTo, progress } = useOnboardingNav('eating-disorder');
  const options = (['yes', 'no', 'skip'] as const).map((value) => ({ value, label: c[value] }));
  return (
    <OnboardingScreen title={c.title} subtitle={c.subtitle} progress={progress} onBack={goBack}>
      <SingleChoice<YesNoSkip>
        options={options}
        value={answers.eatingDisorder}
        onPick={(eatingDisorder) => {
          if (eatingDisorder === 'yes') {
            update({ eatingDisorder });
            goTo('ed-notice');
          } else {
            goNext({ eatingDisorder, gentleMode: false });
          }
        }}
      />
    </OnboardingScreen>
  );
}
