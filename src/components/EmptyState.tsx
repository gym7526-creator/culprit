import { StyleSheet, View } from 'react-native';

import { radius, size, space, useTheme } from '@/theme';

import { SecondaryButton } from './Button';
import { Text } from './Text';

type EmptyStateProps = {
  /** Illustration placeholder until bundled illustrations exist. */
  emoji: string;
  title: string;
  body?: string;
  ctaLabel: string;
  onCta: () => void;
  testID?: string;
};

/** Illustration + one line + one CTA. Empty states always say what happens next (spec §11). */
export function EmptyState({ emoji, title, body, ctaLabel, onCta, testID }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={styles.wrap}>
      <View style={[styles.art, { backgroundColor: colors.brandSoft }]}>
        <Text style={styles.emoji} accessible={false}>
          {emoji}
        </Text>
      </View>
      <Text variant="headline" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textSecondary" align="center">
          {body}
        </Text>
      ) : null}
      <View style={styles.cta}>
        <SecondaryButton label={ctaLabel} onPress={onCta} />
      </View>
    </View>
  );
}

const ART = size.heroEmoji * 2;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  art: {
    width: ART,
    height: ART,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
  cta: { alignSelf: 'stretch', marginTop: space.xs },
});
