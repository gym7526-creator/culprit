import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfettiBurst, haptics } from '@/components';
import { paywallCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';

/** After a successful purchase: success haptic + confetti (spec §9). */
export default function PurchaseSuccess() {
  const router = useRouter();
  useEffect(() => {
    haptics.success();
  }, []);
  return (
    <View style={styles.flex}>
      <InfoScreen
        emoji="🎉"
        title={paywallCopy.success.title}
        body={paywallCopy.success.body}
        testID="purchase-success"
        primary={{
          label: paywallCopy.success.cta,
          onPress: () => router.replace('/(tabs)'),
          testID: 'success-go',
        }}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ConfettiBurst trigger={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
