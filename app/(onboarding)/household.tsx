import { StyleSheet, Switch, View } from 'react-native';

import { Card, Stepper, Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { size, space, useTheme } from '@/theme';

const c = onboardingCopy.household;

export default function HouseholdStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('household');
  const { colors } = useTheme();
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext() }}
    >
      <Stepper
        label={c.label}
        value={answers.household}
        min={1}
        max={8}
        onChange={(household) => update({ household })}
        testID="household"
      />
      <View style={styles.row}>
        <Text variant="body" style={styles.flex}>
          {c.kids}
        </Text>
        <Switch
          value={answers.kids}
          onValueChange={(kids) => update({ kids })}
          accessibilityLabel={c.kids}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </View>
      <Card tone="alt">
        <Text variant="callout" color="textSecondary">
          {c.note}
        </Text>
      </Card>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.minTouch,
    gap: space.sm,
    marginTop: space.lg,
  },
  flex: { flex: 1 },
});
