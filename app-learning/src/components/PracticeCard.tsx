/**
 * PracticeCard — renders a practice question (multiple choice or fill-in-the-blank).
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { PracticeQuestion } from '@/services/DailyLearningService';

interface PracticeCardProps {
  question: PracticeQuestion;
  selectedAnswer: string | undefined;
  onAnswer: (questionId: string, answer: string) => void;
  showResult?: boolean;
}

export function PracticeCard({ question, selectedAnswer, onAnswer, showResult }: PracticeCardProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const [fillAnswer, setFillAnswer] = useState('');

  const isCorrect = selectedAnswer !== undefined && (
    question.type === 'fill_blank'
      ? selectedAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
      : selectedAnswer === question.correctAnswer
  );

  const handleFillSubmit = useCallback((): void => {
    if (fillAnswer.trim()) onAnswer(question.id, fillAnswer.trim());
  }, [fillAnswer, onAnswer, question.id]);

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
          {question.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          {question.question}
        </Text>

        {question.type === 'multiple_choice' ? (
          <RadioButton.Group
            value={selectedAnswer ?? ''}
            onValueChange={(value) => onAnswer(question.id, value)}
          >
            {question.options.map((opt, idx) => {
              const optionColor = showResult && selectedAnswer === opt
                ? (isCorrect ? '#4CAF50' : '#F44336')
                : theme.colors.onSurface;
              return (
                <View key={`${question.id}-opt-${idx}`} style={styles.option}>
                  <RadioButton.Item
                    label={opt}
                    value={opt}
                    disabled={showResult === true}
                    labelStyle={{ color: optionColor }}
                    accessibilityLabel={`Đáp án: ${opt}`}
                  />
                </View>
              );
            })}
          </RadioButton.Group>
        ) : (
          <View style={styles.fillContainer}>
            <TextInput
              mode="outlined"
              label="Nhập từ"
              value={selectedAnswer ?? fillAnswer}
              onChangeText={setFillAnswer}
              disabled={showResult === true || selectedAnswer !== undefined}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Nhập từ vào chỗ trống"
            />
            {selectedAnswer === undefined && (
              <Button mode="contained" onPress={handleFillSubmit} style={styles.submitBtn} disabled={!fillAnswer.trim()}>
                Xác nhận
              </Button>
            )}
          </View>
        )}

        {showResult && selectedAnswer !== undefined ? (
          <View style={[styles.resultBox, { backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text variant="bodyMedium" style={{ color: isCorrect ? '#2E7D32' : '#C62828' }}>
              {isCorrect ? '✓ Chính xác!' : `✗ Đáp án đúng: ${question.correctAnswer}`}
            </Text>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, borderRadius: 16 },
  option: { marginVertical: -4 },
  fillContainer: { gap: 12 },
  submitBtn: { marginTop: 8 },
  resultBox: { marginTop: 12, padding: 12, borderRadius: 8 },
});
