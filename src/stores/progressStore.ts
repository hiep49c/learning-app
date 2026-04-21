/**
 * ProgressStore — tracks lesson completion, scroll position, and progress calculations.
 *
 * Delegates to ProgressService for all database operations.
 * Uses Zustand with immer middleware.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Module from '@/database/models/Module';
import * as ProgressService from '@/services/ProgressService';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/utils/toast';

// ─── Types ───

interface ProgressState {
  overallProgress: number;
  moduleProgress: Record<string, number>;
  lastLessonId: string | null;
}

interface ProgressActions {
  markLessonComplete: (lessonId: string, timeSpent: number) => Promise<void>;
  updateScrollPosition: (lessonId: string, position: number) => Promise<void>;
  loadProgress: () => Promise<void>;
  getNextLesson: () => Promise<string | null>;
}

// ─── Helpers ───

function getCurrentUserId(): string | null {
  return useAuthStore.getState().currentUser?.id ?? null;
}

// ─── Store ───

export const useProgressStore = create<ProgressState & ProgressActions>()(
  immer((set) => ({
    // State
    overallProgress: 0,
    moduleProgress: {},
    lastLessonId: null,

    // Actions
    markLessonComplete: async (
      lessonId: string,
      timeSpent: number,
    ): Promise<void> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;

        await ProgressService.markLessonComplete(userId, lessonId, timeSpent);

        // Reload progress after marking complete
        const overall = await ProgressService.getOverallCompletion(userId);

        set((state) => {
          state.overallProgress = overall;
          state.lastLessonId = lessonId;
        });
      } catch (error) {
        console.error('[ProgressStore] markLessonComplete failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    updateScrollPosition: async (
      lessonId: string,
      position: number,
    ): Promise<void> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;

        await ProgressService.updateScrollPosition(userId, lessonId, position);
      } catch (error) {
        console.error('[ProgressStore] updateScrollPosition failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    loadProgress: async (): Promise<void> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;

        const overall = await ProgressService.getOverallCompletion(userId);
        const nextLesson = await ProgressService.getNextLesson(userId);

        // Load module-level progress
        const modules = await database
          .get<Module>('modules')
          .query(Q.sortBy('order_index', Q.asc))
          .fetch();

        const moduleProgressMap: Record<string, number> = {};
        for (const mod of modules) {
          const completion = await ProgressService.getModuleCompletion(
            userId,
            mod.id,
          );
          moduleProgressMap[mod.id] = completion;
        }

        set((state) => {
          state.overallProgress = overall;
          state.moduleProgress = moduleProgressMap;
          state.lastLessonId = nextLesson?.id ?? null;
        });
      } catch (error) {
        console.error('[ProgressStore] loadProgress failed:', error);
      }
    },

    getNextLesson: async (): Promise<string | null> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return null;

        const lesson = await ProgressService.getNextLesson(userId);
        return lesson?.id ?? null;
      } catch (error) {
        console.error('[ProgressStore] getNextLesson failed:', error);
        return null;
      }
    },
  })),
);
