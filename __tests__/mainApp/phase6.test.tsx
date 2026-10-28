import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabsLayout from '../../app/(tabs)/_layout';
import Today from '../../app/(tabs)/index';
import Results from '../../app/(tabs)/results';
import Share from '../../app/share';
import TestDetail from '../../app/test/[group]';
import { checkinCopy, componentCopy, format, revealCopy } from '@/copy';
import { content } from '@/data/content';
import { addDays } from '@/engines/dates';
import { createProgram } from '@/engines/program';
import { simulateProgram } from '@/engines/simulate';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { DEMO_ANSWERS } from '@/features/debug/actions';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { doctorReportHtml } from '@/features/results/doctorReport';
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
  '(tabs)/plan': () => null,
  '(tabs)/list': () => null,
  '(tabs)/results': Results,
  'test/[group]': TestDetail,
  share: Share,
};

const today = clockNow(0).today;

/** A user whose calm start began 70 days ago, with 70 days of "clear" check-ins logged. */
function seedSolved() {
  const start = addDays(today, -71);
  const p0 = createProgram(content.tests.order, content.tests.tests, {
    profile: 'reflux',
    refluxFirst: false,
    knownFine: [],
    selfReported: [],
    celiac: false,
    age: 32,
    alcoholOptIn: false,
    seed: 'demo',
    today: start,
    gentle: false,
    initialSeverity: 3,
  });
  const sim = simulateProgram(p0, content.tests.tests, addDays(start, 1), 70, 'clear');
  useAppStore.setState({ program: sim.program, checkins: sim.checkins, plans: {} });
  return sim;
}

beforeEach(() => {
  useAppStore.getState().resetAll();
  useOnboardingStore.setState({ answers: DEMO_ANSWERS });
  useSubscriptionStore.getState().setPro(true);
});

describe('check-in', () => {
  it('one tap logs the day and collapses with a streak', async () => {
    const week = buildFirstWeek(DEMO_ANSWERS, addDays(today, -3), 'seed');
    useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
    await renderRouter(routes, { initialUrl: '/?checkin=1', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('checkin-card'));
    await fireEvent.press(
      screen.getByLabelText(format(componentCopy.checkIn.faceA11y, { label: 'Good' })),
    );
    const day = Object.keys(useAppStore.getState().checkins);
    expect(day.length).toBe(1);
    expect(useAppStore.getState().checkins[day[0]!]!.score).toBe(1);
    await fireEvent.press(screen.getByText(checkinCopy.symptomNames.bloating));
    expect(useAppStore.getState().checkins[day[0]!]!.symptoms).toEqual(['bloating']);
    await fireEvent.press(screen.getByTestId('checkin-finish'));
    // Logged today → collapsed card; logged yesterday (before noon) → today's card comes next.
    const loggedToday = day[0] === clockNow(0).today;
    expect(screen.getByTestId(loggedToday ? 'checkin-done' : 'checkin-card')).toBeTruthy();
  });
});

describe('results', () => {
  it('shows the board, the solved report and reveal cards', async () => {
    const sim = seedSolved();
    await renderRouter(routes, { initialUrl: '/results', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('results'));
    expect(screen.getByTestId('solved')).toBeTruthy();
    expect(screen.getByTestId('board-coffee')).toBeTruthy();
    expect(screen.getByTestId('trend-chart')).toBeTruthy();
    expect(useAppStore.getState().celebrated).toContain('case_solved');
    expect(sim.program.completed.length).toBeGreaterThan(5);
  });

  it('reveals a verdict once, then shows it straight away', async () => {
    seedSolved();
    const coffee = useAppStore.getState().program!.completed.find((t) => t.group === 'coffee')!;
    await renderRouter(routes, { initialUrl: '/test/coffee', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('reveal-suspense'));
    await waitFor(() => screen.getByTestId('verdict'), { timeout: 4000 });
    expect(screen.getByText(revealCopy.verdict.trigger)).toBeTruthy();
    expect(useAppStore.getState().revealed).toContain(coffee.id);
    expect(screen.getByTestId('test-chart')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('retest'));
    expect(useAppStore.getState().program!.queue.some((q) => q.group === 'coffee')).toBe(true);
  });

  it('renders the share card with outcomes only', async () => {
    seedSolved();
    await renderRouter(routes, { initialUrl: '/share', wrapper: Wrapper });
    await waitFor(() => screen.getByTestId('share'));
    expect(screen.getByText('Coffee')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('share-image'));
  });

  it('builds the doctor report with every test and the disclaimer', () => {
    const sim = seedSolved();
    const html = doctorReportHtml(sim.program, sim.checkins, today);
    expect(html).toContain('Coffee');
    expect(html).toContain('Likely trigger');
    expect(html).toContain('Placebo');
    expect(html).toContain('It is not medical advice');
    expect(html).not.toMatch(/<script/i);
  });
});
