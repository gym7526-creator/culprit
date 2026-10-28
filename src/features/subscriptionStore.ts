import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { emptyPaywallMemory, type PaywallMemory } from '@/engines/paywall';

/**
 * Subscription state (not health data). `isPro` is a cache of the RevenueCat entitlement so the app
 * opens instantly offline; it's refreshed from the store on launch and on every change.
 */
export type SubscriptionState = {
  isPro: boolean;
  /** Epoch ms when a free trial started on this device (for the day-2 reminder). */
  trialStartedAt: number | null;
  trialDays: number | null;
  productId: string | null;
  paywall: PaywallMemory;
};

type Actions = {
  setPro: (isPro: boolean) => void;
  startTrial: (at: number, days: number, productId: string) => void;
  setProduct: (productId: string) => void;
  paywallClosed: (at: number) => void;
  welcomeOfferShown: (at: number) => void;
  autoShown: (at: number) => void;
  reset: () => void;
};

const initial: SubscriptionState = {
  isPro: false,
  trialStartedAt: null,
  trialDays: null,
  productId: null,
  paywall: emptyPaywallMemory,
};

export const useSubscriptionStore = create<SubscriptionState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setPro: (isPro) => set({ isPro }),
      startTrial: (trialStartedAt, trialDays, productId) =>
        set({ trialStartedAt, trialDays, productId }),
      setProduct: (productId) => set({ productId }),
      paywallClosed: (at) =>
        set((s) => ({ paywall: { ...s.paywall, firstClosedAt: s.paywall.firstClosedAt ?? at } })),
      welcomeOfferShown: (at) =>
        set((s) => ({ paywall: { ...s.paywall, welcomeOfferShownAt: at, lastAutoShownAt: at } })),
      autoShown: (at) => set((s) => ({ paywall: { ...s.paywall, lastAutoShownAt: at } })),
      reset: () => set(initial),
    }),
    { name: 'culprit-subscription', version: 1, storage: createJSONStorage(() => Storage) },
  ),
);
