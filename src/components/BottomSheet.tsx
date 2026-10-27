import { useEffect, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { componentCopy } from '@/copy';
import { motion, radius, size, space, useTheme } from '@/theme';

import { Text } from './Text';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  testID?: string;
}>;

/** Drag distance (pt) or fling velocity (pt/s) that dismisses the sheet. */
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

/**
 * Modal bottom sheet: slides up (fades with Reduce Motion), drag-down or backdrop tap to close.
 * Top corners use the 28 pt sheet radius.
 */
export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0); // 0 = hidden, 1 = shown
  const dragY = useSharedValue(0);

  // Mount as soon as we become visible (state adjusted during render, not in an effect);
  // unmount only after the closing animation finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      dragY.set(0);
      progress.set(withTiming(1, { duration: motion.base }));
    } else {
      progress.set(
        withTiming(0, { duration: motion.base }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, progress, dragY]);

  const pan = usePanGesture({
    onUpdate: (e) => {
      dragY.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        dragY.set(withTiming(0, { duration: motion.fast }));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: progress.value, transform: [{ translateY: dragY.value }] }
      : { transform: [{ translateY: (1 - progress.value) * screenHeight + dragY.value }] },
  );

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}
        >
          <Pressable
            style={styles.flex}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={componentCopy.sheet.close}
          />
        </Animated.View>
        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + space.lg },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
          </GestureDetector>
          {title ? (
            <Text variant="headline" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.screen,
    gap: space.md,
  },
  handleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size.minTouch / 2 + space.xs,
  },
  handle: {
    width: size.sheetHandleWidth,
    height: size.sheetHandleHeight,
    borderRadius: radius.pill,
  },
});
