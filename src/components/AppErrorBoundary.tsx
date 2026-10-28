import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { common } from '@/copy';
import { palette, radius, size, space, typography } from '@/theme';

/**
 * Route-level error screen (expo-router `ErrorBoundary`). It can render outside the theme provider,
 * so it reads the palette directly. Shows a friendly message and a retry, never a stack trace.
 */
export function AppErrorBoundary({ retry }: ErrorBoundaryProps) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]} accessibilityRole="alert">
      <Text style={styles.emoji} accessible={false}>
        🧾
      </Text>
      <Text style={[typography.headline, { color: c.textPrimary }]}>
        {common.somethingWentWrong}
      </Text>
      <Text style={[typography.callout, styles.center, { color: c.textSecondary }]}>
        {common.errorBody}
      </Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        accessibilityLabel={common.retry}
        style={[styles.button, { backgroundColor: c.brand }]}
      >
        <Text style={[typography.button, { color: c.onBrand }]}>{common.retry}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.screen,
  },
  emoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
  center: { textAlign: 'center' },
  button: {
    minHeight: size.button,
    borderRadius: radius.button,
    paddingHorizontal: space.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
