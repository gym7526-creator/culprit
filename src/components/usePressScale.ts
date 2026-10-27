import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion, opacity } from '@/theme';

/**
 * Pressed feedback: spring scale to 0.97. With Reduce Motion on, a quick opacity fade instead.
 */
export function usePressScale() {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.set(
      reduceMotion ? withTiming(1, { duration: motion.fast }) : withSpring(1, motion.spring),
    );
  }, [pressed, reduceMotion]);

  const onPressOut = useCallback(() => {
    pressed.set(
      reduceMotion ? withTiming(0, { duration: motion.fast }) : withSpring(0, motion.spring),
    );
  }, [pressed, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 1 - pressed.value * (1 - opacity.pressed) }
      : { transform: [{ scale: 1 - pressed.value * (1 - motion.pressedScale) }] },
  );

  return { onPressIn, onPressOut, animatedStyle };
}
