import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabsLayout from '../../app/(tabs)/_layout';
import Today from '../../app/(tabs)/index';
import List from '../../app/(tabs)/list';
import Plan from '../../app/(tabs)/plan';
import Results from '../../app/(tabs)/results';
import Cook from '../../app/recipe/[id]/cook';
import Recipe from '../../app/recipe/[id]/index';
import { cookCopy, recipeCopy } from '@/copy';
import { recipeMap } from '@/data/content';
import { emptyAnswers, type Answers } from '@/engines/onboarding';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
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

const routes = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Today,
  '(tabs)/plan': Plan,
  '(tabs)/list': List,
  '(tabs)/results': Results,
  'recipe/[id]/index': Recipe,
  'recipe/[id]/cook': Cook,
  settings: () => null,
};

const answers: Answers = {
  ...emptyAnswers,
  birthYear: 1990,
  symptoms: ['heartburn'],
  mainSymptom: 'heartburn',
  diet: 'none',
  maxMinutes: 30,
  zip: '60614',
  chainId: 'kroger',
  budget: 90,
  consent: true,
};

let firstRecipeId = '';
beforeEach(() => {
  const today = clockNow(0).today;
  useAppStore.getState().resetAll();
  useOnboardingStore.setState({ answers });
  useSubscriptionStore.getState().setPro(true);
  const week = buildFirstWeek(answers, today, 'seed');
  useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
  firstRecipeId = week.plan.nights.find((n) => n.recipeId)!.recipeId!;
});

describe('main app screens', () => {
  it('Today shows the phase pill and the next dinner', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('today'));
    expect(screen.getByTestId('phase-pill')).toBeTruthy();
    expect(screen.getByTestId('tonight-card')).toBeTruthy();
    expect(screen.getByTestId('edu-card')).toBeTruthy();
  });

  it('Plan lists the week with a total and opens the swap sheet', async () => {
    await renderRouter(routes, { initialUrl: '/plan', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('plan'));
    expect(screen.getByTestId('plan-total')).toBeTruthy();
    const more = screen.getAllByLabelText('Change this dinner')[0]!;
    await fireEvent.press(more);
    await waitFor(() => screen.getByText('Swap for'));
  });

  it('List shows aisles, a total and checks items off', async () => {
    await renderRouter(routes, { initialUrl: '/list', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('list'));
    expect(screen.getByTestId('list-total')).toBeTruthy();
  });

  it('Recipe scales servings and opens cooking mode', async () => {
    const r = await renderRouter(routes, {
      initialUrl: `/recipe/${firstRecipeId}`,
      wrapper: Wrapper,
    });
    await waitFor(() => screen.getByTestId('recipe'));
    expect(screen.getByText(recipeMap.get(firstRecipeId)!.title)).toBeTruthy();
    expect(screen.getByText(recipeCopy.ingredients)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cook'));
    await waitFor(() => expect(r.getPathname()).toBe(`/recipe/${firstRecipeId}/cook`));
  });

  it('Cooking mode steps through to the end', async () => {
    const steps = recipeMap.get(firstRecipeId)!.steps.length;
    await renderRouter(routes, { initialUrl: `/recipe/${firstRecipeId}/cook`, wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('cooking'));
    for (let i = 0; i < steps; i++) await fireEvent.press(screen.getByTestId('cook-next'));
    expect(screen.getByText(cookCopy.done)).toBeTruthy();
    expect(screen.getByTestId('cook-finish')).toBeTruthy();
  });
});
