import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { opacity, radius, space, useTheme } from '@/theme';

type CardProps = PropsWithChildren<{
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'surface' | 'alt';
  style?: ViewStyle;
  testID?: string;
}>;

/** Rounded 20 pt surface with the single soft shadow (border in dark mode). */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  tone = 'surface',
  style,
  testID,
}: CardProps) {
  const { colors, elevated } = useTheme();
  const base = [
    styles.card,
    { backgroundColor: tone === 'surface' ? colors.surface : colors.surfaceAlt },
    tone === 'surface' ? elevated : null,
    style,
  ];
  if (!onPress) {
    return (
      <View testID={testID} style={base}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed ? { opacity: opacity.pressed } : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
});
