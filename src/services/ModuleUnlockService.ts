/**
 * ModuleUnlockService — determines whether a module is unlocked based on prerequisites.
 *
 * A module is unlocked if all its prerequisite modules have been completed by the user.
 * A module with no prerequisites is always unlocked.
 *
 * Requirements: 1.3, 2.4
 */
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type ModulePrerequisite from '@/database/models/ModulePrerequisite';
import type Lesson from '@/database/models/Lesson';
import type LessonProgress from '@/database/models/LessonProgress';

/**
 * Check if a module is unlocked given a set of completed module IDs.
 * Returns true if all prerequisites are in the completed set, or if the module has no prerequisites.
 *
 * This is a pure function — it does not query the database.
 * Use getPrerequisites() and getCompletedModuleIds() to build the inputs.
 */
export function isModuleUnlocked(
  moduleId: string,
  prerequisiteModuleIds: string[],
  completedModuleIds: Set<string>,
): boolean {
  if (prerequisiteModuleIds.length === 0) {
    return true;
  }

  return prerequisiteModuleIds.every((prereqId) =>
    completedModuleIds.has(prereqId),
  );
}

/**
 * Query the module_prerequisites table to get prerequisite module IDs for a given module.
 */
export async function getPrerequisites(moduleId: string): Promise<string[]> {
  const records = await database
    .get<ModulePrerequisite>('module_prerequisites')
    .query(Q.where('module_id', moduleId))
    .fetch();

  return records.map((r) => (r._raw as Record<string, unknown>).prerequisite_module_id as string);
}

/**
 * Determine which modules the user has fully completed.
 * A module is "completed" when all its lessons have is_completed=true in lesson_progress.
 */
export async function getCompletedModuleIds(
  userId: string,
): Promise<Set<string>> {
  // Get all lessons grouped by module
  const allLessons = await database
    .get<Lesson>('lessons')
    .query()
    .fetch();

  // Build a map: moduleId → Set of lessonIds
  const moduleLessons = new Map<string, Set<string>>();
  for (const lesson of allLessons) {
    const moduleId = (lesson._raw as Record<string, unknown>).module_id as string;
    const existing = moduleLessons.get(moduleId);
    if (existing) {
      existing.add(lesson.id);
    } else {
      moduleLessons.set(moduleId, new Set([lesson.id]));
    }
  }

  // Get all completed lesson IDs for this user
  const completedRecords = await database
    .get<LessonProgress>('lesson_progress')
    .query(Q.where('user_id', userId), Q.where('is_completed', true))
    .fetch();

  const completedLessonIds = new Set(
    completedRecords.map((r) => (r._raw as Record<string, unknown>).lesson_id as string),
  );

  // A module is completed if every lesson in it is completed
  const completedModules = new Set<string>();
  for (const [moduleId, lessonIds] of moduleLessons) {
    if (lessonIds.size === 0) continue;

    let allCompleted = true;
    for (const lessonId of lessonIds) {
      if (!completedLessonIds.has(lessonId)) {
        allCompleted = false;
        break;
      }
    }

    if (allCompleted) {
      completedModules.add(moduleId);
    }
  }

  return completedModules;
}
