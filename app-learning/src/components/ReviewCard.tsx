/**
 * ReviewCard — shows a word for spaced repetition review.
 * User rates their recall: perfect, good, hard, forgot.
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { WordData } from '@/services/DailyLearningService';
import { TappableText } from './TappableText';

interface ReviewCardProps {
  word: WordData;
  onRate: (result: 'perfect' | 'good' | 'hard' | 'forgot') => void;
  isSubmitting: boolean;
}

export function ReviewCard({ word, onRate, isSubmitting }: ReviewCardProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const [revealed, setRevealed] = useState(false);

  const handleReveal = useCallback((): void => { setRevealed(true); }, []);

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.front}>
          <TappableText text={word.word} variant="headlineSmall" />
          {word.ipa ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>/{word.ipa}/</Text> : null}
        </View>

        {!revealed ? (
          <Button mode="outlined" onPress={handleReveal} style={styles.revealBtn} accessibilityLabel="Hiện đáp án">
            Hiện nghĩa
          </Button>
        ) : (
          <View style={styles.answer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{word.meaningVi}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>{word.meaningEn}</Text>
            {word.example ? (
              <View style={styles.exampleBox}>
                <TappableText text={word.example} variant="bodyMedium" />
              </View>
            ) : null}

            <Text variant="labelMedium" style={[styles.rateLabel, { color: theme.colors.onSurfaceVariant }]}>
              Bạn nhớ từ này thế nào?
            </Text>
            <View style={styles.rateRow}>
              <Button mode="contained" buttonColor="#F44336" onPress={() => onRate('forgot')} disabled={isSubmitting} compact accessibilityLabel="Quên">Quên</Button>
              <Button mode="contained" buttonColor="#FF9800" onPress={() => onRate('hard')} disabled={isSubmitting} compact accessibilityLabel="Khó">Khó</Button>
              <Button mode="contained" buttonColor="#4CAF50" onPress={() => onRate('good')} disabled={isSubmitting} compact accessibilityLabel="Tốt">Tốt</Button>
              <Button mode="contained" buttonColor="#2196F3" onPress={() => onRate('perfect')} disabled={isSubmitting} compact accessibilityLabel="Hoàn hảo">Tuyệt</Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, borderRadius: 16 },
  front: { alignItems: 'center', gap: 4, marginBottom: 16 },
  revealBtn: { marginTop: 8 },
  answer: { marginTop: 12, gap: 4 },
  exampleBox: { marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' },
  rateLabel: { marginTop: 16, textAlign: 'center' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
});
