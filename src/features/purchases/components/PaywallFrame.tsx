import { X } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomCTA, PrimaryButton, Screen, Text } from '@/components';
import { format, paywallCopy } from '@/copy';
import { purchases } from '@/purchases';
import { size, space, useTheme } from '@/theme';

type Props = PropsWithChildren<{
  onClose: () => void;
  step?: { current: number; total: number };
  cta: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    testID?: string;
  };
  /** Fine print and footer links, under the button. */
  below?: ReactNode;
  testID?: string;
}>;

/**
 * Shared paywall layout. The close (X) is always visible top-left (spec §9, Apple 3.1.2): no
 * hidden close and no timers.
 */
export function PaywallFrame({ onClose, step, cta, below, children, testID }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.flex} testID={testID}>
      <View style={[styles.header, { paddingTop: insets.top + space.xs }]}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={paywallCopy.close}
          hitSlop={space.xs}
          style={[styles.close, { backgroundColor: colors.surface }]}
          testID="paywall-close"
        >
          <X size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
        {step ? (
          <Text variant="caption" color="textSecondary">
            {format(paywallCopy.steps, step)}
          </Text>
        ) : null}
        <View style={styles.close} />
      </View>
      <Screen scroll bottomInset={size.button * 4} contentStyle={styles.content}>
        {purchases().isMock ? (
          <Text variant="caption" color="textSecondary" align="center">
            {paywallCopy.devStore}
          </Text>
        ) : null}
        {children}
      </Screen>
      <BottomCTA>
        <PrimaryButton
          label={cta.label}
          onPress={cta.onPress}
          loading={cta.loading}
          disabled={cta.disabled}
          testID={cta.testID ?? 'paywall-cta'}
        />
        {below}
      </BottomCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screen,
    paddingBottom: space.xs,
  },
  close: {
    width: size.minTouch,
    height: size.minTouch,
    borderRadius: size.minTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: space.lg, paddingTop: space.md },
});
