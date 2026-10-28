import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics, Text } from '@/components';
import { radius, size, space, useTheme } from '@/theme';

type Props = {
  title: string;
  price: string;
  sub?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** Plan option. Price and billing period are the largest text on the card (Apple 3.1.2). */
export function PlanCard({ title, price, sub, badge, selected, onPress, testID }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[title, price, sub, badge].filter(Boolean).join(', ')}
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.brandSoft : colors.surface,
          borderColor: selected ? colors.brand : colors.border,
        },
      ]}
    >
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.brand }]}>
          <Text variant="caption" color="onBrand">
            {badge}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="headline">{price}</Text>
          {sub ? (
            <Text variant="callout" color="textSecondary">
              {sub}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.radio,
            { borderColor: selected ? colors.brand : colors.border },
            selected ? { backgroundColor: colors.brand } : null,
          ]}
        >
          {selected ? <Check size={size.iconSm} color={colors.onBrand} strokeWidth={3} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: radius.card, padding: space.md, gap: space.xs },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  radio: {
    width: size.iconLg + space.xxs,
    height: size.iconLg + space.xxs,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
