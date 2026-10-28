import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = '@taichi_settings';

interface SettingsState {
  themeMode: ThemeMode;
  fontScale: number; // 0.8 .. 1.4
  ttsRate: number; // 0.5 .. 2
  loaded: boolean;
}
interface SettingsActions {
  load: () => Promise<void>;
  setThemeMode: (m: ThemeMode) => Promise<void>;
  setFontScale: (v: number) => Promise<void>;
  setTtsRate: (v: number) => Promise<void>;
}

async function persist(state: Pick<SettingsState, 'themeMode' | 'fontScale' | 'ttsRate'>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  immer((set, get) => ({
    themeMode: 'system',
    fontScale: 1,
    ttsRate: 1,
    loaded: false,

    load: async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        set((s) => {
          s.themeMode = p.themeMode ?? 'system';
          s.fontScale = p.fontScale ?? 1;
          s.ttsRate = p.ttsRate ?? 1;
          s.loaded = true;
        });
      } else {
        set((s) => {
          s.loaded = true;
        });
      }
    },

    setThemeMode: async (m) => {
      set((s) => {
        s.themeMode = m;
      });
      await persist({ themeMode: m, fontScale: get().fontScale, ttsRate: get().ttsRate });
    },
    setFontScale: async (v) => {
      set((s) => {
        s.fontScale = v;
      });
      await persist({ themeMode: get().themeMode, fontScale: v, ttsRate: get().ttsRate });
    },
    setTtsRate: async (v) => {
      set((s) => {
        s.ttsRate = v;
      });
      await persist({ themeMode: get().themeMode, fontScale: get().fontScale, ttsRate: v });
    },
  })),
);
