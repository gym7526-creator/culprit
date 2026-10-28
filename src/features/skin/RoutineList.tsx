import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics, Text } from '@/components';
import { format, formatMoney, skinCopy } from '@/copy';
import type { RoutineStep } from '@/engines/skin';
import { radius, size, space, useTheme } from '@/theme';

type Props = {
  title: string;
  steps: readonly RoutineStep[];
  /** When given, each step is a tickable checklist row. */
  done?: readonly string[];
  onToggle?: (productId: string) => void;
  prefix: 'am' | 'pm';
};

/** A morning or night routine: product archetype, how to use it, price est. (spec §12). */
export function RoutineList({ title, steps, done, onToggle, prefix }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="bodyStrong">{title}</Text>
      {steps.map((s, i) => {
        const key = `${prefix}:${s.product.id}`;
        const on = done?.includes(key) ?? false;
        const body = (
          <>
            <View style={[styles.num, { backgroundColor: on ? colors.good : colors.brandSoft }]}>
              {on ? (
                <Check size={size.iconSm} color={colors.surface} strokeWidth={3} />
              ) : (
                <Text variant="caption" color="brandInk">
                  {i + 1}
                </Text>
              )}
            </View>
            <View style={styles.flex}>
              <Text variant="bodyStrong" style={on ? styles.struck : null}>
                {s.product.name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {s.product.how}
              </Text>
              {s.product.startSlow ? (
                <Text variant="caption" color="partialInk">
                  {skinCopy.routine.slow}
                </Text>
              ) : null}
              <Text variant="caption" color="textSecondary">
                {s.owned
                  ? skinCopy.routine.owned
                  : format(skinCopy.routine.price, {
                      price: formatMoney(s.price),
                      months: s.product.monthsPerPack,
                    })}
              </Text>
            </View>
          </>
        );
        return onToggle ? (
          <Pressable
            key={key}
            onPress={() => {
              haptics.light();
              onToggle(s.product.id);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={s.product.name}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            {body}
          </Pressable>
        ) : (
          <View key={key} style={[styles.row, { borderBottomColor: colors.border }]}>
            {body}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    paddingVertical: space.sm,
    minHeight: size.optionCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  num: {
    width: size.iconLg + space.xxs,
    height: size.iconLg + space.xxs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: space.xxs },
  struck: { textDecorationLine: 'line-through' },
});
