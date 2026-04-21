/**
 * ToastProvider — renders a global Snackbar driven by the toast store.
 *
 * Place this component near the root of the app (inside ThemeProvider).
 * Services call `showToast(message)` and this component displays it.
 *
 * Requirements: 17.1, 17.5
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { useToastStore } from '@/utils/toast';

const TOAST_DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme<MD3Theme>();
  const { message, visible, dismiss } = useToastStore();

  return (
    <>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={dismiss}
        duration={TOAST_DURATION}
        style={[styles.snackbar, { backgroundColor: theme.colors.inverseSurface }]}
        action={{
          label: 'Đóng',
          onPress: dismiss,
        }}
        accessibilityLabel={message ?? undefined}
      >
        {message ?? ''}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 16,
  },
});
