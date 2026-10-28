import type { Offering, PlanPackage, PurchasesClient } from './types';
import { PRODUCTS } from './types';

/**
 * In-memory store for development, web previews and tests, used when no RevenueCat key is set.
 * Its sample prices mirror the planned App Store products (spec §9) and are never shown in a
 * release build: release builds require a key.
 */
function pkg(p: Omit<PlanPackage, 'currencyCode'>): PlanPackage {
  return { ...p, currencyCode: 'USD' };
}

const annual = pkg({
  id: '$rc_annual',
  productId: PRODUCTS.annual,
  kind: 'annual',
  price: 39.99,
  priceString: '$39.99',
  perMonthString: '$3.33',
  trialDays: 3,
  introPriceString: null,
});
const monthly = pkg({
  id: '$rc_monthly',
  productId: PRODUCTS.monthly,
  kind: 'monthly',
  price: 9.99,
  priceString: '$9.99',
  perMonthString: '$9.99',
  trialDays: null,
  introPriceString: null,
});

const OFFERINGS: Record<string, Offering> = {
  default: { id: 'default', annual, monthly },
  welcome_offer: {
    id: 'welcome_offer',
    annual: { ...annual, trialDays: null, introPriceString: '$29.99' },
    monthly: null,
  },
};

export function createMockClient(options: { delayMs?: number } = {}): PurchasesClient & {
  setPro(v: boolean): void;
} {
  let pro = false;
  let purchased = false;
  const listeners = new Set<(v: boolean) => void>();
  const delay = options.delayMs ?? 400;
  const wait = () => (delay > 0 ? new Promise((r) => setTimeout(r, delay)) : Promise.resolve());
  const set = (v: boolean) => {
    pro = v;
    listeners.forEach((l) => l(v));
  };
  return {
    isMock: true,
    configure: async () => undefined,
    getOffering: async (id) => OFFERINGS[id] ?? null,
    purchase: async () => {
      await wait();
      purchased = true;
      set(true);
      return { status: 'purchased', isPro: true };
    },
    restore: async () => {
      await wait();
      set(purchased);
      return purchased;
    },
    isPro: async () => pro,
    onChange: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    manage: async () => undefined,
    reset: async () => {
      purchased = false;
      set(false);
    },
    setPro: set,
  };
}
