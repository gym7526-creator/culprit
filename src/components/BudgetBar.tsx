import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { componentCopy, format, formatMoney } from '@/copy';
import { budgetFill, budgetStatus, type BudgetStatus } from '@/engines/budget';
import { motion, radius, size, space, useTheme, type ColorTokens } from '@/theme';

import { Text } from './Text';

type BudgetBarProps = {
  total: number;
  budget: number;
  testID?: string;
};

const statusColors: Record<BudgetStatus, { bar: keyof ColorTokens; text: keyof ColorTokens }> = {
  under: { bar: 'good', text: 'goodInk' },
  near: { bar: 'partial', text: 'partialInk' },
  over: { bar: 'trigger', text: 'triggerInk' },
};

/** Weekly total vs budget: mint under, amber within 5%, coral over (spec §6.5). */
export function BudgetBar({ total, budget, testID }: BudgetBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const status = budgetStatus(total, budget);
  const fill = budgetFill(total, budget);
  const animated = useSharedValue(fill);

  useEffect(() => {
    animated.set(withTiming(fill, { duration: reduceMotion ? 0 : motion.slow }));
  }, [fill, reduceMotion, animated]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${animated.value * 100}%` }));

  const budgetText = formatMoney(budget, true);
  const amount = formatMoney(Math.abs(budget - total));
  const message =
    status === 'over'
      ? format(componentCopy.budget.over, { amount, budget: budgetText })
      : status === 'near'
        ? format(componentCopy.budget.near, { budget: budgetText })
        : format(componentCopy.budget.under, { amount, budget: budgetText });

  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityLabel={`${format(componentCopy.budget.a11y, { total: formatMoney(total), budget: budgetText })}. ${message}`}
    >
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: colors[statusColors[status].bar] }, fillStyle]}
        />
      </View>
      <Text variant="callout" color={statusColors[status].text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  track: { height: size.budgetBar, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
