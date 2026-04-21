/**
 * ProgressService — tracks lesson completion, scroll position, and progress calculations.
 *
 * Uses WatermelonDB for lesson_progress records and AsyncStorage for last_lesson_id.
 * All functions take userId explicitly to support multi-profile.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
import { Q } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { database } from '@/database';
import type LessonProgress from '@/database/models/LessonProgress';
import type Lesson from '@/database/models/Lesson';
import type Module from '@/database/models/Module';

const LAST_LESSON_KEY = '@last_lesson_id';

/**
 * Mark a lesson as completed for the given user.
 * Creates a new lesson_progress record if none exists, or updates the existing one.
 */
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  timeSpent: number,
): Promise<void> {
  const collection = database.get<LessonProgress>('lesson_progress');

  const existing = await collection
    .query(Q.where('user_id', userId), Q.where('lesson_id', lessonId))
    .fetch();

  const now = Date.now();

  if (existing.length > 0) {
    const record = existing[0]!;
    await database.write(async () => {
      await record.update((r) => {
        const raw = r._raw as Record<string, unknown>;
        raw.is_completed = true;
        raw.completed_at = now;
        raw.time_spent_seconds = timeSpent;
        raw.last_accessed_at = now;
      });
    });
  } else {
    await database.write(async () => {
      await collection.create((r) => {
        const raw = r._raw as Record<string, unknown>;
        raw.user_id = userId;
        raw.lesson_id = lessonId;
        raw.is_completed = true;
        raw.completed_at = now;
        raw.time_spent_seconds = timeSpent;
        raw.scroll_position = 0;
        raw.last_accessed_at = now;
      });
    });
  }

  await AsyncStorage.setItem(LAST_LESSON_KEY, lessonId);
}

/**
 * Update the scroll position for a lesson (for resume-learning).
 * Creates a new lesson_progress record if none exists.
 */
export async function updateScrollPosition(
  userId: string,
  lessonId: string,
  position: number,
): Promise<void> {
  const collection = database.get<LessonProgress>('lesson_progress');

  const existing = await collection
    .query(Q.where('user_id', userId), Q.where('lesson_id', lessonId))
    .fetch();

  const now = Date.now();

  if (existing.length > 0) {
    const record = existing[0]!;
    await database.write(async () => {
      await record.update((r) => {
        const raw = r._raw as Record<string, unknown>;
        raw.scroll_position = position;
        raw.last_accessed_at = now;
      });
    });
  } else {
    await database.write(async () => {
      await collection.create((r) => {
        const raw = r._raw as Record<string, unknown>;
        raw.user_id = userId;
        raw.lesson_id = lessonId;
        raw.is_completed = false;
        raw.time_spent_seconds = 0;
        raw.scroll_position = position;
        raw.last_accessed_at = now;
      });
    });
  }

  await AsyncStorage.setItem(LAST_LESSON_KEY, lessonId);
}

/**
 * Return the first uncompleted lesson by module order_index then lesson order_index.
 * Returns null if all lessons are complete.
 */
export async function getNextLesson(userId: string): Promise<Lesson | null> {
  // Get all modules sorted by order_index
  const modules = await database
    .get<Module>('modules')
    .query(Q.sortBy('order_index', Q.asc))
    .fetch();

  // Get all completed lesson IDs for this user
  const completedRecords = await database
    .get<LessonProgress>('lesson_progress')
    .query(Q.where('user_id', userId), Q.where('is_completed', true))
    .fetch();

  const completedLessonIds = new Set(
    completedRecords.map((r) => (r._raw as Record<string, unknown>).lesson_id as string),
  );

  // Iterate modules in order, then lessons in order within each module
  for (const mod of modules) {
    const lessons = await database
      .get<Lesson>('lessons')
      .query(
        Q.where('module_id', mod.id),
        Q.sortBy('order_index', Q.asc),
      )
      .fetch();

    for (const lesson of lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        return lesson;
      }
    }
  }

  return null;
}

/**
 * Calculate module completion percentage for a user.
 * Returns Math.round((completed / total) * 100), or 0 if no lessons.
 */
export async function getModuleCompletion(
  userId: string,
  moduleId: string,
): Promise<number> {
  const totalLessons = await database
    .get<Lesson>('lessons')
    .query(Q.where('module_id', moduleId))
    .fetchCount();

  if (totalLessons === 0) return 0;

  // Get lesson IDs for this module
  const lessons = await database
    .get<Lesson>('lessons')
    .query(Q.where('module_id', moduleId))
    .fetch();

  const lessonIds = lessons.map((l) => l.id);

  const completedCount = await database
    .get<LessonProgress>('lesson_progress')
    .query(
      Q.where('user_id', userId),
      Q.where('lesson_id', Q.oneOf(lessonIds)),
      Q.where('is_completed', true),
    )
    .fetchCount();

  return Math.round((completedCount / totalLessons) * 100);
}

/**
 * Calculate overall course completion percentage for a user.
 * Returns Math.round((completed / total) * 100), or 0 if no lessons.
 */
export async function getOverallCompletion(userId: string): Promise<number> {
  const totalLessons = await database
    .get<Lesson>('lessons')
    .query()
    .fetchCount();

  if (totalLessons === 0) return 0;

  const completedCount = await database
    .get<LessonProgress>('lesson_progress')
    .query(Q.where('user_id', userId), Q.where('is_completed', true))
    .fetchCount();

  return Math.round((completedCount / totalLessons) * 100);
}

/** Exported for testing */
export const _testing = {
  LAST_LESSON_KEY,
};
