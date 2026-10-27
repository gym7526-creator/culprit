import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Ellipsis, FlaskConical, Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { componentCopy, format } from '@/copy';
import { gradients, opacity, radius, size, space, useTheme, type GradientKey } from '@/theme';

import { Text } from './Text';

export type DinnerCardProps = {
  title: string;
  emoji: string;
  gradient: GradientKey;
  minutes: number;
  /** Already formatted, e.g. "$11.40". The component appends "est.". */
  price: string;
  /** Formatted local time, e.g. "8:00 pm". Shown for reflux profiles (spec §6.4 rule 4). */
  eatBy?: string;
  testNight?: boolean;
  /** Pre-paywall preview: title visible, details locked. */
  locked?: boolean;
  size?: 'large' | 'compact';
  onPress?: () => void;
  onMorePress?: () => void;
  moreLabel?: string;
  testID?: string;
};

/** Gradient + emoji dinner card (spec §7.3, MVP image style). */
export function DinnerCard({
  title,
  emoji,
  gradient,
  minutes,
  price,
  eatBy,
  testNight = false,
  locked = false,
  size: cardSize = 'compact',
  onPress,
  onMorePress,
  moreLabel,
  testID,
}: DinnerCardProps) {
  const { colors, scheme, elevated } = useTheme();
  const large = cardSize === 'large';
  const meta = `${format(componentCopy.dinner.minutes, { minutes })} · ${format(componentCopy.dinner.price, { price })}`;
  const a11y = [
    title,
    meta,
    eatBy ? format(componentCopy.dinner.eatBy, { time: eatBy }) : null,
    testNight ? componentCopy.dinner.testNight : null,
    locked ? componentCopy.dinner.locked : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress || locked}
      accessibilityRole={onPress && !locked ? 'button' : undefined}
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.card,
        elevated,
        { backgroundColor: colors.surface },
        pressed ? { opacity: opacity.pressed } : null,
      ]}
    >
      <LinearGradient
        colors={gradients[scheme][gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, large ? styles.heroLarge : null]}
      >
        <Text style={large ? styles.emojiLarge : styles.emoji} accessible={false}>
          {emoji}
        </Text>
        {testNight ? (
          <View style={[styles.badge, styles.badgeLeft, { backgroundColor: colors.partialSoft }]}>
            <FlaskConical size={size.iconSm} color={colors.partialInk} />
            <Text variant="caption" color="partialInk">
              {componentCopy.dinner.testNight}
            </Text>
          </View>
        ) : null}
        {locked ? (
          <View style={[styles.badge, styles.badgeRight, { backgroundColor: colors.surface }]}>
            <Lock size={size.iconSm} color={colors.textPrimary} />
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant={large ? 'headline' : 'bodyStrong'} style={styles.flex} numberOfLines={2}>
            {title}
          </Text>
          {onMorePress && !locked ? (
            <Pressable
              onPress={onMorePress}
              accessibilityRole="button"
              accessibilityLabel={moreLabel ?? title}
              hitSlop={space.xs}
              style={styles.more}
            >
              <Ellipsis size={size.iconMd} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Clock size={size.iconSm} color={colors.textSecondary} />
          <Text variant="callout" color="textSecondary">
            {meta}
          </Text>
        </View>

        {eatBy ? (
          <View style={[styles.eatBy, { backgroundColor: colors.brandSoft }]}>
            <Text variant="caption" color="brandInk">
              {format(componentCopy.dinner.eatBy, { time: eatBy })}
            </Text>
          </View>
        ) : null}

        {locked ? (
          <View style={styles.lockedRow}>
            <BlurView
              intensity={20}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <Text variant="caption" color="textSecondary">
              {componentCopy.dinner.locked}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const HERO = 96;
const HERO_LARGE = 160;

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden' },
  hero: { minHeight: HERO, alignItems: 'center', justifyContent: 'center' },
  heroLarge: { minHeight: HERO_LARGE },
  emoji: { fontSize: size.heroEmoji * 0.75, lineHeight: size.heroEmoji },
  emojiLarge: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
  badge: {
    position: 'absolute',
    top: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
  },
  badgeLeft: { left: space.sm },
  badgeRight: { right: space.sm },
  body: { padding: space.md, gap: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
  flex: { flex: 1 },
  more: { minWidth: size.minTouch, minHeight: size.iconLg, alignItems: 'flex-end' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.xxs + space.xxs / 2 },
  eatBy: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
  },
  lockedRow: { overflow: 'hidden', borderRadius: radius.chip, paddingVertical: space.xxs },
});
