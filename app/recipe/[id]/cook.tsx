import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { Pause, Play, RotateCcw, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ConfettiBurst,
  EmptyState,
  haptics,
  PrimaryButton,
  ProgressBar,
  Screen,
  SecondaryButton,
  Text,
} from '@/components';
import { cookCopy, format, recipeCopy } from '@/copy';
import { useRecipeNight } from '@/features/recipes/useRecipeNight';
import { radius, size, space, useTheme } from '@/theme';

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Tap-to-start countdown for a step. */
function StepTimer({ seconds }: { seconds: number }) {
  const { colors } = useTheme();
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(t);
          setRunning(false);
          if (!fired.current) {
            fired.current = true;
            haptics.success();
          }
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const done = left === 0;
  return (
    <View style={[styles.timer, { backgroundColor: done ? colors.goodSoft : colors.brandSoft }]}>
      <Text
        variant="display"
        color={done ? 'goodInk' : 'brandInk'}
        accessibilityLiveRegion="polite"
      >
        {done ? cookCopy.timerDone : mmss(left)}
      </Text>
      <View style={styles.timerRow}>
        {!done ? (
          <Pressable
            onPress={() => setRunning((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={
              running
                ? cookCopy.pause
                : left === seconds
                  ? format(cookCopy.startTimer, { time: mmss(seconds) })
                  : cookCopy.resume
            }
            style={[styles.round, { backgroundColor: colors.brand }]}
            testID="timer-toggle"
          >
            {running ? (
              <Pause size={size.iconLg} color={colors.onBrand} />
            ) : (
              <Play size={size.iconLg} color={colors.onBrand} />
            )}
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            setRunning(false);
            setLeft(seconds);
            fired.current = false;
          }}
          accessibilityRole="button"
          accessibilityLabel={cookCopy.reset}
          style={[styles.round, { backgroundColor: colors.surface }]}
        >
          <RotateCcw size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

/** Cooking mode (spec §10.3): large text, one step per screen, swipe, timers, screen kept awake. */
export default function CookingMode() {
  useKeepAwake();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { recipe, testDose } = useRecipeNight();
  const [index, setIndex] = useState(0);
  const pager = useRef<ScrollViewInstance>(null);

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
  const total = recipe.steps.length;
  const finished = index >= total;
  const go = (i: number) => {
    const next = Math.max(0, Math.min(total, i));
    setIndex(next);
    pager.current?.scrollTo({ x: next * width, animated: true });
    haptics.light();
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View
      style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top + space.xs }]}
      testID="cooking"
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={cookCopy.close}
          style={[styles.round, { backgroundColor: colors.surface }]}
        >
          <X size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text variant="callout" color="textSecondary" style={styles.flex} align="center">
          {finished ? recipe.title : format(cookCopy.step, { current: index + 1, total })}
        </Text>
        <View style={styles.round} />
      </View>
      <View style={styles.progress}>
        <ProgressBar current={Math.min(index + 1, total)} total={total} />
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        accessibilityHint={cookCopy.swipeHint}
      >
        {recipe.steps.map((s, i) => (
          <ScrollView key={s.text} style={{ width }} contentContainerStyle={styles.page}>
            <Text variant="cooking" testID={`step-${i}`}>
              {s.text}
            </Text>
            {i === 0 && testDose ? (
              <Text variant="bodyStrong" color="partialInk">
                {format(recipeCopy.testIngredient, { portion: testDose.portion })}
              </Text>
            ) : null}
            {s.timerSec ? <StepTimer seconds={s.timerSec} /> : null}
          </ScrollView>
        ))}
        <View style={[styles.page, styles.donePage, { width }]}>
          <Text style={styles.doneEmoji} accessible={false}>
            🎉
          </Text>
          <Text variant="title" align="center" accessibilityRole="header">
            {cookCopy.done}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {cookCopy.doneBody}
          </Text>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ConfettiBurst trigger={finished ? 1 : 0} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {finished ? (
          <PrimaryButton
            label={cookCopy.finish}
            onPress={() => router.back()}
            testID="cook-finish"
          />
        ) : (
          <View style={styles.footRow}>
            {index > 0 ? (
              <View style={styles.flex}>
                <SecondaryButton label={cookCopy.prev} onPress={() => go(index - 1)} />
              </View>
            ) : null}
            <View style={styles.flex}>
              <PrimaryButton
                label={cookCopy.next}
                onPress={() => go(index + 1)}
                testID="cook-next"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screen,
    gap: space.sm,
  },
  progress: { paddingHorizontal: space.screen, paddingVertical: space.sm },
  round: {
    width: size.minTouch * 1.2,
    height: size.minTouch * 1.2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: { padding: space.screen, gap: space.xl, flexGrow: 1 },
  timer: { borderRadius: radius.card, padding: space.lg, alignItems: 'center', gap: space.md },
  timerRow: { flexDirection: 'row', gap: space.md },
  donePage: { justifyContent: 'center', alignItems: 'center' },
  doneEmoji: { fontSize: size.heroEmoji * 1.5, lineHeight: size.heroEmoji * 2 },
  footer: { paddingHorizontal: space.screen, paddingTop: space.sm },
  footRow: { flexDirection: 'row', gap: space.sm },
});
