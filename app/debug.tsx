import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, Screen, SecondaryButton, Text } from '@/components';
import { debugCopy, format } from '@/copy';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { space } from '@/theme';

/** Dev-only debug screen (spec §10.7). Seeding and check-in simulation join in Phase 6. */
export default function Debug() {
  const router = useRouter();
  const { today } = useClock();
  const shift = usePrefsStore((s) => s.shiftDevTime);
  const offset = usePrefsStore((s) => s.devTimeOffsetDays);
  const program = useAppStore((s) => s.program);
  const planCount = useAppStore((s) => Object.keys(s.plans).length);
  const isPro = useSubscriptionStore((s) => s.isPro);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen scroll testID="debug">
      <Text variant="title" accessibilityRole="header">
        {debugCopy.title}
      </Text>
      <Text variant="bodyStrong" testID="debug-today">
        {format(debugCopy.today, { day: today })}
      </Text>
      <View style={styles.row}>
        <SecondaryButton label={debugCopy.back1} onPress={() => shift(-1)} />
        <SecondaryButton label={debugCopy.fwd1} onPress={() => shift(1)} testID="debug-fwd1" />
        <SecondaryButton label={debugCopy.fwd7} onPress={() => shift(7)} />
        {offset !== 0 ? (
          <SecondaryButton label={debugCopy.resetTime} onPress={() => shift(-offset)} />
        ) : null}
      </View>
      <View style={styles.row}>
        <SecondaryButton
          label={debugCopy.togglePro}
          onPress={() => useSubscriptionStore.getState().setPro(!isPro)}
        />
        <SecondaryButton label={debugCopy.forcePaywall} onPress={() => router.push('/(paywall)')} />
        <SecondaryButton
          label={debugCopy.forceOffer}
          onPress={() => router.push('/(paywall)/welcome-offer')}
        />
        <SecondaryButton label={debugCopy.gallery} onPress={() => router.push('/gallery')} />
        <SecondaryButton
          label={debugCopy.resetOnboarding}
          onPress={() => {
            useAppStore.getState().resetAll();
            useOnboardingStore.getState().reset();
            usePrefsStore.getState().resetPrefs();
            useSubscriptionStore.getState().reset();
            router.replace('/');
          }}
        />
      </View>
      <Text variant="bodyStrong">{format(debugCopy.plans, { count: planCount })}</Text>
      <Text variant="bodyStrong">{debugCopy.program}</Text>
      <Card>
        <ScrollView horizontal>
          <Text variant="caption">{JSON.stringify(program, null, 2)}</Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { gap: space.xs, marginVertical: space.sm } });
