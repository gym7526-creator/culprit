import { useState } from 'react';

import { TextField } from '@/components';
import { onboardingCopy } from '@/copy';
import { content } from '@/data/content';
import { zipToState } from '@/engines/price';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.zip;

export default function ZipStep() {
  const { answers, goNext, goBack, progress } = useOnboardingNav('zip');
  const [zip, setZip] = useState(answers.zip ?? '');
  const [touched, setTouched] = useState(false);
  const valid = zipToState(zip, content.regions) !== null;
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: !valid,
        // A new ZIP may change which stores are common, so re-pick the store.
        onPress: () => goNext({ zip, chainId: zip === answers.zip ? answers.chainId : null }),
      }}
    >
      <TextField
        label={c.label}
        value={zip}
        large
        onChangeText={(t) => setZip(t.replace(/\D/g, '').slice(0, 5))}
        onBlur={() => setTouched(true)}
        keyboardType="number-pad"
        maxLength={5}
        autoComplete="postal-code"
        textContentType="postalCode"
        error={touched && zip.length > 0 && !valid ? c.invalid : null}
        testID="zip-input"
      />
    </OnboardingScreen>
  );
}
