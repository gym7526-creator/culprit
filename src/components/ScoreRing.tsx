import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { componentCopy, format } from '@/copy';
import { motion, size as sizes, useTheme, type ColorTokens } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ScoreRingProps = {
  /** 0..1 */
  progress: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: keyof ColorTokens;
  /** Rendered in the middle (e.g. a big number). */
  children?: ReactNode;
  testID?: string;
};

/** SVG progress ring with an animated stroke (spec §7.3). */
export function ScoreRing({
  progress,
  label,
  size = sizes.ring,
  strokeWidth = sizes.ringStroke,
  color = 'brand',
  children,
  testID,
}: ScoreRingProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.set(withTiming(clamped, { duration: reduceMotion ? 0 : motion.slow * 2 }));
  }, [clamped, reduceMotion, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View
      testID={testID}
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={format(componentCopy.ring.a11y, {
        label,
        percent: Math.round(clamped * 100),
      })}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          // Start at 12 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
