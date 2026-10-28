import { useRouter } from 'expo-router';

import { tabsCopy } from '@/copy';
import { InfoScreen } from '@/features/onboarding/components/InfoScreen';

/** Today: placeholder until Phase 5. */
export default function Today() {
  const router = useRouter();
  return (
    <InfoScreen
      emoji="🕵️"
      title={tabsCopy.todayPlaceholder.title}
      body={tabsCopy.todayPlaceholder.body}
      testID="today"
      primary={{ label: tabsCopy.settings, onPress: () => router.push('/settings') }}
    />
  );
}
