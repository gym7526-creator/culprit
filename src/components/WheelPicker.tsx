import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';

export type WheelItem<T extends string | number> = { value: T; label: string };

type WheelPickerProps<T extends string | number> = {
  items: readonly WheelItem<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
};

const ITEM = size.wheelItem;
const VISIBLE = size.wheelVisibleItems;
const PAD = ((VISIBLE - 1) / 2) * ITEM;
/** After scrolling stops for this long with no momentum event (slow drags, web), snap anyway. */
const IDLE_SNAP_MS = 120;

/** One row: scales, fades and tilts with its distance from the centre line (3D drum look). */
function WheelRow({
  index,
  label,
  offset,
  flat,
  onPress,
}: {
  index: number;
  label: string;
  offset: SharedValue<number>;
  flat: boolean;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const d = (offset.value - index * ITEM) / ITEM;
    const abs = Math.abs(d);
    return {
      opacity: interpolate(abs, [0, 1, 2, 3], [1, 0.55, 0.28, 0.12], Extrapolation.CLAMP),
      transform: flat
        ? []
        : [
            { perspective: 600 },
            { rotateX: `${interpolate(d, [-3, 0, 3], [55, 0, -55], Extrapolation.CLAMP)}deg` },
            { scale: interpolate(abs, [0, 1, 2], [1, 0.88, 0.78], Extrapolation.CLAMP) },
          ],
    };
  });
  return (
    <Pressable onPress={onPress} accessible={false} style={styles.item}>
      <Animated.View style={style}>
        <Text variant="headline">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * iOS-style wheel (no date-picker dependency): always comes to rest exactly on one item. Native
 * snapping handles flicks; a settle step snaps slow drags, tiny nudges and web scrolling to the
 * nearest item. Ticks a light haptic per item. Used by TimePicker and the birth-year picker.
 */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: WheelPickerProps<T>) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );
  const offset = useSharedValue(selectedIndex * ITEM);
  const tickIndex = useSharedValue(selectedIndex);
  const dragging = useRef(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ items, value, onChange });
  useEffect(() => {
    latest.current = { items, value, onChange };
  }, [items, value, onChange]);

  // Start on the current value (contentOffset alone isn't honoured on every platform).
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const y = selectedIndex * ITEM;
    const t = setTimeout(() => ref.current?.scrollTo({ y, animated: false }), 0);
    return () => clearTimeout(t);
  }, [selectedIndex, ref]);

  // Follow outside changes (e.g. VoiceOver increment) without fighting the user's finger.
  useEffect(() => {
    if (dragging.current) return;
    if (Math.round(offset.value / ITEM) !== selectedIndex) {
      ref.current?.scrollTo({ y: selectedIndex * ITEM, animated: false });
      offset.set(selectedIndex * ITEM);
    }
  }, [selectedIndex, offset, ref]);

  /** Glide to the nearest item and report it. */
  const settle = useCallback(
    (y: number) => {
      if (idle.current) clearTimeout(idle.current);
      const { items: list, value: current, onChange: change } = latest.current;
      const i = Math.min(list.length - 1, Math.max(0, Math.round(y / ITEM)));
      const target = i * ITEM;
      if (Math.abs(y - target) > 0.5) ref.current?.scrollTo({ y: target, animated: true });
      const item = list[i];
      if (item && item.value !== current) change(item.value);
    },
    [ref],
  );

  const onScrollJS = useCallback(
    (y: number) => {
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => {
        if (!dragging.current) settle(y);
      }, IDLE_SNAP_MS);
    },
    [settle],
  );

  const tick = useCallback(() => haptics.selection(), []);
  const setDragging = useCallback((on: boolean) => {
    dragging.current = on;
  }, []);

  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
    },
    [],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      offset.set(e.contentOffset.y);
      const i = Math.round(e.contentOffset.y / ITEM);
      if (i !== tickIndex.value) {
        tickIndex.set(i);
        scheduleOnRN(tick);
      }
      scheduleOnRN(onScrollJS, e.contentOffset.y);
    },
    onBeginDrag: () => {
      scheduleOnRN(setDragging, true);
    },
    onEndDrag: (e) => {
      scheduleOnRN(setDragging, false);
      // No fling: snap now (a fling snaps when its momentum ends).
      if (!e.velocity || Math.abs(e.velocity.y) < 0.05) scheduleOnRN(settle, e.contentOffset.y);
    },
    onMomentumEnd: (e) => {
      scheduleOnRN(settle, e.contentOffset.y);
    },
  });

  const step = (delta: number) => {
    const item = items[selectedIndex + delta];
    if (item) onChange(item.value);
  };

  const pick = (i: number) => {
    ref.current?.scrollTo({ y: i * ITEM, animated: true });
    const item = items[i];
    if (item && item.value !== value) {
      haptics.selection();
      onChange(item.value);
    }
  };

  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: items[selectedIndex]?.label ?? '' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') step(1);
        if (e.nativeEvent.actionName === 'decrement') step(-1);
      }}
    >
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { backgroundColor: colors.brandSoft, borderColor: colors.brand, top: PAD },
        ]}
      />
      <Animated.ScrollView
        ref={ref}
        style={styles.scroller}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * ITEM }}
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {items.map((item, i) => (
          <WheelRow
            key={String(item.value)}
            index={i}
            label={item.label}
            offset={offset}
            flat={reduceMotion}
            onPress={() => pick(i)}
          />
        ))}
      </Animated.ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.bg, `${colors.bg}00`]}
        style={[styles.fade, styles.fadeTop]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.bg}00`, colors.bg]}
        style={[styles.fade, styles.fadeBottom]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: ITEM * VISIBLE,
    flexGrow: 1,
    minWidth: size.minTouch + space.md,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM,
    borderRadius: radius.chip,
    borderWidth: size.hairline,
  },
  // An explicit height keeps the wheel its own scroller (web otherwise grows it to fit every row).
  scroller: { height: ITEM * VISIBLE, flexGrow: 0 },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, height: ITEM * 1.5 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
});
