import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabsLayout from '../../app/(tabs)/_layout';
import Today from '../../app/(tabs)/index';
import List from '../../app/(tabs)/list';
import Plan from '../../app/(tabs)/plan';
import Results from '../../app/(tabs)/results';
import HowItWorks from '../../app/settings/how-it-works';
import Settings from '../../app/settings/index';
import NotificationSettings from '../../app/settings/notifications';
import Preferences from '../../app/settings/preferences';
import ProgramSettings from '../../app/settings/program';
import { recentEvents } from '@/analytics';
import { content } from '@/data/content';
import { addDays } from '@/engines/dates';
import { useAppStore } from '@/features/appStore';
import { clockNow } from '@/features/clock';
import { DEMO_ANSWERS } from '@/features/debug/actions';
import { buildFirstWeek } from '@/features/onboarding/buildFirstWeek';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import {
  deleteAllData,
  exportJson,
  restartProgram,
  savePreferences,
  setPaused,
} from '@/features/settings/actions';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { currentSchedule, routeForNotification } from '@/notifications/sync';
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

const today = clockNow(0).today;

beforeEach(() => {
  useAppStore.getState().resetAll();
  usePrefsStore.getState().resetPrefs();
  useOnboardingStore.setState({ answers: DEMO_ANSWERS });
  useSubscriptionStore.getState().setPro(true);
  const week = buildFirstWeek(DEMO_ANSWERS, addDays(today, -1), 'seed');
  useAppStore.setState({ program: week.program, plans: { [week.plan.weekStart]: week.plan } });
});

describe('notifications', () => {
  it('schedules check-ins, the Sunday plan and no health details', () => {
    const { list } = currentSchedule(new Date());
    expect(list.some((n) => n.kind === 'checkin')).toBe(true);
    for (const n of list) {
      expect(n.body).not.toMatch(/score|bloat|diarrh|heartburn/i);
    }
  });

  it('respects the toggles', () => {
    usePrefsStore.getState().setNotify('checkin', false);
    const { list } = currentSchedule(new Date());
    expect(list.some((n) => n.kind === 'checkin' || n.kind === 'checkin_followup')).toBe(false);
  });

  it('sends each milestone once', () => {
    const p = useAppStore.getState().program!;
    useAppStore.setState({ program: { ...p, calmEndedOn: today, phase: 'testing' } });
    expect(currentSchedule().milestones.map((m) => m.key)).toContain('calm_complete');
    useAppStore.getState().markNotified(['calm_complete']);
    expect(currentSchedule().milestones.map((m) => m.key)).not.toContain('calm_complete');
  });

  it('routes taps to the right screen', () => {
    expect(routeForNotification('checkin')).toBe('/?checkin=1');
    expect(routeForNotification('result_ready')).toBe('/results');
    expect(routeForNotification('sunday_plan')).toBe('/plan');
  });
});

describe('settings actions', () => {
  it('saving preferences re-plans from today', () => {
    savePreferences({ household: 4, budget: 150 });
    expect(useOnboardingStore.getState().answers.household).toBe(4);
    const plan = Object.values(useAppStore.getState().plans)[0]!;
    expect(plan.budget).toBe(150);
  });

  it('pauses and resumes the program', () => {
    setPaused(true);
    expect(useAppStore.getState().program!.pauses.some((x) => x.to === null)).toBe(true);
    expect(recentEvents().some((e) => e.name === 'program_paused')).toBe(true);
    setPaused(false);
    expect(useAppStore.getState().program!.pauses.every((x) => x.to !== null)).toBe(true);
  });

  it('restarts with a fresh program', () => {
    useAppStore
      .getState()
      .saveCheckin({ day: today, score: 2, symptoms: [], unusual: [], testFoodTaken: null });
    restartProgram();
    expect(useAppStore.getState().checkins).toEqual({});
    expect(useAppStore.getState().program).not.toBeNull();
  });

  it('exports everything as JSON', () => {
    const data = JSON.parse(exportJson());
    expect(data.answers.household).toBe(DEMO_ANSWERS.household);
    expect(data.program.profile).toBeDefined();
    expect(data.contentVersion).toBe(content.manifest.contentVersion);
  });

  it('delete wipes health data but keeps the Apple subscription', async () => {
    await deleteAllData();
    expect(useAppStore.getState().program).toBeNull();
    expect(useOnboardingStore.getState().answers.symptoms).toEqual([]);
    expect(useSubscriptionStore.getState().isPro).toBe(true);
  });

  it('never sends branch onboarding steps or health data to analytics', () => {
    for (const e of recentEvents()) {
      const json = JSON.stringify(e);
      expect(json).not.toMatch(/red-flag|ed-notice|pregnan|score|bloat|trigger|garlic/i);
    }
  });
});

/** Every interactive element needs a role and an accessible name (spec §16, a11y checklist). */
type JsonNode = {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
};

function a11yProblems(tree: unknown): { problems: string[]; checked: number } {
  let checked = 0;
  const roles = new Set(['button', 'checkbox', 'radio', 'switch', 'link', 'adjustable', 'tab']);
  const problems: string[] = [];
  const textOf = (n: JsonNode | string): string =>
    typeof n === 'string' ? n : (n.children ?? []).map(textOf).join('');
  const walk = (n: JsonNode | string | null) => {
    if (!n || typeof n === 'string') return;
    const role = (n.props.accessibilityRole ?? n.props.role) as string | undefined;
    if (role && roles.has(role)) {
      checked++;
      const name = (n.props.accessibilityLabel ?? n.props['aria-label'] ?? textOf(n)) as string;
      if (!String(name).trim())
        problems.push(`${role} without a label (testID ${String(n.props.testID ?? '?')})`);
    }
    (n.children ?? []).forEach(walk);
  };
  const roots = Array.isArray(tree) ? tree : [tree];
  roots.forEach((r) => walk(r as JsonNode));
  return { problems, checked };
}

const routes = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Today,
  '(tabs)/plan': Plan,
  '(tabs)/list': List,
  '(tabs)/results': Results,
  'settings/index': Settings,
  'settings/preferences': Preferences,
  'settings/notifications': NotificationSettings,
  'settings/program': ProgramSettings,
  'settings/how-it-works': HowItWorks,
};

describe('accessibility sweep', () => {
  it.each([
    ['/', 'today'],
    ['/plan', 'plan'],
    ['/list', 'list'],
    ['/results', 'results'],
    ['/settings', 'settings'],
    ['/settings/preferences', 'preferences'],
    ['/settings/notifications', 'notification-settings'],
    ['/settings/program', 'program-settings'],
    ['/settings/how-it-works', 'how-it-works'],
  ])('%s: every control has a role and a label', async (url, testID) => {
    await renderRouter(routes, { initialUrl: url, wrapper: Wrapper });
    await waitFor(() => screen.getByTestId(testID));
    const { problems, checked } = a11yProblems(screen.toJSON());
    expect(checked).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
