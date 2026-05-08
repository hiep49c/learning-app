/**
 * QuizScreen — quiz taking interface with question navigation.
 *
 * Features:
 * - Load quiz and questions from useQuizStore
 * - Render current question with QuizCard
 * - Navigation: "Câu trước" / "Câu sau" buttons
 * - Progress indicator: "Câu 1/5"
 * - "Nộp bài" button when all questions answered
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

import { QuizCard } from '@/components/QuizCard';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';

// ─── Component ───

export default function QuizScreen() {
  const theme = useTheme<MD3Theme>();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const { currentUser } = useAuthStore();
  const {
    currentQuiz,
    questions,
    currentQuestionIndex,
    answers,
    isSubmitted,
    score,
    loadQuiz,
    answerQuestion,
    submitQuiz,
    nextQuestion,
    previousQuestion,
    resetQuiz,
  } = useQuizStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Load quiz on mount ──

  useEffect(() => {
    async function init() {
      if (!quizId) return;
      try {
        resetQuiz();
        await loadQuiz(quizId);
      } catch {
        // Error handled by store
      } finally {
        setIsLoading(false);
      }
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // ── Navigate to results after submission ──

  useEffect(() => {
    if (isSubmitted && score && currentQuiz) {
      // Navigate to result screen — use quizId as attemptId for simplicity
      router.replace(`/quiz/result/${currentQuiz.id}`);
    }
  }, [isSubmitted, score, currentQuiz]);

  // ── Handlers ──

  const handleAnswer = useCallback(
    (answer: string) => {
      if (questions.length === 0) return;
      const question = questions[currentQuestionIndex];
      if (question) {
        answerQuestion(question.id, answer);
      }
    },
    [questions, currentQuestionIndex, answerQuestion],
  );

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    try {
      await submitQuiz(currentUser.id);
    } catch {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, submitQuiz]);

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải quiz" />
      </View>
    );
  }

  // ── Error state ──

  if (!currentQuiz || questions.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Không tìm thấy quiz
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
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
          Câu {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progressBar}
          accessibilityLabel={`Câu hỏi ${currentQuestionIndex + 1} trên ${questions.length}`}
        />
      </View>

      {/* Question */}
      <ScrollView
        style={styles.questionContainer}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion && (
          <QuizCard
            question={{
              id: currentQuestion.id,
              questionText: currentQuestion.questionText,
              options: currentQuestion.optionsJson,
              orderIndex: currentQuestion.orderIndex,
            }}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onSelectAnswer={handleAnswer}
            isSubmitted={false}
          />
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navigationBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <Button
          mode="outlined"
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
          style={styles.navButton}
          contentStyle={styles.navButtonContent}
          accessibilityLabel="Câu trước"
        >
          Câu trước
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            mode="contained"
            onPress={nextQuestion}
            style={styles.navButton}
            contentStyle={styles.navButtonContent}
            accessibilityLabel="Câu sau"
          >
            Câu sau
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => setShowSubmitDialog(true)}
            disabled={!allAnswered || isSubmitting}
            loading={isSubmitting}
            style={styles.navButton}
            contentStyle={styles.navButtonContent}
            accessibilityLabel="Nộp bài"
          >
            Nộp bài
          </Button>
        )}
      </View>

      {/* Submit confirmation dialog */}
      <Portal>
        <Dialog visible={showSubmitDialog} onDismiss={() => setShowSubmitDialog(false)}>
          <Dialog.Title>Nộp bài</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn đã trả lời {Object.keys(answers).length}/{questions.length} câu hỏi. Bạn có chắc muốn nộp bài?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSubmitDialog(false)} accessibilityLabel="Hủy">
              Hủy
            </Button>
            <Button onPress={handleSubmit} accessibilityLabel="Nộp bài">
              Nộp bài
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  progressHeader: {
    padding: 16,
    gap: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
    paddingTop: 0,
  },
  navigationBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    flex: 1,
    borderRadius: 12,
  },
  navButtonContent: {
    minHeight: 44,
  },
});
