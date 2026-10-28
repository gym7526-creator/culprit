/**
 * App-wide constants the owner must confirm before launch.
 * TODO(owner): replace with the real hosted Terms of Use and Privacy Policy pages.
 */
export const LINKS = {
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacy: 'https://culprit.app/privacy',
} as const;

/** TODO(owner): the real support address. */
export const SUPPORT_EMAIL = 'support@culprit.app';

/** Skin mode (spec §12) ships behind this flag: `EXPO_PUBLIC_FEATURE_SKIN=1`, or the debug screen switch. */
export const FEATURE_SKIN_DEFAULT = process.env.EXPO_PUBLIC_FEATURE_SKIN === '1';
