import { contrastRatio, palette, type ColorScheme, type ColorTokens } from '@/theme';

type Pair = [text: keyof ColorTokens, background: keyof ColorTokens];

/** Every text-on-background combination the components actually render. */
const TEXT_PAIRS: readonly Pair[] = [
  ['textPrimary', 'bg'],
  ['textPrimary', 'surface'],
  ['textPrimary', 'surfaceAlt'],
  ['textPrimary', 'brandSoft'], // selected option card
  ['textPrimary', 'partialSoft'], // test banner
  ['textSecondary', 'bg'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'surfaceAlt'],
  ['textSecondary', 'brandSoft'],
  ['onBrand', 'brand'], // primary button label
  ['brandInk', 'bg'],
  ['brandInk', 'surface'],
  ['brandInk', 'brandSoft'], // secondary button, selected chip, eat-by pill
  ['goodInk', 'bg'],
  ['goodInk', 'surface'],
  ['goodInk', 'goodSoft'],
  ['partialInk', 'bg'],
  ['partialInk', 'surface'],
  ['partialInk', 'partialSoft'],
  ['triggerInk', 'bg'],
  ['triggerInk', 'surface'],
  ['triggerInk', 'triggerSoft'],
  ['unclearInk', 'surface'],
  ['unclearInk', 'unclearSoft'],
  ['bg', 'textPrimary'], // neutral toast
];

const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

describe('theme contrast (WCAG AA 4.5:1)', () => {
  for (const scheme of SCHEMES) {
    describe(scheme, () => {
      it.each(TEXT_PAIRS)('%s on %s', (text, background) => {
        const ratio = contrastRatio(palette[scheme][text], palette[scheme][background]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});

describe('spec §7.2 tokens are used verbatim', () => {
  it('keeps the spec light palette', () => {
    expect(palette.light).toMatchObject({
      bg: '#FBFAF7',
      surface: '#FFFFFF',
      surfaceAlt: '#F3F1EC',
      textPrimary: '#15141A',
      textSecondary: '#5E5B66',
      border: '#E7E4DD',
      brand: '#6C4CF1',
      brandSoft: '#EEE9FF',
      good: '#18B785',
      partial: '#F2A93B',
      trigger: '#F0544F',
      unclear: '#9A97A3',
    });
  });

  it('keeps the spec dark palette', () => {
    expect(palette.dark).toMatchObject({
      bg: '#0E0E12',
      surface: '#17171D',
      surfaceAlt: '#1F1F27',
      textPrimary: '#F4F3F0',
      textSecondary: '#A9A6B2',
      border: '#2A2A33',
      brand: '#8B72FF',
      brandSoft: '#2A2346',
      good: '#2BD39E',
      partial: '#FFBE55',
      trigger: '#FF6B66',
      unclear: '#7D7A87',
    });
  });

  it('light and dark define the same tokens', () => {
    expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });
  it('rejects non-hex input', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});
