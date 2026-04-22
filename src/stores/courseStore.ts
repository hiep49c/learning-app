/**
 * CourseStore — manages course tree structure and navigation state.
 *
 * Loads modules sorted by order_index with lesson counts.
 * Delegates module unlock checks to ModuleUnlockService.
 * Uses Zustand with immer middleware.
 *
 * Requirements: 1.1, 1.3, 1.4
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Module from '@/database/models/Module';
import * as ModuleUnlockService from '@/services/ModuleUnlockService';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ───

export interface ModuleData {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
}

interface CourseState {
  modules: ModuleData[];
  expandedModules: Record<string, boolean>;
  selectedLessonId: string | null;
  isLoading: boolean;
}

interface CourseActions {
  loadCourseTree: () => Promise<void>;
  toggleModule: (moduleId: string) => void;
  selectLesson: (lessonId: string) => void;
  isModuleUnlocked: (moduleId: string) => Promise<boolean>;
}

// ─── Helpers ───

function toModuleData(record: Module): ModuleData {
  return {
    id: record.id,
    title: record.title,
    titleVi: record.titleVi,
    description: record.description,
    orderIndex: record.orderIndex,
    difficultyLevel: record.difficultyLevel,
    iconName: record.iconName,
    lessonCount: record.lessonCount,
  };
}

// ─── Store ───

export const useCourseStore = create<CourseState & CourseActions>()(
  immer((set) => ({
    // State
    modules: [],
    expandedModules: {} as Record<string, boolean>,
    selectedLessonId: null,
    isLoading: false,

    // Actions
    loadCourseTree: async (): Promise<void> => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        const records = await database
          .get<Module>('modules')
          .query(Q.sortBy('order_index', Q.asc))
          .fetch();

        const modules = records.map(toModuleData);

        set((state) => {
          state.modules = modules;
          state.isLoading = false;
        });
      } catch (error) {
        console.error('[CourseStore] loadCourseTree failed:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    toggleModule: (moduleId: string): void => {
      set((state) => {
        if (state.expandedModules[moduleId]) {
          delete state.expandedModules[moduleId];
        } else {
          state.expandedModules[moduleId] = true;
        }
      });
    },

    selectLesson: (lessonId: string): void => {
      set((state) => {
        state.selectedLessonId = lessonId;
      });
    },

    isModuleUnlocked: async (moduleId: string): Promise<boolean> => {
      try {
        const userId = useAuthStore.getState().currentUser?.id;
        if (!userId) return false;

        const prerequisites =
          await ModuleUnlockService.getPrerequisites(moduleId);
        const completedModules =
          await ModuleUnlockService.getCompletedModuleIds(userId);

        return ModuleUnlockService.isModuleUnlocked(
          moduleId,
          prerequisites,
          completedModules,
        );
      } catch (error) {
        console.error('[CourseStore] isModuleUnlocked failed:', error);
        return false;
      }
    },
  })),
);
