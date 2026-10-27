import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUiStore, type ToastTone } from '@/features/uiStore';
import { motion, radius, space, useTheme, type ColorTokens } from '@/theme';

import { Text } from './Text';

const toneColors: Record<ToastTone, { fill: keyof ColorTokens; text: keyof ColorTokens }> = {
  neutral: { fill: 'textPrimary', text: 'bg' },
  good: { fill: 'goodSoft', text: 'goodInk' },
  trigger: { fill: 'triggerSoft', text: 'triggerInk' },
};

/**
 * Global toast host. Mount once near the root; show messages with `useUiStore.getState().showToast()`.
 * Announced to screen readers via a polite live region.
 */
export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);
  const { colors, elevated } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, motion.toast);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + space.xs }]}>
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(motion.base)}
          exiting={FadeOut.duration(motion.fast)}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.toast, elevated, { backgroundColor: colors[toneColors[toast.tone].fill] }]}
        >
          <Text variant="callout" color={toneColors[toast.tone].text} align="center">
            {toast.text}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: space.screen, right: space.screen, alignItems: 'center' },
  toast: {
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
});
