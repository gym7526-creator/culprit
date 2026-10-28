import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  BottomSheet,
  Card,
  DinnerCard,
  EmptyState,
  PrimaryButton,
  ScoreRing,
  Screen,
  SecondaryButton,
  TestBanner,
  Text,
  TextButton,
} from '@/components';
import {
  format,
  formatClock,
  formatDay,
  formatMoney,
  revealCopy,
  tabsCopy,
  todayCopy,
} from '@/copy';
import { recipeCostEstimate } from '@/engines/plan';
import { AppHeader } from '@/features/app/AppHeader';
import { CheckInCard } from '@/features/checkin/CheckInCard';
import { useAppStore } from '@/features/appStore';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePlanInput } from '@/features/plan/hooks';
import { recipeVisual } from '@/features/recipes/visual';
import { useMoments } from '@/features/today/useMoments';
import { useTodayModel, type PillTone } from '@/features/today/useTodayModel';
import { radius, size, space, useTheme, type ColorTokens } from '@/theme';

const pillColors: Record<PillTone, { fill: keyof ColorTokens; text: keyof ColorTokens }> = {
  calm: { fill: 'goodSoft', text: 'goodInk' },
  testing: { fill: 'partialSoft', text: 'partialInk' },
  plan: { fill: 'brandSoft', text: 'brandInk' },
};

