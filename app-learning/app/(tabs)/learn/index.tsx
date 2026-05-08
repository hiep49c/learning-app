/**
 * LearnScreen — shows content based on selected subject (Java tree OR English vocab tree).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type LessonProgress from '@/database/models/LessonProgress';
import { CourseTree } from '@/components/CourseTree';
import { useCourseStore } from '@/stores/courseStore';
import { useVocabStore } from '@/stores/vocabStore';
import { useProgressStore } from '@/stores/progressStore';
import { useAuthStore } from '@/stores/authStore';
import { useSubjectStore } from '@/stores/subjectStore';

interface ModuleWithLessons {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  difficultyLevel: string;
  iconName: string;
  lessonCount: number;
  lessons: Array<{ id: string; title: string; titleVi: string; orderIndex: number }>;
}

export default function LearnScreen(): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { currentSubject } = useSubjectStore();
  const { modules: javaModules, expandedModules: javaExpanded, toggleModule: toggleJava, loadCourseTree } = useCourseStore();
  const { topics: vocabTopics, expandedTopics, toggleTopic, loadTopics } = useVocabStore();
  const { moduleProgress, loadProgress } = useProgressStore();

  const [isLoading, setIsLoading] = useState(true);
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function init(): Promise<void> {
      if (!currentUser) { setIsLoading(false); return; }
      try {
        if (currentSubject === 'java') {
          await Promise.all([loadCourseTree(), loadProgress()]);
        } else {
          await Promise.all([loadTopics(), loadProgress()]);
        }
      } catch { /* stores handle errors */ }
    }
    void init();
  }, [currentUser, currentSubject, loadCourseTree, loadTopics, loadProgress]);

  // Build module data with lessons
  const sourceModules = currentSubject === 'java' ? javaModules : vocabTopics;

  useEffect(() => {
    async function buildData(): Promise<void> {
      if (sourceModules.length === 0 || !currentUser) { setIsLoading(false); return; }
      try {
        const completedRecords = await database
          .get<LessonProgress>('lesson_progress')
          .query(Q.where('user_id', currentUser.id), Q.where('is_completed', true))
          .fetch();
        setCompletedLessons(new Set(
          completedRecords.map((r) => (r._raw as Record<string, unknown>).lesson_id as string),
        ));

        const data: ModuleWithLessons[] = [];
        for (const mod of sourceModules) {
          const lessons = await database
            .get<Lesson>('lessons')
            .query(Q.where('module_id', mod.id), Q.sortBy('order_index', Q.asc))
            .fetch();
          data.push({
            ...mod,
            lessons: lessons.map((l) => ({ id: l.id, title: l.title, titleVi: l.titleVi, orderIndex: l.orderIndex })),
          });
        }
        setModulesWithLessons(data);
      } catch (error) {
        console.error('[LearnScreen] buildData failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void buildData();
  }, [sourceModules, currentUser]);

  const handleToggle = useCallback((id: string): void => {
    if (currentSubject === 'java') toggleJava(id); else toggleTopic(id);
  }, [currentSubject, toggleJava, toggleTopic]);

  const handleSelectLesson = useCallback((lessonId: string): void => {
    router.push({ pathname: '/(tabs)/learn/[lessonId]', params: { lessonId } });
  }, []);

  const handleStartDaily = useCallback((): void => {
    router.push('/(tabs)/learn/daily');
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải" />
      </View>
    );
  }

  if (modulesWithLessons.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Chưa có dữ liệu. Vui lòng chọn môn học ở Trang chủ.
        </Text>
      </View>
    );
  }

  const expanded = currentSubject === 'java' ? javaExpanded : expandedTopics;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      {currentSubject === 'english' && (
        <Button mode="contained" icon="school" onPress={handleStartDaily} style={styles.dailyBtn} accessibilityLabel="Học từ vựng hôm nay">
          📚 Học 5 từ hôm nay
        </Button>
      )}
      <CourseTree
        modules={modulesWithLessons}
        expandedModules={expanded}
        onToggleModule={handleToggle}
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
  dailyBtn: { margin: 16, borderRadius: 12 },
});
