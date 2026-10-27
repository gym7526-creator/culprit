import type { TextStyle } from 'react-native';

/** Font family names as registered by `useFonts` in app/_layout.tsx. */
export const fonts = {
  headingBold: 'PlusJakartaSans_700Bold',
  headingSemiBold: 'PlusJakartaSans_600SemiBold',
  headingMedium: 'PlusJakartaSans_500Medium',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export type TextVariant =
  'display' | 'title' | 'headline' | 'body' | 'bodyStrong' | 'callout' | 'caption' | 'button';

/**
 * Type scale (spec §7.2). Plus Jakarta Sans for headings + buttons, Inter for body and small text.
 * No fixed heights anywhere: Dynamic Type must be able to grow these.
 */
export const typography: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.headingBold, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.headingBold, fontSize: 28, lineHeight: 34 },
  headline: { fontFamily: fonts.headingSemiBold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.bodyRegular, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.headingSemiBold, fontSize: 17, lineHeight: 22 },
};
