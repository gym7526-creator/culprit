import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { Slider, TextField, TimePicker } from '@/components';
import { formatMoney, onboardingCopy, skinCopy } from '@/copy';
import { content } from '@/data/content';
import { SKIN_CONCERNS, type SkinConcern } from '@/data/content/schema';
import { zipToState } from '@/engines/price';
import {
  PRODUCT_TYPES,
  SKIN_AREAS,
  SKIN_BUDGET_MAX,
  SKIN_BUDGET_MIN,
  SKIN_DURATIONS,
  type ProductType,
} from '@/engines/skin';
import { MultiChoice, SingleChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingStore } from '@/features/onboardingStore';
import { buildSkinProgram } from '@/features/skin/actions';
import { isSkinStep, skinSteps, type SkinStep } from '@/features/skin/setupFlow';
import { useSkinStore } from '@/features/skin/skinStore';

const c = skinCopy.setup;

/** Skin setup (spec §12), one question per screen. */
export default function SkinSetupStep() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const a = useSkinStore((s) => s.answers);
  const update = useSkinStore((s) => s.update);
  const setStep = useSkinStore((s) => s.setSetupStep);
  const onboarding = useOnboardingStore((s) => s.answers);
  const updateOnboarding = useOnboardingStore((s) => s.update);
  const [zip, setZip] = useState(onboarding.zip ?? '');
  const [steps] = useState(() => skinSteps(Boolean(onboarding.zip)));

  const current = String(step);
  useEffect(() => {
    if (isSkinStep(current)) setStep(current);
  }, [current, setStep]);
  if (!isSkinStep(current)) return <Redirect href="/skin-setup/concern" />;

  const index = steps.indexOf(current);
  const progress = { current: Math.max(1, index + 1), total: steps.length };
  const next = () => {
    const n = steps[index + 1];
    if (n) router.push(`/skin-setup/${n}`);
    else {
      buildSkinProgram();
      router.push('/skin-setup/preview');
    }
  };
  const back = () => (router.canGoBack() ? router.back() : undefined);
  const screen = (props: {
    title: string;
    subtitle?: string;
    ctaDisabled?: boolean;
    noCta?: boolean;
    children: React.ReactNode;
  }) => (
    <OnboardingScreen
      title={props.title}
      subtitle={props.subtitle}
      progress={progress}
      onBack={back}
      cta={
        props.noCta
          ? undefined
          : {
              label: index === steps.length - 1 ? c.build : c.continue,
              onPress: next,
              disabled: props.ctaDisabled,
              testID: 'skin-next',
            }
      }
    >
      {props.children}
    </OnboardingScreen>
  );

  const pickThen =
    <T,>(patch: (v: T) => void) =>
    (v: T) => {
      patch(v);
      setTimeout(next, 250);
    };

  switch (current as SkinStep) {
    case 'concern':
      return screen({
        title: c.concern.title,
        noCta: true,
        children: (
          <SingleChoice
            options={SKIN_CONCERNS.map((k) => ({ value: k, ...c.concern.options[k] }))}
            value={a.concern}
            onPick={pickThen((concern: SkinConcern) => update({ concern }))}
          />
        ),
      });
    case 'areas':
      return screen({
        title: c.areas.title,
        subtitle: c.areas.subtitle,
        ctaDisabled: a.areas.length === 0,
        children: (
          <MultiChoice
            options={SKIN_AREAS.map((k) => ({ value: k, label: c.areas.options[k] }))}
            values={a.areas}
            onToggle={(v) => update({ areas: toggle(a.areas, v) })}
          />
        ),
      });
    case 'duration':
      return screen({
        title: c.duration.title,
        noCta: true,
        children: (
          <SingleChoice
            options={SKIN_DURATIONS.map((k) => ({ value: k, label: c.duration.options[k] }))}
            value={a.duration}
            onPick={pickThen((duration: (typeof SKIN_DURATIONS)[number]) => update({ duration }))}
          />
        ),
      });
    case 'current':
      return screen({
        title: c.current.title,
        subtitle: c.current.subtitle,
        children: (
          <MultiChoice
            options={PRODUCT_TYPES.map((k) => ({ value: k, label: c.current.options[k] }))}
            values={a.current}
            onToggle={(v: ProductType) => update({ current: toggle(a.current, v) })}
          />
        ),
      });
    case 'sensitive':
      return screen({
        title: c.sensitive.title,
        subtitle: c.sensitive.subtitle,
        noCta: true,
        children: (
          <SingleChoice
            options={[
              { value: 'yes', label: c.sensitive.yes, emoji: '🌸' },
              { value: 'no', label: c.sensitive.no, emoji: '👍' },
            ]}
            value={a.sensitive === null ? null : a.sensitive ? 'yes' : 'no'}
            onPick={pickThen((v: string) => update({ sensitive: v === 'yes' }))}
          />
        ),
      });
    case 'budget':
      return screen({
        title: c.budget.title,
        subtitle: c.budget.note,
        children: (
          <Slider
            label={c.budget.label}
            value={a.budget}
            min={SKIN_BUDGET_MIN}
            max={SKIN_BUDGET_MAX}
            step={5}
            onChange={(budget) => update({ budget })}
            formatValue={(v) => formatMoney(v, true)}
          />
        ),
      });
    case 'zip':
      return screen({
        title: onboardingCopy.zip.title,
        subtitle: onboardingCopy.zip.subtitle,
        ctaDisabled: zipToState(zip, content.regions) === null,
        children: (
          <TextField
            label={onboardingCopy.zip.label}
            value={zip}
            large
            keyboardType="number-pad"
            maxLength={5}
            onChangeText={(t) => {
              const z = t.replace(/\D/g, '').slice(0, 5);
              setZip(z);
              if (zipToState(z, content.regions)) updateOnboarding({ zip: z });
            }}
            testID="skin-zip"
          />
        ),
      });
    case 'retailer':
      return screen({
        title: c.retailer.title,
        subtitle: c.retailer.subtitle,
        noCta: true,
        children: (
          <SingleChoice
            options={content.skincare.retailers.map((r) => ({
              value: r.id,
              label: r.name,
              sublabel: r.note,
            }))}
            value={a.retailerId}
            onPick={pickThen((retailerId: string) => update({ retailerId }))}
          />
        ),
      });
    case 'check-in':
      return screen({
        title: c.checkInTime.title,
        subtitle: c.checkInTime.note,
        children: (
          <TimePicker
            label={c.checkInTime.label}
            value={a.checkInTime}
            onChange={(checkInTime) => update({ checkInTime })}
          />
        ),
      });
  }
}
