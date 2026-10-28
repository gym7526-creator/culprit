import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomCTA, PrimaryButton, Screen, SecondaryButton, Text } from '@/components';
import { radius, size, space, useTheme } from '@/theme';

type Props = PropsWithChildren<{
  emoji: string;
  title: string;
  body: string;
  primary?: { label: string; onPress: () => void; testID?: string };
  secondary?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
}>;

/** Centered message screen for notices, the empathy beat and blocked paths. */
export function InfoScreen({ emoji, title, body, primary, secondary, children, testID }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.flex} testID={testID}>
      <Screen
        scroll
        contentStyle={styles.center}
        bottomInset={primary ? size.button * (secondary ? 2.4 : 1.4) : 0}
      >
        <View style={[styles.art, { backgroundColor: colors.brandSoft }]}>
          <Text style={styles.emoji} accessible={false}>
            {emoji}
          </Text>
        </View>
        <Text variant="title" align="center" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {body}
        </Text>
        {children}
      </Screen>
      {primary ? (
        <BottomCTA>
          <PrimaryButton
            label={primary.label}
            onPress={primary.onPress}
            testID={primary.testID ?? 'info-primary'}
          />
          {secondary ? (
            <SecondaryButton
              label={secondary.label}
              onPress={secondary.onPress}
              testID={secondary.testID ?? 'info-secondary'}
            />
          ) : null}
        </BottomCTA>
      ) : null}
    </View>
  );
}

const ART = size.heroEmoji * 2;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: space.md },
  art: {
    width: ART,
    height: ART,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
});
