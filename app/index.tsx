import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen, Text, TextButton } from '@/components';
import { common, galleryCopy, onboardingCopy } from '@/copy';
import { space } from '@/theme';

/** Entry route. Phase 3 replaces this with the onboarding flow (O0 Welcome). */
export default function Index() {
  const router = useRouter();
  return (
    <Screen contentStyle={styles.center}>
      <View style={styles.copy}>
        <Text variant="display" align="center" accessibilityRole="header">
          {onboardingCopy.welcome.title}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {onboardingCopy.welcome.subtitle}
        </Text>
      </View>
      {__DEV__ ? (
        <TextButton label={galleryCopy.openGallery} onPress={() => router.push('/gallery')} />
      ) : null}
      <Text variant="caption" color="textSecondary" align="center">
        {common.disclaimerShort}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', gap: space.xl },
  copy: { gap: space.sm },
});
