import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { healthStorage } from '@/data/healthStorage';
import { emptyAnswers, type Answers } from '@/engines/onboarding';

type OnboardingState = {
  answers: Answers;
  /** Merge a partial answer. Saved to SQLite immediately (spec §8: answers saved as you go). */
  update: (patch: Partial<Answers>) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      answers: emptyAnswers,
      update: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
      reset: () => set({ answers: emptyAnswers }),
    }),
    {
      name: 'onboarding-answers',
      version: 1,
      storage: createJSONStorage(() => healthStorage),
      // Older saves may lack newer fields.
      merge: (persisted, current) => {
        const answers = {
          ...emptyAnswers,
          ...((persisted as { answers?: Partial<Answers> })?.answers ?? {}),
        };
        // Saves from before "My stores" had a single store: keep it as their one store.
        if (answers.stores.length === 0 && answers.chainId) answers.stores = [answers.chainId];
        return { ...current, answers };
      },
    },
  ),
);
