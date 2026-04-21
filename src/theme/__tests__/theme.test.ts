import {
  lightTheme,
  darkTheme,
  MONOSPACE_FONT,
  SYSTEM_FONT,
  DEFAULT_FONT_SIZE_MULTIPLIER,
} from '../index';
import type { ThemePreference } from '../index';

describe('Theme definitions', () => {
  it('lightTheme has light mode flag', () => {
    expect(lightTheme.dark).toBe(false);
  });

  it('darkTheme has dark mode flag', () => {
    expect(darkTheme.dark).toBe(true);
  });

  it('lightTheme primary color is teal-blue', () => {
    expect(lightTheme.colors.primary).toBe('#0077B6');
  });

  it('darkTheme primary color is lighter variant', () => {
    expect(darkTheme.colors.primary).toBe('#8ECFF2');
  });

  it('lightTheme background is near-white', () => {
    expect(lightTheme.colors.background).toBe('#FAFCFF');
  });

  it('darkTheme background is dark', () => {
    expect(darkTheme.colors.background).toBe('#111416');
  });

  it('both themes define all elevation levels', () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(theme.colors.elevation.level0).toBeDefined();
      expect(theme.colors.elevation.level1).toBeDefined();
      expect(theme.colors.elevation.level2).toBeDefined();
      expect(theme.colors.elevation.level3).toBeDefined();
      expect(theme.colors.elevation.level4).toBeDefined();
      expect(theme.colors.elevation.level5).toBeDefined();
    }
  });

  it('both themes have fonts configured', () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(theme.fonts).toBeDefined();
      expect(theme.fonts.bodyLarge).toBeDefined();
      expect(theme.fonts.titleMedium).toBeDefined();
    }
  });
});

describe('Font constants', () => {
  it('MONOSPACE_FONT is defined', () => {
    expect(MONOSPACE_FONT).toBeDefined();
    expect(typeof MONOSPACE_FONT).toBe('string');
  });

  it('SYSTEM_FONT is defined', () => {
    expect(SYSTEM_FONT).toBeDefined();
    expect(typeof SYSTEM_FONT).toBe('string');
  });
});

describe('Defaults', () => {
  it('DEFAULT_FONT_SIZE_MULTIPLIER is 1.0', () => {
    expect(DEFAULT_FONT_SIZE_MULTIPLIER).toBe(1.0);
  });

  it('ThemePreference type accepts valid values', () => {
    const prefs: ThemePreference[] = ['light', 'dark', 'system'];
    expect(prefs).toHaveLength(3);
  });
});
