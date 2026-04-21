import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../ThemeProvider';
import { useAppTheme } from '../useAppTheme';

// ─── Mock AsyncStorage ───────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock useColorScheme ─────────────────────────────────────────────────────

let mockColorScheme: 'light' | 'dark' | null = 'light';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ThemeProvider + useAppTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColorScheme = 'light';
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('provides a theme context with default values', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current.isDark).toBe(false);
    expect(result.current.preference).toBe('system');
    expect(result.current.fontSizeMultiplier).toBe(1.0);
    expect(result.current.theme.dark).toBe(false);
  });

  it('toggleTheme switches from light to dark', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(true);
    expect(result.current.preference).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@theme', 'dark');
  });

  it('setPreference persists to AsyncStorage', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.setPreference('dark');
    });

    expect(result.current.preference).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@theme', 'dark');
  });

  it('loads persisted theme preference on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@theme') return Promise.resolve('dark');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.preference).toBe('dark');
    });

    expect(result.current.isDark).toBe(true);
  });

  it('loads persisted font size multiplier on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@font_size') return Promise.resolve('1.2');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.fontSizeMultiplier).toBe(1.2);
    });
  });

  it('setFontSizeMultiplier clamps to valid range', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.setFontSizeMultiplier(2.0);
    });
    expect(result.current.fontSizeMultiplier).toBe(1.4);

    act(() => {
      result.current.setFontSizeMultiplier(0.5);
    });
    expect(result.current.fontSizeMultiplier).toBe(0.8);
  });

  it('ignores invalid persisted font size', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@font_size') return Promise.resolve('not-a-number');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.fontSizeMultiplier).toBe(1.0);
    });
  });

  it('ignores invalid persisted theme preference', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@theme') return Promise.resolve('invalid-value');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.preference).toBe('system');
    });
  });
});

describe('useAppTheme outside provider', () => {
  it('throws when used outside ThemeProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppTheme());
    }).toThrow('useAppTheme must be used within a <ThemeProvider>');

    spy.mockRestore();
  });
});
