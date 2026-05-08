/**
 * BookmarkStore — manages bookmarks and notes with filtering.
 *
 * Delegates to BookmarkService for all database operations.
 * Uses Zustand with immer middleware.
 *
 * Requirements: 14.1, 14.2, 14.3
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import * as BookmarkService from '@/services/BookmarkService';
import type { BookmarkItemType } from '@/services/BookmarkService';
import { showToast } from '@/utils/toast';

// ─── Types ───

export interface BookmarkData {
  id: string;
  itemId: string;
  itemType: string;
  note: string | null;
  createdAt: Date;
}

interface BookmarkState {
  bookmarks: BookmarkData[];
  filterModule: string | null;
  filterType: BookmarkItemType | null;
}

interface BookmarkActions {
  loadBookmarks: (userId: string) => Promise<void>;
  toggleBookmark: (
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
  ) => Promise<void>;
  updateNote: (bookmarkId: string, note: string) => Promise<void>;
  deleteBookmark: (bookmarkId: string, userId: string) => Promise<void>;
  isBookmarked: (userId: string, itemId: string) => Promise<boolean>;
  setFilter: (module?: string | null, type?: BookmarkItemType | null) => void;
}

// ─── Helpers ───

function toBookmarkData(
  record: import('@/database/models/Bookmark').default,
): BookmarkData {
  return {
    id: record.id,
    itemId: record.itemId,
    itemType: record.itemType,
    note: record.note,
    createdAt: record.createdAt,
  };
}

// ─── Store ───

export const useBookmarkStore = create<BookmarkState & BookmarkActions>()(
  immer((set, get) => ({
    // State
    bookmarks: [],
    filterModule: null,
    filterType: null,

    // Actions
    loadBookmarks: async (userId: string): Promise<void> => {
      try {
        const { filterType } = get();
        const records = await BookmarkService.getBookmarks(userId, {
          itemType: filterType ?? undefined,
        });

        set((state) => {
          state.bookmarks = records.map(toBookmarkData);
        });
      } catch (error) {
        console.error('[BookmarkStore] loadBookmarks failed:', error);
      }
    },

    toggleBookmark: async (
      userId: string,
      itemId: string,
      itemType: BookmarkItemType,
    ): Promise<void> => {
      try {
        await BookmarkService.toggleBookmark(userId, itemId, itemType);

        // Reload bookmarks after toggle
        const { filterType } = get();
        const records = await BookmarkService.getBookmarks(userId, {
          itemType: filterType ?? undefined,
        });

        set((state) => {
          state.bookmarks = records.map(toBookmarkData);
        });
      } catch (error) {
        console.error('[BookmarkStore] toggleBookmark failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    updateNote: async (bookmarkId: string, note: string): Promise<void> => {
      try {
        await BookmarkService.updateNote(bookmarkId, note);

        set((state) => {
          const bookmark = state.bookmarks.find((b) => b.id === bookmarkId);
          if (bookmark) {
            bookmark.note = note.slice(0, 500);
          }
        });
      } catch (error) {
        console.error('[BookmarkStore] updateNote failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    deleteBookmark: async (
      bookmarkId: string,
      userId: string,
    ): Promise<void> => {
      try {
        await BookmarkService.deleteBookmark(bookmarkId);

        // Reload bookmarks after delete
        const { filterType } = get();
        const records = await BookmarkService.getBookmarks(userId, {
          itemType: filterType ?? undefined,
        });

        set((state) => {
          state.bookmarks = records.map(toBookmarkData);
        });
      } catch (error) {
        console.error('[BookmarkStore] deleteBookmark failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    isBookmarked: async (
      userId: string,
      itemId: string,
    ): Promise<boolean> => {
      try {
        return await BookmarkService.isBookmarked(userId, itemId);
      } catch (error) {
        console.error('[BookmarkStore] isBookmarked failed:', error);
        return false;
      }
    },

    setFilter: (
      module?: string | null,
      type?: BookmarkItemType | null,
    ): void => {
      set((state) => {
        if (module !== undefined) {
          state.filterModule = module;
        }
        if (type !== undefined) {
          state.filterType = type;
        }
      });
    },
  })),
);
