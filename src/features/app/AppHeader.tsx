import { useRouter } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { tabsCopy } from '@/copy';
import { radius, size, space, useTheme } from '@/theme';

/** Tab screen header: title, optional line above, and the profile button that opens Settings. */
export function AppHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {eyebrow ? (
          <Text variant="caption" color="textSecondary">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel={tabsCopy.profile}
        style={[styles.avatar, { backgroundColor: colors.brandSoft }]}
        testID="open-settings"
      >
        <UserRound size={size.iconMd} color={colors.brandInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  avatar: {
    width: size.minTouch,
    height: size.minTouch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
