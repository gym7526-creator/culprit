import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function RecipeLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
