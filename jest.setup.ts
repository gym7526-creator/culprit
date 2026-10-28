import { setUpTests } from 'react-native-reanimated';

setUpTests();

// expo-sqlite's native module isn't available under Jest: back the kv-store with a Map.
jest.mock('expo-sqlite/kv-store', () => {
  const store = new Map<string, string>();
  const api = {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: async (k: string) => store.delete(k),
    clear: async () => store.clear(),
  };
  return { __esModule: true, default: api };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

// Under Jest, worklets resolves its web build (see the reanimated resolver), but gesture-handler's
// native entry still tries to bind the UI runtime. Use gesture-handler's own web no-op instead.
jest.mock(
  'react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings',
  () => ({ installUIRuntimeBindings: () => undefined }),
);

// Health storage uses synchronous SQLite; back it with a Map under Jest.
jest.mock('@/data/healthStorage', () => {
  const store = new Map<string, string>();
  return {
    healthStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  };
});

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-keep-awake', () => ({ useKeepAwake: () => undefined }));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///report.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-store-review', () => ({
  hasAction: jest.fn(() => Promise.resolve(true)),
  requestReview: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file:///card.png')),
}));
