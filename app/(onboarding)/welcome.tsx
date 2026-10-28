import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BottomCTA, PrimaryButton, Screen, Text, TextButton } from '@/components';
import { common, galleryCopy, onboardingCopy } from '@/copy';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { motion, radius, size, space, useTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/theme';

const c = onboardingCopy.welcome;
const CARDS = [
  { emoji: '🥢', gradient: 'asian' as const, rotate: -10, x: -64 },
  { emoji: '🐟', gradient: 'mediterranean' as const, rotate: 0, x: 0 },
  { emoji: '🧄', gradient: 'american' as const, rotate: 10, x: 64 },
];
const CARD_W = size.ring;
const CARD_H = size.ring * 1.3;

/** Hero: three dinner cards fan out, then a "trigger" stamp lands on the garlic (spec O0). */
function Hero() {
  const { scheme, colors } = useTheme();
  const reduce = useReducedMotion();
  const fan = useSharedValue(reduce ? 1 : 0);
  const stamp = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    fan.set(withSpring(1, motion.spring));
    stamp.set(withDelay(motion.slow * 2, withSpring(1, { ...motion.spring, stiffness: 320 })));
  }, [reduce, fan, stamp]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stamp.value,
    transform: [{ scale: 2 - stamp.value }, { rotate: '-12deg' }],
  }));

  return (
    <View style={styles.hero} accessible={false} importantForAccessibility="no-hide-descendants">
      {CARDS.map((card, i) => (
        <FanCard
          key={card.emoji}
          card={card}
          index={i}
          progress={fan}
          colors={gradients[scheme][card.gradient]}
        />
      ))}
      <Animated.View
        style={[
          styles.stamp,
          { borderColor: colors.trigger, left: '50%', marginLeft: 64 - 30 },
          stampStyle,
        ]}
      >
        <Text variant="caption" style={{ color: colors.triggerInk }}>
          {c.stamp}
        </Text>
      </Animated.View>
    </View>
  );
}

function FanCard({
  card,
  index,
  progress,
  colors,
}: {
  card: (typeof CARDS)[number];
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  colors: readonly [string, string];
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: card.x * progress.value },
      { rotate: `${card.rotate * progress.value}deg` },
      { translateY: Math.abs(card.rotate) * 0.8 * progress.value },
    ],
    zIndex: index === 1 ? 2 : 1,
  }));
  return (
    <Animated.View style={[styles.card, style]}>
      <LinearGradient colors={colors} style={styles.cardFill}>
        <Text style={styles.cardEmoji}>{card.emoji}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const { goNext } = useOnboardingNav('welcome');
  return (
    <View style={styles.flex}>
      <Screen contentStyle={styles.content}>
        <Hero />
        <View style={styles.copy}>
          <Text variant="display" align="center" accessibilityRole="header">
            {c.title}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {c.subtitle}
          </Text>
        </View>
      </Screen>
      <BottomCTA>
        <PrimaryButton label={c.cta} onPress={() => goNext()} testID="welcome-start" />
        <TextButton label={c.restore} onPress={() => router.push('/(paywall)')} />
        <Text variant="caption" color="textSecondary" align="center">
          {common.disclaimerShort}
        </Text>
        {__DEV__ ? (
          <TextButton label={galleryCopy.openGallery} onPress={() => router.push('/gallery')} />
        ) : null}
      </BottomCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { justifyContent: 'center', gap: space.xxl, paddingBottom: size.button * 4 },
  hero: { height: CARD_H + space.xxxl, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: CARD_W, height: CARD_H },
  cardFill: { flex: 1, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: size.heroEmoji, lineHeight: size.heroEmoji * 1.3 },
  stamp: {
    position: 'absolute',
    top: space.xl,
    borderWidth: size.selectedBorder,
    borderRadius: radius.chip / 2,
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs / 2,
    zIndex: 3,
  },
  copy: { gap: space.sm },
});
