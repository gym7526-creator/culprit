import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, FlaskConical, Lightbulb } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  Card,
  EmptyState,
  PrimaryButton,
  Screen,
  Stepper,
  Text,
} from '@/components';
import { common, format, formatClock, formatQty, recipeCopy } from '@/copy';
import { ingredientMap } from '@/data/content';
import { displayAmount, servingScale } from '@/engines/amount';
import { useOnboardingStore } from '@/features/onboardingStore';
import { recipeVisual } from '@/features/recipes/visual';
import { useRecipeNight } from '@/features/recipes/useRecipeNight';
import { gradients, radius, size, space, useTheme } from '@/theme';

const UNIT_LABEL: Record<string, string> = {
  each: '',
  g: 'g',
  oz: 'oz',
  lb: 'lb',
  ml: 'ml',
  cup: 'cup',
  tbsp: 'tbsp',
  tsp: 'tsp',
};

/** Recipe (spec §10.3): hero, servings scaler, ingredients with tips, test food in amber, steps. */
export default function RecipeScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const household = useOnboardingStore((s) => s.answers.household);
  const { recipe, night, testDose } = useRecipeNight();
  const [servings, setServings] = useState(household);

  if (!recipe) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState
          emoji="🔎"
          title={recipeCopy.notFound}
          ctaLabel={recipeCopy.back}
          onCta={() => router.back()}
        />
      </Screen>
    );
  }
  const v = recipeVisual(recipe);
  const scale = servingScale(recipe.servingsBase, servings);

  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={BOTTOM_CTA_SPACE} contentStyle={styles.noTop} testID="recipe">
        <LinearGradient
          colors={gradients[scheme][v.gradient]}
          style={[styles.hero, { paddingTop: insets.top }]}
        >
          {v.photo ? (
            <Image
              source={v.photo.source}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessible={false}
            />
          ) : (
            <Text style={styles.emoji} accessible={false}>
              {v.emoji}
            </Text>
          )}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={common.back}
            style={[styles.back, { top: insets.top + space.xs, backgroundColor: colors.surface }]}
          >
            <ChevronLeft size={size.iconLg} color={colors.textPrimary} />
          </Pressable>
        </LinearGradient>
        {v.photo ? (
          <Text variant="caption" color="textSecondary" style={styles.credit}>
            {format(recipeCopy.photoCredit, { credit: v.photo.credit })}
          </Text>
        ) : null}

        <View style={styles.body}>
          <Text variant="title" accessibilityRole="header">
            {recipe.title}
          </Text>
          <View style={styles.meta}>
            <Clock size={size.iconSm} color={colors.textSecondary} />
            <Text variant="callout" color="textSecondary">
              {format(recipeCopy.minutes, { minutes: recipe.minutes })}
              {night?.eatBy
                ? ` · ${format(recipeCopy.eatBy, { time: formatClock(night.eatBy) })}`
                : ''}
            </Text>
          </View>

          {testDose ? (
            <Card
              style={[
                styles.test,
                { backgroundColor: colors.partialSoft, borderColor: colors.partial },
              ]}
              testID="test-food"
            >
              <View style={styles.meta}>
                <FlaskConical size={size.iconMd} color={colors.partialInk} />
                <Text variant="bodyStrong" color="partialInk">
                  {format(recipeCopy.testIngredient, { portion: testDose.portion })}
                </Text>
              </View>
              <Text variant="callout" color="partialInk">
                {recipeCopy.testNote}
              </Text>
            </Card>
          ) : null}

          <View style={styles.servings}>
            <Stepper
              label={recipeCopy.servings}
              value={servings}
              min={1}
              max={12}
              onChange={setServings}
              testID="servings"
            />
          </View>

          <Text variant="headline" style={styles.h}>
            {recipeCopy.ingredients}
          </Text>
          {testDose ? (
            <View
              style={[
                styles.ing,
                styles.ingRow,
                { borderBottomColor: colors.border, backgroundColor: colors.partialSoft },
              ]}
            >
              <FlaskConical size={size.iconMd} color={colors.partialInk} />
              <Text variant="bodyStrong" color="partialInk" style={styles.flex}>
                {testDose.portion}
              </Text>
            </View>
          ) : null}
          {recipe.ingredients.map((ri) => {
            const ing = ingredientMap.get(ri.ingredientId);
            const a = displayAmount(ri.qty, ri.unit, scale);
            return (
              <View
                key={ri.ingredientId}
                style={[styles.ing, { borderBottomColor: colors.border }]}
              >
                <View style={styles.ingRow}>
                  <Text variant="bodyStrong" style={styles.qty}>
                    {`${formatQty(a.qty)} ${UNIT_LABEL[a.unit] ?? ''}`.trim()}
                  </Text>
                  <Text variant="body" style={styles.flex}>
                    {ing?.name ?? ri.ingredientId}
                    {ri.prep ? `, ${ri.prep}` : ''}
                    {ri.optional ? ` (${recipeCopy.optional})` : ''}
                  </Text>
                </View>
                {ing?.note ? (
                  <View style={styles.tip}>
                    <Lightbulb size={size.iconSm} color={colors.brandInk} />
                    <Text variant="caption" color="brandInk" style={styles.flex}>
                      {format(recipeCopy.tip, { text: ing.note })}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}

          <Text variant="headline" style={styles.h}>
            {recipeCopy.steps}
          </Text>
          {recipe.steps.map((s, i) => (
            <View key={s.text} style={styles.step}>
              <View style={[styles.num, { backgroundColor: colors.brandSoft }]}>
                <Text variant="caption" color="brandInk">
                  {i + 1}
                </Text>
              </View>
              <Text variant="body" style={styles.flex}>
                {s.text}
              </Text>
            </View>
          ))}
        </View>
      </Screen>
      <BottomCTA>
        <PrimaryButton
          label={recipeCopy.startCooking}
          onPress={() =>
            router.push(`/recipe/${recipe.id}/cook${night ? `?day=${night.day}` : ''}`)
          }
          testID="cook"
        />
      </BottomCTA>
    </View>
  );
}

const HERO = size.ring * 2;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  noTop: { paddingTop: 0, paddingHorizontal: 0 },
  hero: { minHeight: HERO, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  emoji: { fontSize: size.heroEmoji * 1.5, lineHeight: size.heroEmoji * 2 },
  back: {
    position: 'absolute',
    left: space.screen,
    width: size.minTouch,
    height: size.minTouch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credit: { paddingHorizontal: space.screen, paddingTop: space.xxs },
  body: { paddingHorizontal: space.screen, paddingTop: space.lg, gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  test: { borderWidth: 1, gap: space.xs },
  servings: { marginTop: space.sm },
  h: { marginTop: space.lg },
  ing: { paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, gap: space.xxs },
  ingRow: { flexDirection: 'row', gap: space.sm },
  qty: { minWidth: size.minTouch * 1.6 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  step: { flexDirection: 'row', gap: space.sm, paddingVertical: space.xs },
  num: {
    width: size.iconLg + space.xxs,
    height: size.iconLg + space.xxs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
