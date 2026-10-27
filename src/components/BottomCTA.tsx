import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { size, space, useTheme } from '@/theme';

/** Approximate height the pinned CTA occupies, for Screen's `bottomInset`. */
export const BOTTOM_CTA_SPACE = size.button + space.md + size.ctaFade;

/**
 * Pins its children (usually a PrimaryButton) to the bottom of the screen, above the safe area,
 * with a soft fade from transparent to the background behind it (spec §7.3).
 */
export function BottomCTA({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.bg}00`, colors.bg]}
        style={styles.fade}
      />
      <View
        style={{
          backgroundColor: colors.bg,
          paddingHorizontal: space.screen,
          paddingBottom: Math.max(insets.bottom, space.md),
          gap: space.xs,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { height: size.ctaFade },
});
