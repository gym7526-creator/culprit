import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, OptionCard } from '@/components';
import { motion, space } from '@/theme';

export type ChoiceOption<T extends string | number> = {
  value: T;
  label: string;
  emoji?: string;
  sublabel?: string;
};

/**
 * Single-select option cards: the picked card highlights at once (pop + brand colour), stays for
 * `motion.autoAdvance` so the choice registers, then the screen moves on. Taps are locked meanwhile.
 */
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
  const [pending, setPending] = useState<T | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const shown = pending ?? value;
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((o) => (
        <OptionCard
          key={String(o.value)}
          label={o.label}
          emoji={o.emoji}
          sublabel={o.sublabel}
          selected={shown === o.value}
          testID={`option-${String(o.value)}`}
          onPress={() => {
            if (pending !== null) return;
            setPending(o.value);
            timer.current = setTimeout(() => {
              setPending(null);
              onPick(o.value);
            }, motion.autoAdvance);
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
