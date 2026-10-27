import { FlaskConical } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { componentCopy, format } from '@/copy';
import { radius, size, space, useTheme } from '@/theme';

import { Text } from './Text';
import { TextButton } from './TextButton';

type TestBannerProps = {
  /** e.g. "Tonight's test" */
  title: string;
  /** e.g. "½ clove garlic, added to your stir-fry." */
  detail: string;
  day: number;
  totalDays: number;
  onWhyPress?: () => void;
  testID?: string;
};

/** Amber-bordered test-day banner with a flask icon (spec §7.3, §10.1). */
export function TestBanner({ title, detail, day, totalDays, onWhyPress, testID }: TestBannerProps) {
  const { colors } = useTheme();
  const dayText = format(componentCopy.testBanner.day, { day, total: totalDays });
  return (
    <View
      testID={testID}
      style={[styles.banner, { backgroundColor: colors.partialSoft, borderColor: colors.partial }]}
    >
      <View style={styles.row} accessible accessibilityLabel={`${title}: ${detail} ${dayText}`}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <FlaskConical size={size.iconMd} color={colors.partialInk} />
        </View>
        <View style={styles.text}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="body">{detail}</Text>
          <Text variant="caption" color="partialInk">
            {dayText}
          </Text>
        </View>
      </View>
      {onWhyPress ? (
        <View style={styles.why}>
          <TextButton label={componentCopy.testBanner.whyLink} onPress={onWhyPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: size.bannerBorder,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.xxs,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  icon: {
    width: size.minTouch - space.xs,
    height: size.minTouch - space.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: space.xxs / 2 },
  why: { alignItems: 'flex-start' },
});
