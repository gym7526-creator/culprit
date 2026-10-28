import { StyleSheet, Switch, View } from 'react-native';

import { OptionCard, Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { ageFrom, detectProfile } from '@/engines/onboarding';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { radius, size, space, useTheme } from '@/theme';

const c = onboardingCopy.howItWorks;

/** O19: visual timeline + required consent (placebo days, not medical advice). */
export default function HowItWorks() {
  const { answers, update, goNext, goBack, progress, year } = useOnboardingNav('how-it-works');
  const { colors } = useTheme();
  const steps = answers.gentleMode ? c.gentleSteps : c.steps;
  const age = answers.birthYear ? ageFrom(answers.birthYear, year) : 0;
  const offerAlcohol =
    !answers.gentleMode && age >= 21 && detectProfile(answers.symptoms) !== 'fodmap';

  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: c.cta,
        disabled: !answers.consent,
        onPress: () => goNext(),
        testID: 'build-plan',
      }}
    >
      <View style={styles.timeline}>
        {steps.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: colors.brand }]} />
              {i < steps.length - 1 ? (
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
            <View style={styles.stepText}>
              <Text variant="caption" color="brandInk">
                {s.when}
              </Text>
              <Text variant="bodyStrong">{s.title}</Text>
              <Text variant="callout" color="textSecondary">
                {s.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {offerAlcohol ? (
        <View style={styles.switchRow}>
          <Text variant="callout" style={styles.flex}>
            {c.alcohol}
          </Text>
          <Switch
            value={answers.alcoholOptIn}
            onValueChange={(alcoholOptIn) => update({ alcoholOptIn })}
            accessibilityLabel={c.alcohol}
            trackColor={{ true: colors.brand, false: colors.border }}
          />
        </View>
      ) : null}
      <OptionCard
        mode="multi"
        label={c.consent}
        selected={answers.consent}
        onPress={() => update({ consent: !answers.consent })}
        testID="consent"
      />
    </OnboardingScreen>
  );
}

const DOT = space.sm;
const styles = StyleSheet.create({
  timeline: { gap: 0, marginBottom: space.lg },
  step: { flexDirection: 'row', gap: space.sm },
  rail: { width: DOT, alignItems: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, marginTop: space.xxs },
  line: { width: size.selectedBorder, flex: 1, marginVertical: space.xxs },
  stepText: { flex: 1, gap: space.xxs / 2, paddingBottom: space.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.minTouch,
  },
  flex: { flex: 1 },
});
