import { useState } from 'react';

import { OptionCard } from '@/components';
import { onboardingCopy } from '@/copy';
import { RED_FLAGS, type RedFlag } from '@/engines/onboarding';
import { MultiChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.redFlags;

/**
 * O9a red-flag check (spec §2). The picks live only in this screen's memory: nothing identifiable is
 * stored or logged, only whether the doctor notice was acknowledged.
 */
export default function RedFlagsStep() {
  const { goNext, goBack, goTo, progress } = useOnboardingNav('red-flags');
  const [picked, setPicked] = useState<RedFlag[]>([]);
  const [none, setNone] = useState(false);
  const options = RED_FLAGS.map((value) => ({ value, label: c.options[value] }));
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: picked.length === 0 && !none,
        onPress: () =>
          picked.length > 0 ? goTo('red-flag-notice') : goNext({ redFlagsAcknowledged: false }),
      }}
    >
      <MultiChoice<RedFlag>
        options={options}
        values={picked}
        onToggle={(v) => {
          setNone(false);
          setPicked((p) => toggle(p, v));
        }}
      />
      <OptionCard
        mode="multi"
        emoji="✅"
        label={c.none}
        selected={none}
        testID="option-none"
        onPress={() => {
          setPicked([]);
          setNone((n) => !n);
        }}
      />
    </OnboardingScreen>
  );
}
