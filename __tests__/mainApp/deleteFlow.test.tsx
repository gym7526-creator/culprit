import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DeleteData from '../../app/settings/delete';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { DEMO_ANSWERS } from '@/features/debug/actions';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { ThemeScope } from '@/theme';

jest.setTimeout(60000);

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

beforeEach(() => {
  useOnboardingStore.setState({ answers: DEMO_ANSWERS });
  const week = buildFirstWeek(DEMO_ANSWERS, clockNow(0).today, 'seed');
  useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
  useSubscriptionStore.getState().setPro(true);
});

describe('delete all data', () => {
  it('needs "Yes", then typing DELETE, and points to cancelling the subscription', async () => {
    await renderRouter(
      { 'settings/delete': DeleteData, index: () => null },
      { initialUrl: '/settings/delete', wrapper: Wrapper },
    );
    expect(screen.getByTestId('delete-cancel-sub')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('delete-yes'));
    await waitFor(() => screen.getByTestId('delete-confirm'));
    expect(screen.getByTestId('delete-final').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await fireEvent.changeText(screen.getByTestId('delete-type'), 'delet');
    expect(useAppStore.getState().program).not.toBeNull();
    await fireEvent.changeText(screen.getByTestId('delete-type'), 'delete');
    await fireEvent.press(screen.getByTestId('delete-final'));
    await waitFor(() => screen.getByTestId('delete-done'));
    expect(useAppStore.getState().program).toBeNull();
    expect(useSubscriptionStore.getState().isPro).toBe(true);
    expect(screen.getByTestId('delete-cancel-sub')).toBeTruthy();
  });

  it('keeping the data deletes nothing', async () => {
    await renderRouter(
      { 'settings/delete': DeleteData, index: () => null },
      { initialUrl: '/settings/delete', wrapper: Wrapper },
    );
    await fireEvent.press(screen.getByTestId('delete-keep'));
    expect(useAppStore.getState().program).not.toBeNull();
  });
});
