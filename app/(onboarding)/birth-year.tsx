import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { WheelPicker } from '@/components';
import { onboardingCopy } from '@/copy';
import { ageFrom, ageGate } from '@/engines/onboarding';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { skinEnabledNow } from '@/features/skin/skinStore';

const c = onboardingCopy.birthYear;

export default function BirthYearStep() {
  const router = useRouter();
  const { answers, update, goNext, goBack, goTo, progress, year } = useOnboardingNav('birth-year');
  const years = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => year - 5 - i).map((y) => ({
        value: y,
        label: String(y),
      })),
    [year],
  );
  const [value, setValue] = useState<number>(answers.birthYear ?? year - 30);

  const onContinue = () => {
    update({ birthYear: value });
    const gate = ageGate(ageFrom(value, year));
    if (gate === 'blocked') goTo('age-blocked');
    else if (gate === 'teen') goTo('teen');
    // Skin-only (behind FEATURE_SKIN): the short skin setup replaces the stomach questions.
    else if (answers.focus === 'skin' && skinEnabledNow()) router.push('/skin-setup/concern');
    else goNext({ birthYear: value });
  };

  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: onContinue }}
    >
      <WheelPicker
        items={years}
        value={value}
        onChange={setValue}
        accessibilityLabel={c.label}
        testID="birth-year-wheel"
      />
    </OnboardingScreen>
  );
}
