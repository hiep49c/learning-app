/**
 * FlashCard — displays a vocabulary word with flip animation.
 * Front: word + IPA. Back: meaning + example.
 * Tap word/sentence to hear pronunciation.
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { WordData } from '@/services/DailyLearningService';
import { TappableText } from './TappableText';

interface FlashCardProps {
  word: WordData;
  showBack?: boolean;
}

export function FlashCard({ word, showBack: controlledShowBack }: FlashCardProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const [internalShowBack, setInternalShowBack] = useState(false);
  const showBack = controlledShowBack ?? internalShowBack;

  const handleFlip = useCallback((): void => {
    if (controlledShowBack === undefined) setInternalShowBack((prev) => !prev);
  }, [controlledShowBack]);

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={handleFlip} accessibilityLabel={`Thẻ từ: ${word.word}`}>
      <Card.Content style={styles.content}>
        {!showBack ? (
          <View style={styles.front}>
            <TappableText text={word.word} variant="headlineSmall" />
            {word.ipa ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>/{word.ipa}/</Text> : null}
            <Chip style={styles.chip} textStyle={styles.chipText}>{word.category}</Chip>
            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              Nhấn để lật thẻ
            </Text>
          </View>
        ) : (
          <View style={styles.back}>
            <TappableText text={word.word} variant="titleLarge" />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginTop: 8 }} selectable>
              {word.meaningVi}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 4 }} selectable>
              {word.meaningEn}
            </Text>
            {word.example ? (
              <View style={styles.exampleBox}>
                <TappableText text={word.example} variant="bodyMedium" />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {word.exampleVi}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, elevation: 2, borderRadius: 16 },
  content: { minHeight: 200, justifyContent: 'center' },
  front: { alignItems: 'center', gap: 8 },
  back: { gap: 4 },
  chip: { marginTop: 8 },
  chipText: { fontSize: 12 },
  hint: { marginTop: 16, fontSize: 12 },
  exampleBox: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' },
});
