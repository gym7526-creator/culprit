import { useCallback, useEffect, useState } from 'react';

import { track } from '@/analytics';
import { notificationCopy, paywallCopy } from '@/copy';
import { scheduleTrialReminder } from '@/notifications/trialReminder';
import { purchases, type Offering, type OfferingId, type PlanPackage } from '@/purchases';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { useUiStore } from '@/features/uiStore';

/** Configures the store once and keeps the cached entitlement in sync. Mount at the root. */
export function usePurchasesBootstrap(): void {
  const setPro = useSubscriptionStore((s) => s.setPro);
  useEffect(() => {
    const client = purchases();
    let unsubscribe: () => void = () => undefined;
    (async () => {
      try {
        await client.configure();
        unsubscribe = client.onChange(setPro);
        setPro(await client.isPro());
      } catch {
        // Offline: keep the cached entitlement.
      }
    })();
    return () => unsubscribe();
  }, [setPro]);
}

export function useOffering(id: OfferingId) {
  const [offering, setOffering] = useState<Offering | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const o = await purchases().getOffering(id);
        if (!alive) return;
        setOffering(o);
        setState(o && (o.annual || o.monthly) ? 'ready' : 'error');
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, attempt]);

  const retry = useCallback(() => {
    setState('loading');
    setAttempt((a) => a + 1);
  }, []);

  return { offering, state, retry };
}

/** Buys a package; records the trial start and schedules the reminder. */
export async function buy(pkg: PlanPackage): Promise<'purchased' | 'cancelled' | 'error'> {
  const result = await purchases().purchase(pkg);
  const store = useSubscriptionStore.getState();
  if (result.status === 'purchased') {
    store.setPro(result.isPro);
    store.setProduct(pkg.productId);
    if (pkg.trialDays) {
      const now = Date.now();
      store.startTrial(now, pkg.trialDays, pkg.productId);
      track({ name: 'trial_started', props: { product: pkg.productId } });
      await scheduleTrialReminder(now, pkg.trialDays, notificationCopy.trialEnding);
    } else {
      track({ name: 'purchase_completed', props: { product: pkg.productId } });
    }
    return result.isPro ? 'purchased' : 'error';
  }
  if (result.status === 'error') useUiStore.getState().showToast(paywallCopy.errors.purchase);
  return result.status;
}

/** Restores purchases and toasts the outcome. Returns whether the user is now pro. */
export async function restore(): Promise<boolean> {
  const { showToast } = useUiStore.getState();
  try {
    const pro = await purchases().restore();
    useSubscriptionStore.getState().setPro(pro);
    if (pro) {
      track({ name: 'purchase_restored' });
      showToast(paywallCopy.restore.found, 'good');
    } else {
      showToast(paywallCopy.restore.none);
    }
    return pro;
  } catch {
    showToast(paywallCopy.restore.failed);
    return false;
  }
}
