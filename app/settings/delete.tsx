import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import {
  Card,
  haptics,
  PrimaryButton,
  SecondaryButton,
  Text,
  TextButton,
  TextField,
} from '@/components';
import { format, settingsCopy } from '@/copy';
import { deleteAllData } from '@/features/settings/actions';
import { SettingsScreen } from '@/features/settings/components';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { purchases } from '@/purchases';
import { space, useTheme } from '@/theme';

const d = settingsCopy.del;
const APPLE_SUBSCRIPTIONS = 'https://apps.apple.com/account/subscriptions';

/** Opens subscription management: RevenueCat Customer Center, else Apple's subscriptions page. */
async function manageSubscription(): Promise<void> {
  try {
    const client = purchases();
    if (!client.isMock && Platform.OS === 'ios') {
      await client.manage();
      return;
    }
  } catch {
    // Fall through to Apple's page.
  }
  await Linking.openURL(APPLE_SUBSCRIPTIONS);
}

/**
 * "Delete all my data" (spec §10.6, §14) in three steps: what gets deleted (+ cancel subscription),
 * type DELETE to confirm, then done. Apple doesn't let apps cancel subscriptions, so we link to it.
 */
export default function DeleteData() {
  const router = useRouter();
  const { colors } = useTheme();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const [step, setStep] = useState<'explain' | 'confirm' | 'done'>('explain');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = typed.trim().toUpperCase() === d.word;

  const subscriptionCard = isPro ? (
    <Card
      style={[styles.card, { borderColor: colors.partial, borderWidth: 1 }]}
      testID="delete-sub-card"
    >
      <Text variant="bodyStrong">{d.subTitle}</Text>
      <Text variant="callout" color="textSecondary">
        {step === 'done' ? d.doneSub : d.subBody}
      </Text>
      <SecondaryButton
        label={d.cancelSub}
        onPress={() => void manageSubscription()}
        testID="delete-cancel-sub"
      />
    </Card>
  ) : null;

  if (step === 'done') {
    return (
      <SettingsScreen
        title={d.doneTitle}
        testID="delete-done"
        footer={
          <PrimaryButton
            label={d.done}
            onPress={() => router.replace('/')}
            testID="delete-finish"
          />
        }
      >
        <Text variant="body">{d.doneBody}</Text>
        {subscriptionCard}
      </SettingsScreen>
    );
  }

  if (step === 'confirm') {
    return (
      <SettingsScreen
        title={d.confirmTitle}
        testID="delete-confirm"
        footer={
          <View style={styles.gap}>
            <PrimaryButton
              label={d.confirmBtn}
              disabled={!matches}
              loading={busy}
              onPress={async () => {
                setBusy(true);
                await deleteAllData();
                haptics.success();
                setBusy(false);
                setStep('done');
              }}
              testID="delete-final"
            />
            <TextButton label={d.back} onPress={() => setStep('explain')} />
          </View>
        }
      >
        <Text variant="body">{format(d.confirmBody, { word: d.word })}</Text>
        <TextField
          label={format(d.confirmLabel, { word: d.word })}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          testID="delete-type"
        />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen
      title={d.title}
      testID="delete-explain"
      footer={
        <View style={styles.gap}>
          <SecondaryButton label={d.keep} onPress={() => router.back()} testID="delete-keep" />
          <TextButton label={d.yes} onPress={() => setStep('confirm')} testID="delete-yes" />
        </View>
      }
    >
      <Text variant="bodyStrong">{d.willDelete}</Text>
      {d.items.map((it) => (
        <Text key={it} variant="body">
          • {it}
        </Text>
      ))}
      <Text variant="bodyStrong" color="triggerInk" style={styles.card}>
        {d.cantUndo}
      </Text>
      {subscriptionCard}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: space.lg, gap: space.sm },
  gap: { gap: space.xs },
});
