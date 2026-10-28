import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { Text, TextButton } from '@/components';
import { format, paywallCopy } from '@/copy';
import { buy, useOffering } from '@/features/purchases/hooks';
import { PaywallFooter } from '@/features/purchases/components/PaywallFooter';
import { PaywallFrame } from '@/features/purchases/components/PaywallFrame';
import { PaywallState } from '@/features/purchases/components/PaywallState';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';
import { radius, size, useTheme } from '@/theme';

const c = paywallCopy.welcome;

/** One-time welcome offer, 24 h after the paywall was closed (RevenueCat offering `welcome_offer`). */
export default function WelcomeOffer() {
  const router = useRouter();
  const { colors } = useTheme();
  const { offering, state, retry } = useOffering('welcome_offer');
  const shown = useSubscriptionStore((s) => s.welcomeOfferShown);
  const [busy, setBusy] = useState(false);
  const pkg = offering?.annual ?? null;

  useEffect(() => {
    shown(Date.now());
    track({ name: 'welcome_offer_viewed' });
  }, [shown]);

  const leave = () => router.replace(onboardingHref('first-week'));

  // No offer configured: never show an empty paywall.
  if (state === 'error' || (state === 'ready' && !pkg?.introPriceString)) {
    return <PaywallState state="error" onRetry={leave} />;
  }
  if (state === 'loading' || !pkg) return <PaywallState state="loading" onRetry={retry} />;

  const vars = { intro: pkg.introPriceString ?? '', price: pkg.priceString };
  return (
    <PaywallFrame
      onClose={leave}
      cta={{
        label: c.cta,
        loading: busy,
        testID: 'claim-offer',
        onPress: async () => {
          setBusy(true);
          const r = await buy(pkg);
          setBusy(false);
          if (r === 'purchased') router.replace('/(paywall)/success');
        },
      }}
      below={
        <>
          <PaywallFooter fine={format(c.fine, vars)} />
          <TextButton label={c.noThanks} onPress={leave} />
        </>
      }
      testID="welcome-offer"
    >
      <View style={[styles.art, { backgroundColor: colors.brandSoft }]}>
        <Text style={styles.emoji} accessible={false}>
          🎁
        </Text>
      </View>
      <Text variant="title" align="center" accessibilityRole="header">
        {c.title}
      </Text>
      <Text variant="headline" align="center">
        {format(c.body, vars)}
      </Text>
    </PaywallFrame>
  );
}

const ART = size.heroEmoji * 2;
const styles = StyleSheet.create({
  art: {
    alignSelf: 'center',
    width: ART,
    height: ART,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
});
