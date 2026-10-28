import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  PrimaryButton,
  ProgressBar,
  Screen,
  Text,
} from '@/components';
import { space } from '@/theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  progress: { current: number; total: number } | null;
  onBack?: () => void;
  cta?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    testID?: string;
  };
  /** Extra content under the CTA (e.g. a text link). */
  footer?: ReactNode;
  testID?: string;
}>;

/** Shared onboarding layout: progress bar with back, one question, pinned CTA (spec §7.3, §8). */
export function OnboardingScreen({
  title,
  subtitle,
  progress,
  onBack,
  cta,
  footer,
  children,
  testID,
}: Props) {
  return (
    <View style={styles.flex} testID={testID}>
      <Screen scroll bottomInset={cta ? BOTTOM_CTA_SPACE + (footer ? space.xxxl : 0) : 0}>
        {progress || onBack ? (
          <ProgressBar
            current={progress?.current ?? 0}
            total={progress?.total ?? 1}
            onBack={onBack}
          />
        ) : null}
        <View style={styles.head}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.body}>{children}</View>
      </Screen>
      {cta ? (
        <BottomCTA>
          <PrimaryButton
            label={cta.label}
            onPress={cta.onPress}
            disabled={cta.disabled}
            loading={cta.loading}
            testID={cta.testID ?? 'onboarding-cta'}
          />
          {footer}
        </BottomCTA>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: space.xs, marginTop: space.lg, marginBottom: space.xl },
  body: { gap: space.sm },
});
