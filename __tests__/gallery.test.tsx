import { screen } from '@testing-library/react-native';

import Gallery from '../app/gallery';
import { galleryCopy } from '@/copy';
import { type ColorScheme } from '@/theme';

import { renderWithTheme } from './helpers/renderWithTheme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  Redirect: () => null,
}));

const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

describe('design gallery (dev)', () => {
  it.each(SCHEMES)('renders every section in %s mode', async (scheme) => {
    await renderWithTheme(<Gallery />, scheme);
    for (const title of Object.values(galleryCopy.sections)) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
  });
});
