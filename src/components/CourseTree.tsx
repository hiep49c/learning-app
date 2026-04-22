/**
 * CourseTree — renders the module/lesson hierarchy as an expandable tree.
 *
 * All modules are freely accessible — no locking system.
 * Each module is an expandable header with icon, title, difficulty badge,
 * and progress bar. Each lesson is a tappable row with title and completion
 * checkmark.
 *
 * Uses custom expandable sections (TouchableRipple + View) instead of
 * List.Accordion to avoid rendering issues with description render functions.
 *
 * Requirements: 1.1, 1.3, 12.2
 */
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Chip,
  Icon,
  ProgressBar,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// ─── Data interfaces ─────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  titleVi: string;
  orderIndex: number;
}

interface ModuleData {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
  lessons: LessonData[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CourseTreeProps {
  /** All modules with their lessons. */
  modules: ModuleData[];
  /** Set of currently expanded module IDs. */
  expandedModules: Set<string>;
  /** Toggle a module's expanded/collapsed state. */
  onToggleModule: (id: string) => void;
  /** Navigate to a lesson. */
  onSelectLesson: (id: string) => void;
  /** Module completion percentages (0–100). */
  moduleProgress: Record<string, number>;
  /** Set of completed lesson IDs. */
  completedLessons: Set<string>;
}

// ─── Difficulty badge colors ─────────────────────────────────────────────────

interface DifficultyStyle {
  label: string;
  backgroundColor: string;
  textColor: string;
}

function getDifficultyStyle(level: string): DifficultyStyle {
  switch (level.toLowerCase()) {
    case 'beginner':
      return { label: 'Beginner', backgroundColor: '#E8F5E9', textColor: '#2E7D32' };
    case 'intermediate':
      return { label: 'Intermediate', backgroundColor: '#E3F2FD', textColor: '#1565C0' };
    case 'advanced':
      return { label: 'Advanced', backgroundColor: '#FFF3E0', textColor: '#E65100' };
    case 'expert':
      return { label: 'Expert', backgroundColor: '#FFEBEE', textColor: '#C62828' };
    default:
      return { label: level, backgroundColor: '#F5F5F5', textColor: '#616161' };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CourseTree({
  modules,
  expandedModules,
  onToggleModule,
  onSelectLesson,
  moduleProgress,
  completedLessons,
}: CourseTreeProps) {
  const theme = useTheme<MD3Theme>();

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.orderIndex - b.orderIndex),
    [modules],
  );

  const renderLesson = useCallback(
    (lesson: LessonData) => {
      const isCompleted = completedLessons.has(lesson.id);

      return (
        <TouchableRipple
          key={lesson.id}
          onPress={() => {
            onSelectLesson(lesson.id);
          }}
          accessibilityLabel={`${lesson.titleVi || lesson.title}${isCompleted ? ', đã hoàn thành' : ''}`}
          accessibilityRole="button"
          style={styles.lessonItem}
        >
          <View style={styles.lessonRow}>
            <View style={styles.lessonIconContainer}>
              <Icon
                source={isCompleted ? 'check-circle' : 'circle-outline'}
                size={20}
                color={
                  isCompleted
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
            </View>
            <Text
              variant="bodyMedium"
              style={[
                styles.lessonTitle,
                { color: theme.colors.onSurface },
              ]}
              numberOfLines={2}
            >
              {lesson.titleVi || lesson.title}
            </Text>
          </View>
        </TouchableRipple>
      );
    },
    [completedLessons, onSelectLesson, theme],
  );

  return (
    <View style={styles.container}>
      {sortedModules.map((mod) => {
        const progress = moduleProgress[mod.id] ?? 0;
        const isExpanded = expandedModules.has(mod.id);
        const difficulty = getDifficultyStyle(mod.difficultyLevel);
        const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;
        const sortedLessons = [...mod.lessons].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );

        return (
          <View key={mod.id}>
            {/* Module header — tappable to expand/collapse */}
            <TouchableRipple
              onPress={() => {
                onToggleModule(mod.id);
              }}
              accessibilityLabel={`Module: ${mod.titleVi || mod.title}${isExpanded ? ', đang mở' : ', đã đóng'}`}
              accessibilityRole="button"
              style={[
                styles.moduleContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.moduleHeader}>
                <View style={styles.moduleTopRow}>
                  <View style={styles.moduleTitleRow}>
                    <Icon
                      source={mod.iconName || 'book-outline'}
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.moduleTitle,
                        { color: theme.colors.onSurface },
                      ]}
                      numberOfLines={2}
                    >
                      {mod.titleVi || mod.title}
                    </Text>
                  </View>
                  <Icon
                    source={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.moduleMeta}>
                  <Chip
                    mode="flat"
                    compact
                    textStyle={[styles.difficultyText, { color: difficulty.textColor }]}
                    style={[styles.difficultyChip, { backgroundColor: difficulty.backgroundColor }]}
                  >
                    {difficulty.label}
                  </Chip>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {mod.lessonCount} bài học
                  </Text>
                </View>

                <View style={styles.progressRow}>
                  <ProgressBar
                    progress={normalizedProgress}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                    accessibilityLabel={`Tiến trình: ${progress} phần trăm`}
                  />
                  <Text
                    variant="labelSmall"
                    style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {progress}%
                  </Text>
                </View>
              </View>
            </TouchableRipple>

            {/* Lessons — conditionally rendered when expanded */}
            {isExpanded && (
              <View style={styles.lessonsContainer}>
                {sortedLessons.map((lesson) => renderLesson(lesson))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  moduleContainer: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  moduleHeader: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  moduleTitle: {
    flex: 1,
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  difficultyChip: {
    height: 24,
  },
  difficultyText: {
    fontSize: 11,
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  lessonsContainer: {
    paddingLeft: 16,
    backgroundColor: 'transparent',
  },
  lessonItem: {
    minHeight: 44,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  lessonIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 28,
  },
});
