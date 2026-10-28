import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  BudgetBar,
  Card,
  PrimaryButton,
  Screen,
  Text,
} from '@/components';
import { format, formatMoney, skinCopy } from '@/copy';
import { content } from '@/data/content';
import { useOnboardingStore } from '@/features/onboardingStore';
import { usePrefsStore } from '@/features/prefsStore';
import { currentRoutine } from '@/features/skin/actions';
import { RoutineList } from '@/features/skin/RoutineList';
import { useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { space } from '@/theme';

const c = skinCopy.preview;

/** The skin "magic moment": their own routine, priced at their store, before the paywall. */
export default function SkinPreview() {
  const router = useRouter();
  const program = useSkinStore((s) => s.program);
  const answers = useSkinStore((s) => s.answers);
  const chainId = useOnboardingStore((s) => s.answers.chainId);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const complete = usePrefsStore((s) => s.completeOnboarding);
  // Recomputed when the answers or program change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const routine = useMemo(() => currentRoutine(), [program, answers, chainId]);
  const store = content.chains.chains.find((ch) => ch.id === chainId)?.name ?? '';

  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={BOTTOM_CTA_SPACE} testID="skin-preview">
        <Text variant="title" accessibilityRole="header">
          {c.title}
        </Text>
        <Card style={styles.card}>
          <Text variant="headline" testID="skin-monthly">
            {format(c.monthly, { total: formatMoney(routine.monthly), store })}
          </Text>
          <BudgetBar total={routine.monthly} budget={routine.budget} />
          <Text variant="caption" color="textSecondary">
            {format(c.upfront, { total: formatMoney(routine.upfront) })}
          </Text>
        </Card>
        <Card style={styles.card}>
          <RoutineList title={skinCopy.routine.am} steps={routine.am} prefix="am" />
        </Card>
        <Card style={styles.card}>
          <RoutineList title={skinCopy.routine.pm} steps={routine.pm} prefix="pm" />
        </Card>
        <Text variant="caption" color="textSecondary" style={styles.card}>
          {c.rules}
        </Text>
      </Screen>
      <BottomCTA>
        <PrimaryButton
          label={c.unlock}
          onPress={() => {
            complete();
            router.replace(isPro ? '/(tabs)/skin' : '/(paywall)');
          }}
          testID="skin-unlock"
        />
      </BottomCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: space.lg, gap: space.sm },
});
