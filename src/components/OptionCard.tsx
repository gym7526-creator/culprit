import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { opacity, radius, size, space, typography, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';
import { usePressScale } from './usePressScale';

export type OptionCardProps = {
  label: string;
  emoji?: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  /** 'single' reads as a radio button; 'multi' as a checkbox. Screens auto-advance single-select after `motion.autoAdvance`. */
  mode?: 'single' | 'multi';
  disabled?: boolean;
  testID?: string;
};

/** Onboarding answer card (spec §7.3): min 64 pt, emoji left, check on the right when selected. */
export function OptionCard({
  label,
  emoji,
  sublabel,
  selected,
  onPress,
  mode = 'single',
  disabled = false,
  testID,
}: OptionCardProps) {
  const { colors, elevated } = useTheme();
  const { onPressIn, onPressOut, animatedStyle } = usePressScale();

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
      accessibilityState={
        mode === 'single' ? { selected, disabled } : { checked: selected, disabled }
      }
    >
      <Animated.View
        style={[
          styles.card,
          selected ? null : elevated,
          {
            backgroundColor: selected ? colors.brandSoft : colors.surface,
            // Border width stays constant so selecting never shifts the layout.
            borderColor: selected ? colors.brand : colors.border,
          },
          disabled ? { opacity: opacity.disabled } : null,
          animatedStyle,
        ]}
      >
        {emoji ? (
          <Text style={styles.emoji} accessible={false}>
            {emoji}
          </Text>
        ) : null}
        <View style={styles.labels}>
          <Text variant="bodyStrong">{label}</Text>
          {sublabel ? (
            <Text variant="callout" color="textSecondary">
              {sublabel}
            </Text>
          ) : null}
        </View>
        {selected ? (
          <View style={[styles.check, { backgroundColor: colors.brand }]}>
            <Check size={size.iconSm} color={colors.onBrand} strokeWidth={3} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: size.optionCard,
    borderRadius: radius.card,
    borderWidth: size.selectedBorder,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  emoji: {
    fontSize: size.optionEmoji,
    lineHeight: size.optionEmoji * 1.25,
    fontFamily: typography.body.fontFamily,
  },
  labels: { flex: 1, gap: space.xxs / 2 },
  check: {
    width: size.iconLg,
    height: size.iconLg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
