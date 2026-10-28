import { Text } from '@/components';
import { format, onboardingCopy } from '@/copy';
import { toggle } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { provisionalStore } from '@/features/stores/pick';
import { StorePicker } from '@/features/stores/StorePicker';
import { storeLabel } from '@/features/stores/storeName';

const c = onboardingCopy.store;

/** O13b "My stores": pick every store they use; each list is priced at the best one for it. */
export default function StoreStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('store');
  const stores = answers.stores;
  const onToggle = (id: string) => {
    const next = toggle(stores, id);
    update({ stores: next, chainId: provisionalStore(next), storeAuto: true });
  };
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.subtitle}
      progress={progress}
      onBack={goBack}
      cta={{
        label: onboardingCopy.continue,
        disabled: stores.length === 0,
        onPress: () => goNext(),
        testID: 'store-continue',
      }}
    >
      {stores.length > 0 ? (
        <Text variant="callout" color="brandInk">
          {stores.length > 1
            ? format(c.picked, { count: stores.length })
            : format(c.confirm, { store: storeLabel(answers), zip: answers.zip ?? '' })}
        </Text>
      ) : null}
      <StorePicker
        zip={answers.zip ?? ''}
        values={stores}
        storeName={answers.storeName}
        onToggle={onToggle}
        onStoreName={(storeName) => update({ storeName })}
      />
    </OnboardingScreen>
  );
}
