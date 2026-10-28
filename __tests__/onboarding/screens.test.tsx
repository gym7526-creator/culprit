import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AgeBlocked from '../../app/(onboarding)/age-blocked';
import BirthYear from '../../app/(onboarding)/birth-year';
import Teen from '../../app/(onboarding)/teen';
import Welcome from '../../app/(onboarding)/welcome';
import { onboardingCopy } from '@/copy';
import { emptyAnswers } from '@/engines/onboarding';
import { useOnboardingStore } from '@/features/onboardingStore';
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
  '(onboarding)/welcome': Welcome,
  '(onboarding)/birth-year': BirthYear,
  '(onboarding)/age-blocked': AgeBlocked,
  '(onboarding)/teen': Teen,
  '(onboarding)/focus': () => null,
  '(onboarding)/symptoms': () => null,
};

const year = new Date().getFullYear();

function withBirthYear(birthYear: number) {
  useOnboardingStore.setState({ answers: { ...emptyAnswers, birthYear } });
}

describe('onboarding screens', () => {
  it('renders the welcome screen', async () => {
    await renderRouter(routes, { initialUrl: '/welcome', wrapper: Wrapper });
    expect(screen.getByText(onboardingCopy.welcome.cta)).toBeTruthy();
  });

  it('blocks under-13s', async () => {
    withBirthYear(year - 10);
    const r = await renderRouter(routes, { initialUrl: '/birth-year', wrapper: Wrapper });
    await fireEvent.press(screen.getByText(onboardingCopy.continue));
    expect(r.getPathname()).toBe('/age-blocked');
    expect(screen.getByTestId('age-blocked')).toBeTruthy();
  });

  it('routes 13–17 to the 18+ screen instead of the program', async () => {
    withBirthYear(year - 16);
    const r = await renderRouter(routes, { initialUrl: '/birth-year', wrapper: Wrapper });
    await fireEvent.press(screen.getByText(onboardingCopy.continue));
    expect(r.getPathname()).toBe('/teen');
  });

  it('lets adults continue', async () => {
    withBirthYear(year - 30);
    const r = await renderRouter(routes, { initialUrl: '/birth-year', wrapper: Wrapper });
    await fireEvent.press(screen.getByText(onboardingCopy.continue));
    expect(r.getPathname()).not.toMatch(/teen|age-blocked/);
  });
});
