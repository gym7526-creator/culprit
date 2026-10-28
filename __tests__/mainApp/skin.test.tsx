import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Teen from '../../app/(onboarding)/teen';
import TabsLayout from '../../app/(tabs)/_layout';
import Today from '../../app/(tabs)/index';
import Skin from '../../app/(tabs)/skin';
import SkinStep from '../../app/skin-setup/[step]';
import SkinPreview from '../../app/skin-setup/preview';
import { skinCopy } from '@/copy';
import { emptyAnswers } from '@/engines/onboarding';
import { emptySkinAnswers } from '@/engines/skin';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { DEMO_ANSWERS } from '@/features/debug/actions';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { buildSkinProgram } from '@/features/skin/actions';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { ThemeScope } from '@/theme';

jest.setTimeout(90000);

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
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Today,
  '(tabs)/plan': () => null,
  '(tabs)/list': () => null,
  '(tabs)/results': () => null,
  '(tabs)/skin': Skin,
  'skin-setup/[step]': SkinStep,
  'skin-setup/preview': SkinPreview,
  '(onboarding)/teen': Teen,
  '(paywall)/index': () => null,
};

const year = new Date().getFullYear();
const today = clockNow(0).today;

function seedSkinUser(age: number) {
  useOnboardingStore.setState({
    answers: {
      ...emptyAnswers,
      focus: 'skin',
      birthYear: year - age - 1,
      zip: '60614',
      chainId: 'kroger',
    },
  });
  useSkinStore.setState({
    answers: { ...emptySkinAnswers, concern: 'breakouts', sensitive: false, budget: 30 },
  });
  buildSkinProgram();
}

beforeEach(() => {
  useAppStore.getState().resetAll();
  useSkinStore.getState().reset();
  usePrefsStore.getState().resetPrefs();
  usePrefsStore.getState().setSkinOverride(true);
  useSubscriptionStore.getState().setPro(true);
});

describe('skin mode', () => {
  it('setup asks one question per screen and builds a priced routine', async () => {
    useOnboardingStore.setState({
      answers: {
        ...emptyAnswers,
        focus: 'skin',
        birthYear: year - 30,
        zip: '60614',
        chainId: 'kroger',
      },
    });
    const r = await renderRouter(routes, { initialUrl: '/skin-setup/concern', wrapper: Wrapper });
    await fireEvent.press(screen.getByText(skinCopy.setup.concern.options.breakouts.label));
    await waitFor(() => expect(r.getPathname()).toBe('/skin-setup/areas'), { timeout: 2000 });
    await fireEvent.press(screen.getByText(skinCopy.setup.areas.options.chin_jaw));
    await fireEvent.press(screen.getByTestId('skin-next'));
    await fireEvent.press(screen.getByText(skinCopy.setup.duration.options.months));
    await waitFor(() => expect(r.getPathname()).toBe('/skin-setup/current'), { timeout: 2000 });
    await fireEvent.press(screen.getByTestId('skin-next'));
    await fireEvent.press(screen.getByText(skinCopy.setup.sensitive.no));
    await waitFor(() => expect(r.getPathname()).toBe('/skin-setup/budget'), { timeout: 2000 });
    await fireEvent.press(screen.getByTestId('skin-next'));
    // The ZIP is already known, so the skincare store question comes next.
    expect(r.getPathname()).toBe('/skin-setup/retailer');
    await fireEvent.press(screen.getByText('CVS'));
    await waitFor(() => expect(r.getPathname()).toBe('/skin-setup/check-in'), { timeout: 2000 });
    await fireEvent.press(screen.getByTestId('skin-next'));
    await waitFor(() => screen.getByTestId('skin-preview'));
    expect(screen.getByTestId('skin-monthly')).toBeTruthy();
    expect(useSkinStore.getState().program?.treatmentId).toBe('benzoyl_peroxide_wash');
    expect(useSkinStore.getState().answers.areas).toEqual(['chin_jaw']);
    expect(useSkinStore.getState().answers.retailerId).toBe('cvs');
    expect(screen.getByText(/at CVS \(est\.\)/)).toBeTruthy();
  });

  it('skin-only users land on the Skin tab and check in with one tap', async () => {
    seedSkinUser(30);
    const r = await renderRouter(routes, { initialUrl: '/', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('skin'));
    expect(r.getPathname()).toBe('/skin');
    await fireEvent.press(screen.getByTestId('skin-score-1'));
    expect(useSkinStore.getState().checkins[today]?.score).toBe(1);
    await fireEvent.press(screen.getByLabelText('Gentle foaming cleanser'));
    expect(useSkinStore.getState().done[today]).toContain('am:gentle_cleanser');
    expect(screen.getByTestId('skin-change')).toBeTruthy();
  });

  it('adults can queue a food experiment; teens never see one', async () => {
    seedSkinUser(30);
    await renderRouter(routes, { initialUrl: '/skin', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('skin'));
    await fireEvent.press(screen.getByTestId('start-milk_pause'));
    expect(useSkinStore.getState().program!.changes.map((c) => c.key)).toContain('milk_pause');

    seedSkinUser(16);
    await renderRouter(routes, { initialUrl: '/skin', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('skin-adults-only'));
    expect(screen.queryByTestId('start-milk_pause')).toBeNull();
  });

  it('offers skin mode on the 18+ screen when the flag is on', async () => {
    await renderRouter(routes, { initialUrl: '/teen', wrapper: Wrapper });
    expect(screen.getByTestId('teen-skin')).toBeTruthy();
    usePrefsStore.getState().setSkinOverride(false);
    await renderRouter(routes, { initialUrl: '/teen', wrapper: Wrapper });
    expect(screen.queryByTestId('teen-skin')).toBeNull();
  });

  it('shows stomach users a setup prompt on the Skin tab', async () => {
    useOnboardingStore.setState({ answers: DEMO_ANSWERS });
    const week = buildFirstWeek(DEMO_ANSWERS, today, 'seed');
    useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
    await renderRouter(routes, { initialUrl: '/skin', wrapper: Wrapper });
    expect(screen.getByTestId('skin-empty')).toBeTruthy();
  });
});
