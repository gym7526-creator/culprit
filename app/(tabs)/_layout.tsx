import { Redirect, Tabs } from 'expo-router';
import { CalendarDays, Search, ShoppingBasket, Sparkles, Sun } from 'lucide-react-native';
import { useEffect } from 'react';

import { skinCopy, tabsCopy } from '@/copy';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { onboardingHref } from '@/features/onboarding/useOnboardingNav';
import { syncProgramAndPlan } from '@/features/plan/actions';
import { useSkinEnabled, useSkinStore } from '@/features/skin/skinStore';
import { useSubscriptionStore } from '@/features/subscriptionStore';
import { useTheme } from '@/theme';

/** The main app, for subscribers only (entitlement `pro`). Spec §10: Today · Plan · List · Results. */
export default function TabsLayout() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const hasProgram = useAppStore((s) => s.program !== null);
  const hasSkin = useSkinStore((s) => s.program !== null);
  const skinEnabled = useSkinEnabled();
  // Skin-only users see just the Skin tab; stomach users see Skin once the flag is on.
  const stomach = hasProgram ? undefined : null;
  const skinTab = skinEnabled || hasSkin ? undefined : null;
  const { today, hour } = useClock();
  const { colors } = useTheme();

  // Move the program forward and keep a plan for today whenever the date changes.
  useEffect(() => {
    if (isPro && hasProgram) syncProgramAndPlan(today, hour);
  }, [isPro, hasProgram, today, hour]);

  if (!isPro) return <Redirect href={onboardingHref('first-week')} />;
  if (!hasProgram && !hasSkin) return <Redirect href={onboardingHref('welcome')} />;
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
          href: stomach,
          title: tabsCopy.today,
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          href: stomach,
          title: tabsCopy.plan,
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          href: stomach,
          title: tabsCopy.list,
          tabBarIcon: ({ color, size }) => <ShoppingBasket color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: stomach,
          title: tabsCopy.results,
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="skin"
        options={{
          href: skinTab,
          title: skinCopy.tab,
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

export { AppErrorBoundary as ErrorBoundary } from '@/components/AppErrorBoundary';
