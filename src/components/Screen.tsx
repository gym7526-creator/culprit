import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, useTheme } from '@/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  /** Extra bottom space so content can scroll clear of a pinned BottomCTA. */
  bottomInset?: number;
  contentStyle?: ViewStyle;
  testID?: string;
}>;

/** Screen container: themed background, safe-area top padding, 20 pt side padding. */
export function Screen({
  children,
  scroll = false,
  bottomInset = 0,
  contentStyle,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: insets.top + space.md,
    paddingBottom: insets.bottom + space.xl + bottomInset,
    paddingHorizontal: space.screen,
  };

  if (scroll) {
    return (
      <ScrollView
        testID={testID}
        style={[styles.flex, { backgroundColor: colors.bg }]}
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View
      testID={testID}
      style={[styles.flex, { backgroundColor: colors.bg }, padding, contentStyle]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
