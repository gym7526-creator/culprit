import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { track } from '@/analytics';
import {
  Card,
  ConfettiBurst,
  haptics,
  Screen,
  SecondaryButton,
  StatusPill,
  Text,
  type PillStatus,
} from '@/components';
import { common, format, groupEmoji, revealCopy, formatDay } from '@/copy';
import { content } from '@/data/content';
import { groupStatus, latestResults, requestRetest } from '@/engines/program';
import { testChart } from '@/engines/report';
import type { TestGroup } from '@/engines/types';
import { useAppStore } from '@/features/appStore';
import { useUiStore } from '@/features/uiStore';
import { ScoreChart } from '@/features/results/ScoreChart';
import { radius, size, space, useTheme } from '@/theme';

/** Suspense before a verdict appears (skipped for results already seen). */
const REVEAL_MS = 1400;

const pillFor: Record<string, PillStatus> = {
  untested: 'untested',
  testing: 'testing',
  trigger: 'trigger',
  partial: 'partial',
  cleared: 'cleared',
  unclear: 'unclear',
  self_reported: 'selfReported',
};

/** Test detail + verdict reveal (spec §10.5): chart, explanation, confidence, retest. */
export default function TestDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { group } = useLocalSearchParams<{ group: string }>();
  const program = useAppStore((s) => s.program);
  const checkins = useAppStore((s) => s.checkins);
  const revealed = useAppStore((s) => s.revealed);
  const markRevealed = useAppStore((s) => s.markRevealed);
  const setProgram = useAppStore((s) => s.setProgram);
  const toast = useUiStore((s) => s.showToast);
  const g = String(group) as TestGroup;
  const def = content.tests.tests.find((t) => t.id === g);

  const data = useMemo(() => {
    if (!program) return null;
    const result = latestResults(program).get(g) ?? null;
    const test = [...program.completed].reverse().find((t) => t.group === g && t.result) ?? null;
    return {
      result,
      test,
      status: groupStatus(program, g),
      chart: test ? testChart(program, test.id, checkins) : null,
      retestQueued: program.queue.some((q) => q.group === g && q.kind === 'retest'),
      knownFine: program.knownFine.includes(g),
    };
  }, [program, checkins, g]);

  const needsReveal = data?.test ? !revealed.includes(data.test.id) : false;
  const [phase, setPhase] = useState<'suspense' | 'shown'>(needsReveal ? 'suspense' : 'shown');

  useEffect(() => {
    if (phase !== 'suspense' || !data?.test) return;
    const t = setTimeout(() => {
      setPhase('shown');
      markRevealed(data.test!.id);
      if (data.result?.outcome === 'tolerated') haptics.success();
      else haptics.warning();
    }, REVEAL_MS);
    return () => clearTimeout(t);
  }, [phase, data, markRevealed]);

  if (!program || !def || !data) {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator accessibilityLabel={common.loading} />
      </Screen>
    );
  }
  const name = def.name;
  const r = data.result;

  return (
    <View style={styles.flex}>
      <Screen scroll testID="test-detail">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={revealCopy.back}
          style={styles.back}
        >
          <ChevronLeft size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
            <Text style={styles.emoji} accessible={false}>
              {groupEmoji[g] ?? '🔎'}
            </Text>
          </View>
          <Text variant="title" align="center" accessibilityRole="header">
            {name}
          </Text>
        </View>

        {phase === 'suspense' ? (
          <View style={styles.suspense} testID="reveal-suspense">
            <ActivityIndicator color={colors.brand} />
            <Text variant="callout" color="textSecondary">
              {revealCopy.analyzing}
            </Text>
          </View>
        ) : r ? (
          <Animated.View entering={ZoomIn.duration(350)} style={styles.verdict} testID="verdict">
            <StatusPill
              status={pillFor[data.status] ?? 'unclear'}
              label={revealCopy.verdict[r.outcome]}
            />
            <Text variant="headline" align="center">
              {format(revealCopy.verdictBody[r.outcome], {
                group: name,
                portion: def.doses[Math.max(0, r.safeDose - 1)]?.portion ?? '',
              })}
            </Text>
          </Animated.View>
        ) : (
          <Card style={styles.gap}>
            <Text variant="bodyStrong">
              {data.knownFine
                ? revealCopy.knownFine
                : data.status === 'testing'
                  ? revealCopy.testingNow
                  : revealCopy.notTested}
            </Text>
            <Text variant="callout" color="textSecondary">
              {data.knownFine
                ? revealCopy.knownFineBody
                : data.status === 'testing'
                  ? revealCopy.testingBody
                  : revealCopy.notTestedBody}
            </Text>
          </Card>
        )}

        {phase === 'shown' && r ? (
          <Animated.View entering={FadeIn.delay(200)} style={styles.gap}>
            <Card style={styles.gap}>
              <Text variant="body">{r.explanation}</Text>
              {r.confidence ? (
                <Text variant="callout" color="textSecondary">
                  {revealCopy.confidence[r.confidence]}
                  {r.failedChecks.length > 0
                    ? `. ${r.failedChecks.map((c) => revealCopy.confidenceWhy[c]).join(' ')}`
                    : ''}
                </Text>
              ) : null}
            </Card>

            {data.chart ? (
              <Card style={styles.gap}>
                <Text variant="bodyStrong">{revealCopy.chartTitle}</Text>
                <ScoreChart
                  dots
                  points={data.chart.days.map((d) => ({
                    value: d.score,
                    marker: d.dose ? format(revealCopy.dose, { n: d.dose }) : null,
                  }))}
                  baseline={data.chart.baseline}
                  baselineLabel={revealCopy.baseline}
                  accessibilityLabel={`${revealCopy.chartTitle}. ${r.explanation}`}
                  testID="test-chart"
                />
                <Text variant="caption" color="textSecondary">
                  {`${formatDay(data.chart.days[0]!.day, 'short')} – ${formatDay(data.chart.days[data.chart.days.length - 1]!.day, 'short')}`}
                </Text>
              </Card>
            ) : null}

            {r.outcome !== 'self_reported' ? (
              data.retestQueued ? (
                <Text variant="callout" color="textSecondary" align="center">
                  {revealCopy.retestPending}
                </Text>
              ) : (
                <SecondaryButton
                  label={revealCopy.retest}
                  onPress={() => {
                    setProgram(requestRetest(program, g));
                    track({ name: 'retest_requested' });
                    toast(revealCopy.retestQueued);
                  }}
                  testID="retest"
                />
              )
            ) : null}
          </Animated.View>
        ) : null}
      </Screen>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ConfettiBurst
          trigger={phase === 'shown' && needsReveal && r?.outcome === 'tolerated' ? 1 : 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  back: { width: size.minTouch, height: size.minTouch, justifyContent: 'center' },
  head: { alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  icon: {
    width: size.heroEmoji * 1.6,
    height: size.heroEmoji * 1.6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
  suspense: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  verdict: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  gap: { gap: space.sm, marginTop: space.sm },
});
