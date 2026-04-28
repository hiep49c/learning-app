/**
 * DailySummary — shows end-of-session statistics.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { DailySummaryData } from '@/services/DailyLearningService';

interface DailySummaryProps {
  summary: DailySummaryData;
  onFinish: () => void;
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }): React.JSX.Element {
  return (
    <View style={styles.statItem}>
      <Text variant="headlineMedium" style={{ color }}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DailySummary({ summary, onFinish }: DailySummaryProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const accuracy = summary.totalCount > 0
    ? Math.round((summary.correctCount / summary.totalCount) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary, textAlign: 'center' }}>
            🎉 Hoàn thành!
          </Text>

          <View style={styles.statsRow}>
            <StatItem label="Từ mới" value={summary.newWordsCount} color="#4CAF50" />
            <StatItem label="Ôn tập" value={summary.reviewedCount} color="#2196F3" />
            <StatItem label="Chính xác" value={`${accuracy}%`} color="#FF9800" />
          </View>

          <View style={[styles.streakBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
              🔥 {summary.streak} ngày liên tiếp
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={onFinish} style={styles.finishBtn} accessibilityLabel="Hoàn tất">
        Hoàn tất
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { borderRadius: 16 },
  content: { alignItems: 'center', gap: 24, paddingVertical: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center', gap: 4 },
  statLabel: { color: '#666' },
  streakBox: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  finishBtn: { marginTop: 24, marginHorizontal: 16 },
});
