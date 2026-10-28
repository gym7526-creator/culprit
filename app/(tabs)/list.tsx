import { FlashList } from '@shopify/flash-list';
import { Check, Info, Share2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  BudgetBar,
  EmptyState,
  haptics,
  PrimaryButton,
  SecondaryButton,
  Text,
  TextButton,
  TextField,
} from '@/components';
import { common, format, formatMoney, groceryCopy, listCopy } from '@/copy';
import { recipeMap } from '@/data/content';
import { listAsText, type CustomItem, type GroceryLine } from '@/engines/grocery';
import { track } from '@/analytics';
import { AppHeader } from '@/features/app/AppHeader';
import { useAppStore } from '@/features/appStore';
import { useActivePlan, useGroceryList } from '@/features/plan/hooks';
import { radius, size, space, useTheme } from '@/theme';

type Row =
  | { type: 'header'; key: string; title: string }
  | { type: 'line'; key: string; line: GroceryLine }
  | { type: 'custom'; key: string; item: CustomItem }
  | { type: 'hidden'; key: string; count: number };

function usedByText(ids: readonly string[]): string {
  const names = ids.map((id) =>
    id.startsWith('test:') ? listCopy.testFood : (recipeMap.get(id)?.title ?? id),
  );
  return format(listCopy.usedIn, { dishes: [...new Set(names)].join(', ') });
}

