import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { healthStorage } from '@/data/healthStorage';
import type { DayKey } from '@/engines/dates';
import type { CustomItem } from '@/engines/grocery';
import type { WeekPlan } from '@/engines/plan';
import type { ProgramState } from '@/engines/program';
import type { CheckIn } from '@/engines/types';

/**
 * The program and plans: health-related, so persisted in on-device SQLite (`health_kv`), never in
 * prefs or analytics. Check-ins land here in Phase 6.
 */
export type AppState = {
  program: ProgramState | null;
  /** Keyed by weekStart. */
  plans: Record<DayKey, WeekPlan>;
  /** Thumbs up / down per recipe (plan scoring). */
  feedback: Record<string, 1 | -1>;
  /** Grocery line ids (ingredient ids or custom ids) checked off, per plan. */
  checked: Record<DayKey, string[]>;
  custom: Record<DayKey, CustomItem[]>;
  /** "Done shopping" pressed: checked lines collapse. */
  doneShopping: Record<DayKey, boolean>;
  /** Pantry staples the user tapped to say "I don't have this". */
  pantryMissing: string[];
  shuffles: Record<DayKey, number>;
  twoWeek: boolean;
  /** Education card ids dismissed. */
  dismissedCards: string[];
  checkins: Record<DayKey, CheckIn>;
  /** Completed test ids whose verdict has been revealed. */
  revealed: string[];
  /** One-time moments already celebrated ('calm_complete', 'case_solved'). */
  celebrated: string[];
  /** Milestone notifications already sent (so a reschedule never repeats them). */
  notified: string[];
};

type Actions = {
  setProgram: (p: ProgramState) => void;
  savePlan: (p: WeekPlan) => void;
  replacePlan: (oldStart: DayKey, p: WeekPlan) => void;
  setFeedback: (recipeId: string, v: 1 | -1 | null) => void;
  toggleChecked: (weekStart: DayKey, id: string) => void;
  addCustom: (weekStart: DayKey, item: CustomItem) => void;
  removeCustom: (weekStart: DayKey, id: string) => void;
  setDoneShopping: (weekStart: DayKey, v: boolean) => void;
  togglePantry: (ingredientId: string) => void;
  bumpShuffle: (weekStart: DayKey) => number;
  setTwoWeek: (v: boolean) => void;
  dismissCard: (id: string) => void;
  saveCheckin: (c: CheckIn) => void;
  markRevealed: (testId: string) => void;
  markCelebrated: (key: string) => void;
  markNotified: (keys: string[]) => void;
  resetAll: () => void;
};

const initial: AppState = {
  program: null,
  plans: {},
  feedback: {},
  checked: {},
  custom: {},
  doneShopping: {},
  pantryMissing: [],
  shuffles: {},
  twoWeek: false,
  dismissedCards: [],
  checkins: {},
  revealed: [],
  celebrated: [],
  notified: [],
};

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const useAppStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setProgram: (program) => set({ program }),
      savePlan: (p) => set((s) => ({ plans: { ...s.plans, [p.weekStart]: p } })),
      replacePlan: (oldStart, p) =>
        set((s) => {
          const plans = { ...s.plans };
          delete plans[oldStart];
          plans[p.weekStart] = p;
          return { plans };
        }),
      setFeedback: (recipeId, v) =>
        set((s) => {
          const feedback = { ...s.feedback };
          if (v === null) delete feedback[recipeId];
          else feedback[recipeId] = v;
          return { feedback };
        }),
      toggleChecked: (w, id) =>
        set((s) => ({ checked: { ...s.checked, [w]: toggle(s.checked[w] ?? [], id) } })),
      addCustom: (w, item) =>
        set((s) => ({ custom: { ...s.custom, [w]: [...(s.custom[w] ?? []), item] } })),
      removeCustom: (w, id) =>
        set((s) => ({
          custom: { ...s.custom, [w]: (s.custom[w] ?? []).filter((c) => c.id !== id) },
        })),
      setDoneShopping: (w, v) => set((s) => ({ doneShopping: { ...s.doneShopping, [w]: v } })),
      togglePantry: (id) => set((s) => ({ pantryMissing: toggle(s.pantryMissing, id) })),
      bumpShuffle: (w) => {
        const n = (get().shuffles[w] ?? 0) + 1;
        set((s) => ({ shuffles: { ...s.shuffles, [w]: n } }));
        return n;
      },
      setTwoWeek: (twoWeek) => set({ twoWeek }),
      dismissCard: (id) => set((s) => ({ dismissedCards: [...s.dismissedCards, id] })),
      saveCheckin: (c) => set((s) => ({ checkins: { ...s.checkins, [c.day]: c } })),
      markRevealed: (id) =>
        set((s) => (s.revealed.includes(id) ? s : { revealed: [...s.revealed, id] })),
      markCelebrated: (key) =>
        set((s) => (s.celebrated.includes(key) ? s : { celebrated: [...s.celebrated, key] })),
      markNotified: (keys) => set((s) => ({ notified: [...new Set([...s.notified, ...keys])] })),
      resetAll: () => set(initial),
    }),
    {
      name: 'culprit-app',
      version: 1,
      storage: createJSONStorage(() => healthStorage),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<AppState>) }),
    },
  ),
);
