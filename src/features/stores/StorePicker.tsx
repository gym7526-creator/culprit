import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OptionCard, Text, TextButton, TextField } from '@/components';
import { format, onboardingCopy } from '@/copy';
import { content } from '@/data/content';
import { storeGroups, type Chain } from '@/engines/price';
import { space } from '@/theme';

const c = onboardingCopy.store;

/** Price tier from the chain index, so people can see why totals differ (all "est."). */
export function tierOf(index: number): keyof typeof c.tiers {
  return index <= 0.92 ? 'budget' : index >= 1.08 ? 'premium' : 'mid';
}

type Props = {
  zip: string;
  value: string | null;
  storeName: string | null;
  onPick: (chainId: string) => void;
  onStoreName: (name: string) => void;
};

/**
 * O13 store picker: chains with stores in the user's state first, then nationwide chains, then a
 * searchable list of every chain, plus "Other / local store" with an optional typed name.
 */
export function StorePicker({ zip, value, storeName, onPick, onStoreName }: Props) {
  const groups = useMemo(() => storeGroups(zip, content.regions, content.chains), [zip]);
  const pickedInMore = groups.more.some((ch) => ch.id === value);
  const [showMore, setShowMore] = useState(pickedInMore);
  const [query, setQuery] = useState('');

  const card = (ch: Chain) => (
    <OptionCard
      key={ch.id}
      label={ch.name}
      sublabel={[ch.family, c.tiers[tierOf(ch.index)]].filter(Boolean).join(' · ')}
      selected={value === ch.id}
      onPress={() => onPick(ch.id)}
      testID={`store-${ch.id}`}
    />
  );

  const q = query.trim().toLowerCase();
  const more = q
    ? [...groups.near, ...groups.nationwide, ...groups.more].filter(
        (ch) => ch.name.toLowerCase().includes(q) || ch.family?.toLowerCase().includes(q),
      )
    : groups.more;

  return (
    <View style={styles.wrap}>
      {groups.near.length > 0 ? (
        <View style={styles.group}>
          <Text variant="caption" color="textSecondary">
            {format(c.near, { state: groups.state ?? '' }).toUpperCase()}
          </Text>
          {groups.near.map(card)}
        </View>
      ) : null}
      <View style={styles.group}>
        <Text variant="caption" color="textSecondary">
          {(groups.near.length > 0 ? c.nationwide : c.nearUnknown).toUpperCase()}
        </Text>
        {groups.nationwide.map(card)}
      </View>

      {showMore ? (
        <View style={styles.group}>
          <TextField
            label={c.search}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            testID="store-search"
          />
          {more.map(card)}
          {q && more.length === 0 ? (
            <Text variant="callout" color="textSecondary">
              {format(c.noMatch, { query })}
            </Text>
          ) : null}
          <TextButton label={c.hideMore} onPress={() => setShowMore(false)} />
        </View>
      ) : (
        <TextButton
          label={format(c.more, { count: groups.more.length })}
          onPress={() => setShowMore(true)}
          testID="store-more"
        />
      )}

      {groups.other ? (
        <View style={styles.group}>
          {card(groups.other)}
          {value === 'other' ? (
            <>
              <TextField
                label={c.otherName}
                value={storeName ?? ''}
                onChangeText={onStoreName}
                maxLength={40}
                testID="store-other-name"
              />
              <Text variant="caption" color="textSecondary">
                {c.otherNote}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  group: { gap: space.sm },
});
