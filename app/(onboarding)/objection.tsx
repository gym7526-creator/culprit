import { Check, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components';
import { onboardingCopy } from '@/copy';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { useOnboardingNav } from '@/features/onboarding/useOnboardingNav';
import { size, space, useTheme } from '@/theme';

const c = onboardingCopy.objection;

export default function Objection() {
  const { goNext, goBack, progress } = useOnboardingNav('objection');
  const { colors } = useTheme();
  return (
    <OnboardingScreen
      title={c.title}
      subtitle={c.body}
      progress={progress}
      onBack={goBack}
      cta={{ label: onboardingCopy.continue, onPress: () => goNext() }}
    >
      <View style={styles.row}>
        <Card tone="alt" style={styles.col}>
          <Text variant="bodyStrong" color="textSecondary">
            {c.oldWay}
          </Text>
          {c.oldItems.map((item) => (
            <View key={item} style={styles.item}>
              <X size={size.iconSm} color={colors.triggerInk} />
              <Text variant="callout" color="textSecondary" style={styles.flex}>
                {item}
              </Text>
            </View>
          ))}
        </Card>
        <Card style={[styles.col, { borderColor: colors.brand, borderWidth: size.selectedBorder }]}>
          <Text variant="bodyStrong" color="brandInk">
            {c.newWay}
          </Text>
          {c.newItems.map((item) => (
            <View key={item} style={styles.item}>
              <Check size={size.iconSm} color={colors.goodInk} />
              <Text variant="callout" style={styles.flex}>
                {item}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  col: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
});
