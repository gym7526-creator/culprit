import { Redirect, Tabs } from 'expo-router';
import { House } from 'lucide-react-native';

import { tabsCopy } from '@/copy';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';
import { useTheme } from '@/theme';

/** The main app, for subscribers only (entitlement `pro`). Tabs are filled in Phase 5. */
export default function TabsLayout() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { colors } = useTheme();
  if (!isPro) return <Redirect href={onboardingHref('first-week')} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabsCopy.today,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
