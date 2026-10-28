import { Linking, StyleSheet, View } from 'react-native';

import { Text, TextButton } from '@/components';
import { common, settingsCopy } from '@/copy';
import { SettingsScreen, SettingsSection } from '@/features/settings/components';
import { space } from '@/theme';

const h = settingsCopy.how;

/** "How Culprit works": method and sources (spec §2, §17; Apple 1.4.1). */
export default function HowItWorks() {
  return (
    <SettingsScreen title={h.title} testID="how-it-works">
      <Text variant="body">{h.intro}</Text>
      {h.steps.map((st) => (
        <View key={st.title} style={styles.step}>
          <Text variant="bodyStrong">{st.title}</Text>
          <Text variant="callout" color="textSecondary">
            {st.body}
          </Text>
        </View>
      ))}
      <Text variant="callout" style={styles.step}>
        {h.limits}
      </Text>
      <SettingsSection title={h.sources}>
        {settingsCopy.sourcesList.map((src) => (
          <TextButton key={src.url} label={src.label} onPress={() => Linking.openURL(src.url)} />
        ))}
      </SettingsSection>
      <Text variant="caption" color="textSecondary" style={styles.step}>
        {common.disclaimer}
      </Text>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({ step: { marginTop: space.lg, gap: space.xxs } });
