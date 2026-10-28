import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { track } from '@/analytics';
import { useAppStore } from '@/features/appStore';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';

import { routeForNotification, syncNotifications } from './sync';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Keeps local notifications in sync with the stores and routes notification taps. Mount once at the
 * root.
 */
export function useNotifications(): void {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void syncNotifications();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncNotifications(), 500);
    };
    const subs = [
      useAppStore.subscribe(schedule),
      usePrefsStore.subscribe(schedule),
      useOnboardingStore.subscribe(schedule),
      useSubscriptionStore.subscribe(schedule),
    ];
    return () => {
      subs.forEach((u) => u());
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const open = (r: Notifications.NotificationResponse | null) => {
      if (!r) return;
      const type = r.notification.request.content.data?.type;
      track({ name: 'notification_opened', props: { type: String(type ?? 'unknown') } });
      router.push(routeForNotification(type) as never);
    };
    void Notifications.getLastNotificationResponseAsync().then((r) => {
      open(r);
      void Notifications.clearLastNotificationResponseAsync();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);
}
