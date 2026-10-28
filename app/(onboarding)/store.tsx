import { Text } from '@/components';
import { format, onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { StorePicker } from '@/features/stores/StorePicker';
import { storeLabel } from '@/features/stores/storeName';

const c = onboardingCopy.store;

/** O13b: stores near the ZIP first, every chain still pickable, or a local store by name. */
export default function StoreStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('store');
  const chosen = answers.chainId !== null;
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: !chosen,
        onPress: () => goNext(),
        testID: 'store-continue',
      }}
    >
      {chosen ? (
        <Text variant="callout" color="brandInk">
          {format(c.confirm, { store: storeLabel(answers), zip: answers.zip ?? '' })}
        </Text>
      ) : null}
      <StorePicker
        zip={answers.zip ?? ''}
        value={answers.chainId}
        storeName={answers.storeName}
        onPick={(chainId) => update({ chainId })}
        onStoreName={(storeName) => update({ storeName })}
      />
    </OnboardingScreen>
  );
}
