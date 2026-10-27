import { Pressable, StyleSheet } from 'react-native';

import { opacity, size, space } from '@/theme';

import { Text } from './Text';

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

/** Brand-colored text link with a 44 pt minimum hit area. */
export function TextButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
}: TextButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        pressed ? { opacity: opacity.pressed } : null,
        disabled ? { opacity: opacity.disabled } : null,
      ]}
    >
      <Text variant="callout" color="brandInk" align="center">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.minTouch,
    minWidth: size.minTouch,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
