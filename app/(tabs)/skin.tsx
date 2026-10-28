import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  BottomSheet,
  BudgetBar,
  Card,
  EmptyState,
  haptics,
  Screen,
  SecondaryButton,
  StatusPill,
  Text,
  TextButton,
  type PillStatus,
} from '@/components';
import { format, formatMoney, skinCopy } from '@/copy';
import { content } from '@/data/content';
import { diffDays } from '@/engines/dates';
import {
  activeChange,
  changeLength,
  skinResults,
  startExperiment,
  switchTreatment,
  SKIN_BASELINE_DAYS,
  type SkinOutcome,
  type SkinScore,
} from '@/engines/skin';
import { AppHeader } from '@/features/app/AppHeader';
import { useClock } from '@/features/clock';
import { currentRoutine, submitSkinCheckin } from '@/features/skin/actions';
import { RoutineList } from '@/features/skin/RoutineList';
import { useSkinStore } from '@/features/skin/skinStore';
import { useUiStore } from '@/features/uiStore';
import { radius, size, space, useTheme } from '@/theme';

const c = skinCopy;
const file = content.skincare;

const pill: Record<SkinOutcome, PillStatus> = {
  in_progress: 'testing',
  not_enough_data: 'unclear',
  seems_to_help: 'cleared',
  possibly_worse: 'trigger',
  no_clear_effect: 'untested',
};

const nameOf = (key: string) =>
  file.products.find((p) => p.id === key)?.name ??
  file.experiments.find((e) => e.id === key)?.name ??
  key;

