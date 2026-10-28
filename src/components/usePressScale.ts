import { useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion, opacity } from '@/theme';

/**
 * Pressed feedback used by every tappable component: a quick squeeze on touch (70 ms), then on
 * release a small overshoot "pop" that springs back to rest. With Reduce Motion on, a quick opacity
 * fade instead. Runs on the UI thread, so it responds instantly.
 */
export function usePressScale() {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (reduceMotion) {
      dim.set(withTiming(opacity.pressed, { duration: motion.fast }));
      return;
    }
    scale.set(
      withTiming(motion.pressedScale, {
        duration: motion.pressIn,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [scale, dim, reduceMotion]);

  const onPressOut = useCallback(() => {
    if (reduceMotion) {
      dim.set(withTiming(1, { duration: motion.fast }));
      return;
    }
    scale.set(
      withSequence(
        withTiming(motion.popScale, { duration: motion.popOut, easing: Easing.out(Easing.cubic) }),
        withSpring(1, motion.popSpring),
      ),
    );
  }, [scale, dim, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: dim.value,
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
}
