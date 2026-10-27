import { create } from 'zustand';

export type ToastTone = 'neutral' | 'good' | 'trigger';

export type ToastMessage = { id: number; text: string; tone: ToastTone };

type UiState = {
  toast: ToastMessage | null;
  showToast: (text: string, tone?: ToastTone) => void;
  hideToast: () => void;
};

let nextToastId = 1;

/** Ephemeral UI state (never persisted). */
export const useUiStore = create<UiState>()((set) => ({
  toast: null,
  showToast: (text, tone = 'neutral') => set({ toast: { id: nextToastId++, text, tone } }),
  hideToast: () => set({ toast: null }),
}));
