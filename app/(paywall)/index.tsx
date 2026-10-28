import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { Text } from '@/components';
import { paywallCopy } from '@/copy';
import { useOffering } from '@/features/purchases/hooks';
import { PaywallFooter } from '@/features/purchases/components/PaywallFooter';
import { PaywallFrame } from '@/features/purchases/components/PaywallFrame';
import { PaywallState } from '@/features/purchases/components/PaywallState';
import { usePaywallClose } from '@/features/purchases/usePaywallClose';
import { size, space, useTheme } from '@/theme';

const c = paywallCopy.p1;

/** P1 "Try Culprit free." */
export default function PaywallBenefits() {
  const router = useRouter();
  const { colors } = useTheme();
  const { offering, state, retry } = useOffering('default');
  const onClose = usePaywallClose('benefits');
  const hasTrial = Boolean(offering?.annual?.trialDays);

  useEffect(() => {
    if (offering)
      track({ name: 'paywall_viewed', props: { step: 'benefits', offering: offering.id } });
  }, [offering]);

  if (state !== 'ready') return <PaywallState state={state} onRetry={retry} />;

  return (
    <PaywallFrame
      onClose={onClose}
      step={{ current: 1, total: hasTrial ? 3 : 2 }}
      cta={{
        label: paywallCopy.continue,
        onPress: () => router.push(hasTrial ? '/(paywall)/timeline' : '/(paywall)/plans'),
        testID: 'p1-continue',
      }}
      below={<PaywallFooter />}
      testID="paywall-p1"
    >
      <Text variant="display" accessibilityRole="header">
        {hasTrial ? c.title : paywallCopy.p3.title}
      </Text>
      <View style={styles.list}>
        {c.benefits.map((b) => (
          <View key={b} style={styles.row}>
            <CircleCheck size={size.iconLg + space.xxs} color={colors.good} />
            <Text variant="bodyStrong" style={styles.flex}>
              {b}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="callout" color="textSecondary">
        {hasTrial ? c.noPayment : c.noPaymentNoTrial}
      </Text>
    </PaywallFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
});
