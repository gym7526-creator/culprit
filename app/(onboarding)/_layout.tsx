import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Onboarding stack: horizontal slide between one-question screens (spec §7.4). */
export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
