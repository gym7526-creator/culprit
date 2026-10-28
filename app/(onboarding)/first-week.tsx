import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  BudgetBar,
  Card,
  Chip,
  DinnerCard,
  EmptyState,
  PrimaryButton,
  Screen,
  Text,
} from '@/components';
import { common, format, formatMoney, onboardingCopy } from '@/copy';
import { recipeMap } from '@/data/content';
import { weekday } from '@/engines/dates';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { usePlanPreview } from '@/features/onboarding/usePlanPreview';
import { usePrefsStore } from '@/features/prefsStore';
import { size, space, useTheme, type GradientKey } from '@/theme';

const c = onboardingCopy.firstWeek;
const names = onboardingCopy.testNames;

function parseImage(key: string): { gradient: GradientKey; emoji: string } {
  const [gradient, emoji] = key.split(':');
  return { gradient: (gradient ?? 'bowls') as GradientKey, emoji: emoji ?? '🍽️' };
}

function formatClock(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
}

/** O21: the pre-paywall magic moment. Built by the real engines, so it's genuinely theirs. */
export default function FirstWeek() {
  const { goNext, goTo } = useOnboardingNav('first-week');
  const { preview, error } = usePlanPreview();
  const { scheme } = useTheme();
  const router = useRouter();
  const completed = usePrefsStore((st) => st.onboardingCompleted);
  // After onboarding, the locked preview leads straight back to the paywall.
  const unlock = () => (completed ? router.push('/(paywall)') : goNext());

  useEffect(() => {
    if (preview) track({ name: 'plan_preview_viewed' });
  }, [preview]);

  if (error) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState
          emoji="🧾"
          title={common.somethingWentWrong}
          ctaLabel={common.retry}
          onCta={() => goTo('building')}
        />
      </Screen>
    );
  }
  if (!preview) {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator accessibilityLabel={common.loading} />
      </Screen>
    );
  }

  const { plan } = preview;
  const dinners = plan.nights.filter((n) => n.status === 'cook' && n.recipeId);

  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={BOTTOM_CTA_SPACE} testID="first-week">
        <Text variant="title" accessibilityRole="header">
          {c.title}
        </Text>

        <Card style={styles.totalCard}>
          <Text variant="display" testID="week-total">
            {format(c.total, { total: formatMoney(plan.total), store: preview.chainName })}
          </Text>
          <BudgetBar total={plan.total} budget={plan.budget} />
          <Text variant="caption" color="textSecondary">
            {c.priceInfo}
          </Text>
        </Card>

        {preview.setAside.length > 0 ? (
          <View style={styles.section}>
            <Text variant="bodyStrong">{c.setAside}</Text>
            <View style={styles.chips}>
              {preview.setAside.map((g) => (
                <Chip
                  key={g}
                  label={names[g]}
                  selected={false}
                  disabled
                  onPress={() => undefined}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text variant="callout" color="textSecondary">
            {c.gentleNote}
          </Text>
        )}

        {preview.firstSuspects.length > 0 ? (
          <View style={styles.section}>
            <Text variant="bodyStrong">{c.suspects}</Text>
            <Text variant="headline" color="brandInk" testID="first-suspects">
              {preview.firstSuspects.map((g) => names[g]).join(' → ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          {dinners.map((n) => {
            const r = recipeMap.get(n.recipeId!)!;
            const img = parseImage(r.imageKey);
            return (
              <View key={n.day} style={styles.dinner}>
                <Text variant="caption" color="textSecondary">
                  {onboardingCopy.cookNights.daysLong[weekday(n.day)]}
                </Text>
                <DinnerCard
                  title={r.title}
                  emoji={img.emoji}
                  gradient={img.gradient}
                  minutes={r.minutes}
                  price={formatMoney(preview.dinnerCost[r.id] ?? 0)}
                  eatBy={n.eatBy ? formatClock(n.eatBy) : undefined}
                  locked
                />
              </View>
            );
          })}
        </View>

        <Card style={styles.section}>
          <Text variant="bodyStrong">{c.listTitle}</Text>
          <Text variant="caption" color="textSecondary">
            {format(c.listItems, { count: preview.listItemCount })}
          </Text>
          <View style={styles.listPreview}>
            {preview.listPreview.map((l) => (
              <Text key={l} variant="callout">
                {l}
              </Text>
            ))}
            <BlurView
              intensity={30}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, styles.blur]}
            >
              <Lock size={size.iconLg} />
            </BlurView>
          </View>
        </Card>
      </Screen>
      <BottomCTA>
        <PrimaryButton label={c.cta} onPress={unlock} testID="unlock-plan" />
      </BottomCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  totalCard: { marginTop: space.lg, gap: space.sm },
  section: { marginTop: space.xl, gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  dinner: { gap: space.xxs },
  listPreview: { gap: space.xxs, overflow: 'hidden', paddingVertical: space.xs },
  blur: { alignItems: 'center', justifyContent: 'center' },
});
