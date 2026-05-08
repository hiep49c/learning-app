/**
 * useAppTheme — convenience hook to access the current theme context.
 *
 * Returns the resolved MD3 theme, an `isDark` boolean, the raw preference,
 * toggle / set helpers, and the font-size multiplier.
 */
import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ThemeContextValue } from './ThemeProvider';

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useAppTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
