/**
 * HomeScreen — resume learning, progress overview, module cards, recent bookmarks.
 *
 * Features:
 * - "Tiếp tục học" card with last lesson info
 * - Overall course progress percentage
 * - Module progress overview cards
 * - Quick access to recent bookmarks
 *
 * Requirements: 12.1, 12.2, 12.3
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type Module from '@/database/models/Module';
import { useProgressStore } from '@/stores/progressStore';
import { useCourseStore } from '@/stores/courseStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';

// ─── Component ───

export default function HomeScreen() {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { overallProgress, moduleProgress, lastLessonId, loadProgress } = useProgressStore();
  const { modules, loadCourseTree } = useCourseStore();
  const { bookmarks, loadBookmarks } = useBookmarkStore();

  const [isLoading, setIsLoading] = useState(true);
  const [lastLesson, setLastLesson] = useState<{ id: string; title: string; titleVi: string } | null>(null);

  // ── Load data on mount ──

  useEffect(() => {
    async function init() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        await Promise.all([
          loadProgress(),
          loadCourseTree(),
          loadBookmarks(currentUser.id),
        ]);
      } catch {
        // Errors handled by stores
      } finally {
        setIsLoading(false);
      }
    }
    void init();
  }, [currentUser, loadProgress, loadCourseTree, loadBookmarks]);

  // ── Load next uncompleted lesson ──

  useEffect(() => {
    async function fetchNextLesson() {
      if (!currentUser) {
        setLastLesson(null);
        return;
      }
      try {
        // Get first uncompleted lesson (by module order, then lesson order)
        const modules = await database.get('modules')
          .query(Q.sortBy('order_index', Q.asc)).fetch();

        const completedRecords = await database.get('lesson_progress')
          .query(Q.where('user_id', currentUser.id), Q.where('is_completed', true)).fetch();
        const completedIds = new Set(
          completedRecords.map(r => (r._raw as Record<string, unknown>)['lesson_id'] as string)
        );

        for (const mod of modules) {
          const lessons = await database.get('lessons')
            .query(Q.where('module_id', mod.id), Q.sortBy('order_index', Q.asc)).fetch();
          for (const lesson of lessons) {
            if (!completedIds.has(lesson.id)) {
              const raw = lesson._raw as Record<string, unknown>;
              setLastLesson({
                id: lesson.id,
                title: (raw['title'] as string) ?? '',
                titleVi: (raw['title_vi'] as string) ?? '',
              });
              return;
            }
          }
        }
        // All lessons completed
        setLastLesson(null);
      } catch {
        setLastLesson(null);
      }
    }
    void fetchNextLesson();
  }, [currentUser, overallProgress]); // Re-run when progress changes

  const handleContinueLearning = useCallback(() => {
    if (lastLesson) {
      router.push(`/(tabs)/course/${lastLesson.id}`);
    } else {
      router.push('/(tabs)/course');
    }
  }, [lastLesson]);

  const handleModulePress = useCallback((moduleId: string) => {
    // Auto-expand the module in CourseStore, then navigate to course tab
    useCourseStore.getState().toggleModule(moduleId);
    router.push('/(tabs)/course');
  }, []);

  const handleBookmarkPress = useCallback((itemId: string, itemType: string) => {
    if (itemType === 'lesson') {
      router.push(`/(tabs)/course/${itemId}`);
    } else if (itemType === 'keyword') {
      router.push(`/keyword/${itemId}`);
    }
  }, []);

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải dữ liệu" />
      </View>
    );
  }

  const normalizedProgress = Math.min(Math.max(overallProgress, 0), 100) / 100;
  const recentBookmarks = bookmarks.slice(0, 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onSurface }]}>
        Xin chào, {currentUser?.name ?? 'Bạn'}! 👋
      </Text>

      {/* Continue Learning Card */}
      <Card
        style={[styles.continueCard, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={handleContinueLearning}
        accessibilityLabel="Tiếp tục học"
        accessibilityRole="button"
      >
        <Card.Content style={styles.continueContent}>
          <View style={styles.continueTextSection}>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Tiếp tục học
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}
              numberOfLines={2}
            >
              {lastLesson
                ? lastLesson.titleVi || lastLesson.title
                : 'Chúc mừng! Bạn đã hoàn thành tất cả bài học 🎉'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="arrow-right-circle"
            size={40}
            color={theme.colors.onPrimaryContainer}
          />
        </Card.Content>
      </Card>

      {/* Overall Progress */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
          Tiến trình tổng thể
        </Text>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <View style={styles.progressRow}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {overallProgress}%
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                hoàn thành
              </Text>
            </View>
            <ProgressBar
              progress={normalizedProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
              accessibilityLabel={`Tiến trình: ${overallProgress} phần trăm`}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Module Progress Overview */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
          Tiến trình theo module
        </Text>
        <View style={styles.moduleGrid}>
          {modules.map((mod) => {
            const progress = moduleProgress[mod.id] ?? 0;
            const normalizedModProgress = Math.min(Math.max(progress, 0), 100) / 100;
            return (
              <Card
                key={mod.id}
                style={[styles.moduleCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleModulePress(mod.id)}
                accessibilityLabel={`Module ${mod.titleVi || mod.title}, ${progress} phần trăm hoàn thành`}
                accessibilityRole="button"
              >
                <Card.Content style={styles.moduleCardContent}>
                  <MaterialCommunityIcons
                    name={(mod.iconName || 'book-outline') as any}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelLarge"
                    numberOfLines={2}
                    style={[styles.moduleTitle, { color: theme.colors.onSurface }]}
                  >
                    {mod.titleVi || mod.title}
                  </Text>
                  <ProgressBar
                    progress={normalizedModProgress}
                    color={theme.colors.primary}
                    style={styles.moduleProgressBar}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {progress}%
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      </View>

      {/* Recent Bookmarks */}
      {recentBookmarks.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
            Đánh dấu gần đây
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentBookmarks.map((bookmark) => (
              <Card
                key={bookmark.id}
                style={[styles.bookmarkCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleBookmarkPress(bookmark.itemId, bookmark.itemType)}
                accessibilityLabel={`Đánh dấu ${bookmark.itemType === 'lesson' ? 'bài học' : 'từ khóa'}`}
                accessibilityRole="button"
              >
                <Card.Content style={styles.bookmarkContent}>
                  <MaterialCommunityIcons
                    name={bookmark.itemType === 'lesson' ? 'book-open-variant' : 'key-variant'}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodySmall"
                    numberOfLines={2}
                    style={{ color: theme.colors.onSurface, marginTop: 4 }}
                  >
                    {bookmark.itemType === 'lesson' ? 'Bài học' : 'Từ khóa'}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    marginBottom: 24,
    marginTop: 8,
  },
  continueCard: {
    borderRadius: 16,
    marginBottom: 24,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  continueTextSection: {
    flex: 1,
    marginRight: 16,
  },
  section: {
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '47%',
    borderRadius: 12,
  },
  moduleCardContent: {
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 12,
  },
  moduleTitle: {
    minHeight: 36,
  },
  moduleProgressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  bookmarkCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
  },
  bookmarkContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});
