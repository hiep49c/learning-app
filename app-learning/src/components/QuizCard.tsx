/**
 * QuizCard — renders a single quiz question with multiple-choice options.
 *
 * Before submission: radio buttons for options, highlight selected.
 * After submission: show correct (green) / incorrect (red), display explanation.
 *
 * Requirements: 15.1, 15.3
 */
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Card,
  RadioButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// ─── Data interface ──────────────────────────────────────────────────────────

interface QuizQuestionData {
  id: string;
  questionText: string;
  options: string[];
  orderIndex: number;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuizCardProps {
  /** The quiz question to render. */
  question: QuizQuestionData;
  /** Currently selected answer, or null if none selected. */
  selectedAnswer: string | null;
  /** Called when the user selects an answer option. */
  onSelectAnswer: (answer: string) => void;
  /** Whether the quiz has been submitted. */
  isSubmitted: boolean;
  /** The correct answer (shown after submission). */
  correctAnswer?: string;
  /** Explanation text (shown after submission on wrong answer). */
  explanation?: string;
}

// ─── Option labels ───────────────────────────────────────────────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ─── Component ───────────────────────────────────────────────────────────────

export function QuizCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  isSubmitted,
  correctAnswer,
  explanation,
}: QuizCardProps) {
  const theme = useTheme<MD3Theme>();

  const getOptionStyle = useCallback(
    (option: string) => {
      if (!isSubmitted) {
        // Before submission: highlight selected
        if (option === selectedAnswer) {
          return {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
          };
        }
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        };
      }

      // After submission
      if (option === correctAnswer) {
        // Correct answer — always green
        return {
          backgroundColor: '#E8F5E9',
          borderColor: '#4CAF50',
        };
      }
      if (option === selectedAnswer && option !== correctAnswer) {
        // User's wrong answer — red
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
        };
      }
      return {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outlineVariant,
      };
    },
    [isSubmitted, selectedAnswer, correctAnswer, theme],
  );

  const getOptionIcon = useCallback(
    (option: string): string | null => {
      if (!isSubmitted) return null;

      if (option === correctAnswer) return 'check-circle';
      if (option === selectedAnswer && option !== correctAnswer) return 'close-circle';
      return null;
    },
    [isSubmitted, selectedAnswer, correctAnswer],
  );

  const getOptionIconColor = useCallback(
    (option: string): string => {
      if (option === correctAnswer) return '#4CAF50';
      return '#F44336';
    },
    [correctAnswer],
  );

  const isUserWrong = isSubmitted && selectedAnswer != null && selectedAnswer !== correctAnswer;

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        {/* Question text */}
        <Text
          variant="titleMedium"
          style={[styles.questionText, { color: theme.colors.onSurface }]}
        >
          {question.questionText}
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const optionStyle = getOptionStyle(option);
            const icon = getOptionIcon(option);
            const label = OPTION_LABELS[index] ?? `${index + 1}`;

            return (
              <Surface
                key={index}
                style={[
                  styles.optionSurface,
                  {
                    backgroundColor: optionStyle.backgroundColor,
                    borderColor: optionStyle.borderColor,
                  },
                ]}
                elevation={0}
              >
                <RadioButton.Android
                  value={option}
                  status={selectedAnswer === option ? 'checked' : 'unchecked'}
                  onPress={() => {
                    if (!isSubmitted) {
                      onSelectAnswer(option);
                    }
                  }}
                  disabled={isSubmitted}
                  color={
                    isSubmitted
                      ? option === correctAnswer
                        ? '#4CAF50'
                        : option === selectedAnswer
                          ? '#F44336'
                          : theme.colors.primary
                      : theme.colors.primary
                  }
                  accessibilityLabel={`${label}. ${option}`}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selectedAnswer === option,
                    disabled: isSubmitted,
                  }}
                />
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.optionText,
                    { color: theme.colors.onSurface },
                    isSubmitted && option === correctAnswer && styles.correctOptionText,
                    isSubmitted && option === selectedAnswer && option !== correctAnswer && styles.wrongOptionText,
                  ]}
                  onPress={() => {
                    if (!isSubmitted) {
                      onSelectAnswer(option);
                    }
                  }}
                  accessibilityRole="radio"
                >
                  <Text style={styles.optionLabel}>{label}. </Text>
                  {option}
                </Text>
              </Surface>
            );
          })}
        </View>

        {/* Explanation (shown after submission when wrong) */}
        {isUserWrong && explanation != null && explanation.length > 0 && (
          <Surface
            style={[
              styles.explanationContainer,
              { backgroundColor: theme.dark ? 'rgba(255,235,59,0.1)' : '#FFFDE7' },
            ]}
            elevation={0}
          >
            <Text
              variant="labelLarge"
              style={[styles.explanationTitle, { color: theme.colors.onSurface }]}
            >
              💡 Giải thích
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.explanationText, { color: theme.colors.onSurfaceVariant }]}
            >
              {explanation}
            </Text>
          </Surface>
        )}

        {/* Correct answer confirmation */}
        {isSubmitted && selectedAnswer === correctAnswer && (
          <Surface
            style={[
              styles.explanationContainer,
              { backgroundColor: theme.dark ? 'rgba(76,175,80,0.1)' : '#E8F5E9' },
            ]}
            elevation={0}
          >
            <Text
              variant="labelLarge"
              style={[styles.correctMessage, { color: '#2E7D32' }]}
            >
              ✓ Chính xác!
            </Text>
          </Surface>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 16,
  },
  questionText: {
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 8,
  },
  optionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingRight: 12,
    minHeight: 48,
  },
  optionText: {
    flex: 1,
    paddingVertical: 12,
  },
  optionLabel: {
    fontWeight: '600',
  },
  correctOptionText: {
    fontWeight: '600',
  },
  wrongOptionText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  explanationTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  explanationText: {
    lineHeight: 22,
  },
  correctMessage: {
    fontWeight: '600',
  },
});
