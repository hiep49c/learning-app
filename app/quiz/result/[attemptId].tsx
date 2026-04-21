/**
 * QuizResultScreen — shows quiz score and per-question results.
 *
 * Features:
 * - Show score (percentage, correct/total)
 * - Per-question results with QuizCard (isSubmitted=true)
 * - "Làm lại" button → navigate back to quiz
 * - "Quay lại bài học" button
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';

import { QuizCard } from '@/components/QuizCard';
import { useQuizStore } from '@/stores/quizStore';

// ─── Component ───

export default function QuizResultScreen() {
  const theme = useTheme<MD3Theme>();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { currentQuiz, questions, answers, score } = useQuizStore();

  // ── Determine score display ──

  const scorePercentage = score?.percentage ?? 0;
  const scoreCorrect = score?.correct ?? 0;
  const scoreTotal = score?.total ?? questions.length;

  const isPassing = scorePercentage >= 70;
  const scoreColor = isPassing ? '#4CAF50' : '#F44336';
  const scoreIcon = isPassing ? 'check-circle' : 'close-circle';
  const scoreMessage = isPassing ? 'Tuyệt vời! Bạn đã vượt qua!' : 'Hãy thử lại nhé!';

  // ── Handlers ──

  const handleRetake = () => {
    if (currentQuiz) {
      router.replace(`/quiz/${currentQuiz.id}`);
    } else {
      router.back();
    }
  };

  const handleBackToLesson = () => {
    router.back();
    // Navigate back past the quiz to the lesson
    setTimeout(() => {
      router.back();
    }, 100);
  };

  // ── No data state ──

  if (!score || questions.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Không tìm thấy kết quả
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Score card */}
      <Card style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.scoreContent}>
          <MaterialCommunityIcons
            name={scoreIcon}
            size={64}
            color={scoreColor}
          />
          <Text variant="displaySmall" style={[styles.scoreText, { color: scoreColor }]}>
            {scorePercentage}%
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {scoreCorrect}/{scoreTotal} câu đúng
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {scoreMessage}
          </Text>
        </Card.Content>
      </Card>

      {/* Per-question results */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Chi tiết câu hỏi
      </Text>

      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionWrapper}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Câu {index + 1}
          </Text>
          <QuizCard
            question={{
              id: question.id,
              questionText: question.questionText,
              options: question.optionsJson,
              orderIndex: question.orderIndex,
            }}
            selectedAnswer={answers[question.id] ?? null}
            onSelectAnswer={() => {}}
            isSubmitted
            correctAnswer={question.correctAnswer}
            explanation={question.explanation}
          />
        </View>
      ))}

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="refresh"
          onPress={handleRetake}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          accessibilityLabel="Làm lại"
        >
          Làm lại
        </Button>
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={handleBackToLesson}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          accessibilityLabel="Quay lại bài học"
        >
          Quay lại bài học
        </Button>
      </View>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scoreCard: {
    borderRadius: 16,
    marginBottom: 24,
  },
  scoreContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoreText: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  questionWrapper: {
    marginBottom: 8,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionButtonContent: {
    minHeight: 48,
  },
  bottomSpacer: {
    height: 32,
  },
});
