/**
 * TappableText — renders text where words/sentences can be tapped to trigger TTS.
 * Used throughout the daily learning flow for interactive pronunciation.
 */
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import * as TTSService from '@/services/TTSService';

interface TappableTextProps {
  text: string;
  language?: string;
  variant?: 'bodyLarge' | 'bodyMedium' | 'titleMedium' | 'titleLarge' | 'headlineSmall';
  style?: object;
  accessibilityLabel?: string;
}

export function TappableText({ text, language = 'en-US', variant = 'bodyLarge', style, accessibilityLabel }: TappableTextProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();

  const handlePress = useCallback((): void => {
    void TTSService.speak(text, { language, rate: 0.9 });
  }, [text, language]);

  return (
    <TouchableRipple
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel ?? `Nhấn để nghe: ${text}`}
      accessibilityRole="button"
      style={styles.touchable}
    >
      <View style={styles.row}>
        <Text variant={variant} style={[{ color: theme.colors.primary }, style]}>
          {text}
        </Text>
        <Text style={[styles.speaker, { color: theme.colors.primary }]}>🔊</Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  touchable: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  speaker: { fontSize: 14, marginLeft: 6 },
});
