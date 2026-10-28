import { Linking, StyleSheet } from 'react-native';

import { Text, TextButton } from '@/components';
import { settingsCopy } from '@/copy';
import { recipeMap } from '@/data/content';
import { recipePhotos } from '@/data/photos';
import { SettingsScreen, SettingsSection } from '@/features/settings/components';
import { space } from '@/theme';

const a = settingsCopy.attribution;

/** Data attribution: prices, nutrition knowledge, icons, fonts and photo credits. */
export default function Attribution() {
  const photos = Object.entries(recipePhotos);
  return (
    <SettingsScreen title={a.title}>
      {a.items.map((t) => (
        <Text key={t} variant="callout" style={styles.item}>
          {t}
        </Text>
      ))}
      <SettingsSection title={a.photos}>
        {photos.length === 0 ? (
          <Text variant="callout" color="textSecondary">
            {a.photosNone}
          </Text>
        ) : (
          photos.map(([id, p]) => (
            <TextButton
              key={id}
              label={`${recipeMap.get(id)?.title ?? id}: ${p.credit}`}
              onPress={() => Linking.openURL(p.url)}
            />
          ))
        )}
      </SettingsSection>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({ item: { marginTop: space.sm } });
