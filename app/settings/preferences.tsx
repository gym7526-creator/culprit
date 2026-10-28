import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Chip, PrimaryButton, Slider, Stepper, Text, TextField, TimePicker } from '@/components';
import { format, formatMoney, onboardingCopy, settingsCopy } from '@/copy';
import type { Allergen } from '@/data/content/schema';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  PANTRY_STAPLES,
  SELECTABLE_EQUIPMENT,
  type Answers,
} from '@/engines/onboarding';
import { useOnboardingStore } from '@/features/onboardingStore';
import { savePreferences } from '@/features/settings/actions';
import { SettingsScreen } from '@/features/settings/components';
import { provisionalStore } from '@/features/stores/pick';
import { StorePicker } from '@/features/stores/StorePicker';
import { useUiStore } from '@/features/uiStore';
import { size, space, useTheme } from '@/theme';

const p = settingsCopy.prefs;
const o = onboardingCopy;

function toggle<T>(list: readonly T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </View>
  );
}

/** Profile & preferences (spec §10.6). Saving re-plans the rest of this week. */
export default function Preferences() {
  const router = useRouter();
  const { colors } = useTheme();
  const saved = useOnboardingStore((s) => s.answers);
  const toast = useUiStore((s) => s.showToast);
  const [a, setA] = useState<Answers>(saved);
  const set = (patch: Partial<Answers>) => setA((cur) => ({ ...cur, ...patch }));
  const zipValid = /^\d{5}$/.test(a.zip ?? '');

  return (
    <SettingsScreen
      title={p.title}
      testID="preferences"
      footer={
        <PrimaryButton
          label={settingsCopy.save}
          disabled={!zipValid || a.cookDays.length === 0 || a.stores.length === 0}
          onPress={() => {
            savePreferences(a);
            toast(settingsCopy.saved, 'good');
            router.back();
          }}
          testID="save-prefs"
        />
      }
    >
      <Group title={p.household}>
        <Stepper
          label={p.household}
          value={a.household}
          min={1}
          max={8}
          onChange={(household) => set({ household })}
        />
        <View style={styles.switchRow}>
          <Text variant="body" style={styles.flex}>
            {p.kids}
          </Text>
          <Switch
            value={a.kids}
            onValueChange={(kids) => set({ kids })}
            accessibilityLabel={p.kids}
            trackColor={{ true: colors.brand, false: colors.border }}
          />
        </View>
      </Group>

      <Group title={p.budget}>
        <Slider
          label={p.budget}
          value={a.budget ?? 90}
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          onChange={(budget) => set({ budget })}
          formatValue={(v) => formatMoney(v, true)}
        />
      </Group>

      <Group title={p.zip}>
        <TextField
          label={p.zip}
          value={a.zip ?? ''}
          onChangeText={(t) => set({ zip: t.replace(/\D/g, '').slice(0, 5) })}
          keyboardType="number-pad"
          error={a.zip && !zipValid ? o.zip.invalid : null}
        />
      </Group>

      {zipValid ? (
        <Group title={p.store}>
          <StorePicker
            zip={a.zip ?? ''}
            values={a.stores}
            storeName={a.storeName}
            onToggle={(id) => {
              const stores = toggle(a.stores, id);
              set({ stores, chainId: provisionalStore(stores), storeAuto: true });
            }}
            onStoreName={(storeName) => set({ storeName })}
          />
        </Group>
      ) : null}

      <Group title={p.cookNights}>
        <View style={styles.chips}>
          {o.cookNights.days.map((d, i) => (
            <Chip
              key={d}
              label={d}
              selected={a.cookDays.includes(i)}
              onPress={() => set({ cookDays: toggle(a.cookDays, i).sort() })}
            />
          ))}
        </View>
      </Group>

      <Group title={p.cookTime}>
        <View style={styles.chips}>
          {([15, 30, 45] as const).map((n) => (
            <Chip
              key={n}
              label={format(p.minutes, { n })}
              selected={a.maxMinutes === n}
              onPress={() => set({ maxMinutes: n })}
            />
          ))}
        </View>
      </Group>

      <Group title={p.equipment}>
        <View style={styles.chips}>
          {SELECTABLE_EQUIPMENT.map((e) => {
            const opt = o.equipment.options[e as keyof typeof o.equipment.options];
            return (
              <Chip
                key={e}
                label={opt?.label ?? e}
                emoji={opt?.emoji}
                selected={a.equipment.includes(e)}
                onPress={() => set({ equipment: toggle(a.equipment, e) })}
              />
            );
          })}
        </View>
      </Group>

      <Group title={p.diet}>
        <View style={styles.chips}>
          {(Object.keys(o.diet.options) as (keyof typeof o.diet.options)[]).map((d) => (
            <Chip
              key={d}
              label={o.diet.options[d].label}
              emoji={o.diet.options[d].emoji}
              selected={(a.diet ?? 'none') === d}
              onPress={() => set({ diet: d })}
            />
          ))}
        </View>
      </Group>

      <Group title={p.allergies}>
        <View style={styles.chips}>
          {(Object.keys(o.diet.allergens) as Allergen[]).map((al) => (
            <Chip
              key={al}
              label={o.diet.allergens[al as keyof typeof o.diet.allergens]}
              selected={a.allergens.includes(al)}
              onPress={() => set({ allergens: toggle(a.allergens, al) })}
            />
          ))}
          <Chip label={p.celiac} selected={a.celiac} onPress={() => set({ celiac: !a.celiac })} />
        </View>
      </Group>

      <Group title={p.dislikes}>
        <View style={styles.chips}>
          {(Object.keys(o.diet.dislikeOptions) as (keyof typeof o.diet.dislikeOptions)[]).map(
            (id) => (
              <Chip
                key={id}
                label={o.diet.dislikeOptions[id]}
                selected={a.dislikes.includes(id)}
                onPress={() => set({ dislikes: toggle(a.dislikes, id) })}
              />
            ),
          )}
        </View>
      </Group>

      <Group title={p.pantry}>
        <View style={styles.chips}>
          {PANTRY_STAPLES.map((id) => (
            <Chip
              key={id}
              label={o.pantry.names[id]}
              selected={a.pantry.includes(id)}
              onPress={() => set({ pantry: toggle(a.pantry, id) })}
            />
          ))}
        </View>
      </Group>

      <Group title={p.bedtime}>
        <TimePicker label={p.bedtime} value={a.bedtime} onChange={(bedtime) => set({ bedtime })} />
      </Group>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { marginTop: space.xl, gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: size.minTouch },
});
