import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, SecondaryButton, Text, TextButton } from '@/components';
import { common, paywallCopy, settingsCopy } from '@/copy';
import { LINKS } from '@/config';
import { restore } from '@/features/purchases/hooks';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { purchases } from '@/purchases';
import { size, space, useTheme } from '@/theme';

/** Settings (subscription section now; the rest lands in Phase 7). */
export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const isPro = useSubscriptionStore((s) => s.isPro);
  return (
    <Screen scroll testID="settings">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={common.back}
        style={styles.back}
      >
        <ChevronLeft size={size.iconLg} color={colors.textPrimary} />
      </Pressable>
      <Text variant="title" accessibilityRole="header">
        {settingsCopy.title}
      </Text>

      <Card style={styles.section}>
        <Text variant="bodyStrong">{settingsCopy.subscription}</Text>
        <Text variant="callout" color="textSecondary">
          {isPro ? settingsCopy.active : settingsCopy.inactive}
        </Text>
        <SecondaryButton
          label={settingsCopy.manage}
          onPress={() => purchases().manage()}
          testID="manage-subscription"
        />
        <TextButton label={paywallCopy.footer.restore} onPress={() => restore()} />
      </Card>

      <Card style={styles.section}>
        <Text variant="caption" color="textSecondary">
          {common.disclaimer}
        </Text>
        <View style={styles.links}>
          <TextButton
            label={paywallCopy.footer.terms}
            onPress={() => Linking.openURL(LINKS.terms)}
          />
          <TextButton
            label={paywallCopy.footer.privacy}
            onPress={() => Linking.openURL(LINKS.privacy)}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: size.minTouch, height: size.minTouch, justifyContent: 'center' },
  section: { marginTop: space.lg, gap: space.sm },
  links: { flexDirection: 'row', gap: space.md },
});
