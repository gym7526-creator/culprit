import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from './usePressScale';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  /** Style of the animated surface (the part that squeezes and pops). */
  style?: StyleProp<ViewStyle>;
  /** Style of the outer touch area (layout only). */
  containerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** A Pressable with the shared squeeze-and-pop press animation (see usePressScale). */
export function PressableScale({
  style,
  containerStyle,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const press = usePressScale();
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={containerStyle}
      onPressIn={(e) => {
        if (!disabled) press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, press.animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
