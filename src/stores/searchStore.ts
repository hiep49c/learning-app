/**
 * SearchStore — manages search state and delegates to SearchService.
 *
 * Supports searching lessons, keywords, and code examples.
 * Maintains recent searches (max 10, no duplicates).
 * Uses Zustand with immer middleware.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import * as SearchService from '@/services/SearchService';
import type { SearchResults } from '@/services/SearchService';

// ─── Constants ───

const MAX_RECENT_SEARCHES = 10;

// ─── Types ───

interface SearchState {
  query: string;
  results: SearchResults;
  isSearching: boolean;
  recentSearches: string[];
}

interface SearchActions {
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  addRecentSearch: (query: string) => void;
}

// ─── Initial state ───

const EMPTY_RESULTS: SearchResults = {
  lessons: [],
  keywords: [],
  codeExamples: [],
};

// ─── Store ───

export const useSearchStore = create<SearchState & SearchActions>()(
  immer((set) => ({
    // State
    query: '',
    results: EMPTY_RESULTS,
    isSearching: false,
    recentSearches: [],

    // Actions
    search: async (query: string): Promise<void> => {
      set((state) => {
        state.query = query;
        state.isSearching = true;
      });

      try {
        const results = await SearchService.searchAll(query);

        set((state) => {
          state.results = results;
          state.isSearching = false;
        });
      } catch (error) {
        console.error('[SearchStore] search failed:', error);
        set((state) => {
          state.results = EMPTY_RESULTS;
          state.isSearching = false;
        });
      }
    },

    clearSearch: (): void => {
      set((state) => {
        state.query = '';
        state.results = EMPTY_RESULTS;
        state.isSearching = false;
      });
    },

    addRecentSearch: (query: string): void => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return;

      set((state) => {
        // Remove duplicate if exists
        const filtered = state.recentSearches.filter((s) => s !== trimmed);
        // Add to front, cap at max
        state.recentSearches = [trimmed, ...filtered].slice(
          0,
          MAX_RECENT_SEARCHES,
        );
      });
    },
  })),
);
