import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FEATURE_SKIN_DEFAULT } from '@/config';
import { healthStorage } from '@/data/healthStorage';
import type { DayKey } from '@/engines/dates';
import {
  emptySkinAnswers,
  type SkinAnswers,
  type SkinCheckIn,
  type SkinProgram,
} from '@/engines/skin';
import { usePrefsStore } from '@/features/prefsStore';

/** Skin mode state: health-adjacent, so it lives in on-device SQLite like the stomach program. */
export type SkinState = {
  answers: SkinAnswers;
  program: SkinProgram | null;
  checkins: Record<DayKey, SkinCheckIn>;
  /** Routine steps ticked per day, e.g. "am:gentle_cleanser". */
  done: Record<DayKey, string[]>;
  /** Setup step reached, for resume. */
  setupStep: string | null;
};

type Actions = {
  update: (patch: Partial<SkinAnswers>) => void;
  setProgram: (p: SkinProgram | null) => void;
  saveCheckin: (c: SkinCheckIn) => void;
  toggleDone: (day: DayKey, key: string) => void;
  setSetupStep: (step: string | null) => void;
  reset: () => void;
};

const initial: SkinState = {
  answers: emptySkinAnswers,
  program: null,
  checkins: {},
  done: {},
  setupStep: null,
};

export const useSkinStore = create<SkinState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      update: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
      setProgram: (program) => set({ program }),
      saveCheckin: (c) => set((s) => ({ checkins: { ...s.checkins, [c.day]: c } })),
      toggleDone: (day, key) =>
        set((s) => {
          const list = s.done[day] ?? [];
          return {
            done: {
              ...s.done,
              [day]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key],
            },
          };
        }),
      setSetupStep: (setupStep) => set({ setupStep }),
      reset: () => set(initial),
    }),
    {
      name: 'culprit-skin',
      version: 1,
      storage: createJSONStorage(() => healthStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SkinState>;
        return { ...current, ...p, answers: { ...emptySkinAnswers, ...(p.answers ?? {}) } };
      },
    },
  ),
);

/** Whether skin mode is switched on for this build (or by the debug override). */
export function useSkinEnabled(): boolean {
  const override = usePrefsStore((s) => s.skinOverride);
  return override ?? FEATURE_SKIN_DEFAULT;
}

export function skinEnabledNow(): boolean {
  return usePrefsStore.getState().skinOverride ?? FEATURE_SKIN_DEFAULT;
}
