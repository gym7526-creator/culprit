import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { track } from '@/analytics';
import { BottomCTA, PrimaryButton, Screen, Text } from '@/components';
import { caseCopy, common, groupEmoji, shareCopy } from '@/copy';
import { content } from '@/data/content';
import { caseReport } from '@/engines/report';
import { useAppStore } from '@/features/appStore';
import { useUiStore } from '@/features/uiStore';
import { gradients, radius, size, space, useTheme } from '@/theme';

const nameOf = (g: string) => content.tests.tests.find((t) => t.id === g)?.name ?? g;

/**
 * Share card preview (spec §10.5): a 1080×1350 image with outcomes only, no scores or health
 * details, previewed before sharing.
 */
export default function ShareResults() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const program = useAppStore((s) => s.program);
  const toast = useUiStore((s) => s.showToast);
  const card = useRef<HostInstance>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => {
    if (!program) return [];
    const r = caseReport(program);
    return [
      ...r.triggers.map((x) => ({ g: x.group, mark: '❌', note: '' })),
      ...r.partial.map((x) => ({ g: x.group, mark: '🟡', note: caseCopy.smallAmounts })),
      ...r.cleared.map((x) => ({ g: x.group, mark: '✅', note: '' })),
    ];
  }, [program]);

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, width: 1080, height: 1350 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: shareCopy.title });
      track({ name: 'share_card_created' });
    } catch {
      toast(shareCopy.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.flex}>
      <Screen scroll bottomInset={size.button * 2} testID="share">
        <View style={styles.head}>
          <Text variant="title" style={styles.flex} accessibilityRole="header">
            {shareCopy.title}
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={common.close}
            style={[styles.close, { backgroundColor: colors.surface }]}
          >
            <X size={size.iconLg} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View ref={card} collapsable={false} style={styles.cardWrap}>
          <LinearGradient colors={gradients[scheme].bowls} style={styles.card}>
            <Text variant="caption" color="textSecondary">
              🕵️ {shareCopy.footer}
            </Text>
            <Text variant="display">{shareCopy.heading}</Text>
            <View style={styles.rows}>
              {rows.map((r) => (
                <View key={r.g} style={[styles.row, { backgroundColor: colors.surface }]}>
                  <Text style={styles.emoji} accessible={false}>
                    {groupEmoji[r.g] ?? '🔎'}
                  </Text>
                  <Text variant="bodyStrong" style={styles.flex}>
                    {nameOf(r.g)}
                    {r.note ? ` (${r.note})` : ''}
                  </Text>
                  <Text style={styles.emoji}>{r.mark}</Text>
                </View>
              ))}
            </View>
            <Text variant="caption" color="textSecondary" align="center">
              {shareCopy.url}
            </Text>
          </LinearGradient>
        </View>
        <Text variant="caption" color="textSecondary" align="center" style={styles.note}>
          {shareCopy.note}
        </Text>
      </Screen>
      <BottomCTA>
        <PrimaryButton
          label={shareCopy.share}
          onPress={share}
          loading={busy}
          testID="share-image"
        />
      </BottomCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  close: {
    width: size.minTouch,
    height: size.minTouch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: { borderRadius: radius.card, overflow: 'hidden', aspectRatio: 1080 / 1350 },
  card: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'space-between' },
  rows: { gap: space.xs, flex: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.chip,
    padding: space.sm,
  },
  emoji: { fontSize: size.iconLg, lineHeight: size.iconLg * 1.3 },
  note: { marginTop: space.md },
});
