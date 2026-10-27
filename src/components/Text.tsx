import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { typography, useTheme, type ColorTokens, type TextVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: keyof ColorTokens;
  align?: TextStyle['textAlign'];
};

/** Themed text. Font scaling stays on (Dynamic Type); never pair with fixed heights. */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
