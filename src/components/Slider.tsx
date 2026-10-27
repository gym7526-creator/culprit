import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { componentCopy, format } from '@/copy';
import { radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** How the value is announced and shown (e.g. "$130"). */
  formatValue?: (value: number) => string;
  /** Optional evenly spaced marks under the track (e.g. the 5 faces on O6). */
  marks?: readonly string[];
  testID?: string;
};

/** Snapping slider (gesture-handler + Reanimated). Drag or tap anywhere on the track. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = String,
  marks,
  testID,
}: SliderProps) {
  const { colors } = useTheme();
  const steps = Math.max(1, Math.round((max - min) / step));
  const indexOf = (v: number) => Math.min(steps, Math.max(0, Math.round((v - min) / step)));

  const width = useSharedValue(0);
  const index = useSharedValue(indexOf(value));

  useEffect(() => {
    index.set(Math.min(steps, Math.max(0, Math.round((value - min) / step))));
  }, [value, min, step, steps, index]);

  const commit = (i: number) => {
    const next = min + i * step;
    if (next !== value) {
      haptics.selection();
      onChange(next);
    }
  };

  const updateFromX = (x: number) => {
    'worklet';
    if (width.value <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / width.value));
    const i = Math.round(ratio * steps);
    if (i !== index.value) {
      index.set(i);
      scheduleOnRN(commit, i);
    }
  };

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (e) => {
      updateFromX(e.x);
    },
    onUpdate: (e) => {
      updateFromX(e.x);
    },
  });

  const fillStyle = useAnimatedStyle(() => ({ width: `${(index.value / steps) * 100}%` }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (index.value / steps) * width.value - size.sliderThumb / 2 }],
  }));

  const display = formatValue(value);

  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(componentCopy.slider.a11y, { label, value: display }) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const i = indexOf(value);
        if (e.nativeEvent.actionName === 'increment' && i < steps) commit(i + 1);
        if (e.nativeEvent.actionName === 'decrement' && i > 0) commit(i - 1);
      }}
    >
      <Text variant="headline" align="center">
        {display}
      </Text>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hitArea}
          onLayout={(e) => {
            width.set(e.nativeEvent.layout.width);
          }}
        >
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
            <Animated.View style={[styles.fill, { backgroundColor: colors.brand }, fillStyle]} />
          </View>
          <Animated.View
            style={[
              styles.thumb,
              { backgroundColor: colors.surface, borderColor: colors.brand },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
      {marks && marks.length > 0 ? (
        <View style={styles.marks}>
          {marks.map((m, i) => (
            <Text key={`${m}-${i}`} variant="callout" accessible={false}>
              {m}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  hitArea: { minHeight: size.minTouch, justifyContent: 'center' },
  track: { height: size.sliderTrack, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%' },
  thumb: {
    position: 'absolute',
    left: 0,
    width: size.sliderThumb,
    height: size.sliderThumb,
    borderRadius: radius.pill,
    borderWidth: size.selectedBorder + 1,
  },
  marks: { flexDirection: 'row', justifyContent: 'space-between' },
});
