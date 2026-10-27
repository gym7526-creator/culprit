import { Redirect, useRouter } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BOTTOM_CTA_SPACE,
  BottomCTA,
  BottomSheet,
  BudgetBar,
  Card,
  CheckInFaces,
  Chip,
  ConfettiBurst,
  DinnerCard,
  EmptyState,
  OptionCard,
  PrimaryButton,
  ProgressBar,
  ScoreRing,
  Screen,
  SecondaryButton,
  Slider,
  StatusPill,
  Stepper,
  TestBanner,
  Text,
  TextButton,
  TimePicker,
  type CheckInScore,
  type PillStatus,
} from '@/components';
import { common, componentCopy, formatMoney, galleryCopy } from '@/copy';
import { usePrefsStore } from '@/features/prefsStore';
import { useUiStore } from '@/features/uiStore';
import {
  radius,
  size,
  space,
  typography,
  useTheme,
  type ColorTokens,
  type TextVariant,
} from '@/theme';

const g = galleryCopy;
const s = g.sample;

const TEXT_VARIANTS: readonly TextVariant[] = [
  'display',
  'title',
  'headline',
  'body',
  'bodyStrong',
  'callout',
  'caption',
  'button',
];

const PILL_STATUSES: readonly PillStatus[] = [
  'untested',
  'testing',
  'trigger',
  'partial',
  'cleared',
  'unclear',
  'selfReported',
];

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text variant="headline" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ThemeSwitcher() {
  const override = usePrefsStore((st) => st.themeOverride);
  const setOverride = usePrefsStore((st) => st.setThemeOverride);
  return (
    <View style={styles.wrapRow}>
      <Chip label={g.themeSystem} selected={override === null} onPress={() => setOverride(null)} />
      <Chip
        label={g.themeLight}
        selected={override === 'light'}
        onPress={() => setOverride('light')}
      />
      <Chip
        label={g.themeDark}
        selected={override === 'dark'}
        onPress={() => setOverride('dark')}
      />
    </View>
  );
}

