/**
 * HomeScreen — subject picker + progress + continue learning + daily vocab.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import { useAuthStore } from '@/stores/authStore';
import { useSubjectStore } from '@/stores/subjectStore';
import type { SubjectId } from '@/stores/subjectStore';
import { useProgressStore } from '@/stores/progressStore';
import { getDailySummary } from '@/services/DailyLearningService';
import type { DailySummaryData } from '@/services/DailyLearningService';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const { currentSubject, setSubject, loadSubject, isLoaded } = useSubjectStore();
  const { overallProgress, loadProgress } = useProgressStore();

  const [isLoading, setIsLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [vocabCount, setVocabCount] = useState(0);
  const [javaCount, setJavaCount] = useState(0);

  useEffect(() => {
    async function init(): Promise<void> {
      if (!currentUser) { setIsLoading(false); return; }
      try {
        await Promise.all([loadSubject(), loadProgress()]);
        const summary = await getDailySummary(currentUser.id);
        setDailySummary(summary);

        // Count modules per subject
        const allModules = await database.get('modules').query().fetch();
        setJavaCount(allModules.filter((m) => !m.id.startsWith('vocab-')).length);
        setVocabCount(allModules.filter((m) => m.id.startsWith('vocab-')).length);
      } catch { /* stores handle errors */ }
      finally { setIsLoading(false); }
    }
    void init();
  }, [currentUser, loadSubject, loadProgress]);

  // Find next lesson for current subject
  useEffect(() => {
    async function findNext(): Promise<void> {
      if (!currentUser) return;
      const prefix = currentSubject === 'english' ? 'vocab-' : '';
      const modules = await database.get('modules').query(
        currentSubject === 'english'
          ? Q.where('id', Q.like('vocab-%'))
          : Q.where('id', Q.notLike('vocab-%')),
        Q.sortBy('order_index', Q.asc),
      ).fetch();

      const completed = await database.get('lesson_progress').query(
        Q.where('user_id', currentUser.id), Q.where('is_completed', true),
      ).fetch();
      const completedIds = new Set(completed.map((r) => (r._raw as Record<string, unknown>).lesson_id as string));

      for (const mod of modules) {
        const lessons = await database.get('lessons').query(
          Q.where('module_id', mod.id), Q.sortBy('order_index', Q.asc),
        ).fetch();
        for (const l of lessons) {
          if (!completedIds.has(l.id)) {
            setNextLesson({ id: l.id, title: (l._raw as Record<string, unknown>).title_vi as string ?? (l._raw as Record<string, unknown>).title as string });
            return;
          }
        }
      }
      setNextLesson(null);
    }
    void findNext();
  }, [currentUser, currentSubject, overallProgress]);

  const handleSelectSubject = useCallback((subject: SubjectId): void => {
    void setSubject(subject);
  }, [setSubject]);

  const handleContinue = useCallback((): void => {
    if (nextLesson) {
      router.push({ pathname: '/(tabs)/learn/[lessonId]', params: { lessonId: nextLesson.id } });
    } else {
      router.push('/(tabs)/learn');
    }
  }, [nextLesson]);

  const handleStartDaily = useCallback((): void => {
    router.push('/(tabs)/learn/daily');
  }, []);

  if (isLoading || !isLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onSurface }]}>
        Xin chào, {currentUser?.name ?? 'Bạn'}! 👋
      </Text>

      {/* Subject Picker */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
        Chọn môn học
      </Text>
      <View style={styles.subjectRow}>
        <Card
          style={[styles.subjectCard, currentSubject === 'java' && { borderColor: theme.colors.primary, borderWidth: 2 }]}
          onPress={() => handleSelectSubject('java')}
          accessibilityLabel="Chọn Java Spring"
        >
          <Card.Content style={styles.subjectContent}>
            <MaterialCommunityIcons name="language-java" size={32} color={currentSubject === 'java' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            <Text variant="titleSmall" style={{ color: currentSubject === 'java' ? theme.colors.primary : theme.colors.onSurface }}>Java Spring</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{javaCount} modules</Text>
          </Card.Content>
        </Card>
        <Card
          style={[styles.subjectCard, currentSubject === 'english' && { borderColor: theme.colors.primary, borderWidth: 2 }]}
          onPress={() => handleSelectSubject('english')}
          accessibilityLabel="Chọn Tiếng Anh"
        >
          <Card.Content style={styles.subjectContent}>
            <MaterialCommunityIcons name="alphabetical-variant" size={32} color={currentSubject === 'english' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            <Text variant="titleSmall" style={{ color: currentSubject === 'english' ? theme.colors.primary : theme.colors.onSurface }}>Tiếng Anh</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{vocabCount} chủ đề</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Daily Vocab (English only) */}
      {currentSubject === 'english' && (
        <Card style={[styles.dailyCard, { backgroundColor: theme.colors.primaryContainer }]} onPress={handleStartDaily} accessibilityLabel="Học từ vựng hôm nay">
          <Card.Content style={styles.dailyContent}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>📚 Học từ vựng hôm nay</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}>
                {dailySummary && dailySummary.newWordsCount > 0
                  ? `Đã học ${dailySummary.newWordsCount} từ • 🔥 ${dailySummary.streak} ngày`
                  : '5 từ mới mỗi ngày • Spaced Repetition'}
              </Text>
            </View>
            <Button mode="contained" onPress={handleStartDaily} compact>Bắt đầu</Button>
          </Card.Content>
        </Card>
      )}

      {/* Continue Learning */}
      <Card style={[styles.continueCard, { backgroundColor: theme.colors.surface }]} onPress={handleContinue} accessibilityLabel="Tiếp tục học">
        <Card.Content style={styles.dailyContent}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {currentSubject === 'java' ? '☕ Tiếp tục Java' : '📖 Xem chủ đề từ vựng'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={1}>
              {nextLesson ? nextLesson.title : 'Đã hoàn thành tất cả 🎉'}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right-circle" size={32} color={theme.colors.primary} />
        </Card.Content>
      </Card>

      {/* Progress */}
      <Card style={{ backgroundColor: theme.colors.surface, marginTop: 16, borderRadius: 12 }}>
        <Card.Content>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>Tiến trình tổng thể</Text>
          <View style={styles.progressRow}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{overallProgress}%</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>hoàn thành</Text>
          </View>
          <ProgressBar progress={Math.min(overallProgress, 100) / 100} color={theme.colors.primary} style={styles.progressBar} />
        </Card.Content>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { marginBottom: 24, marginTop: 8 },
  subjectRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  subjectCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  subjectContent: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  dailyCard: { borderRadius: 16, marginBottom: 12 },
  dailyContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  continueCard: { borderRadius: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
});
