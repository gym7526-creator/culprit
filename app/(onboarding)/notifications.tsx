import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text, TextButton } from '@/components';
import { onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { radius, space, useTheme } from '@/theme';

const c = onboardingCopy.notifications;

/**
 * Pre-permission screen (spec O17). Shows what the reminder looks like, then calls the real iOS
 * prompt. Never mimics the system dialog. "Not now" asks again after the first plan.
 */
export default function NotificationsStep() {
  const { goNext, goBack, progress } = useOnboardingNav('notifications');
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    setBusy(true);
    try {
      const res = await Notifications.requestPermissionsAsync();
      goNext({ notifications: res.granted ? 'granted' : 'denied' });
    } catch {
      goNext({ notifications: 'denied' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.body}
      progress={progress}
      onBack={goBack}
      cta={{ label: c.cta, onPress: ask, loading: busy, testID: 'notif-allow' }}
      footer={
        <TextButton
          label={c.later}
          onPress={() => goNext({ notifications: 'later' })}
          testID="notif-later"
        />
      }
    >
      <Card style={[styles.preview, { borderRadius: radius.card }]}>
        <View style={styles.previewHead}>
          <View style={[styles.icon, { backgroundColor: colors.brand }]} />
          <Text variant="caption" color="textSecondary" style={styles.flex}>
            {c.previewApp}
          </Text>
          <Text variant="caption" color="textSecondary">
            {c.previewTime}
          </Text>
        </View>
        <Text variant="callout">{c.previewBody}</Text>
      </Card>
    </OnboardingScreen>
  );
}

const ICON = space.lg;
const styles = StyleSheet.create({
  preview: { gap: space.xs, marginTop: space.lg },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  icon: { width: ICON, height: ICON, borderRadius: radius.chip / 3 },
  flex: { flex: 1 },
});
