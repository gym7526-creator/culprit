import Storage from 'expo-sqlite/kv-store';

import { defaultPrefs, usePrefsStore } from '@/features/prefsStore';

describe('prefs store', () => {
  beforeEach(() => usePrefsStore.getState().resetPrefs());

  it('starts with the spec defaults (check-in 8:30 pm, bedtime 11:00 pm)', () => {
    const s = usePrefsStore.getState();
    expect(s.checkInTime).toBe('20:30');
    expect(s.bedtime).toBe('23:00');
    expect(s.themeOverride).toBeNull();
  });

  it('updates and persists to the kv-store', async () => {
    usePrefsStore.getState().setThemeOverride('dark');
    usePrefsStore.getState().setOnboardingStep('o3-symptoms');
    const raw = await Storage.getItem('culprit-prefs');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw ?? '{}') as { state: Record<string, unknown> };
    expect(saved.state.themeOverride).toBe('dark');
    expect(saved.state.onboardingStep).toBe('o3-symptoms');
  });

  it('completing onboarding clears the resume step', () => {
    usePrefsStore.getState().setOnboardingStep('o10-diet');
    usePrefsStore.getState().completeOnboarding();
    expect(usePrefsStore.getState()).toMatchObject({
      onboardingCompleted: true,
      onboardingStep: null,
    });
  });

  it('time travel accumulates and resets', () => {
    usePrefsStore.getState().shiftDevTime(3);
    usePrefsStore.getState().shiftDevTime(-1);
    expect(usePrefsStore.getState().devTimeOffsetDays).toBe(2);
    usePrefsStore.getState().resetPrefs();
    expect(usePrefsStore.getState().devTimeOffsetDays).toBe(defaultPrefs.devTimeOffsetDays);
  });
});
