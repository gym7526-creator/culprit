import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Platform, Switch } from 'react-native';

import { PrimaryButton, Text, TimePicker } from '@/components';
import { settingsCopy } from '@/copy';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore, type PrefsState } from '@/features/prefsStore';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/components';
import { useTheme } from '@/theme';

const n = settingsCopy.notif;
const TOGGLES: (keyof PrefsState['notify'])[] = ['checkin', 'tests', 'plan', 'trial', 'milestones'];

/** Notifications: check-in time, per-type toggles, and a way back in if permission is off. */
export default function NotificationSettings() {
  const { colors } = useTheme();
  const checkInTime = useOnboardingStore((s) => s.answers.checkInTime);
  const update = useOnboardingStore((s) => s.update);
  const notify = usePrefsStore((s) => s.notify);
  const setNotify = usePrefsStore((s) => s.setNotify);
  const [granted, setGranted] = useState<boolean | null>(Platform.OS === 'web' ? true : null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void Notifications.getPermissionsAsync().then((p) => setGranted(p.granted));
  }, []);

  return (
    <SettingsScreen title={n.title} testID="notification-settings">
      {granted === false ? (
        <SettingsSection>
          <Text variant="body">{n.off}</Text>
          <PrimaryButton
            label={n.enable}
            onPress={async () => {
              const p = await Notifications.requestPermissionsAsync();
              if (p.granted) setGranted(true);
              else void Linking.openSettings();
            }}
          />
        </SettingsSection>
      ) : null}
      <SettingsSection>
        <TimePicker
          label={n.checkInTime}
          value={checkInTime}
          onChange={(t) => update({ checkInTime: t })}
        />
      </SettingsSection>
      <SettingsSection>
        {TOGGLES.map((k) => (
          <SettingsRow
            key={k}
            label={n[k]}
            right={
              <Switch
                value={notify[k]}
                onValueChange={(v) => setNotify(k, v)}
                accessibilityLabel={n[k]}
                trackColor={{ true: colors.brand, false: colors.border }}
                testID={`notify-${k}`}
              />
            }
          />
        ))}
      </SettingsSection>
      <Text variant="caption" color="textSecondary">
        {n.quiet}
      </Text>
    </SettingsScreen>
  );
}
