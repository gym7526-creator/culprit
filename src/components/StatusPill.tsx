import { StyleSheet, View } from 'react-native';

import { componentCopy } from '@/copy';
import { radius, size, space, useTheme, type ColorTokens } from '@/theme';

import { Text } from './Text';

export type PillStatus =
  'untested' | 'testing' | 'trigger' | 'partial' | 'cleared' | 'unclear' | 'selfReported';

type PillColors = { fill: keyof ColorTokens; dot: keyof ColorTokens; text: keyof ColorTokens };

const pillColors: Record<PillStatus, PillColors> = {
  untested: { fill: 'surfaceAlt', dot: 'unclear', text: 'textSecondary' },
  testing: { fill: 'partialSoft', dot: 'partial', text: 'partialInk' },
  trigger: { fill: 'triggerSoft', dot: 'trigger', text: 'triggerInk' },
  partial: { fill: 'partialSoft', dot: 'partial', text: 'partialInk' },
  cleared: { fill: 'goodSoft', dot: 'good', text: 'goodInk' },
  unclear: { fill: 'unclearSoft', dot: 'unclear', text: 'unclearInk' },
  selfReported: { fill: 'brandSoft', dot: 'brand', text: 'brandInk' },
};

type StatusPillProps = { status: PillStatus; label?: string; testID?: string };

/**
 * Status pill (spec §7.3, §10.5). Self-reported results get a dashed outline so they read
 * differently from tested results.
 */
export function StatusPill({ status, label, testID }: StatusPillProps) {
  const { colors } = useTheme();
  const c = pillColors[status];
  const text = label ?? componentCopy.status[status];
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={text}
      style={[
        styles.pill,
        { backgroundColor: colors[c.fill] },
        status === 'selfReported'
          ? { borderWidth: size.hairline, borderStyle: 'dashed', borderColor: colors.brand }
          : null,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors[c.dot] }]} />
      <Text variant="caption" color={c.text}>
        {text}
      </Text>
    </View>
  );
}

const DOT = space.xs;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xxs + space.xxs / 2,
    paddingHorizontal: space.xs + space.xxs / 2,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
  },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
});
