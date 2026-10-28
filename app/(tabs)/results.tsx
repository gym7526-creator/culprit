import { Screen, Text } from '@/components';
import { resultsCopy } from '@/copy';
import { AppHeader } from '@/features/app/AppHeader';

/** Results "case file" (spec §10.5): built in Phase 6. */
export default function Results() {
  return (
    <Screen scroll testID="results">
      <AppHeader title={resultsCopy.title} />
      <Text variant="body" color="textSecondary">
        {resultsCopy.placeholder}
      </Text>
    </Screen>
  );
}
