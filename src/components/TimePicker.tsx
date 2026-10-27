import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { componentCopy } from '@/copy';
import { parseTime, snapMinute, toTime, type Period } from '@/engines/time';
import { space } from '@/theme';

import { Text } from './Text';
import { WheelPicker, type WheelItem } from './WheelPicker';

type TimePickerProps = {
  /** "HH:mm", 24-hour. */
  value: string;
  onChange: (value: string) => void;
  label: string;
  minuteStep?: 5 | 10 | 15 | 30;
  testID?: string;
};

/** Hour / minute / AM-PM wheels. Defaults in the app: check-in 20:30, bedtime 23:00. */
export function TimePicker({ value, onChange, label, minuteStep = 15, testID }: TimePickerProps) {
  const { hour12, minute, period } = parseTime(value);
  // Snap an off-step minute (e.g. a stored 20:37) to the nearest wheel option.
  const snappedMinute = snapMinute(minute, minuteStep);

  const hours = useMemo<WheelItem<number>[]>(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    [],
  );
  const minutes = useMemo<WheelItem<number>[]>(
    () =>
      Array.from({ length: 60 / minuteStep }, (_, i) => ({
        value: i * minuteStep,
        label: String(i * minuteStep).padStart(2, '0'),
      })),
    [minuteStep],
  );
  const periods = useMemo<WheelItem<Period>[]>(
    () => [
      { value: 'am', label: componentCopy.timePicker.am },
      { value: 'pm', label: componentCopy.timePicker.pm },
    ],
    [],
  );

  return (
    <View testID={testID} style={styles.wrap}>
      <Text variant="callout" color="textSecondary">
        {label}
      </Text>
      <View style={styles.row}>
        <WheelPicker
          items={hours}
          value={hour12}
          onChange={(h) => onChange(toTime(h, snappedMinute, period))}
          accessibilityLabel={`${label}, ${componentCopy.timePicker.hour}`}
        />
        <WheelPicker
          items={minutes}
          value={snappedMinute}
          onChange={(m) => onChange(toTime(hour12, m, period))}
          accessibilityLabel={`${label}, ${componentCopy.timePicker.minute}`}
        />
        <WheelPicker
          items={periods}
          value={period}
          onChange={(p) => onChange(toTime(hour12, snappedMinute, p))}
          accessibilityLabel={`${label}, ${componentCopy.timePicker.period}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', gap: space.xs },
});
