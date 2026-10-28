import { Text } from '@/components';
import { common, settingsCopy } from '@/copy';
import { SettingsScreen } from '@/features/settings/components';

export default function Disclaimer() {
  return (
    <SettingsScreen title={settingsCopy.rows.disclaimer}>
      <Text variant="body">{common.disclaimer}</Text>
    </SettingsScreen>
  );
}
