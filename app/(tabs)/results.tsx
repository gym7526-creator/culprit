import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as StoreReview from 'expo-store-review';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import {
  Card,
  ConfettiBurst,
  haptics,
  PrimaryButton,
  Screen,
  SecondaryButton,
  StatusPill,
  Text,
  type PillStatus,
} from '@/components';
import { caseCopy, format, formatDay, groupEmoji } from '@/copy';
import { content } from '@/data/content';
import { diffDays } from '@/engines/dates';
import {
  caseCounts,
  caseReport,
  caseSolved,
  suspectBoard,
  trend,
  type BoardItem,
} from '@/engines/report';
import { AppHeader } from '@/features/app/AppHeader';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { usePrefsStore } from '@/features/prefsStore';
import { doctorReportHtml } from '@/features/results/doctorReport';
import { ScoreChart } from '@/features/results/ScoreChart';
import { useUiStore } from '@/features/uiStore';
import { radius, size, space, useTheme } from '@/theme';

const RATING_INTERVAL_MS = 120 * 24 * 60 * 60 * 1000;

const pillFor: Record<BoardItem['status'], PillStatus> = {
  untested: 'untested',
  testing: 'testing',
  trigger: 'trigger',
  partial: 'partial',
  cleared: 'cleared',
  unclear: 'unclear',
  self_reported: 'selfReported',
  known_fine: 'cleared',
};

const nameOf = (g: string) => content.tests.tests.find((t) => t.id === g)?.name ?? g;

