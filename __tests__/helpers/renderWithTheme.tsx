import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeScope, type ColorScheme } from '@/theme';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Renders inside the providers every component expects, in the given color scheme. */
export function renderWithTheme(ui: ReactElement, scheme: ColorScheme = 'light') {
  return render(
    <GestureHandlerRootView>
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeScope scheme={scheme}>{ui}</ThemeScope>
      </SafeAreaProvider>
    </GestureHandlerRootView>,
  );
}