/** List (spec §10.4): by aisle, checkboxes, packs, price est., pantry cross-off, add, share, done. */
export default function List() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const plan = useActivePlan();
  const list = useGroceryList(plan);
  const w = plan?.weekStart ?? '';
  const checked = useAppStore((s) => s.checked[w]);
  const done = useAppStore((s) => s.doneShopping[w] ?? false);
  const { toggleChecked, addCustom, removeCustom, setDoneShopping, togglePantry } =
    useAppStore.getState();
  const [info, setInfo] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const isChecked = (id: string) => (checked ?? []).includes(id);

  const rows = useMemo<Row[]>(() => {
    if (!list) return [];
    const out: Row[] = [];
    let hidden = 0;
    const visible = (id: string) => {
      if (done && (checked ?? []).includes(id)) {
        hidden++;
        return false;
      }
      return true;
    };
    for (const s of list.sections) {
      const lines = s.lines.filter((l) => l.pantry || visible(l.ingredientId));
      if (lines.length === 0) continue;
      out.push({ type: 'header', key: `h-${s.aisle}`, title: groceryCopy.aisles[s.aisle] });
      for (const l of lines) out.push({ type: 'line', key: l.ingredientId, line: l });
    }
    const custom = list.custom.filter((c) => visible(c.id));
    if (custom.length > 0) {
      out.push({ type: 'header', key: 'h-custom', title: groceryCopy.aisles.custom });
      for (const c of custom) out.push({ type: 'custom', key: c.id, item: c });
    }
    if (hidden > 0) out.push({ type: 'hidden', key: 'hidden', count: hidden });
    return out;
  }, [list, checked, done]);

  if (!plan || !list) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.bg }]}>
        <EmptyState
          emoji="🧺"
          title={listCopy.empty}
          body={listCopy.emptyBody}
          ctaLabel={common.retry}
          onCta={() => undefined}
        />
      </View>
    );
  }

  const itemCount =
    list.sections.reduce((n, s) => n + s.lines.filter((l) => !l.pantry).length, 0) +
    list.custom.length;

  const checkbox = (id: string, label: string) => {
    const on = isChecked(id);
    return (
      <Pressable
        onPress={() => {
          haptics.light();
          toggleChecked(w, id);
          if (!on) track({ name: 'list_item_checked' });
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel={label}
        hitSlop={space.xs}
        style={[
          styles.box,
          {
            borderColor: on ? colors.good : colors.border,
            backgroundColor: on ? colors.good : 'transparent',
          },
        ]}
        testID={`check-${id}`}
      >
        {on ? <Check size={size.iconSm} color={colors.surface} strokeWidth={3} /> : null}
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'header') {
      return (
        <Text variant="caption" color="textSecondary" style={styles.header}>
          {item.title.toUpperCase()}
        </Text>
      );
    }
    if (item.type === 'hidden') {
      return (
        <TextButton
          label={format(listCopy.checkedHidden, { count: item.count })}
          onPress={() => setDoneShopping(w, false)}
        />
      );
    }
    if (item.type === 'custom') {
      return (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          {checkbox(item.item.id, item.item.name)}
          <Text
            variant="body"
            style={[styles.flex, isChecked(item.item.id) ? styles.struck : null]}
          >
            {item.item.name}
          </Text>
          <Pressable
            onPress={() => removeCustom(w, item.item.id)}
            accessibilityRole="button"
            accessibilityLabel={format(listCopy.remove, { name: item.item.name })}
            hitSlop={space.sm}
          >
            <X size={size.iconMd} color={colors.textSecondary} />
          </Pressable>
        </View>
      );
    }
    const l = item.line;
    if (l.pantry) {
      return (
        <Pressable
          onPress={() => togglePantry(l.ingredientId)}
          accessibilityRole="button"
          accessibilityLabel={`${l.name}, ${listCopy.youHave}. ${listCopy.tapToNeed}`}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={[styles.box, { borderColor: colors.border }]} />
          <View style={styles.flex}>
            <Text variant="body" color="textSecondary" style={styles.struck}>
              {l.name}
            </Text>
            <Text variant="caption" color="textSecondary">
              {listCopy.youHave}
            </Text>
          </View>
        </Pressable>
      );
    }
    const on = isChecked(l.ingredientId);
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        {checkbox(l.ingredientId, `${l.name}, ${l.packLabel}`)}
        <View style={styles.flex}>
          <Text variant="body" style={on ? styles.struck : null}>
            {l.name}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {`${l.packLabel} · ${usedByText(l.usedBy)}`}
          </Text>
        </View>
        <Text variant="callout" color="textSecondary">
          {formatMoney(l.priceEst)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]} testID="list">
      <FlashList
        data={rows}
        keyExtractor={(r) => r.key}
        getItemType={(r) => r.type}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.screen,
          paddingBottom: size.button * 4,
        }}
        ListHeaderComponent={
          <View style={styles.gap}>
            <AppHeader
              eyebrow={format(listCopy.items, { count: itemCount })}
              title={listCopy.title}
            />
            <View style={styles.actions}>
              <SecondaryButton
                label={listCopy.add}
                onPress={() => setAdding(true)}
                testID="add-item"
              />
              <Pressable
                onPress={async () => {
                  await Share.share({
                    message: listAsText(list, formatMoney),
                    title: listCopy.shareTitle,
                  });
                  track({ name: 'list_shared' });
                }}
                accessibilityRole="button"
                accessibilityLabel={listCopy.share}
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                testID="share-list"
              >
                <Share2 size={size.iconMd} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          !done && (checked ?? []).length > 0 ? (
            <View style={styles.footer}>
              <SecondaryButton
                label={listCopy.doneShopping}
                onPress={() => setDoneShopping(w, true)}
                testID="done-shopping"
              />
            </View>
          ) : null
        }
      />

      <View
        style={[styles.sticky, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <View style={styles.totalRow}>
          <Text variant="headline" style={styles.flex} testID="list-total">
            {format(listCopy.total, { total: formatMoney(list.total) })}
          </Text>
          <Pressable
            onPress={() => setInfo(true)}
            accessibilityRole="button"
            accessibilityLabel={listCopy.estInfo}
            hitSlop={space.sm}
          >
            <Info size={size.iconMd} color={colors.textSecondary} />
          </Pressable>
        </View>
        <BudgetBar total={list.total} budget={list.budget} />
      </View>

      <BottomSheet visible={info} onClose={() => setInfo(false)} title={listCopy.estInfo}>
        <Text variant="body">{listCopy.estBody}</Text>
        <SecondaryButton label={common.done} onPress={() => setInfo(false)} />
      </BottomSheet>

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title={listCopy.add}>
        <TextField
          label={listCopy.add}
          placeholder={listCopy.addPlaceholder}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          testID="add-input"
        />
        <PrimaryButton
          label={listCopy.addConfirm}
          disabled={draft.trim().length === 0}
          onPress={() => {
            addCustom(w, { id: `custom-${Date.now()}`, name: draft.trim() });
            setDraft('');
            setAdding(false);
          }}
          testID="add-confirm"
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  gap: { gap: space.md, marginBottom: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  iconBtn: {
    width: size.button,
    height: size.button,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: space.lg, marginBottom: space.xxs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.optionCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  box: {
    width: size.iconLg,
    height: size.iconLg,
    borderRadius: radius.chip / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  struck: { textDecorationLine: 'line-through' },
  footer: { marginTop: space.lg },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.md,
    gap: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
});
