import { ChevronLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { componentCopy, format } from '@/copy';
import { motion, opacity, radius, size, space, useTheme } from '@/theme';

type ProgressBarProps = {
  current: number;
  total: number;
  onBack?: () => void;
  testID?: string;
};

/** Onboarding top bar: back chevron + 6 pt rounded bar that animates its width (spec §7.3). */
export function ProgressBar({ current, total, onBack, testID }: ProgressBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const target = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const progress = useSharedValue(target);

  useEffect(() => {
    progress.set(withTiming(target, { duration: reduceMotion ? 0 : motion.slow }));
  }, [target, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.row} testID={testID}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={componentCopy.progress.back}
          hitSlop={space.xs}
          style={({ pressed }) => [styles.back, pressed ? { opacity: opacity.pressed } : null]}
        >
          <ChevronLeft size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View
        style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
        accessibilityRole="progressbar"
        accessibilityLabel={format(componentCopy.progress.a11y, { current, total })}
        accessibilityValue={{ min: 0, max: total, now: current }}
      >
        <Animated.View style={[styles.fill, { backgroundColor: colors.brand }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  back: {
    width: size.minTouch,
    height: size.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { flex: 1, height: size.progressBar, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
