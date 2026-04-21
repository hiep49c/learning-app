/**
 * CourseTreeScreen — renders the module/lesson hierarchy with progress and unlock status.
 *
 * Features:
 * - Render CourseTree component with data from useCourseStore
 * - Load course tree on mount
 * - Wire onToggleModule and onSelectLesson
 * - Load module progress and unlock status
 *
 * Requirements: 1.1, 1.3, 12.2
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type LessonProgress from '@/database/models/LessonProgress';
import { CourseTree } from '@/components/CourseTree';
import { useCourseStore } from '@/stores/courseStore';
import { useProgressStore } from '@/stores/progressStore';
import { useAuthStore } from '@/stores/authStore';
import * as ModuleUnlockService from '@/services/ModuleUnlockService';

// ─── Types ───

interface ModuleWithLessons {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
  lessons: Array<{
    id: string;
    title: string;
    titleVi: string;
    orderIndex: number;
  }>;
  prerequisiteNames?: string[];
}

// ─── Component ───

export default function CourseTreeScreen() {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { modules, expandedModules, toggleModule, loadCourseTree } = useCourseStore();
  const { moduleProgress, loadProgress } = useProgressStore();

  const [isLoading, setIsLoading] = useState(true);
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [unlockedModules, setUnlockedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // ── Load data on mount ──

  useEffect(() => {
    async function init() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        await Promise.all([loadCourseTree(), loadProgress()]);
      } catch {
        // Errors handled by stores
      }
    }
    void init();
  }, [currentUser, loadCourseTree, loadProgress]);

  // ── Build module data with lessons ──

  useEffect(() => {
    async function buildModuleData() {
      if (modules.length === 0 || !currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userId = currentUser.id;

        // Get completed module IDs for unlock checks
        const completedModuleIds = await ModuleUnlockService.getCompletedModuleIds(userId);

        // Get completed lesson IDs
        const completedRecords = await database
          .get<LessonProgress>('lesson_progress')
          .query(Q.where('user_id', userId), Q.where('is_completed', true))
          .fetch();
        const completedLessonIds = new Set(
          completedRecords.map((r) => (r._raw as Record<string, unknown>).lesson_id as string),
        );
        setCompletedLessons(completedLessonIds);

        // Build modules with lessons and unlock status
        const unlocked = new Set<string>();
        const modulesData: ModuleWithLessons[] = [];

        for (const mod of modules) {
          // Get lessons for this module
          const lessons = await database
            .get<Lesson>('lessons')
            .query(Q.where('module_id', mod.id), Q.sortBy('order_index', Q.asc))
            .fetch();

          // Check unlock status
          const prerequisites = await ModuleUnlockService.getPrerequisites(mod.id);
          const isUnlocked = ModuleUnlockService.isModuleUnlocked(
            mod.id,
            prerequisites,
            completedModuleIds,
          );
          if (isUnlocked) {
            unlocked.add(mod.id);
          }

          // Get prerequisite module names for lock message
          let prerequisiteNames: string[] = [];
          if (!isUnlocked && prerequisites.length > 0) {
            const prereqModules = modules.filter((m) => prerequisites.includes(m.id));
            prerequisiteNames = prereqModules.map((m) => m.titleVi || m.title);
          }

          modulesData.push({
            id: mod.id,
            title: mod.title,
            titleVi: mod.titleVi,
            description: mod.description,
            orderIndex: mod.orderIndex,
            difficultyLevel: mod.difficultyLevel,
            iconName: mod.iconName,
            lessonCount: mod.lessonCount,
            lessons: lessons.map((l) => ({
              id: l.id,
              title: l.title,
              titleVi: l.titleVi,
              orderIndex: l.orderIndex,
            })),
            prerequisiteNames,
          });
        }

        setUnlockedModules(unlocked);
        setModulesWithLessons(modulesData);
      } catch (error) {
        console.error('[CourseTreeScreen] buildModuleData failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void buildModuleData();
  }, [modules, currentUser]);

  // ── Handlers ──

  const handleToggleModule = useCallback(
    (moduleId: string) => {
      toggleModule(moduleId);
    },
    [toggleModule],
  );

  const handleSelectLesson = useCallback((lessonId: string) => {
    router.push(`/(tabs)/course/${lessonId}`);
  }, []);

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải khóa học" />
      </View>
    );
  }

  // ── Empty state ──

  if (modulesWithLessons.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Chưa có dữ liệu khóa học
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <CourseTree
        modules={modulesWithLessons}
        expandedModules={expandedModules}
        onToggleModule={handleToggleModule}
        onSelectLesson={handleSelectLesson}
        moduleProgress={moduleProgress}
        unlockedModules={unlockedModules}
        completedLessons={completedLessons}
      />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
