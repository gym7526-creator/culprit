import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components';
import { common, paywallCopy } from '@/copy';

/** Loading / error states shared by the paywall steps. */
export function PaywallState({
  state,
  onRetry,
}: {
  state: 'loading' | 'error';
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      {state === 'loading' ? (
        <ActivityIndicator accessibilityLabel={common.loading} />
      ) : (
        <EmptyState
          emoji="📡"
          title={paywallCopy.errors.offering}
          ctaLabel={common.retry}
          onCta={onRetry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
