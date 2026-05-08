/**
 * DeepCard — shows detailed word information: collocations, synonyms, antonyms, examples.
 * All text is tappable for TTS.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { WordData } from '@/services/DailyLearningService';
import { TappableText } from './TappableText';

interface DeepCardProps {
  word: WordData;
}

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element | null {
  const theme = useTheme<MD3Theme>();
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{value}</Text>
    </View>
  );
}

export function DeepCard({ word }: DeepCardProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <TappableText text={word.word} variant="titleLarge" />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          /{word.ipa}/ • {word.category}
        </Text>

        <Divider style={styles.divider} />

        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
          {word.meaningVi} — {word.meaningEn}
        </Text>

        {word.example ? (
          <View style={styles.exampleBox}>
            <TappableText text={word.example} variant="bodyMedium" />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {word.exampleVi}
            </Text>
          </View>
        ) : null}

        <Divider style={styles.divider} />

        <InfoRow label="Collocations" value={word.collocations} />
        <InfoRow label="Synonyms" value={word.synonyms} />
        <InfoRow label="Antonyms" value={word.antonyms} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, borderRadius: 16 },
  row: { marginTop: 8, gap: 2 },
  divider: { marginVertical: 12 },
  exampleBox: { marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' },
});
