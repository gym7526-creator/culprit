import { useRouter } from 'expo-router';
import { Shuffle, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type ScrollViewInstance,
} from 'react-native';

import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  BottomSheet,
  BudgetBar,
  Card,
  DinnerCard,
  EmptyState,
  Screen,
  SecondaryButton,
  Text,
  TextButton,
  haptics,
} from '@/components';
import { common, format, formatClock, formatDay, formatMoney, planCopy } from '@/copy';
import { recipeMap } from '@/data/content';
import { diffDays, type DayKey } from '@/engines/dates';
import { recipeCostEstimate, swapOptions } from '@/engines/plan';
import { AppHeader } from '@/features/app/AppHeader';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { setEatingOut, setTwoWeek, shuffleWeek, swapDinner } from '@/features/plan/actions';
import { useActivePlan, usePlanInput } from '@/features/plan/hooks';
import { recipeVisual } from '@/features/recipes/visual';
import { useUiStore } from '@/features/uiStore';
import { radius, size, space, useTheme } from '@/theme';

/** Plan (spec §10.2): week strip, dinner cards, swap / eating out / feedback sheet, shuffle, 2-week. */
export default function Plan() {
  const router = useRouter();
  const { colors } = useTheme();
  const { today } = useClock();
  const plan = useActivePlan();
  const input = usePlanInput(plan);
  const twoWeek = useAppStore((s) => s.twoWeek);
  const feedback = useAppStore((s) => s.feedback);
  const setFeedback = useAppStore((s) => s.setFeedback);
  const toast = useUiStore((s) => s.showToast);
  const [sheetDay, setSheetDay] = useState<DayKey | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<string, number>>({});

  const sheetNight = plan?.nights.find((n) => n.day === sheetDay) ?? null;
  const options = useMemo(
    () =>
      plan && input && sheetNight?.status === 'cook'
        ? swapOptions(input, plan, sheetNight.day, 3)
        : [],
    [plan, input, sheetNight],
  );

  if (!plan || !input) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState
          emoji="🗓️"
          title={planCopy.title}
          body={common.loading}
          ctaLabel={common.retry}
          onCta={() => router.replace('/plan')}
        />
      </Screen>
    );
  }

  const sheetRecipe = sheetNight?.recipeId ? recipeMap.get(sheetNight.recipeId) : undefined;
  const closeSheet = () => setSheetDay(null);

  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={BOTTOM_CTA_SPACE} testID="plan" scrollRef={scroll}>
        <AppHeader
          title={planCopy.title}
          right={
            <Pressable
              onPress={() => {
                haptics.light();
                shuffleWeek(plan, today);
                toast(planCopy.shuffled);
              }}
              accessibilityRole="button"
              accessibilityLabel={planCopy.shuffle}
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
              testID="shuffle"
            >
              <Shuffle size={size.iconMd} color={colors.textPrimary} />
            </Pressable>
          }
        />

        <View style={styles.toggleRow}>
          <Text variant="callout" style={styles.flex}>
            {planCopy.twoWeek}
          </Text>
          <Switch
            value={twoWeek}
            onValueChange={(v) => setTwoWeek(plan, today, v)}
            accessibilityLabel={planCopy.twoWeek}
            trackColor={{ true: colors.brand, false: colors.border }}
            testID="two-week"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {plan.nights.map((n) => {
            const isToday = n.day === today;
            return (
              <Pressable
                key={n.day}
                onPress={() =>
                  scroll.current?.scrollTo({ y: offsets.current[n.day] ?? 0, animated: true })
                }
                accessibilityRole="button"
                accessibilityLabel={formatDay(n.day)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isToday ? colors.brand : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text variant="caption" color={isToday ? 'onBrand' : 'textSecondary'}>
                  {formatDay(n.day, 'weekday')}
                </Text>
                <Text variant="bodyStrong" color={isToday ? 'onBrand' : 'textPrimary'}>
                  {Number(n.day.slice(8))}
                </Text>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: n.testGroup
                        ? colors.partial
                        : n.recipeId
                          ? colors.good
                          : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {plan.overBudgetBy && plan.suggestions.length > 0 ? (
          <Card style={styles.section}>
            <Text variant="bodyStrong" color="triggerInk">
              {format(planCopy.overBudget, { amount: formatMoney(plan.overBudgetBy) })}
            </Text>
            {plan.suggestions.map((s) => (
              <Text key={`${s.kind}${s.day}`} variant="callout" color="textSecondary">
                {s.kind === 'swap'
                  ? format(planCopy.suggestSwap, {
                      from: recipeMap.get(s.from)?.title ?? '',
                      to: recipeMap.get(s.to)?.title ?? '',
                      amount: formatMoney(s.saves),
                    })
                  : format(planCopy.suggestSkip, {
                      day: formatDay(s.day, 'weekday'),
                      amount: formatMoney(s.saves),
                    })}
              </Text>
            ))}
          </Card>
        ) : null}

        {plan.nights.map((n) => {
          const r = n.recipeId ? recipeMap.get(n.recipeId) : undefined;
          const past = diffDays(n.day, today) > 0;
          return (
            <View
              key={n.day}
              style={styles.section}
              onLayout={(e) => {
                offsets.current[n.day] = e.nativeEvent.layout.y;
              }}
            >
              <Text variant="caption" color="textSecondary">
                {formatDay(n.day)}
                {past ? ` · ${planCopy.past}` : ''}
              </Text>
              {r ? (
                <DinnerCard
                  title={r.title}
                  {...pick(recipeVisual(r))}
                  minutes={r.minutes}
                  price={formatMoney(recipeCostEstimate(r, input))}
                  eatBy={n.eatBy ? formatClock(n.eatBy) : undefined}
                  testNight={Boolean(n.testGroup)}
                  onPress={() => router.push(`/recipe/${r.id}?day=${n.day}`)}
                  onMorePress={past ? undefined : () => setSheetDay(n.day)}
                  moreLabel={planCopy.sheetTitle}
                  testID={`dinner-${n.day}`}
                />
              ) : (
                <Pressable
                  onPress={past ? undefined : () => setSheetDay(n.day)}
                  accessibilityRole="button"
                  style={[styles.empty, { borderColor: colors.border }]}
                  testID={`night-${n.day}`}
                >
                  <Text variant="callout" color="textSecondary">
                    {n.status === 'eating_out' ? planCopy.eatingOut : planCopy.notCooking}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </Screen>

      <BottomCTA>
        <Text variant="bodyStrong" testID="plan-total">
          {format(plan.nights.length > 7 ? planCopy.totalTwo : planCopy.total, {
            total: formatMoney(plan.total),
          })}
        </Text>
        <BudgetBar total={plan.total} budget={plan.budget} />
      </BottomCTA>

      <BottomSheet
        visible={sheetNight !== null}
        onClose={closeSheet}
        title={planCopy.sheetTitle}
        testID="dinner-sheet"
      >
        {sheetNight?.status === 'cook' && sheetRecipe ? (
          <View style={styles.gap}>
            <Text variant="bodyStrong">{planCopy.swap}</Text>
            {options.length === 0 ? (
              <Text variant="callout" color="textSecondary">
                {planCopy.noSwaps}
              </Text>
            ) : (
              options.map((o) => {
                const r = recipeMap.get(o.recipeId)!;
                const delta =
                  Math.abs(o.priceDelta) < 0.005
                    ? planCopy.same
                    : format(planCopy.swapDelta, {
                        sign: o.priceDelta > 0 ? '+' : '−',
                        amount: formatMoney(Math.abs(o.priceDelta)),
                      });
                return (
                  <Pressable
                    key={o.recipeId}
                    onPress={() => {
                      swapDinner(plan, sheetNight.day, o.recipeId);
                      haptics.light();
                      toast(planCopy.swapped, 'good');
                      closeSheet();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${planCopy.swap} ${r.title}, ${delta}`}
                    style={[
                      styles.option,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    testID={`swap-${o.recipeId}`}
                  >
                    <Text style={styles.optEmoji} accessible={false}>
                      {recipeVisual(r).emoji}
                    </Text>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{r.title}</Text>
                      <Text variant="caption" color="textSecondary">
                        {format('{m} min', { m: r.minutes })}
                      </Text>
                    </View>
                    <Text variant="callout" color={o.priceDelta > 0 ? 'triggerInk' : 'goodInk'}>
                      {delta}
                    </Text>
                  </Pressable>
                );
              })
            )}
            <View style={styles.feedback}>
              {([1, -1] as const).map((v) => {
                const active = feedback[sheetRecipe.id] === v;
                const Icon = v === 1 ? ThumbsUp : ThumbsDown;
                return (
                  <Pressable
                    key={v}
                    onPress={() => {
                      setFeedback(sheetRecipe.id, active ? null : v);
                      if (!active) toast(v === 1 ? planCopy.liked : planCopy.disliked);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={v === 1 ? planCopy.like : planCopy.dislike}
                    style={[
                      styles.iconBtn,
                      {
                        backgroundColor: active ? colors.brandSoft : colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Icon
                      size={size.iconMd}
                      color={active ? colors.brandInk : colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
            {sheetNight.testGroup ? (
              <Text variant="caption" color="textSecondary">
                {planCopy.testNightLocked}
              </Text>
            ) : (
              <SecondaryButton
                label={planCopy.markEatingOut}
                onPress={() => {
                  setEatingOut(plan, sheetNight.day, true);
                  closeSheet();
                }}
                testID="mark-eating-out"
              />
            )}
          </View>
        ) : sheetNight ? (
          <View style={styles.gap}>
            <SecondaryButton
              label={planCopy.cookTonight}
              onPress={() => {
                setEatingOut(plan, sheetNight.day, false);
                closeSheet();
              }}
              testID="cook-instead"
            />
            <TextButton label={common.cancel} onPress={closeSheet} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function pick(v: ReturnType<typeof recipeVisual>) {
  return { emoji: v.emoji, gradient: v.gradient, photo: v.photo?.source };
}

const CHIP = size.minTouch * 1.2;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
    minHeight: size.minTouch,
  },
  strip: { gap: space.xs, paddingVertical: space.sm },
  chip: {
    width: CHIP,
    minHeight: CHIP * 1.3,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
  },
  dot: { width: space.xs, height: space.xs, borderRadius: radius.pill },
  section: { marginTop: space.lg, gap: space.xs },
  empty: {
    minHeight: size.optionCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    minHeight: size.optionCard,
  },
  optEmoji: { fontSize: size.optionEmoji, lineHeight: size.optionEmoji * 1.3 },
  feedback: { flexDirection: 'row', gap: space.sm },
  iconBtn: {
    width: size.minTouch,
    height: size.minTouch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
