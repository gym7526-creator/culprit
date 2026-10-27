import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { opacity, radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';
import { usePressScale } from './usePressScale';

type ButtonKind = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

function BaseButton({
  kind,
  label,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps & { kind: ButtonKind }) {
  const { colors } = useTheme();
  const { onPressIn, onPressOut, animatedStyle } = usePressScale();
  const inactive = disabled || loading;
  const bg = kind === 'primary' ? colors.brand : colors.brandSoft;
  const fg = kind === 'primary' ? colors.onBrand : colors.brandInk;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => {
        if (inactive) return;
        haptics.light();
        onPressIn();
      }}
      onPressOut={onPressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.base,
          { backgroundColor: bg },
          disabled ? { opacity: opacity.disabled } : null,
          animatedStyle,
        ]}
      >
        {/* The label stays mounted (invisible) while loading so the button keeps its size. */}
        <Text
          variant="button"
          style={[{ color: fg }, loading ? styles.hidden : null]}
          numberOfLines={2}
          align="center"
        >
          {label}
        </Text>
        {loading ? (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color={fg} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/** Full-width 56 pt pill, brand fill (spec §7.3). */
export function PrimaryButton(props: ButtonProps) {
  return <BaseButton kind="primary" {...props} />;
}

/** Same size as PrimaryButton, brandSoft fill with brand text. */
export function SecondaryButton(props: ButtonProps) {
  return <BaseButton kind="secondary" {...props} />;
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.button,
    borderRadius: radius.button,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  hidden: { opacity: 0 },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
