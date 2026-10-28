import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@taichi_bookmarks';

interface BookmarkState {
  ids: string[];
  loaded: boolean;
}
interface BookmarkActions {
  load: () => Promise<void>;
  toggle: (formId: string) => Promise<void>;
  has: (formId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState & BookmarkActions>()(
  immer((set, get) => ({
    ids: [],
    loaded: false,

    load: async () => {
      const raw = await AsyncStorage.getItem(KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      set((s) => {
        s.ids = ids;
        s.loaded = true;
      });
    },

    toggle: async (formId: string) => {
      const exists = get().ids.includes(formId);
      const next = exists ? get().ids.filter((x) => x !== formId) : [...get().ids, formId];
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      set((s) => {
        s.ids = next;
      });
    },

    has: (formId: string) => get().ids.includes(formId),
  })),
);
