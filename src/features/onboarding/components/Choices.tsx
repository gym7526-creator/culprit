import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, OptionCard } from '@/components';
import { motion, space } from '@/theme';

export type ChoiceOption<T extends string | number> = {
  value: T;
  label: string;
  emoji?: string;
  sublabel?: string;
};

/** Single-select option cards that auto-advance 250 ms after a pick (spec §7.3). */
export function SingleChoice<T extends string | number>({
  options,
  value,
  onPick,
}: {
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onPick: (value: T) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picked = useRef<T | null>(value);
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((o) => (
        <OptionCard
          key={String(o.value)}
          label={o.label}
          emoji={o.emoji}
          sublabel={o.sublabel}
          selected={value === o.value}
          testID={`option-${String(o.value)}`}
          onPress={() => {
            picked.current = o.value;
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => onPick(o.value), motion.autoAdvance);
          }}
        />
      ))}
    </View>
  );
}

/** Multi-select option cards (Continue button advances). */
export function MultiChoice<T extends string | number>({
  options,
  values,
  onToggle,
}: {
  options: readonly ChoiceOption<T>[];
  values: readonly T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.list}>
      {options.map((o) => (
        <OptionCard
          key={String(o.value)}
          mode="multi"
          label={o.label}
          emoji={o.emoji}
          sublabel={o.sublabel}
          selected={values.includes(o.value)}
          testID={`option-${String(o.value)}`}
          onPress={() => onToggle(o.value)}
        />
      ))}
    </View>
  );
}

/** Wrapping row of toggle chips. */
export function ChipChoice<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: readonly { value: T; label: string }[];
  values: readonly T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={values.includes(o.value)}
          onPress={() => onToggle(o.value)}
          testID={`chip-${o.value}`}
        />
      ))}
    </View>
  );
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
