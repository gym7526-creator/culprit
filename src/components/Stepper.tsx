import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { componentCopy, format } from '@/copy';
import { opacity, radius, size, space, useTheme } from '@/theme';

import { haptics } from './haptics';
import { Text } from './Text';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step?: number;
  testID?: string;
};

/** − value + stepper with 44 pt buttons; exposed to VoiceOver as an adjustable control. */
export function Stepper({ label, value, min, max, onChange, step = 1, testID }: StepperProps) {
  const { colors } = useTheme();
  const canDec = value - step >= min;
  const canInc = value + step <= max;

  const change = (next: number) => {
    if (next < min || next > max) return;
    haptics.selection();
    onChange(next);
  };

  const button = (kind: 'dec' | 'inc') => {
    const enabled = kind === 'dec' ? canDec : canInc;
    const Icon = kind === 'dec' ? Minus : Plus;
    return (
      <Pressable
        testID={testID ? `${testID}-${kind}` : undefined}
        onPress={() => change(kind === 'dec' ? value - step : value + step)}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={format(
          kind === 'dec' ? componentCopy.stepper.decrement : componentCopy.stepper.increment,
          { label },
        )}
        accessibilityState={{ disabled: !enabled }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.brandSoft },
          pressed ? { opacity: opacity.pressed } : null,
          !enabled ? { opacity: opacity.disabled } : null,
        ]}
      >
        <Icon size={size.iconMd} color={colors.brandInk} />
      </Pressable>
    );
  };

  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') change(value + step);
        if (e.nativeEvent.actionName === 'decrement') change(value - step);
      }}
    >
      {button('dec')}
      <Text variant="title" align="center" style={styles.value}>
        {value}
      </Text>
      {button('inc')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, alignSelf: 'center' },
  button: {
    width: size.stepperButton,
    height: size.stepperButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: size.minTouch },
});
