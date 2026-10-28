import { Text, Slider } from '@/components';
import { formatMoney, onboardingCopy } from '@/copy';
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, defaultBudget } from '@/engines/onboarding';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.budget;

export default function BudgetStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('budget');
  const value = answers.budget ?? defaultBudget(answers.household);
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext({ budget: value }) }}
    >
      <Slider
        label={c.label}
        value={value}
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={BUDGET_STEP}
        onChange={(budget) => update({ budget })}
        formatValue={(v) => formatMoney(v, true)}
        testID="budget-slider"
      />
      <Text variant="callout" color="textSecondary" align="center">
        {c.note}
      </Text>
    </OnboardingScreen>
  );
}
