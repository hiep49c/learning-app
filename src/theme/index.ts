/**
 * Theme configuration for React Native Paper MD3.
 *
 * - Light and dark themes with semantic colors suitable for a learning app.
 * - Custom font configuration: system font for UI, monospace for code.
 * - Font size multiplier support via AsyncStorage key `@font_size`.
 */
import { Platform } from 'react-native';
import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// ─── Font families ───────────────────────────────────────────────────────────

const SYSTEM_FONT = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const MONOSPACE_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// ─── Font configuration (MD3) ────────────────────────────────────────────────

const baseFontConfig = {
  fontFamily: SYSTEM_FONT,
} as const;

const fontConfig = configureFonts({
  config: {
    displayLarge: baseFontConfig,
    displayMedium: baseFontConfig,
    displaySmall: baseFontConfig,
    headlineLarge: baseFontConfig,
    headlineMedium: baseFontConfig,
    headlineSmall: baseFontConfig,
    titleLarge: baseFontConfig,
    titleMedium: baseFontConfig,
    titleSmall: baseFontConfig,
    bodyLarge: baseFontConfig,
    bodyMedium: baseFontConfig,
    bodySmall: baseFontConfig,
    labelLarge: baseFontConfig,
    labelMedium: baseFontConfig,
    labelSmall: baseFontConfig,
  },
});

// ─── Light theme ─────────────────────────────────────────────────────────────

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0077B6',           // Teal-blue — calm, suitable for learning
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8E6F5',
    onPrimaryContainer: '#001F2A',
    secondary: '#4A6572',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CDE5F0',
    onSecondaryContainer: '#052029',
    tertiary: '#5C6BC0',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#DEE0FF',
    onTertiaryContainer: '#151A5C',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FAFCFF',
    onBackground: '#191C1E',
    surface: '#FAFCFF',
    onSurface: '#191C1E',
    surfaceVariant: '#DDE3EA',
    onSurfaceVariant: '#41484D',
    outline: '#72787E',
    outlineVariant: '#C1C7CE',
    inverseSurface: '#2E3133',
    inverseOnSurface: '#F0F1F3',
    inversePrimary: '#8ECFF2',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#EEF4FA',
      level2: '#E6EFF7',
      level3: '#DEEAF4',
      level4: '#DCE9F3',
      level5: '#D6E5F1',
    },
    surfaceDisabled: 'rgba(25, 28, 30, 0.12)',
    onSurfaceDisabled: 'rgba(25, 28, 30, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    shadow: '#000000',
    scrim: '#000000',
  },
};

// ─── Dark theme ──────────────────────────────────────────────────────────────

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8ECFF2',
    onPrimary: '#003548',
    primaryContainer: '#004D67',
    onPrimaryContainer: '#C8E6F5',
    secondary: '#B1C9D6',
    onSecondary: '#1C333D',
    secondaryContainer: '#334A55',
    onSecondaryContainer: '#CDE5F0',
    tertiary: '#BDC2FF',
    onTertiary: '#252D72',
    tertiaryContainer: '#3D4589',
    onTertiaryContainer: '#DEE0FF',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#111416',
    onBackground: '#E1E2E5',
    surface: '#111416',
    onSurface: '#E1E2E5',
    surfaceVariant: '#41484D',
    onSurfaceVariant: '#C1C7CE',
    outline: '#8B9198',
    outlineVariant: '#41484D',
    inverseSurface: '#E1E2E5',
    inverseOnSurface: '#2E3133',
    inversePrimary: '#0077B6',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: '#1A2024',
      level2: '#1F272C',
      level3: '#242E34',
      level4: '#263036',
      level5: '#29353B',
    },
    surfaceDisabled: 'rgba(225, 226, 229, 0.12)',
    onSurfaceDisabled: 'rgba(225, 226, 229, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
    scrim: '#000000',
  },
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export { MONOSPACE_FONT, SYSTEM_FONT };

/** Theme preference stored in AsyncStorage under key `@theme`. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Default font size multiplier stored in AsyncStorage under key `@font_size`. */
export const DEFAULT_FONT_SIZE_MULTIPLIER = 1.0;
