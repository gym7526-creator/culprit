import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { Text } from '@/components';
import { format, paywallCopy } from '@/copy';
import { useOffering } from '@/features/purchases/hooks';
import { PaywallFooter } from '@/features/purchases/components/PaywallFooter';
import { PaywallFrame } from '@/features/purchases/components/PaywallFrame';
import { PaywallState } from '@/features/purchases/components/PaywallState';
import { usePaywallClose } from '@/features/purchases/usePaywallClose';
import { radius, size, space, useTheme } from '@/theme';

const c = paywallCopy.p2;

/** P2 honest trial timeline. Day numbers come from the product's real trial length. */
export default function PaywallTimeline() {
  const router = useRouter();
  const { colors } = useTheme();
  const { offering, state, retry } = useOffering('default');
  const onClose = usePaywallClose('timeline');
  const days = offering?.annual?.trialDays ?? 0;

  useEffect(() => {
    if (offering)
      track({ name: 'paywall_viewed', props: { step: 'timeline', offering: offering.id } });
  }, [offering]);

  if (state !== 'ready') return <PaywallState state={state} onRetry={retry} />;
  const vars = { reminderDay: Math.max(1, days - 1), endDay: days };

  return (
    <PaywallFrame
      onClose={onClose}
      step={{ current: 2, total: 3 }}
      cta={{
        label: paywallCopy.continue,
        onPress: () => router.push('/(paywall)/plans'),
        testID: 'p2-continue',
      }}
      below={<PaywallFooter />}
      testID="paywall-p2"
    >
      <Text variant="title" accessibilityRole="header">
        {c.title}
      </Text>
      <View>
        {c.timeline.map((item, i) => (
          <View key={item.text} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: colors.brandSoft }]}>
                <Text style={styles.emoji} accessible={false}>
                  {item.emoji}
                </Text>
              </View>
              {i < c.timeline.length - 1 ? (
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
            <View style={styles.text}>
              <Text variant="bodyStrong">{format(item.when, vars)}</Text>
              <Text variant="callout" color="textSecondary">
                {item.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PaywallFrame>
  );
}

const DOT = size.minTouch;
const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: DOT },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.iconLg, lineHeight: size.iconLg * 1.3 },
  line: { width: 2, flex: 1, minHeight: space.xl },
  text: { flex: 1, paddingBottom: space.xl, gap: space.xxs, paddingTop: space.xs },
});
