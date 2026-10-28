import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

import { periodDays } from '@/engines/paywall';

import { ENTITLEMENT, type Offering, type PlanPackage, type PurchasesClient } from './types';

function hasPro(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

function toPlan(p: PurchasesPackage, kind: PlanPackage['kind']): PlanPackage {
  const s = p.product;
  const intro = s.introPrice;
  const isFreeTrial = intro !== null && intro.price === 0;
  return {
    id: p.identifier,
    productId: s.identifier,
    kind,
    price: s.price,
    priceString: s.priceString,
    currencyCode: s.currencyCode,
    perMonthString: s.pricePerMonthString,
    trialDays: isFreeTrial ? periodDays(intro.period) : null,
    introPriceString: intro !== null && !isFreeTrial ? intro.priceString : null,
  };
}

/** The real store, via RevenueCat. Packages are found by type, so offerings stay editable in RC. */
export function createRevenueCatClient(apiKey: string): PurchasesClient {
  let configured = false;
  const packages = new Map<string, PurchasesPackage>();

  return {
    isMock: false,
    configure: async () => {
      if (configured) return;
      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
      Purchases.configure({ apiKey });
      configured = true;
    },
    getOffering: async (id) => {
      const all = await Purchases.getOfferings();
      const o = id === 'default' ? all.current : (all.all[id] ?? null);
      if (!o) return null;
      const out: Offering = {
        id: o.identifier,
        annual: o.annual ? toPlan(o.annual, 'annual') : null,
        monthly: o.monthly ? toPlan(o.monthly, 'monthly') : null,
      };
      for (const p of [o.annual, o.monthly])
        if (p) packages.set(`${o.identifier}:${p.identifier}`, p);
      return out;
    },
    purchase: async (plan) => {
      const entry = [...packages.entries()].find(
        ([key, p]) => key.endsWith(`:${plan.id}`) && p.product.identifier === plan.productId,
      );
      if (!entry) return { status: 'error', message: 'Package not loaded' };
      try {
        const { customerInfo } = await Purchases.purchasePackage(entry[1]);
        return { status: 'purchased', isPro: hasPro(customerInfo) };
      } catch (e) {
        const err = e as { code?: string; userCancelled?: boolean | null; message?: string };
        if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { status: 'cancelled' };
        }
        return { status: 'error', message: err.message ?? 'Purchase failed' };
      }
    },
    restore: async () => hasPro(await Purchases.restorePurchases()),
    isPro: async () => hasPro(await Purchases.getCustomerInfo()),
    onChange: (listener) => {
      const l = (info: CustomerInfo) => listener(hasPro(info));
      Purchases.addCustomerInfoUpdateListener(l);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(l);
      };
    },
    manage: async () => {
      if (Platform.OS === 'web') return;
      await RevenueCatUI.presentCustomerCenter();
    },
    reset: async () => {
      if (!(await Purchases.isAnonymous())) await Purchases.logOut();
    },
  };
}
