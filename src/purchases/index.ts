import { Platform } from 'react-native';

import { createMockClient } from './mock';
import type { PurchasesClient } from './types';

export * from './types';

/**
 * Picks the store client. RevenueCat keys come from EAS env vars (spec §14):
 * EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY. Without a key, dev builds
 * and previews (EXPO_PUBLIC_PURCHASES_MOCK=1) use the in-memory store; a release build without a
 * key can't sell anything rather than unlocking for free.
 */
function apiKey(): string | undefined {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
        : undefined;
  return key && key.length > 0 ? key : undefined;
}

function unavailableClient(): PurchasesClient {
  return {
    isMock: false,
    configure: async () => undefined,
    getOffering: async () => null,
    purchase: async () => ({ status: 'error', message: 'Store not configured' }),
    restore: async () => false,
    isPro: async () => false,
    onChange: () => () => undefined,
    manage: async () => undefined,
    reset: async () => undefined,
  };
}

let client: PurchasesClient | null = null;

export function purchases(): PurchasesClient {
  if (client) return client;
  const key = apiKey();
  if (key) {
    // Loaded lazily so web, tests and Expo Go never touch the native module without a key.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRevenueCatClient } = require('./revenuecat') as typeof import('./revenuecat');
    client = createRevenueCatClient(key);
  } else if (__DEV__ || process.env.EXPO_PUBLIC_PURCHASES_MOCK === '1') {
    client = createMockClient();
  } else {
    client = unavailableClient();
  }
  return client;
}

/** Tests only. */
export function setPurchasesClient(c: PurchasesClient | null): void {
  client = c;
}
