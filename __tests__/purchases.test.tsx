import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PaywallBenefits from '../app/(paywall)/index';
import PaywallPlans, { fineFor } from '../app/(paywall)/plans';
import Success from '../app/(paywall)/success';
import PaywallTimeline from '../app/(paywall)/timeline';
import WelcomeOffer from '../app/(paywall)/welcome-offer';
import TabsLayout from '../app/(tabs)/_layout';
import Today from '../app/(tabs)/index';
import { paywallCopy } from '@/copy';
import { DAY_MS } from '@/engines/paywall';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { trialReminderDate } from '@/notifications/trialReminder';
import { setPurchasesClient } from '@/purchases';
import { createMockClient } from '@/purchases/mock';
import { ThemeScope } from '@/theme';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeScope scheme="light">{children}</ThemeScope>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const routes = {
  '(paywall)/index': PaywallBenefits,
  '(paywall)/timeline': PaywallTimeline,
  '(paywall)/plans': PaywallPlans,
  '(paywall)/success': Success,
  '(paywall)/welcome-offer': WelcomeOffer,
  '(onboarding)/first-week': () => null,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Today,
};

jest.setTimeout(30000);

let mock: ReturnType<typeof createMockClient>;
beforeEach(() => {
  mock = createMockClient({ delayMs: 0 });
  setPurchasesClient(mock);
  useSubscriptionStore.getState().reset();
});

describe('mock store', () => {
  it('unlocks on purchase and restores only after buying', async () => {
    expect(await mock.restore()).toBe(false);
    const o = await mock.getOffering('default');
    await mock.purchase(o!.annual!);
    expect(await mock.isPro()).toBe(true);
    await mock.reset();
    expect(await mock.isPro()).toBe(false);
  });
});

describe('fine print', () => {
  it('states trial length, price and renewal', async () => {
    const o = await mock.getOffering('default');
    expect(fineFor(o!.annual!)).toBe(
      '3 days free, then $39.99/year. Auto-renews until canceled. Cancel anytime in Settings.',
    );
    expect(fineFor(o!.monthly!)).toBe(
      '$9.99/month. Auto-renews until canceled. Cancel anytime in Settings.',
    );
  });
});

describe('trial reminder', () => {
  it('fires 24 h before the trial ends, outside quiet hours', () => {
    const start = new Date(2026, 9, 28, 14, 0).getTime();
    const at = trialReminderDate(start, 3, start)!;
    expect(at.getTime()).toBe(start + 2 * DAY_MS);
    const late = new Date(2026, 9, 28, 23, 30).getTime();
    const moved = trialReminderDate(late, 3, late)!;
    expect(moved.getHours()).toBe(21);
    expect(moved.getDate()).toBe(30);
  });
});

describe('paywall flow', () => {
  it('walks P1 → P2 → P3, buys the pre-selected annual trial and unlocks', async () => {
    const r = await renderRouter(routes, { initialUrl: '/(paywall)', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('paywall-p1'));
    expect(screen.getByTestId('paywall-close')).toBeTruthy();
    expect(screen.getByText(paywallCopy.p1.noPayment)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('p1-continue'));
    await waitFor(() => screen.getByTestId('paywall-p2'));
    expect(screen.getByText('Day 2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('p2-continue'));
    await waitFor(() => screen.getByTestId('paywall-p3'));
    expect(screen.getByText('3 DAYS FREE · SAVE 67%')).toBeTruthy();
    expect(screen.getByText('$39.99/year')).toBeTruthy();
    expect(screen.getByText('$3.33/mo')).toBeTruthy();
    expect(screen.getByText(paywallCopy.p3.ctaTrial)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('buy'));
    await waitFor(() => expect(r.getPathname()).toBe('/success'));
    const s = useSubscriptionStore.getState();
    expect(s.isPro).toBe(true);
    expect(s.trialDays).toBe(3);
    expect(s.trialStartedAt).not.toBeNull();
  });

  it('switches the CTA and fine print for monthly', async () => {
    await renderRouter(routes, { initialUrl: '/(paywall)/plans', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('plan-monthly'));
    await fireEvent.press(screen.getByTestId('plan-monthly'));
    expect(screen.getByText(paywallCopy.p3.ctaSubscribe)).toBeTruthy();
    expect(screen.getByTestId('fine-print').props.children).toContain('$9.99/month');
  });

  it('closing returns to the locked preview and remembers it', async () => {
    const r = await renderRouter(routes, { initialUrl: '/(paywall)', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('paywall-close'));
    await fireEvent.press(screen.getByTestId('paywall-close'));
    expect(r.getPathname()).toBe('/first-week');
    expect(useSubscriptionStore.getState().paywall.firstClosedAt).not.toBeNull();
  });

  it('restore unlocks a previous buyer', async () => {
    const o = await mock.getOffering('default');
    await mock.purchase(o!.monthly!);
    useSubscriptionStore.getState().setPro(false);
    const r = await renderRouter(routes, { initialUrl: '/(paywall)', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('restore'));
    await fireEvent.press(screen.getByTestId('restore'));
    await waitFor(() => expect(r.getPathname()).toBe('/'));
    expect(useSubscriptionStore.getState().isPro).toBe(true);
  });

  it('shows the welcome offer intro price and marks it shown', async () => {
    await renderRouter(routes, { initialUrl: '/(paywall)/welcome-offer', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('welcome-offer'));
    expect(screen.getAllByText(/\$29\.99/).length).toBeGreaterThan(0);
    expect(useSubscriptionStore.getState().paywall.welcomeOfferShownAt).not.toBeNull();
  });
});

describe('entitlement gating', () => {
  it('keeps non-subscribers out of the app', async () => {
    const r = await renderRouter(routes, { initialUrl: '/(tabs)', wrapper: Wrapper });
    expect(r.getPathname()).toBe('/first-week');
  });

  it('lets subscribers in', async () => {
    useSubscriptionStore.getState().setPro(true);
    await renderRouter(routes, { initialUrl: '/(tabs)', wrapper: Wrapper });
    expect(screen.getByTestId('today')).toBeTruthy();
  });
});
