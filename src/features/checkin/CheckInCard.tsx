import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  Card,
  CheckInFaces,
  Chip,
  haptics,
  PrimaryButton,
  Text,
  type CheckInScore,
} from '@/components';
import { checkinCopy, format } from '@/copy';
import type { DayKey } from '@/engines/dates';
import { SYMPTOMS, UNUSUAL_REASONS, type Symptom, type UnusualReason } from '@/engines/types';
import { useAppStore } from '@/features/appStore';
import { size, space, useTheme } from '@/theme';

import { submitCheckin } from './actions';

type Props = {
  day: DayKey;
  isYesterday: boolean;
  /** Ask "Did you have the test food?" (dose days only). */
  testDay: boolean;
  streak: number;
  /** Called after the first tap saves the day (keeps the card on this day while details are added). */
  onLogged?: () => void;
  onFinished?: () => void;
};

function toggle<T>(list: readonly T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/**
 * The nightly check-in (spec §6.2): one tap saves it; symptoms, the test-food question and
 * "unusual day" are optional extras. Collapses to "✓ Checked in · N-day streak".
 */
export function CheckInCard({ day, isYesterday, testDay, streak, onLogged, onFinished }: Props) {
  const { colors } = useTheme();
  const saved = useAppStore((s) => s.checkins[day]);
  const [open, setOpen] = useState(false);
  const [showUnusual, setShowUnusual] = useState(false);
  const [collapsed, setCollapsed] = useState(saved !== undefined);

  if (collapsed && saved) {
    return (
      <Card style={styles.row} testID="checkin-done">
        <Text variant="bodyStrong" color="goodInk" style={styles.flex}>
          {streak > 1 ? format(checkinCopy.checkedIn, { count: streak }) : checkinCopy.checkedInOne}
        </Text>
        <Pressable
          onPress={() => {
            setCollapsed(false);
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={checkinCopy.edit}
          hitSlop={space.sm}
        >
          <Text variant="callout" color="brandInk">
            {checkinCopy.edit}
          </Text>
        </Pressable>
      </Card>
    );
  }

  const onFace = (score: CheckInScore) => {
    haptics.success();
    onLogged?.();
    submitCheckin(day, { score });
    setOpen(true);
  };

  return (
    <Card style={styles.card} testID="checkin-card">
      <Text variant="headline" accessibilityRole="header">
        {isYesterday ? checkinCopy.titleYesterday : checkinCopy.title}
      </Text>
      <CheckInFaces value={saved?.score ?? null} onChange={onFace} testID="checkin-faces" />

      {open && saved ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={styles.card}
        >
          <Text variant="callout" color="textSecondary">
            {checkinCopy.symptoms}
          </Text>
          <View style={styles.chips}>
            {SYMPTOMS.map((s: Symptom) => (
              <Chip
                key={s}
                label={checkinCopy.symptomNames[s]}
                selected={saved.symptoms.includes(s)}
                onPress={() =>
                  submitCheckin(day, { score: saved.score, symptoms: toggle(saved.symptoms, s) })
                }
              />
            ))}
          </View>

          {testDay ? (
            <View style={styles.gap}>
              <Text variant="bodyStrong">
                {isYesterday ? checkinCopy.testYesterday : checkinCopy.testQuestion}
              </Text>
              <View style={styles.chips}>
                {([true, false] as const).map((v) => (
                  <Chip
                    key={String(v)}
                    label={v ? checkinCopy.yes : checkinCopy.no}
                    selected={saved.testFoodTaken === v}
                    onPress={() => submitCheckin(day, { score: saved.score, testFoodTaken: v })}
                    testID={`test-food-${v ? 'yes' : 'no'}`}
                  />
                ))}
              </View>
              {saved.testFoodTaken === false ? (
                <Text variant="caption" color="textSecondary">
                  {checkinCopy.notEatenNote}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={() => setShowUnusual((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showUnusual }}
            style={styles.row}
          >
            <Text variant="callout" style={styles.flex}>
              {checkinCopy.unusual}
            </Text>
            {showUnusual ? (
              <ChevronUp size={size.iconMd} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={size.iconMd} color={colors.textSecondary} />
            )}
          </Pressable>
          {showUnusual ? (
            <View style={styles.gap}>
              <View style={styles.chips}>
                {UNUSUAL_REASONS.map((u: UnusualReason) => (
                  <Chip
                    key={u}
                    label={checkinCopy.unusualNames[u]}
                    selected={saved.unusual.includes(u)}
                    onPress={() =>
                      submitCheckin(day, { score: saved.score, unusual: toggle(saved.unusual, u) })
                    }
                  />
                ))}
              </View>
              <Text variant="caption" color="textSecondary">
                {checkinCopy.unusualNote}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={checkinCopy.done}
            onPress={() => {
              setOpen(false);
              setCollapsed(true);
              onFinished?.();
            }}
            testID="checkin-finish"
          />
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  gap: { gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: size.minTouch },
  flex: { flex: 1 },
});
