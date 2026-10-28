import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { Text } from '@/components';
import { format, paywallCopy } from '@/copy';
import { formatPrice, savingsPercent } from '@/engines/paywall';
import { buy, useOffering } from '@/features/purchases/hooks';
import { PaywallFooter } from '@/features/purchases/components/PaywallFooter';
import { PaywallFrame } from '@/features/purchases/components/PaywallFrame';
import { PaywallState } from '@/features/purchases/components/PaywallState';
import { PlanCard } from '@/features/purchases/components/PlanCard';
import { usePaywallClose } from '@/features/purchases/usePaywallClose';
import type { PlanKind, PlanPackage } from '@/purchases';
import { space } from '@/theme';

const c = paywallCopy.p3;

export function fineFor(pkg: PlanPackage): string {
  if (pkg.kind === 'monthly') return format(c.fineMonthly, { price: pkg.priceString });
  return pkg.trialDays
    ? format(c.fineTrial, { days: pkg.trialDays, price: pkg.priceString })
    : format(c.fineAnnual, { price: pkg.priceString });
}

/** P3 plan picker. Annual pre-selected; trial badge only on a plan that really has a trial. */
export default function PaywallPlans() {
  const router = useRouter();
  const { offering, state, retry } = useOffering('default');
  const onClose = usePaywallClose('plans');
  const [kind, setKind] = useState<PlanKind>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (offering) {
      track({ name: 'paywall_viewed', props: { step: 'plans', offering: offering.id } });
    }
  }, [offering]);

  if (state !== 'ready' || !offering)
    return <PaywallState state={state === 'ready' ? 'error' : state} onRetry={retry} />;
  const { annual, monthly } = offering;
  const selected = (kind === 'annual' ? annual : monthly) ?? annual ?? monthly;
  if (!selected) return <PaywallState state="error" onRetry={retry} />;

  const pct = annual && monthly ? savingsPercent(annual.price, monthly.price) : null;
  const annualBadge = annual?.trialDays
    ? pct
      ? format(c.badgeTrial, { days: annual.trialDays, pct })
      : undefined
    : pct
      ? format(c.badgeSave, { pct })
      : undefined;
  const perMonth = annual
    ? (annual.perMonthString ?? formatPrice(annual.price / 12, annual.currencyCode))
    : null;

  const onBuy = async () => {
    setBusy(true);
    const result = await buy(selected);
    setBusy(false);
    if (result === 'purchased') router.replace('/(paywall)/success');
  };

  return (
    <PaywallFrame
      onClose={onClose}
      step={{ current: annual?.trialDays ? 3 : 2, total: annual?.trialDays ? 3 : 2 }}
      cta={{
        label: selected.trialDays ? c.ctaTrial : c.ctaSubscribe,
        onPress: onBuy,
        loading: busy,
        testID: 'buy',
      }}
      below={<PaywallFooter fine={fineFor(selected)} />}
      testID="paywall-p3"
    >
      <Text variant="title" accessibilityRole="header">
        {c.title}
      </Text>
      <View style={styles.cards} accessibilityRole="radiogroup">
        {annual ? (
          <PlanCard
            title={c.annual}
            price={format(c.perYear, { price: annual.priceString })}
            sub={perMonth ? format(c.perMonthUnder, { price: perMonth }) : undefined}
            badge={annualBadge}
            selected={selected === annual}
            onPress={() => setKind('annual')}
            testID="plan-annual"
          />
        ) : null}
        {monthly ? (
          <PlanCard
            title={c.monthly}
            price={format(c.perMonth, { price: monthly.priceString })}
            badge={
              monthly.trialDays
                ? format(c.badgeTrial, { days: monthly.trialDays, pct: 0 })
                : undefined
            }
            selected={selected === monthly}
            onPress={() => setKind('monthly')}
            testID="plan-monthly"
          />
        ) : null}
      </View>
    </PaywallFrame>
  );
}

const styles = StyleSheet.create({ cards: { gap: space.md } });
