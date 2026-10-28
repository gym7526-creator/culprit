import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { storeLabel } from '@/features/stores/storeName';
import { haptics, Screen, ScoreRing, Text } from '@/components';
import { format, onboardingCopy } from '@/copy';
import { content } from '@/data/content';
import { detectProfile } from '@/engines/onboarding';
import { eatByTime } from '@/engines/plan';
import { track } from '@/analytics';
import { useAppStore } from '@/features/appStore';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { onboardingHref, useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { usePrefsStore } from '@/features/prefsStore';
import { radius, size, space, useTheme } from '@/theme';

const c = onboardingCopy.building;
/** 7 s total (spec: 6–8 s, can't be skipped). */
export const BUILD_MS = 7000;

function formatClock(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** O20: animated checklist + ring while the real engines build the plan. */
export default function Building() {
  const router = useRouter();
  const { colors } = useTheme();
  const { answers, today } = useOnboardingNav('building');
  const seed = usePrefsStore((s) => s.installId);
  const [shown, setShown] = useState(0);
  const [progress, setProgress] = useState(0);
  const built = useRef(false);

  const lines = useMemo(() => {
    const profile = detectProfile(answers.symptoms);
    const names = onboardingCopy.testNames;
    const store = storeLabel(answers);
    const out = [
      format(c.lines.matching, { count: content.recipes.length }),
      answers.gentleMode ? c.lines.gentle : c.lines.setAside,
    ];
    if (!answers.gentleMode) {
      const first = profile === 'reflux' ? ['coffee', 'tomato'] : ['wheat', 'onion'];
      out.push(
        format(c.lines.suspects, {
          list: first.map((g) => names[g as keyof typeof names].toLowerCase()).join(', '),
        }),
      );
    }
    out.push(format(c.lines.pricing, { store, zip: answers.zip ?? '' }));
    if (profile !== 'fodmap')
      out.push(format(c.lines.timing, { time: formatClock(eatByTime(answers.bedtime, 180)) }));
    return out;
  }, [answers]);

  // Build and save the real plan once.
  useEffect(() => {
    if (built.current) return;
    built.current = true;
    const week = buildFirstWeek(answers, today, seed);
    // A fresh program replaces anything from an earlier run through onboarding.
    useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
    track({ name: 'plan_generated' });
  }, [answers, today, seed]);

  // Timed checklist and ring.
  useEffect(() => {
    const step = BUILD_MS / (lines.length + 1);
    const timers = lines.map((_, i) => setTimeout(() => setShown(i + 1), step * (i + 1)));
    const start = Date.now();
    const tick = setInterval(() => setProgress(Math.min(1, (Date.now() - start) / BUILD_MS)), 100);
    const done = setTimeout(() => {
      haptics.success();
      router.replace(onboardingHref('first-week'));
    }, BUILD_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [lines, router]);

  return (
    <Screen contentStyle={styles.center} testID="building">
      <ScoreRing progress={progress} label={c.ringLabel} size={size.ring * 1.4}>
        <Text variant="headline">{`${Math.round(progress * 100)}%`}</Text>
      </ScoreRing>
      <Text variant="title" align="center" accessibilityRole="header">
        {c.title}
      </Text>
      <View style={styles.list} accessibilityLiveRegion="polite">
        {lines.slice(0, shown).map((line) => (
          <Animated.View key={line} entering={FadeIn.duration(300)} style={styles.line}>
            <View style={[styles.check, { backgroundColor: colors.goodSoft }]}>
              <Check size={size.iconSm} color={colors.goodInk} strokeWidth={3} />
            </View>
            <Text variant="callout" style={styles.flex}>
              {line}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center', gap: space.xl },
  list: { alignSelf: 'stretch', gap: space.sm, minHeight: size.ring * 1.5 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  check: {
    width: size.iconLg,
    height: size.iconLg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
