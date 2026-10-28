import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function SkinSetupLayout() {
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

export { AppErrorBoundary as ErrorBoundary } from '@/components/AppErrorBoundary';
