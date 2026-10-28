import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Switch } from 'react-native';

import { Text } from '@/components';
import { common, debugCopy, format, paywallCopy, settingsCopy } from '@/copy';
import { LINKS, SUPPORT_EMAIL } from '@/config';
import { content } from '@/data/content';
import { usePrefsStore } from '@/features/prefsStore';
import { restore } from '@/features/purchases/hooks';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/components';
import { exportData } from '@/features/settings/actions';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { purchases } from '@/purchases';
import { space, useTheme } from '@/theme';

const s = settingsCopy;

/** Settings (spec §10.6). */
export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const isPro = useSubscriptionStore((st) => st.isPro);
  const analytics = usePrefsStore((st) => st.analyticsEnabled);
  const setAnalytics = usePrefsStore((st) => st.setAnalyticsEnabled);

  return (
    <SettingsScreen title={s.title} testID="settings">
      <SettingsSection title={s.sections.you}>
        <SettingsRow
          label={s.rows.preferences}
          onPress={() => router.push('/settings/preferences')}
          testID="row-preferences"
        />
        <SettingsRow
          label={s.rows.notifications}
          onPress={() => router.push('/settings/notifications')}
          testID="row-notifications"
        />
      </SettingsSection>

      <SettingsSection title={s.subscription}>
        <SettingsRow label={isPro ? s.active : s.inactive} />
        <SettingsRow
          label={s.manage}
          onPress={() => purchases().manage()}
          testID="manage-subscription"
        />
        <SettingsRow label={paywallCopy.footer.restore} onPress={() => restore()} />
      </SettingsSection>

      <SettingsSection title={s.sections.program}>
        <SettingsRow
          label={s.rows.program}
          onPress={() => router.push('/settings/program')}
          testID="row-program"
        />
      </SettingsSection>

      <SettingsSection title={s.sections.about}>
        <SettingsRow
          label={s.rows.howItWorks}
          onPress={() => router.push('/settings/how-it-works')}
          testID="row-how"
        />
        <SettingsRow
          label={s.rows.disclaimer}
          onPress={() => router.push('/settings/disclaimer')}
        />
        <SettingsRow label={s.rows.privacy} onPress={() => Linking.openURL(LINKS.privacy)} />
        <SettingsRow label={s.rows.terms} onPress={() => Linking.openURL(LINKS.terms)} />
        <SettingsRow
          label={s.rows.attribution}
          onPress={() => router.push('/settings/attribution')}
        />
        <SettingsRow
          label={s.rows.help}
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(s.help.subject)}`)
          }
        />
      </SettingsSection>

      <SettingsSection title={s.sections.data}>
        <SettingsRow
          label={s.rows.analytics}
          detail={s.rows.analyticsNote}
          right={
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              accessibilityLabel={s.rows.analytics}
              trackColor={{ true: colors.brand, false: colors.border }}
            />
          }
        />
        <SettingsRow label={s.rows.export} onPress={() => void exportData()} testID="row-export" />
        <SettingsRow
          label={s.rows.delete}
          onPress={() => router.push('/settings/delete')}
          destructive
          testID="row-delete"
        />
      </SettingsSection>

      {__DEV__ ? (
        <SettingsSection>
          <SettingsRow label={debugCopy.title} onPress={() => router.push('/debug')} />
        </SettingsSection>
      ) : null}

      <Text variant="caption" color="textSecondary" align="center" style={styles.version}>
        {format(s.version, {
          app: Constants.expoConfig?.version ?? '1.0.0',
          content: content.manifest.contentVersion.slice(0, 8),
        })}
      </Text>
      <Text variant="caption" color="textSecondary" align="center">
        {common.disclaimerShort}
      </Text>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({ version: { marginTop: space.xl } });
