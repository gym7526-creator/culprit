import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components';
import { onboardingCopy } from '@/copy';
import { toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { space } from '@/theme';

const c = onboardingCopy.cookNights;

export default function CookNightsStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('cook-nights');
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: answers.cookDays.length === 0,
        onPress: () => goNext(),
      }}
    >
      <View style={styles.days}>
        {c.days.map((d, i) => (
          <Chip
            key={d}
            label={d}
            selected={answers.cookDays.includes(i)}
            onPress={() => update({ cookDays: toggle(answers.cookDays, i).sort((a, b) => a - b) })}
            testID={`day-${i}`}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
