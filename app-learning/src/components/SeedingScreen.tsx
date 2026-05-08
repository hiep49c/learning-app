/**
 * SeedingScreen — full-screen loading view shown during first-launch data seeding.
 *
 * Displays a progress bar and percentage while seed data is being loaded
 * into WatermelonDB. Shows an error state with retry button if seeding fails.
 *
 * Requirements: 18.3
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, Surface, Button, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

interface SeedingScreenProps {
  /** Current progress percentage (0–100). */
  progress: number;
  /** Error message to display, or null if no error. */
  error: string | null;
  /** Called when the user taps the retry button after an error. */
  onRetry: () => void;
}

export function SeedingScreen({ progress, error, onRetry }: SeedingScreenProps) {
  const theme = useTheme<MD3Theme>();
  const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessibilityRole="none"
      accessibilityLabel="Màn hình chuẩn bị dữ liệu"
    >
      <Surface style={styles.card} elevation={2}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface }]}
          accessibilityRole="header"
        >
          {error !== null ? 'Đã xảy ra lỗi' : 'Đang chuẩn bị dữ liệu...'}
        </Text>

        {error !== null ? (
          <View style={styles.errorContainer}>
            <Text
              variant="bodyMedium"
              style={[styles.errorText, { color: theme.colors.error }]}
            >
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={onRetry}
              style={styles.retryButton}
              accessibilityLabel="Thử lại"
              accessibilityHint="Nhấn để thử nạp dữ liệu lại"
            >
              Thử lại
            </Button>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={normalizedProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
              accessibilityLabel={`Tiến trình: ${Math.round(progress)} phần trăm`}
            />
            <Text
              variant="bodyLarge"
              style={[styles.percentText, { color: theme.colors.onSurfaceVariant }]}
            >
              {Math.round(progress)}%
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}
            >
              Vui lòng không tắt ứng dụng
            </Text>
          </View>
        )}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  percentText: {
    fontVariant: ['tabular-nums'],
  },
  hintText: {
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
});
