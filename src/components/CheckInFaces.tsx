import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { componentCopy, format } from '@/copy';
import { motion, opacity, radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type CheckInScore = 0 | 1 | 2 | 3 | 4;

type CheckInFacesProps = {
  value: CheckInScore | null;
  onChange: (score: CheckInScore) => void;
  disabled?: boolean;
  testID?: string;
};

const SELECTED_SCALE = 1.12;

function Face({
  score,
  emoji,
  label,
  value,
  onChange,
  disabled,
}: {
  score: CheckInScore;
  emoji: string;
  label: string;
  value: CheckInScore | null;
  onChange: (score: CheckInScore) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const selected = value === score;
  const dimmed = value !== null && !selected;
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);

  useEffect(() => {
    const targetScale = selected && !reduceMotion ? SELECTED_SCALE : 1;
    scale.set(reduceMotion ? targetScale : withSpring(targetScale, motion.spring));
    fade.set(withTiming(dimmed ? opacity.disabled : 1, { duration: motion.base }));
  }, [selected, dimmed, reduceMotion, scale, fade]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <PressableScale
      onPress={() => {
        haptics.light();
        onChange(score);
      }}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={format(componentCopy.checkIn.faceA11y, { label })}
      accessibilityState={{ selected, disabled }}
      containerStyle={styles.faceCol}
      style={styles.faceCol}
    >
      <Animated.View style={[styles.faceCol, animatedStyle]}>
        <View
          style={[
            styles.face,
            {
              backgroundColor: selected ? colors.brandSoft : colors.surfaceAlt,
              borderColor: selected ? colors.brand : 'transparent',
            },
          ]}
        >
          <Text style={styles.emoji} accessible={false}>
            {emoji}
          </Text>
        </View>
        <Text variant="caption" color={selected ? 'brandInk' : 'textSecondary'} align="center">
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

/** The one-tap nightly check-in: five 64 pt faces with labels underneath (spec §6.2, §7.3). */
export function CheckInFaces({ value, onChange, disabled = false, testID }: CheckInFacesProps) {
  return (
    <View
      testID={testID}
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={componentCopy.checkIn.question}
    >
      {componentCopy.checkIn.faces.map((f) => (
        <Face
          key={f.score}
          score={f.score}
          emoji={f.emoji}
          label={f.label}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xxs },
  faceCol: { alignItems: 'center', gap: space.xs, flex: 1 },
  // 64 pt on standard phones; shrinks proportionally on narrow screens instead of overflowing.
  face: {
    width: '100%',
    maxWidth: size.face,
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: size.selectedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.faceEmoji, lineHeight: size.faceEmoji * 1.25 },
});
