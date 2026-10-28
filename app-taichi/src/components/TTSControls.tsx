/**
 * TTSControls — bottom panel to read a form's text aloud (Vietnamese).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, IconButton, Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { TTSService } from '@/services/TTSService';
import { useSettingsStore } from '@/stores/settingsStore';

interface Props {
  text: string;
  onClose: () => void;
}

export function TTSControls({ text, onClose }: Props) {
  const theme = useTheme();
  const { ttsRate, setTtsRate } = useSettingsStore();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      TTSService.stop();
    };
  }, []);

  const play = () => {
    TTSService.stop();
    setSpeaking(true);
    TTSService.speak(text, {
      rate: ttsRate,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  const stop = () => {
    TTSService.stop();
    setSpeaking(false);
  };

  return (
    <Surface elevation={4} style={[styles.container, { backgroundColor: theme.colors.elevation.level2 }]}>
      <View style={styles.row}>
        <Text variant="titleSmall">Đọc bài</Text>
        <IconButton icon="close" size={20} onPress={() => { stop(); onClose(); }} />
      </View>
      <View style={styles.controls}>
        <IconButton
          icon={speaking ? 'stop' : 'play'}
          mode="contained"
          size={28}
          onPress={speaking ? stop : play}
        />
        <View style={styles.rateWrap}>
          <Text variant="labelMedium" style={styles.rateLabel}>Tốc độ</Text>
          <SegmentedButtons
            value={String(ttsRate)}
            onValueChange={(v) => setTtsRate(Number(v))}
            density="small"
            buttons={[
              { value: '0.75', label: '0.75x' },
              { value: '1', label: '1x' },
              { value: '1.25', label: '1.25x' },
              { value: '1.5', label: '1.5x' },
            ]}
          />
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateWrap: { flex: 1 },
  rateLabel: { marginBottom: 4 },
});
