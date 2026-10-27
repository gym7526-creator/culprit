import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

import { usePrefsStore } from '@/features/prefsStore';

import { elevation, palette, type ColorScheme, type ColorTokens } from './tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  /** The single soft shadow in light mode; a hairline border in dark mode. */
  elevated: ViewStyle;
};

export function buildTheme(scheme: ColorScheme): Theme {
  const colors = palette[scheme];
  const elevated: ViewStyle =
    scheme === 'light'
      ? {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: elevation.offsetY },
          shadowRadius: elevation.blur / 2,
          shadowOpacity: elevation.opacity,
          elevation: elevation.androidElevation,
        }
      : { borderWidth: 1, borderColor: colors.border };
  return { scheme, colors, elevated };
}

const themes: Record<ColorScheme, Theme> = { light: buildTheme('light'), dark: buildTheme('dark') };

const ThemeContext = createContext<Theme>(themes.light);

/** Follows the system scheme unless the user (or the dev gallery) set an override in prefs. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const override = usePrefsStore((s) => s.themeOverride);
  const scheme: ColorScheme = override ?? (system === 'dark' ? 'dark' : 'light');
  const value = useMemo(() => themes[scheme], [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Forces a scheme for a subtree (used by the gallery's side-by-side preview and tests). */
export function ThemeScope({ scheme, children }: PropsWithChildren<{ scheme: ColorScheme }>) {
  return <ThemeContext.Provider value={themes[scheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
