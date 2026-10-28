import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, size, space, typography, useTheme } from '@/theme';

import { Text } from './Text';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  large?: boolean;
};

/** Themed text input with a label and inline error. 44 pt minimum height; grows with Dynamic Type. */
export function TextField({ label, error, large = false, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="callout" color="textSecondary">
        {label}
      </Text>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        style={[
          large ? typography.title : typography.body,
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: error ? colors.trigger : colors.border,
          },
        ]}
      />
      {error ? (
        <Text variant="caption" color="triggerInk" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  input: {
    minHeight: size.button,
    borderRadius: radius.chip,
    borderWidth: size.hairline,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
