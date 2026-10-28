import { Text } from '@/components';
import { format, onboardingCopy } from '@/copy';
import { content } from '@/data/content';
import { chainsForZip } from '@/engines/price';
import { SingleChoice } from '@/features/onboarding/components/Choices';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';

const c = onboardingCopy.store;

/** O13b: chains common near the ZIP come first. */
export default function StoreStep() {
  const { answers, update, goNext, goBack, progress } = useOnboardingNav('store');
  const chains = chainsForZip(answers.zip ?? '', content.regions, content.chains);
  const options = chains.map((ch) => ({ value: ch.id, label: ch.name }));
  const chosen = chains.find((ch) => ch.id === answers.chainId);
  return (
    <OnboardingScreen
      title={c.title}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, disabled: !chosen, onPress: () => goNext() }}
    >
      {chosen ? (
        <Text variant="callout" color="brandInk">
          {format(c.confirm, { store: chosen.name, zip: answers.zip ?? '' })}
        </Text>
      ) : null}
      <SingleChoice<string>
        options={options}
        value={answers.chainId}
        onPick={(chainId) => update({ chainId })}
      />
    </OnboardingScreen>
  );
}
