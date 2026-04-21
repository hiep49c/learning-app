/**
 * ThemeProvider — wraps the app in React Native Paper's PaperProvider
 * with theme selection (light / dark / system).
 *
 * Persists the user's preference in AsyncStorage under key `@theme`.
 * Falls back to the device color scheme when preference is 'system'.
 */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MD3Theme } from 'react-native-paper';

import {
  lightTheme,
  darkTheme,
  DEFAULT_FONT_SIZE_MULTIPLIER,
} from './index';
import type { ThemePreference } from './index';

// ─── AsyncStorage keys ───────────────────────────────────────────────────────

const THEME_KEY = '@theme';
const FONT_SIZE_KEY = '@font_size';

// ─── Context value ───────────────────────────────────────────────────────────

export interface ThemeContextValue {
  /** The resolved MD3 theme object. */
  theme: MD3Theme;
  /** Whether the current resolved theme is dark. */
  isDark: boolean;
  /** The raw user preference ('light' | 'dark' | 'system'). */
  preference: ThemePreference;
  /** Toggle between light ↔ dark. Resets 'system' to the opposite of current. */
  toggleTheme: () => void;
  /** Set an explicit preference. */
  setPreference: (pref: ThemePreference) => void;
  /** Current font-size multiplier (0.8 – 1.4). */
  fontSizeMultiplier: number;
  /** Update the font-size multiplier and persist it. */
  setFontSizeMultiplier: (multiplier: number) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider component ──────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(
    DEFAULT_FONT_SIZE_MULTIPLIER,
  );
  const [isReady, setIsReady] = useState(false);

  // ── Load persisted values on mount ──────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [storedTheme, storedFontSize] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(FONT_SIZE_KEY),
        ]);

        if (cancelled) return;

        if (
          storedTheme === 'light' ||
          storedTheme === 'dark' ||
          storedTheme === 'system'
        ) {
          setPreferenceState(storedTheme);
        }

        if (storedFontSize !== null) {
          const parsed = parseFloat(storedFontSize);
          if (!Number.isNaN(parsed) && parsed >= 0.8 && parsed <= 1.4) {
            setFontSizeMultiplierState(parsed);
          }
        }
      } catch {
        // Silently fall back to defaults — AsyncStorage may not be available in tests.
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Resolve theme ───────────────────────────────────────────────────────

  const isDark = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark';
    }
    return preference === 'dark';
  }, [preference, systemScheme]);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => {
      // Best-effort persistence.
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    setPreference(next);
  }, [isDark, setPreference]);

  const setFontSizeMultiplier = useCallback((multiplier: number) => {
    const clamped = Math.min(1.4, Math.max(0.8, multiplier));
    setFontSizeMultiplierState(clamped);
    AsyncStorage.setItem(FONT_SIZE_KEY, String(clamped)).catch(() => {
      // Best-effort persistence.
    });
  }, []);

  // ── Context value (stable reference) ────────────────────────────────────

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark,
      preference,
      toggleTheme,
      setPreference,
      fontSizeMultiplier,
      setFontSizeMultiplier,
    }),
    [
      theme,
      isDark,
      preference,
      toggleTheme,
      setPreference,
      fontSizeMultiplier,
      setFontSizeMultiplier,
    ],
  );

  // Don't render children until persisted values are loaded to avoid flash.
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}
