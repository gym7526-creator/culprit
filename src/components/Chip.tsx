import { Pressable, StyleSheet } from 'react-native';

import { opacity, radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';

type ChipProps = {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

/** Hit slop that grows the 36 pt chip to the 44 pt minimum touch target. */
const CHIP_HIT_SLOP = (size.minTouch - size.chip) / 2;

/** Toggleable 36 pt chip for symptoms, suspects, dislikes (spec §7.3). */
export function Chip({ label, emoji, selected, onPress, disabled = false, testID }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      disabled={disabled}
      hitSlop={CHIP_HIT_SLOP}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.brandSoft : colors.surface,
          borderColor: selected ? colors.brand : colors.border,
        },
        pressed ? { opacity: opacity.pressed } : null,
        disabled ? { opacity: opacity.disabled } : null,
      ]}
    >
      <Text variant="callout" color={selected ? 'brandInk' : 'textPrimary'}>
        {emoji ? `${emoji} ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: size.chip,
    borderRadius: radius.chip,
    borderWidth: size.hairline,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
