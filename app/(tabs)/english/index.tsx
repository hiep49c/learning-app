/**
 * EnglishTopicScreen — renders vocabulary topics with expandable lesson lists.
 * Reuses CourseTree component with vocab data filtered by 'vocab-' prefix.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type LessonProgress from '@/database/models/LessonProgress';
import { CourseTree } from '@/components/CourseTree';
import { useVocabStore } from '@/stores/vocabStore';
import { useProgressStore } from '@/stores/progressStore';
import { useAuthStore } from '@/stores/authStore';

interface TopicWithLessons {
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
}

export default function EnglishTopicScreen() {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { topics, expandedTopics, toggleTopic, loadTopics } = useVocabStore();
  const { moduleProgress, loadProgress } = useProgressStore();

  const [isLoading, setIsLoading] = useState(true);
  const [topicsWithLessons, setTopicsWithLessons] = useState<TopicWithLessons[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function init() {
      if (!currentUser) { setIsLoading(false); return; }
      try {
        await Promise.all([loadTopics(), loadProgress()]);
      } catch { /* handled by stores */ }
    }
    void init();
  }, [currentUser, loadTopics, loadProgress]);

  useEffect(() => {
    async function buildData() {
      if (topics.length === 0 || !currentUser) { setIsLoading(false); return; }
      try {
        const userId = currentUser.id;
        const completedRecords = await database
          .get<LessonProgress>('lesson_progress')
          .query(Q.where('user_id', userId), Q.where('is_completed', true))
          .fetch();
        setCompletedLessons(new Set(
          completedRecords.map((r) => (r._raw as Record<string, unknown>).lesson_id as string),
        ));

        const data: TopicWithLessons[] = [];
        for (const topic of topics) {
          const lessons = await database
            .get<Lesson>('lessons')
            .query(Q.where('module_id', topic.id), Q.sortBy('order_index', Q.asc))
            .fetch();
          data.push({
            ...topic,
            lessons: lessons.map((l) => ({
              id: l.id, title: l.title, titleVi: l.titleVi, orderIndex: l.orderIndex,
            })),
          });
        }
        setTopicsWithLessons(data);
      } catch (error) {
        console.error('[EnglishTopicScreen] buildData failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void buildData();
  }, [topics, currentUser]);

  const handleToggleTopic = useCallback((id: string) => { toggleTopic(id); }, [toggleTopic]);

  const handleSelectLesson = useCallback((lessonId: string) => {
    router.push({ pathname: '/(tabs)/english/[lessonId]', params: { lessonId } });
  }, []);

  const handleStartDaily = useCallback(() => {
    router.push('/(tabs)/english/daily');
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải chủ đề" />
      </View>
    );
  }

  if (topicsWithLessons.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Chưa có dữ liệu từ vựng
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <Card style={[styles.dailyCard, { backgroundColor: theme.colors.primaryContainer }]} onPress={handleStartDaily} accessibilityLabel="Bắt đầu học hôm nay">
        <Card.Content style={styles.dailyContent}>
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
            📚 Học từ vựng hôm nay
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
            Ôn tập + Từ mới + Luyện tập + Spaced Repetition
          </Text>
          <Button mode="contained" onPress={handleStartDaily} style={styles.dailyBtn} accessibilityLabel="Bắt đầu">
            Bắt đầu
          </Button>
        </Card.Content>
      </Card>

      <CourseTree
        modules={topicsWithLessons}
        expandedModules={expandedTopics}
        onToggleModule={handleToggleTopic}
        onSelectLesson={handleSelectLesson}
        moduleProgress={moduleProgress}
        completedLessons={completedLessons}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  dailyCard: { margin: 16, borderRadius: 16 },
  dailyContent: { gap: 8, paddingVertical: 8 },
  dailyBtn: { marginTop: 4, alignSelf: 'flex-start' },
});