/** Today (spec §10.1). The check-in card joins in Phase 6. */
export default function Today() {
  const router = useRouter();
  const { colors } = useTheme();
  const { checkin } = useLocalSearchParams<{ checkin?: string }>();
  const m = useTodayModel();
  const moments = useMoments(checkin === '1');
  const celebrate = useAppStore((s) => s.markCelebrated);
  const [pinned, setPinned] = useState<NonNullable<typeof moments>['checkin']>(null);
  const target = pinned ?? moments?.checkin ?? null;
  const input = usePlanInput(m?.plan ?? null);
  const household = useOnboardingStore((s) => s.answers.household);
  const dismiss = useAppStore((s) => s.dismissCard);
  const [why, setWhy] = useState(false);

  if (!m) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState
          emoji="🧾"
          title={todayCopy.noPlan}
          ctaLabel={todayCopy.viewRecipe}
          onCta={() => router.push('/plan')}
        />
      </Screen>
    );
  }

  const pc = pillColors[m.pill.tone];
  const visual = m.recipe ? recipeVisual(m.recipe) : null;

  return (
    <>
      <Screen scroll testID="today">
        <AppHeader eyebrow={formatDay(m.today)} title={tabsCopy.today} />
        <View style={[styles.pill, { backgroundColor: colors[pc.fill] }]} testID="phase-pill">
          <Text variant="caption" color={pc.text}>
            {m.pill.text}
          </Text>
        </View>

        {moments?.unrevealed.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/test/${r.group}?reveal=1`)}
            accessibilityRole="button"
            style={[styles.moment, { backgroundColor: colors.brandSoft }]}
            testID={`reveal-${r.group}`}
          >
            <Text variant="bodyStrong" color="brandInk" style={styles.flex}>
              {format(revealCopy.resultReady, { group: r.name })}
            </Text>
          </Pressable>
        ))}
        {moments?.solved ? (
          <Pressable
            onPress={() => router.push('/results')}
            accessibilityRole="button"
            style={[styles.moment, { backgroundColor: colors.goodSoft }]}
            testID="case-solved"
          >
            <Text variant="bodyStrong" color="goodInk">
              {revealCopy.caseSolved}
            </Text>
          </Pressable>
        ) : null}
        {moments?.calmDone ? (
          <Card style={[styles.section, styles.gap]} testID="calm-done">
            <View style={styles.cardHead}>
              <Text variant="bodyStrong" color="goodInk" style={styles.flex}>
                {revealCopy.calmDone}
              </Text>
              <Pressable
                onPress={() => celebrate('calm_complete')}
                accessibilityRole="button"
                accessibilityLabel={todayCopy.dismiss}
                hitSlop={space.sm}
              >
                <X size={size.iconMd} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text variant="callout" color="textSecondary">
              {revealCopy.calmDoneBody}
            </Text>
          </Card>
        ) : null}

        {target ? (
          <View style={styles.section}>
            <CheckInCard
              key={target.day}
              day={target.day}
              isYesterday={target.isYesterday}
              testDay={target.testDay}
              streak={moments?.streak ?? 0}
              onLogged={() => setPinned(target)}
              onFinished={() => setPinned(null)}
            />
          </View>
        ) : moments?.loggedToday ? (
          <View style={styles.section}>
            <CheckInCard
              key={m.today}
              day={m.today}
              isYesterday={false}
              testDay={false}
              streak={moments.streak}
            />
          </View>
        ) : null}

        {m.test ? (
          <View style={styles.section}>
            <TestBanner
              title={todayCopy.testTitle}
              detail={m.test.detail}
              day={m.test.dose}
              totalDays={3}
              onWhyPress={() => setWhy(true)}
              testID="test-banner"
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text variant="bodyStrong">{m.isTomorrow ? todayCopy.tomorrow : todayCopy.tonight}</Text>
          {m.recipe && visual && m.night ? (
            <>
              <DinnerCard
                size="large"
                title={m.recipe.title}
                emoji={visual.emoji}
                gradient={visual.gradient}
                photo={visual.photo?.source}
                minutes={m.recipe.minutes}
                price={formatMoney(input ? recipeCostEstimate(m.recipe, input) : 0)}
                eatBy={m.night.eatBy ? formatClock(m.night.eatBy) : undefined}
                testNight={Boolean(m.night.testGroup)}
                onPress={() => router.push(`/recipe/${m.recipe!.id}?day=${m.night!.day}`)}
                testID="tonight-card"
              />
              <Text variant="caption" color="textSecondary">
                {format(todayCopy.servings, { count: household })}
              </Text>
              <PrimaryButton
                label={todayCopy.startCooking}
                onPress={() => router.push(`/recipe/${m.recipe!.id}/cook?day=${m.night!.day}`)}
                testID="start-cooking"
              />
            </>
          ) : (
            <Card style={styles.gap}>
              <Text variant="bodyStrong">
                {m.night?.status === 'eating_out' ? todayCopy.eatingOut : todayCopy.notCooking}
              </Text>
              <Text variant="callout" color="textSecondary">
                {m.night?.status === 'eating_out'
                  ? todayCopy.eatingOutBody
                  : todayCopy.notCookingBody}
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="bodyStrong">{todayCopy.ideasTitle}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ideas}
          >
            {[
              ...m.staples.breakfast.map((s) => ({ s, label: todayCopy.breakfast })),
              ...m.staples.lunch.map((s) => ({ s, label: todayCopy.lunch })),
            ].map(({ s, label }) => (
              <Card key={s.id} style={styles.idea}>
                <Text variant="caption" color="textSecondary">
                  {label}
                </Text>
                <Text variant="callout">{s.text}</Text>
              </Card>
            ))}
          </ScrollView>
        </View>

        {!m.program.gentle ? (
          <Card style={[styles.section, styles.ringRow]}>
            <ScoreRing progress={m.ring} label={todayCopy.ringLabel} size={size.ring * 0.7}>
              <Text variant="bodyStrong">
                {format(todayCopy.ringCenter, { pct: Math.round(m.ring * 100) })}
              </Text>
            </ScoreRing>
            <Text variant="callout" style={styles.flex}>
              {m.next ?? m.pill.text}
            </Text>
          </Card>
        ) : null}

        {m.card ? (
          <Card style={[styles.section, styles.gap]} testID="edu-card">
            <View style={styles.cardHead}>
              <Text variant="caption" color="brandInk" style={styles.flex}>
                {todayCopy.learn}
              </Text>
              <Pressable
                onPress={() => dismiss(m.card!.id)}
                accessibilityRole="button"
                accessibilityLabel={todayCopy.dismiss}
                hitSlop={space.sm}
              >
                <X size={size.iconMd} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text variant="bodyStrong">{m.card.title}</Text>
            <Text variant="callout" color="textSecondary">
              {m.card.body}
            </Text>
            {m.card.sourceUrl && m.card.sourceLabel ? (
              <TextButton
                label={format(todayCopy.source, { label: m.card.sourceLabel })}
                onPress={() => Linking.openURL(m.card!.sourceUrl!)}
              />
            ) : null}
          </Card>
        ) : null}
      </Screen>

      <BottomSheet visible={why} onClose={() => setWhy(false)} title={todayCopy.whyAmount}>
        <Text variant="body">{m.test?.def.whyThisAmount}</Text>
        <Text variant="callout" color="textSecondary">
          {m.test?.def.howTo}
        </Text>
        <SecondaryButton label={todayCopy.dismiss} onPress={() => setWhy(false)} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    marginTop: space.sm,
  },
  section: { marginTop: space.xl, gap: space.sm },
  gap: { gap: space.xs },
  ideas: { gap: space.sm, paddingRight: space.screen },
  idea: { width: size.ring * 1.6, gap: space.xxs },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  moment: {
    marginTop: space.md,
    borderRadius: radius.card,
    padding: space.md,
    minHeight: size.minTouch,
  },
  flex: { flex: 1 },
});
