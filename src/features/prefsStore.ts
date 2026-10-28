import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ColorScheme } from '@/theme/tokens';

/**
 * Small, non-health preferences only. Health data (check-ins, results, safety answers) lives in SQLite
 * (src/data), never here.
 */
export type PrefsState = {
  /** null = follow the system. */
  themeOverride: ColorScheme | null;
  /** Last onboarding route reached, for resume-on-relaunch (Phase 3). */
  onboardingStep: string | null;
  onboardingCompleted: boolean;
  /** "HH:mm", 24h. Defaults from the spec: check-in 8:30 pm, bedtime 11:00 pm. */
  checkInTime: string;
  bedtime: string;
  /** Dev-only time travel, in days, applied to the injected `now()` (Phase 2+). */
  devTimeOffsetDays: number;
  /** Random per-install id: seeds plans. Not personal, never tied to an account. */
  installId: string;
  /** Epoch ms of the last App Store rating prompt (max once per 120 days). */
  lastRatingPromptAt: number | null;
  /** Notification toggles (Settings). */
  notify: { checkin: boolean; tests: boolean; plan: boolean; trial: boolean; milestones: boolean };
  /** Settings → "Share anonymous usage data" (never health data either way). */
  analyticsEnabled: boolean;
};

export type PrefsActions = {
  setThemeOverride: (scheme: ColorScheme | null) => void;
  setOnboardingStep: (step: string | null) => void;
  completeOnboarding: () => void;
  setCheckInTime: (time: string) => void;
  setBedtime: (time: string) => void;
  shiftDevTime: (days: number) => void;
  resetPrefs: () => void;
  setRatingPrompted: (at: number) => void;
  setNotify: (key: keyof PrefsState['notify'], on: boolean) => void;
  setAnalyticsEnabled: (on: boolean) => void;
};

function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export const defaultPrefs: PrefsState = {
  themeOverride: null,
  onboardingStep: null,
  onboardingCompleted: false,
  checkInTime: '20:30',
  bedtime: '23:00',
  devTimeOffsetDays: 0,
  installId: '',
  lastRatingPromptAt: null,
  notify: { checkin: true, tests: true, plan: true, trial: true, milestones: true },
  analyticsEnabled: true,
};

export const usePrefsStore = create<PrefsState & PrefsActions>()(
  persist(
    (set) => ({
      ...defaultPrefs,
      installId: randomId(),
      setThemeOverride: (themeOverride) => set({ themeOverride }),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      completeOnboarding: () => set({ onboardingCompleted: true, onboardingStep: null }),
      setCheckInTime: (checkInTime) => set({ checkInTime }),
      setBedtime: (bedtime) => set({ bedtime }),
      shiftDevTime: (days) => set((s) => ({ devTimeOffsetDays: s.devTimeOffsetDays + days })),
      resetPrefs: () => set({ ...defaultPrefs, installId: randomId() }),
      setRatingPrompted: (lastRatingPromptAt) => set({ lastRatingPromptAt }),
      setNotify: (key, on) => set((s) => ({ notify: { ...s.notify, [key]: on } })),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
    }),
    {
      name: 'culprit-prefs',
      version: 1,
      storage: createJSONStorage(() => Storage),
      // New fields keep their defaults when an older saved state is loaded.
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<PrefsState>) }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.installId) state.installId = randomId();
      },
    },
  ),
);