/** Results "case file" (spec §10.5). */
export default function Results() {
  const router = useRouter();
  const { colors } = useTheme();
  const { today } = useClock();
  const program = useAppStore((s) => s.program);
  const checkins = useAppStore((s) => s.checkins);
  const celebrated = useAppStore((s) => s.celebrated);
  const markCelebrated = useAppStore((s) => s.markCelebrated);
  const toast = useUiStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const model = useMemo(() => {
    if (!program) return null;
    const board = suspectBoard(program);
    const start = program.calmStartedOn ?? today;
    const pts = diffDays(start, today) >= 0 ? trend(checkins, start, today) : [];
    const calmEndIdx = program.calmEndedOn ? diffDays(start, program.calmEndedOn) : pts.length - 1;
    return {
      board,
      counts: caseCounts(board),
      pts,
      calmEndIdx,
      solved: caseSolved(program),
      report: caseReport(program),
    };
  }, [program, checkins, today]);

  const justSolved = model?.solved === true && !celebrated.includes('case_solved');

  // The moment the case is solved: confetti + haptic, then a rating prompt (max once per 120 days).
  useEffect(() => {
    if (!justSolved) return;
    haptics.success();
    markCelebrated('case_solved');
    const last = usePrefsStore.getState().lastRatingPromptAt;
    const now = Date.now();
    if (last === null || now - last > RATING_INTERVAL_MS) {
      const t = setTimeout(async () => {
        if (Platform.OS !== 'web' && (await StoreReview.hasAction())) {
          usePrefsStore.getState().setRatingPrompted(now);
          track({ name: 'rating_prompt_shown' });
          await StoreReview.requestReview();
        }
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [justSolved, markCelebrated]);

  if (!program || !model) return null;
  const { counts } = model;
  const subtitle = program.gentle
    ? caseCopy.gentleSubtitle
    : program.phase === 'setup' || program.phase === 'calm'
      ? caseCopy.calmSubtitle
      : format(counts.partial > 0 ? caseCopy.subtitlePartial : caseCopy.subtitle, counts);

  const exportPdf = async () => {
    setBusy(true);
    try {
      const html = doctorReportHtml(program, checkins, today);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
      track({ name: 'pdf_exported' });
    } catch {
      toast(caseCopy.pdfFailed);
    } finally {
      setBusy(false);
    }
  };

  const section = (title: string, items: readonly string[]) =>
    items.length === 0 ? null : (
      <View style={styles.gapSm}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="callout" color="textSecondary">
          {items.join(' · ')}
        </Text>
      </View>
    );

  return (
    <View style={styles.flex}>
      <Screen scroll testID="results">
        <AppHeader title={caseCopy.title} />
        <Text variant="callout" color="textSecondary" testID="case-subtitle">
          {subtitle}
        </Text>

        {model.solved ? (
          <Card
            style={[styles.section, styles.gapSm, { borderColor: colors.good, borderWidth: 1 }]}
            testID="solved"
          >
            <Text variant="headline" color="goodInk">
              {caseCopy.solved} 🕵️
            </Text>
            <Text variant="callout" color="textSecondary">
              {caseCopy.solvedBody}
            </Text>
            {section(
              caseCopy.triggers,
              model.report.triggers.map((r) => nameOf(r.group)),
            )}
            {section(
              caseCopy.partial,
              model.report.partial.map((r) => nameOf(r.group)),
            )}
            {section(
              caseCopy.cleared,
              model.report.cleared.map((r) => nameOf(r.group)),
            )}
            {section(
              caseCopy.unclear,
              model.report.unclear.map((r) => nameOf(r.group)),
            )}
            {section(caseCopy.selfReported, model.report.selfReported.map(nameOf))}
            {model.report.controls.length > 0 ? (
              <View style={styles.gapSm}>
                <Text variant="bodyStrong">{caseCopy.placebo}</Text>
                <Text variant="caption" color="textSecondary">
                  {caseCopy.placeboBody}
                </Text>
                {model.report.controls.map((c) => (
                  <Text key={c.day} variant="caption" color="textSecondary">
                    {format(c.reacted ? caseCopy.placeboReacted : caseCopy.placeboCalm, {
                      day: formatDay(c.day, 'short'),
                    })}
                  </Text>
                ))}
              </View>
            ) : null}
            <PrimaryButton
              label={caseCopy.share}
              onPress={() => router.push('/share')}
              testID="share-results"
            />
            <SecondaryButton
              label={caseCopy.pdf}
              onPress={exportPdf}
              loading={busy}
              testID="export-pdf"
            />
          </Card>
        ) : null}

        {!program.gentle ? (
          <View style={styles.section}>
            <Text variant="bodyStrong">{caseCopy.board}</Text>
            <View style={styles.grid}>
              {model.board.map((b) => (
                <Pressable
                  key={b.group}
                  onPress={() => router.push(`/test/${b.group}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${nameOf(b.group)}, ${b.status === 'known_fine' ? caseCopy.status.known_fine : b.status}`}
                  style={[
                    styles.tile,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  testID={`board-${b.group}`}
                >
                  <Text style={styles.emoji} accessible={false}>
                    {groupEmoji[b.group] ?? '🔎'}
                  </Text>
                  <Text variant="callout" numberOfLines={2}>
                    {nameOf(b.group)}
                  </Text>
                  <StatusPill
                    status={pillFor[b.status]}
                    label={b.status === 'known_fine' ? caseCopy.status.known_fine : undefined}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!program.gentle &&
        !model.solved &&
        (model.report.triggers.length > 0 || model.report.cleared.length > 0) ? (
          <View style={styles.section}>
            <SecondaryButton
              label={caseCopy.pdf}
              onPress={exportPdf}
              loading={busy}
              testID="export-pdf"
            />
          </View>
        ) : null}

        <Card style={[styles.section, styles.gapSm]}>
          <Text variant="bodyStrong">{caseCopy.trend}</Text>
          {model.pts.filter((p) => p.score !== null).length >= 2 ? (
            <>
              <ScoreChart
                points={model.pts.map((p) => ({ value: p.smooth }))}
                shade={{
                  from: 0,
                  to: Math.max(0, Math.min(model.pts.length - 1, model.calmEndIdx)),
                }}
                accessibilityLabel={caseCopy.trend}
                testID="trend-chart"
              />
              <Text variant="caption" color="textSecondary">
                {caseCopy.trendNote}
              </Text>
            </>
          ) : (
            <Text variant="callout" color="textSecondary">
              {caseCopy.noCheckins}
            </Text>
          )}
        </Card>
      </Screen>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ConfettiBurst trigger={justSolved ? 1 : 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { marginTop: space.xl },
  gapSm: { gap: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.sm,
    gap: space.xs,
    minHeight: size.optionCard * 2,
  },
  emoji: { fontSize: size.optionEmoji, lineHeight: size.optionEmoji * 1.3 },
});
