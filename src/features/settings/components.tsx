import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOTTOM_CTA_SPACE, BottomCTA, Card, Screen, Text } from '@/components';
import { common } from '@/copy';
import { size, space, useTheme } from '@/theme';

/** Settings sub-screen: back button, title, scroll content, optional pinned footer. */
export function SettingsScreen({
  title,
  footer,
  children,
  testID,
}: PropsWithChildren<{ title: string; footer?: ReactNode; testID?: string }>) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={footer ? BOTTOM_CTA_SPACE : 0} testID={testID}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={common.back}
          style={styles.back}
        >
          <ChevronLeft size={size.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {children}
      </Screen>
      {footer ? <BottomCTA>{footer}</BottomCTA> : null}
    </View>
  );
}

export function SettingsSection({ title, children }: PropsWithChildren<{ title?: string }>) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="caption" color="textSecondary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

export function SettingsRow({
  label,
  detail,
  onPress,
  right,
  destructive = false,
  testID,
}: {
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      style={[styles.row, { borderBottomColor: colors.border }]}
      testID={testID}
    >
      <View style={styles.flex}>
        <Text variant="body" color={destructive ? 'triggerInk' : 'textPrimary'}>
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" color="textSecondary">
            {detail}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={size.iconMd} color={colors.textSecondary} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { width: size.minTouch, height: size.minTouch, justifyContent: 'center' },
  title: { marginBottom: space.sm },
  section: { marginTop: space.lg, gap: space.xs },
  sectionTitle: { marginLeft: space.xs },
  card: { paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.optionCard,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
