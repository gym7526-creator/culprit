/**
 * Design tokens (spec §7.2). Every color and size used in styles must come from here.
 *
 * Additions beyond the spec (see CLAUDE.md → Design system):
 * - `*Ink`: text-safe variants of status colors (the base mint/amber/coral fail 4.5:1 as text).
 * - `*Soft`: tinted fills behind status text (pills, banners).
 * - `onBrand`: label color on brand fills (white in light; near-black in dark for contrast).
 */

export type ColorScheme = 'light' | 'dark';

export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  brand: string;
  brandSoft: string;
  brandInk: string;
  onBrand: string;
  good: string;
  goodSoft: string;
  goodInk: string;
  partial: string;
  partialSoft: string;
  partialInk: string;
  trigger: string;
  triggerSoft: string;
  triggerInk: string;
  unclear: string;
  unclearSoft: string;
  unclearInk: string;
  overlay: string;
  shadow: string;
};

export const palette: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#FBFAF7',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F1EC',
    textPrimary: '#15141A',
    textSecondary: '#5E5B66',
    border: '#E7E4DD',
    brand: '#6C4CF1',
    brandSoft: '#EEE9FF',
    brandInk: '#5B3AE0',
    onBrand: '#FFFFFF',
    good: '#18B785',
    goodSoft: '#E3F7F0',
    goodInk: '#0B7A57',
    partial: '#F2A93B',
    partialSoft: '#FDF1DE',
    partialInk: '#9A5B00',
    trigger: '#F0544F',
    triggerSoft: '#FDE7E6',
    triggerInk: '#C2312C',
    unclear: '#9A97A3',
    unclearSoft: '#EFEEF2',
    unclearInk: '#66636E',
    overlay: 'rgba(21, 20, 26, 0.4)',
    shadow: '#000000',
  },
  dark: {
    bg: '#0E0E12',
    surface: '#17171D',
    surfaceAlt: '#1F1F27',
    textPrimary: '#F4F3F0',
    textSecondary: '#A9A6B2',
    border: '#2A2A33',
    brand: '#8B72FF',
    brandSoft: '#2A2346',
    brandInk: '#A897FF',
    onBrand: '#0E0E12',
    good: '#2BD39E',
    goodSoft: '#12392D',
    goodInk: '#2BD39E',
    partial: '#FFBE55',
    partialSoft: '#3D2E12',
    partialInk: '#FFBE55',
    trigger: '#FF6B66',
    triggerSoft: '#3F1C1C',
    triggerInk: '#FF6B66',
    unclear: '#7D7A87',
    unclearSoft: '#26252E',
    unclearInk: '#A9A6B2',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
};

/** 4-pt grid. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  screen: 20,
} as const;

export const radius = {
  card: 20,
  button: 28,
  chip: 14,
  sheet: 28,
  pill: 999,
} as const;

/** Component sizes (pt). Heights are minimums unless noted, so Dynamic Type never clips. */
export const size = {
  minTouch: 44,
  button: 56,
  optionCard: 64,
  chip: 36,
  progressBar: 6,
  face: 64,
  optionEmoji: 28,
  faceEmoji: 30,
  heroEmoji: 56,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  ring: 120,
  ringStroke: 12,
  budgetBar: 10,
  sliderTrack: 6,
  sliderThumb: 28,
  wheelItem: 44,
  wheelVisibleItems: 5,
  sheetHandleWidth: 40,
  sheetHandleHeight: 5,
  stepperButton: 44,
  confettiPiece: 8,
  hairline: 1,
  selectedBorder: 2,
  bannerBorder: 1.5,
  ctaFade: 24,
  galleryPreview: 220,
} as const;

/** One soft shadow (light mode only; dark mode uses borders). */
export const elevation = {
  offsetY: 4,
  blur: 16,
  opacity: 0.06,
  androidElevation: 3,
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  autoAdvance: 250,
  toast: 2600,
  confetti: 1100,
  pressedScale: 0.95,
  selectedPop: 1.03,
  /** Press: quick squeeze in, then a small overshoot pop on release that settles fast. */
  pressIn: 70,
  popOut: 90,
  popScale: 1.035,
  popSpring: { damping: 12, stiffness: 420, mass: 0.5 },
  spring: { damping: 15, stiffness: 220, mass: 0.6 },
  /** Wheel picker snap. */
  wheelSnap: 180,
} as const;

export const opacity = {
  disabled: 0.4,
  pressed: 0.7,
  locked: 0.55,
} as const;

/**
 * Dinner card gradients (MVP image style: gradient + large emoji, spec §5.2 Images option b).
 * Keyed by cuisine group; recipes map to these via `imageKey` in Phase 1.
 */
export type GradientKey =
  'american' | 'mexican' | 'italian' | 'asian' | 'mediterranean' | 'sheetPan' | 'bowls' | 'soups';

export const gradients: Record<ColorScheme, Record<GradientKey, readonly [string, string]>> = {
  light: {
    american: ['#FFE3C7', '#FFC9A3'],
    mexican: ['#FFE0D6', '#FFB8A1'],
    italian: ['#FCE4E1', '#F7C2BC'],
    asian: ['#E3F4E8', '#BFE6CC'],
    mediterranean: ['#E2EEFC', '#BDD7F7'],
    sheetPan: ['#FFF0CC', '#FFDC8F'],
    bowls: ['#EEE9FF', '#D6CCFF'],
    soups: ['#F3EBDD', '#E5D3B5'],
  },
  dark: {
    american: ['#3A2A1C', '#4A3220'],
    mexican: ['#3D231C', '#4D2A20'],
    italian: ['#3B2124', '#4B272B'],
    asian: ['#1C3326', '#21402E'],
    mediterranean: ['#1C2A3D', '#22344D'],
    sheetPan: ['#3A3119', '#4A3D1C'],
    bowls: ['#2A2346', '#342B58'],
    soups: ['#352E24', '#43392B'],
  },
};
