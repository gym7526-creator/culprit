import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Text, TextButton } from '@/components';
import { paywallCopy } from '@/copy';
import { LINKS } from '@/config';
import { restore } from '@/features/purchases/hooks';
import { space } from '@/theme';

/** Fine print + Restore Purchases · Terms · Privacy (spec §9). */
export function PaywallFooter({ fine }: { fine?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    const pro = await restore();
    setBusy(false);
    if (pro) router.replace('/(tabs)');
  };
  return (
    <View style={styles.wrap}>
      {fine ? (
        <Text variant="caption" color="textSecondary" align="center" testID="fine-print">
          {fine}
        </Text>
      ) : null}
      <View style={styles.links}>
        <TextButton label={paywallCopy.footer.restore} onPress={onRestore} testID="restore" />
        <TextButton label={paywallCopy.footer.terms} onPress={() => Linking.openURL(LINKS.terms)} />
        <TextButton
          label={paywallCopy.footer.privacy}
          onPress={() => Linking.openURL(LINKS.privacy)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xxs },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.xs },
});