/** Skin mode home (spec §12): one tap a day, the routine, the current change and results. */
export default function Skin() {
  const router = useRouter();
  const { colors } = useTheme();
  const { today } = useClock();
  const program = useSkinStore((s) => s.program);
  const answers = useSkinStore((s) => s.answers);
  const checkins = useSkinStore((s) => s.checkins);
  const done = useSkinStore((s) => s.done[today]);
  const setProgram = useSkinStore((s) => s.setProgram);
  const toggleDone = useSkinStore((s) => s.toggleDone);
  const toast = useUiStore((s) => s.showToast);
  const [switching, setSwitching] = useState(false);

  // Recomputed when the answers or the program (treatment) change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const routine = useMemo(() => (program ? currentRoutine() : null), [program, answers]);
  const results = useMemo(
    () => (program ? skinResults(file, program, checkins, today) : []),
    [program, checkins, today],
  );

  if (!program || !routine) {
    return (
      <Screen contentStyle={styles.center} testID="skin-empty">
        <EmptyState
          emoji="✨"
          title={c.setupCta}
          body={c.setupBody}
          ctaLabel={c.setupCta}
          onCta={() => router.push('/skin-setup/concern')}
        />
      </Screen>
    );
  }

  const logged = checkins[today];
  const running = activeChange(file, program, today);
  const baselineDay = diffDays(program.startedOn, today) + 1;
  const totalSteps = routine.am.length + routine.pm.length;
  const doneCount = (done ?? []).length;
  const queuedKeys = program.changes.map((ch) => ch.key);

  let changeText: string = c.change.none;
  if (baselineDay <= SKIN_BASELINE_DAYS && !running) {
    changeText = format(c.change.baseline, { day: Math.max(1, baselineDay) });
  } else if (running) {
    const day = diffDays(running.startedOn, today) + 1;
    const len = changeLength(file, running);
    if (running.key === 'milk_pause')
      changeText = day <= 28 ? c.change.milkPause : c.change.milkBack;
    else if (running.key === 'low_glycemic') changeText = format(c.change.swap, { day });
    else
      changeText = format(c.change.running, {
        name: nameOf(running.key),
        week: Math.ceil(day / 7),
        weeks: Math.ceil(len / 7),
      });
  }

  return (
    <>
      <Screen scroll testID="skin">
        <AppHeader title={c.title} />

        <Card style={styles.section} testID="skin-checkin">
          <Text variant="headline">{c.checkin.title}</Text>
          {logged ? (
            <Text variant="bodyStrong" color="goodInk">
              {c.checkin.logged} · {c.checkin.emoji[logged.score]} {c.checkin.options[logged.score]}
            </Text>
          ) : null}
          <View style={styles.faces}>
            {c.checkin.options.map((label, i) => {
              const selected = logged?.score === i;
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    haptics.success();
                    submitSkinCheckin(today, i as SkinScore);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={format(c.checkin.a11y, { label })}
                  style={[
                    styles.face,
                    {
                      backgroundColor: selected ? colors.brandSoft : colors.surface,
                      borderColor: selected ? colors.brand : colors.border,
                    },
                  ]}
                  testID={`skin-score-${i}`}
                >
                  <Text style={styles.emoji} accessible={false}>
                    {c.checkin.emoji[i]}
                  </Text>
                  <Text
                    variant="caption"
                    align="center"
                    color={selected ? 'brandInk' : 'textSecondary'}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text variant="bodyStrong" testID="skin-change">
            {changeText}
          </Text>
          <Text variant="caption" color="textSecondary">
            {c.change.judgeNote}
          </Text>
        </Card>

        <Card style={styles.section}>
          <View style={styles.row}>
            <Text variant="caption" color="textSecondary" style={styles.flex}>
              {format(c.routine.done, { done: doneCount, total: totalSteps })}
            </Text>
            <Text variant="caption" color="textSecondary">
              {format(c.routine.total, { total: formatMoney(routine.monthly) })}
            </Text>
          </View>
          <BudgetBar total={routine.monthly} budget={routine.budget} />
          <RoutineList
            title={c.routine.am}
            steps={routine.am}
            prefix="am"
            done={done}
            onToggle={(id) => toggleDone(today, `am:${id}`)}
          />
          <RoutineList
            title={c.routine.pm}
            steps={routine.pm}
            prefix="pm"
            done={done}
            onToggle={(id) => toggleDone(today, `pm:${id}`)}
          />
          <TextButton label={c.switchTreatment} onPress={() => setSwitching(true)} />
        </Card>

        <View style={styles.section}>
          <Text variant="bodyStrong">{c.results.title}</Text>
          {results.length === 0 ? (
            <Text variant="callout" color="textSecondary">
              {c.results.empty}
            </Text>
          ) : (
            results.map((r) => (
              <Card key={r.change.id} style={styles.result} testID={`skin-result-${r.change.key}`}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{nameOf(r.change.key)}</Text>
                  {r.outcome === 'in_progress' ? (
                    <Text variant="caption" color="textSecondary">
                      {format('{d} / {l}', { d: r.day, l: r.length })}
                    </Text>
                  ) : null}
                </View>
                <StatusPill status={pill[r.outcome]} label={c.results.outcome[r.outcome]} />
              </Card>
            ))
          )}
        </View>

        <Card style={styles.section}>
          <Text variant="bodyStrong">{c.experiments.title}</Text>
          {program.experimentsAllowed ? (
            <>
              <Text variant="caption" color="textSecondary">
                {c.experiments.subtitle}
              </Text>
              {file.experiments.map((e) => {
                const queued = queuedKeys.includes(e.id);
                return (
                  <View key={e.id} style={styles.experiment}>
                    <Text variant="bodyStrong">{e.name}</Text>
                    <Text variant="callout" color="textSecondary">
                      {e.how}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {e.evidence}
                    </Text>
                    {queued ? (
                      <Text variant="caption" color="brandInk">
                        {c.experiments.queued}
                      </Text>
                    ) : (
                      <SecondaryButton
                        label={c.experiments.start}
                        onPress={() => setProgram(startExperiment(file, program, e.id, today))}
                        testID={`start-${e.id}`}
                      />
                    )}
                  </View>
                );
              })}
            </>
          ) : (
            <Text variant="callout" color="textSecondary" testID="skin-adults-only">
              {c.experiments.adultsOnly}
            </Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text variant="bodyStrong">{c.habits}</Text>
          {file.habits.map((h) => (
            <Text key={h} variant="callout">
              • {h}
            </Text>
          ))}
          <TextButton label={c.source} onPress={() => Linking.openURL(file.habitsSourceUrl)} />
        </Card>
        <Text variant="caption" color="textSecondary" align="center" style={styles.section}>
          {c.extras}
        </Text>
      </Screen>

      <BottomSheet
        visible={switching}
        onClose={() => setSwitching(false)}
        title={c.switchTreatment}
      >
        {file.products
          .filter((p) => p.step === 'treatment')
          .map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setProgram(switchTreatment(file, program, p.id, today));
                setSwitching(false);
                toast(c.switched);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: program.treatmentId === p.id }}
              accessibilityLabel={p.name}
              style={[
                styles.option,
                {
                  borderColor: program.treatmentId === p.id ? colors.brand : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text variant="bodyStrong">{p.name}</Text>
              <Text variant="caption" color="textSecondary">
                {format(c.routine.lookFor, { items: p.lookFor.join(', ') })}
              </Text>
              {p.note ? (
                <Text variant="caption" color="partialInk">
                  {p.note}
                </Text>
              ) : null}
            </Pressable>
          ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: space.lg, gap: space.sm },
  faces: { flexDirection: 'row', gap: space.xs },
  face: {
    flex: 1,
    minHeight: size.face + space.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxs,
    gap: space.xxs,
  },
  emoji: { fontSize: size.faceEmoji, lineHeight: size.faceEmoji * 1.3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  result: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  experiment: { gap: space.xxs, marginTop: space.sm },
  option: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.xxs,
    marginBottom: space.sm,
  },
});
