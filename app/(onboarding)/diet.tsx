import { Switch, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { ALLERGENS, type Allergen } from '@/data/content/schema';
import type { Diet } from '@/engines/plan';
import { ChipChoice, SingleChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { space, useTheme } from '@/theme';

const c = onboardingCopy.diet;
type DislikeId = keyof typeof c.dislikeOptions;

/** O10: diet, allergies, celiac (forces gluten-free and skips the wheat test), foods you won't eat. */
export default function DietStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('diet');
  const { colors } = useTheme();
  const diets = (['none', 'vegetarian', 'vegan', 'pescatarian'] as const).map((value) => ({
    value,
    ...c.options[value],
  }));
  const allergenOptions = ALLERGENS.map((value) => ({ value, label: c.allergens[value] }));
  const dislikeOptions = (Object.keys(c.dislikeOptions) as DislikeId[]).map((value) => ({
    value,
    label: c.dislikeOptions[value],
  }));

  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: answers.diet === null,
        onPress: () => goNext(),
      }}
    >
      <SingleChoice<Diet>
        options={diets}
        value={answers.diet}
        onPick={(diet) => update({ diet })}
      />

      <Text variant="headline" style={styles.section}>
        {c.allergiesTitle}
      </Text>
      <ChipChoice<Allergen>
        options={allergenOptions}
        values={answers.allergens}
        onToggle={(a) => update({ allergens: toggle(answers.allergens, a) })}
      />

      <View style={styles.switchRow}>
        <Text variant="body" style={styles.flex}>
          {c.celiacLabel}
        </Text>
        <Switch
          value={answers.celiac}
          onValueChange={(celiac) => update({ celiac })}
          accessibilityLabel={c.celiacLabel}
          trackColor={{ true: colors.brand, false: colors.border }}
          testID="celiac-switch"
        />
      </View>
      {answers.celiac ? (
        <Text variant="callout" color="brandInk">
          {c.celiacNote}
        </Text>
      ) : null}

      <Text variant="headline" style={styles.section}>
        {c.dislikesTitle}
      </Text>
      <ChipChoice<DislikeId>
        options={dislikeOptions}
        values={answers.dislikes as DislikeId[]}
        onToggle={(d) => update({ dislikes: toggle(answers.dislikes, d) })}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    minHeight: 44,
  },
  flex: { flex: 1 },
});
