import { Text, TimePicker } from '@/components';
import { onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { usePrefsStore } from '@/features/prefsStore';

const c = onboardingCopy.checkInTime;

export default function CheckInTimeStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('check-in-time');
  const setPrefTime = usePrefsStore((s) => s.setCheckInTime);
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        onPress: () => {
          setPrefTime(answers.checkInTime);
          goNext();
        },
      }}
    >
      <TimePicker
        label={c.label}
        value={answers.checkInTime}
        onChange={(checkInTime) => update({ checkInTime })}
      />
      <Text variant="callout" color="textSecondary" align="center">
        {c.note}
      </Text>
    </OnboardingScreen>
  );
}
