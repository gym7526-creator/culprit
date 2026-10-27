import { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

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

/**
 * iOS-style wheel built on a snapping ScrollView (no date-picker dependency).
 * Used by TimePicker and the O2 birth-year picker. Adjustable for VoiceOver.
 */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: WheelPickerProps<T>) {
  const { colors } = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );
  const lastHapticIndex = useRef(selectedIndex);

  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM, animated: false });
  }, [selectedIndex]);

  const indexFromEvent = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = indexFromEvent(e);
    if (i !== lastHapticIndex.current) {
      lastHapticIndex.current = i;
      haptics.selection();
    }
  };

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const item = items[indexFromEvent(e)];
    if (item && item.value !== value) onChange(item.value);
  };

  const step = (delta: number) => {
    const item = items[selectedIndex + delta];
    if (item) onChange(item.value);
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
        style={[styles.band, { backgroundColor: colors.surfaceAlt, top: PAD }]}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onSettle}
        onScrollEndDrag={(e) => {
          // Android may not fire momentum end for a slow drag.
          if (!e.nativeEvent.velocity || e.nativeEvent.velocity.y === 0) onSettle(e);
        }}
      >
        {items.map((item, i) => (
          <View key={String(item.value)} style={styles.item}>
            <Text
              variant={i === selectedIndex ? 'headline' : 'body'}
              color={i === selectedIndex ? 'textPrimary' : 'textSecondary'}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: ITEM * VISIBLE, flex: 1, minWidth: size.minTouch + space.md },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM, borderRadius: radius.chip },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
});
