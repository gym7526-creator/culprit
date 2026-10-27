import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { motion, radius, size, useTheme } from '@/theme';

type ConfettiBurstProps = {
  /** Increment to fire a burst. 0 = idle. */
  trigger: number;
  pieces?: number;
};

type Piece = { angle: number; distance: number; spin: number; colorIndex: number; square: boolean };

const SPREAD = 140;
const FALL = 60;
const GLOW = 160;

/** Deterministic pseudo-random so the burst looks the same every time (and in tests). */
function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i * 137.508) % 360; // golden angle spread
    return {
      angle: (t * Math.PI) / 180,
      distance: SPREAD * (0.55 + ((i * 7) % 10) / 22),
      spin: (i % 2 === 0 ? 1 : -1) * (180 + ((i * 53) % 270)),
      colorIndex: i % 3,
      square: i % 3 === 0,
    };
  });
}

function ConfettiPiece({
  piece,
  progress,
  color,
}: {
  piece: Piece;
  progress: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p === 0 ? 0 : 1 - p * p,
      transform: [
        { translateX: Math.cos(piece.angle) * piece.distance * p },
        { translateY: Math.sin(piece.angle) * piece.distance * p + FALL * p * p },
        { rotate: `${piece.spin * p}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { backgroundColor: color, borderRadius: piece.square ? radius.chip / 7 : radius.pill },
        style,
      ]}
    />
  );
}

/**
 * Subtle brand + mint confetti burst from the center of its parent (spec §7.3).
 * With Reduce Motion: a soft mint glow that fades in and out instead.
 */
export function ConfettiBurst({ trigger, pieces = 24 }: ConfettiBurstProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const glow = useSharedValue(0);
  const items = useMemo(() => makePieces(pieces), [pieces]);
  const palette = [colors.brand, colors.good, colors.brandSoft];

  useEffect(() => {
    if (trigger === 0) return;
    if (reduceMotion) {
      glow.set(
        withSequence(
          withTiming(1, { duration: motion.base }),
          withTiming(0, { duration: motion.slow }),
        ),
      );
      return;
    }
    progress.set(0);
    progress.set(
      withTiming(1, { duration: motion.confetti, easing: Easing.out(Easing.cubic) }, () => {
        progress.value = 0;
      }),
    );
  }, [trigger, reduceMotion, progress, glow]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.5 }));

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.center]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.glow, { backgroundColor: colors.good }, glowStyle]} />
      {!reduceMotion
        ? items.map((p, i) => (
            <ConfettiPiece
              key={i}
              piece={p}
              progress={progress}
              color={palette[p.colorIndex] ?? colors.brand}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  piece: { position: 'absolute', width: size.confettiPiece, height: size.confettiPiece * 1.5 },
  glow: { position: 'absolute', width: GLOW, height: GLOW, borderRadius: radius.pill },
});
