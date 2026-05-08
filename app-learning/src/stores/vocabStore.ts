/**
 * VocabStore — manages English vocabulary topic tree and navigation state.
 * Filters modules with 'vocab-' prefix from the shared modules table.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Module from '@/database/models/Module';

export interface VocabTopicData {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
}

interface VocabState {
  topics: VocabTopicData[];
  expandedTopics: Record<string, boolean>;
  isLoading: boolean;
}

interface VocabActions {
  loadTopics: () => Promise<void>;
  toggleTopic: (topicId: string) => void;
}

export const useVocabStore = create<VocabState & VocabActions>()(
  immer((set) => ({
    topics: [],
    expandedTopics: {},
    isLoading: false,

    loadTopics: async (): Promise<void> => {
      set((state) => { state.isLoading = true; });
      try {
        const records = await database
          .get<Module>('modules')
          .query(Q.where('id', Q.like('vocab-%')), Q.sortBy('order_index', Q.asc))
          .fetch();

        set((state) => {
          state.topics = records.map((r) => ({
            id: r.id,
            title: r.title,
            titleVi: r.titleVi,
            description: r.description,
            orderIndex: r.orderIndex,
            difficultyLevel: r.difficultyLevel,
            iconName: r.iconName,
            lessonCount: r.lessonCount,
          }));
          state.isLoading = false;
        });
      } catch (error) {
        console.error('[VocabStore] loadTopics failed:', error);
        set((state) => { state.isLoading = false; });
      }
    },

    toggleTopic: (topicId: string): void => {
      set((state) => {
        if (state.expandedTopics[topicId]) {
          delete state.expandedTopics[topicId];
        } else {
          state.expandedTopics[topicId] = true;
        }
      });
    },
  })),
);
