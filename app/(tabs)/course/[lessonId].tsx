/**
 * LessonScreen — displays lesson content with code blocks, keywords, quiz link.
 *
 * Features:
 * - Load lesson content from WatermelonDB by lessonId
 * - Render via ContentRenderer component
 * - "Đánh dấu hoàn thành" button at bottom
 * - Bookmark toggle button in header (heart icon)
 * - "Làm Quiz" button → navigate to quiz
 * - Save scroll position on leave, restore on return
 *
 * Requirements: 2.2, 12.1, 14.1, 16.1, 17.5
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type Quiz from '@/database/models/Quiz';
import type LessonProgress from '@/database/models/LessonProgress';
import { ContentRenderer } from '@/components/ContentRenderer';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/utils/toast';

// ─── Types ───

interface ContentSection {
  type: 'heading' | 'paragraph' | 'code_block' | 'table' | 'list' | 'keyword_ref' | 'diagram';
  level?: number;
  text?: string;
  code?: string;
  language?: string;
  fileName?: string;
  rows?: string[][];
  headers?: string[];
  items?: string[];
  ordered?: boolean;
  keywordId?: string;
}

interface LessonContent {
  sections: ContentSection[];
}

// ─── Component ───

export default function LessonScreen() {
  const theme = useTheme<MD3Theme>();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { currentUser } = useAuthStore();
  const { markLessonComplete, updateScrollPosition } = useProgressStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  const [isLoading, setIsLoading] = useState(true);
  const [lesson, setLesson] = useState<{
    id: string;
    title: string;
    titleVi: string;
    content: LessonContent;
  } | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [initialScrollPosition, setInitialScrollPosition] = useState(0);
  const [isMarking, setIsMarking] = useState(false);

  const startTime = useRef(Date.now());
  const lastScrollPosition = useRef(0);

  // ── Load lesson data ──

  useEffect(() => {
    async function loadLesson() {
      if (!lessonId || !currentUser) return;

      try {
        const lessonRecord = await database.get<Lesson>('lessons').find(lessonId);

        // Defensive parsing: @json decorator should parse the string,
        // but if the raw value is still a string (e.g. double-stringified), parse it again.
        let parsedContent: LessonContent;
        const rawContent = lessonRecord.contentJson;
        if (typeof rawContent === 'string') {
          try {
            parsedContent = JSON.parse(rawContent) as LessonContent;
          } catch {
            parsedContent = { sections: [] };
          }
        } else {
          parsedContent = (rawContent as LessonContent) ?? { sections: [] };
        }

        const validContent = parsedContent?.sections ? parsedContent : { sections: [] };
        if (!parsedContent?.sections) {
          showToast('Nội dung bị lỗi');
        }

        setLesson({
          id: lessonRecord.id,
          title: lessonRecord.title,
          titleVi: lessonRecord.titleVi,
          content: validContent,
        });

        // Load quiz for this lesson
        const quizzes = await database
          .get<Quiz>('quizzes')
          .query(Q.where('lesson_id', lessonId))
          .fetch();
        if (quizzes.length > 0) {
          setQuizId(quizzes[0]!.id);
        }

        // Check completion status
        const progressRecords = await database
          .get<LessonProgress>('lesson_progress')
          .query(
            Q.where('user_id', currentUser.id),
            Q.where('lesson_id', lessonId),
          )
          .fetch();
        if (progressRecords.length > 0) {
          const progress = progressRecords[0]!;
          setIsCompleted(progress.isCompleted);
          setInitialScrollPosition(progress.scrollPosition);
        }

        // Check bookmark status
        const isBookmarkedResult = await isBookmarked(currentUser.id, lessonId);
        setBookmarked(isBookmarkedResult);
      } catch (error) {
        console.error('[LessonScreen] loadLesson failed:', error);
        showToast('Bài học không tồn tại');
      } finally {
        setIsLoading(false);
      }
    }

    startTime.current = Date.now();
    void loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, currentUser]);

  // ── Save scroll position on unmount ──

  useEffect(() => {
    return () => {
      if (lessonId && currentUser) {
        void updateScrollPosition(lessonId, lastScrollPosition.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, currentUser]);

  // ── Handlers ──

  const handleScrollPositionChange = useCallback((position: number) => {
    lastScrollPosition.current = position;
  }, []);

  const handleMarkComplete = useCallback(async () => {
    if (!lessonId || !currentUser || isMarking) return;
    setIsMarking(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      await markLessonComplete(lessonId, timeSpent);
      setIsCompleted(true);
    } catch {
      // Error handled by store
    } finally {
      setIsMarking(false);
    }
  }, [lessonId, currentUser, isMarking, markLessonComplete]);

  const handleToggleBookmark = useCallback(async () => {
    if (!lessonId || !currentUser) return;
    try {
      await toggleBookmark(currentUser.id, lessonId, 'lesson');
      setBookmarked((prev) => !prev);
    } catch {
      // Error handled by store
    }
  }, [lessonId, currentUser, toggleBookmark]);

  const handleKeywordPress = useCallback((keywordId: string) => {
    router.push(`/keyword/${keywordId}`);
  }, []);

  const handleQuizPress = useCallback(() => {
    if (quizId) {
      router.push(`/quiz/${quizId}`);
    }
  }, [quizId]);

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải bài học" />
      </View>
    );
  }

  // ── Error state ──

  if (!lesson) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Không tìm thấy bài học
        </Text>
        <Button
          mode="text"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
          accessibilityLabel="Quay lại"
        >
          Quay lại
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: lesson.titleVi || lesson.title,
          headerRight: () => (
            <IconButton
              icon={bookmarked ? 'heart' : 'heart-outline'}
              iconColor={bookmarked ? theme.colors.error : theme.colors.onSurfaceVariant}
              onPress={handleToggleBookmark}
              accessibilityLabel={bookmarked ? 'Bỏ đánh dấu bài học' : 'Đánh dấu bài học'}
              accessibilityRole="button"
            />
          ),
        }}
      />

      <ContentRenderer
        content={lesson.content}
        onKeywordPress={handleKeywordPress}
        onScrollPositionChange={handleScrollPositionChange}
        initialScrollPosition={initialScrollPosition}
      />

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        {quizId && (
          <Button
            mode="outlined"
            icon="pencil"
            onPress={handleQuizPress}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            accessibilityLabel="Làm Quiz"
          >
            Làm Quiz
          </Button>
        )}
        <Button
          mode={isCompleted ? 'outlined' : 'contained'}
          icon={isCompleted ? 'check-circle' : 'check'}
          onPress={handleMarkComplete}
          disabled={isCompleted || isMarking}
          loading={isMarking}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          accessibilityLabel={isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        >
          {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        </Button>
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonContent: {
    minHeight: 44,
  },
});
