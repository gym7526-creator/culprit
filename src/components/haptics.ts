import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Fire-and-forget haptics. No-ops on web; failures are ignored (haptics are never critical). */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function fire(promise: () => Promise<void>): void {
  if (!enabled) return;
  promise().catch(() => undefined);
}

export const haptics = {
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => fire(() => Haptics.selectionAsync()),
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
