import { onboardingCopy } from '@/copy';
import type { Equipment } from '@/data/content/schema';
import { SELECTABLE_EQUIPMENT } from '@/engines/onboarding';
import { MultiChoice, toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.equipment;

export default function EquipmentStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('equipment');
  const options = SELECTABLE_EQUIPMENT.map((value) => ({
    value,
    ...c.options[value as keyof typeof c.options],
  }));
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: answers.equipment.length === 0 ? onboardingCopy.skip : onboardingCopy.continue,
        onPress: () => goNext(),
      }}
    >
      <MultiChoice<Equipment>
        options={options}
        values={answers.equipment}
        onToggle={(e) => update({ equipment: toggle(answers.equipment, e) })}
      />
    </OnboardingScreen>
  );
}