function Swatches() {
  const { colors } = useTheme();
  const keys = Object.keys(colors) as (keyof ColorTokens)[];
  return (
    <View style={styles.wrapRow}>
      {keys.map((k) => (
        <View key={k} style={styles.swatch}>
          <View
            style={[styles.swatchColor, { backgroundColor: colors[k], borderColor: colors.border }]}
          />
          <Text variant="caption" color="textSecondary">
            {k}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GalleryContent() {
  const showToast = useUiStore((st) => st.showToast);
  const [loadingPrimary, setLoadingPrimary] = useState(false);
  const [single, setSingle] = useState<'stomach' | 'skin' | 'both' | null>('stomach');
  const [multi, setMulti] = useState<Set<string>>(new Set(['bloating', 'heartburn']));
  const [step, setStep] = useState(3);
  const [checkIn, setCheckIn] = useState<CheckInScore | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [people, setPeople] = useState(2);
  const [impact, setImpact] = useState(2);
  const [budget, setBudget] = useState(90);
  const [bedtime, setBedtime] = useState('23:00');

  const toggleMulti = (id: string) =>
    setMulti((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <Screen scroll bottomInset={BOTTOM_CTA_SPACE}>
        <View style={styles.header}>
          <Text variant="title" accessibilityRole="header">
            {g.title}
          </Text>
          <Text variant="callout" color="textSecondary">
            {g.subtitle}
          </Text>
          <ThemeSwitcher />
        </View>

        <Section title={g.sections.type}>
          {TEXT_VARIANTS.map((v) => (
            <View key={v} style={styles.typeRow}>
              <Text variant="caption" color="textSecondary">
                {`${v} · ${typography[v].fontSize}/${typography[v].lineHeight}`}
              </Text>
              <Text variant={v}>{s[v === 'button' ? 'primary' : v]}</Text>
            </View>
          ))}
        </Section>

        <Section title={g.sections.colors}>
          <Swatches />
        </Section>

        <Section title={g.sections.buttons}>
          <PrimaryButton
            label={s.primary}
            loading={loadingPrimary}
            onPress={() => {
              setLoadingPrimary(true);
              setTimeout(() => setLoadingPrimary(false), 1500);
            }}
          />
          <PrimaryButton label={s.disabled} disabled onPress={() => undefined} />
          <PrimaryButton label={s.loading} loading onPress={() => undefined} />
          <SecondaryButton label={s.secondary} onPress={() => undefined} />
          <SecondaryButton label={s.disabled} disabled onPress={() => undefined} />
          <SecondaryButton label={s.loading} loading onPress={() => undefined} />
          <TextButton label={s.textButton} onPress={() => undefined} />
          <TextButton label={s.disabled} disabled onPress={() => undefined} />
        </Section>

        <Section title={g.sections.options}>
          <OptionCard
            {...s.optionStomach}
            selected={single === 'stomach'}
            onPress={() => setSingle('stomach')}
          />
          <OptionCard
            {...s.optionSkin}
            selected={single === 'skin'}
            onPress={() => setSingle('skin')}
          />
          <OptionCard
            {...s.optionBoth}
            selected={single === 'both'}
            onPress={() => setSingle('both')}
          />
          <OptionCard
            emoji="🚫"
            label={s.optionDisabledNote}
            selected={false}
            disabled
            onPress={() => undefined}
          />
          <OptionCard
            mode="multi"
            emoji="☕"
            label={componentCopy.checkIn.symptoms[3].label}
            selected={multi.has('heartburn')}
            onPress={() => toggleMulti('heartburn')}
          />
        </Section>

        <Section title={g.sections.chips}>
          <View style={styles.wrapRow}>
            {componentCopy.checkIn.symptoms.map((sym) => (
              <Chip
                key={sym.id}
                label={sym.label}
                selected={multi.has(sym.id)}
                onPress={() => toggleMulti(sym.id)}
              />
            ))}
            <Chip label={s.disabled} selected={false} disabled onPress={() => undefined} />
            <Chip label={s.disabled} selected disabled onPress={() => undefined} />
          </View>
        </Section>

        <Section title={g.sections.progress}>
          <ProgressBar
            current={step}
            total={10}
            onBack={() => setStep((v) => Math.max(0, v - 1))}
          />
          <ProgressBar current={10} total={10} />
          <TextButton label={common.continue} onPress={() => setStep((v) => Math.min(10, v + 1))} />
        </Section>

        <Section title={g.sections.cards}>
          <Card>
            <Text variant="bodyStrong">{s.cardTitle}</Text>
            <Text variant="callout" color="textSecondary">
              {s.cardBody}
            </Text>
          </Card>
          <Card tone="alt" onPress={() => undefined} accessibilityLabel={s.cardTitle}>
            <Text variant="bodyStrong">{s.cardTitle}</Text>
            <Text variant="callout" color="textSecondary">
              {s.cardBody}
            </Text>
          </Card>
        </Section>

        <Section title={g.sections.dinner}>
          <DinnerCard
            size="large"
            title={s.dinnerTitle}
            emoji="🥢"
            gradient="asian"
            minutes={s.dinnerMinutes}
            price={s.dinnerPrice}
            eatBy={s.dinnerEatBy}
            testNight
            onPress={() => undefined}
          />
          <DinnerCard
            title={s.dinnerTitle2}
            emoji="🐟"
            gradient="mediterranean"
            minutes={s.dinnerMinutes2}
            price={s.dinnerPrice2}
            onPress={() => undefined}
            onMorePress={() => setSheetOpen(true)}
          />
          <DinnerCard
            title={s.dinnerTitle2}
            emoji="🐟"
            gradient="sheetPan"
            minutes={s.dinnerMinutes2}
            price={s.dinnerPrice2}
            locked
          />
        </Section>

        <Section title={g.sections.test}>
          <TestBanner
            title={s.testTitle}
            detail={s.testFood}
            day={2}
            totalDays={3}
            onWhyPress={() => setSheetOpen(true)}
          />
        </Section>

        <Section title={g.sections.checkIn}>
          <Text variant="bodyStrong">{componentCopy.checkIn.question}</Text>
          <CheckInFaces value={checkIn} onChange={setCheckIn} />
          <TextButton label={s.reset} onPress={() => setCheckIn(null)} />
          <CheckInFaces value={1} onChange={() => undefined} disabled />
        </Section>

        <Section title={g.sections.ring}>
          <View style={styles.wrapRow}>
            <ScoreRing progress={0.25} label={s.ringLabel}>
              <Text variant="headline">25%</Text>
            </ScoreRing>
            <ScoreRing progress={0.6} label={s.ringLabel} color="partial" size={size.ring * 0.75}>
              <Text variant="bodyStrong">60%</Text>
            </ScoreRing>
            <ScoreRing progress={1} label={s.ringLabel} color="good" size={size.ring * 0.75}>
              <Text variant="bodyStrong">✓</Text>
            </ScoreRing>
          </View>
        </Section>

        <Section title={g.sections.budget}>
          <BudgetBar {...s.budgetUnder} />
          <BudgetBar {...s.budgetNear} />
          <BudgetBar {...s.budgetOver} />
        </Section>

        <Section title={g.sections.pills}>
          <View style={styles.wrapRow}>
            {PILL_STATUSES.map((st) => (
              <StatusPill key={st} status={st} />
            ))}
          </View>
        </Section>

        <Section title={g.sections.overlays}>
          <SecondaryButton label={s.showSheet} onPress={() => setSheetOpen(true)} />
          <View style={styles.wrapRow}>
            <Chip label={s.showToast} selected={false} onPress={() => showToast(s.toastText)} />
            <Chip
              label={s.toastGood}
              selected={false}
              onPress={() => showToast(s.toastText, 'good')}
            />
            <Chip
              label={s.toastTrigger}
              selected={false}
              onPress={() => showToast(s.toastText, 'trigger')}
            />
          </View>
          <View style={styles.confettiBox}>
            <SecondaryButton label={s.confetti} onPress={() => setConfetti((c) => c + 1)} />
            <ConfettiBurst trigger={confetti} />
          </View>
        </Section>

        <Section title={g.sections.inputs}>
          <Text variant="callout" color="textSecondary">
            {s.stepperLabel}
          </Text>
          <Stepper label={s.stepperLabel} value={people} min={1} max={8} onChange={setPeople} />
          <Slider
            label={s.sliderLabel}
            value={impact}
            min={0}
            max={4}
            step={1}
            onChange={setImpact}
            formatValue={(v) => s.sliderFaces[v] ?? String(v)}
            marks={s.sliderFaces}
          />
          <Slider
            label={g.sections.budget}
            value={budget}
            min={40}
            max={300}
            step={5}
            onChange={setBudget}
            formatValue={(v) => formatMoney(v, true)}
          />
          <TimePicker label={s.timeLabel} value={bedtime} onChange={setBedtime} />
          <Text variant="caption" color="textSecondary">
            {bedtime}
          </Text>
        </Section>

        <Section title={g.sections.empty}>
          <EmptyState
            emoji={s.emptyEmoji}
            title={s.emptyTitle}
            body={s.emptyBody}
            ctaLabel={s.emptyCta}
            onCta={() => undefined}
          />
        </Section>

        <Section title={g.sections.cta}>
          <Text variant="callout" color="textSecondary">
            {s.ctaNote}
          </Text>
        </Section>
      </Screen>

      <BottomCTA>
        <PrimaryButton label={s.primary} onPress={() => showToast(s.toastText, 'good')} />
      </BottomCTA>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={s.sheetTitle}>
        <Text variant="body" color="textSecondary">
          {s.sheetBody}
        </Text>
        <PrimaryButton label={common.done} onPress={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}

/** Dev-only design-system gallery (spec §7.3). Release builds redirect home. */
export default function Gallery() {
  const router = useRouter();
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={styles.flex}>
      <GalleryContent />
      <View style={styles.close}>
        <TextButton
          label={common.close}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </View>
    </View>
  );
}

const SWATCH = size.minTouch;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: space.xs, marginBottom: space.md },
  section: { gap: space.sm, marginTop: space.xl },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  typeRow: { gap: space.xxs / 2 },
  swatch: { width: SWATCH * 1.8, gap: space.xxs },
  swatchColor: { height: SWATCH, borderRadius: radius.chip, borderWidth: size.hairline },
  confettiBox: { minHeight: size.galleryPreview, justifyContent: 'center' },
  close: { position: 'absolute', top: space.xxxl, right: space.xs },
});
