/**
 * TTSControls — floating bottom sheet with TTS playback controls.
 *
 * Shows play/stop buttons, rate presets, pitch presets, and voice selector.
 * Compact design that doesn't block lesson content.
 *
 * Vietnamese labels: "Tốc độ đọc", "Cao độ", "Giọng đọc"
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTTSStore } from '@/stores/ttsStore';

// ─── Rate/Pitch presets ──────────────────────────────────────────────────────

const RATE_PRESETS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2.0 },
];

const PITCH_PRESETS = [
  { label: 'Thấp', value: 0.7 },
  { label: 'Bình thường', value: 1.0 },
  { label: 'Cao', value: 1.3 },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface TTSControlsProps {
  /** Called when user presses the play/read button. */
  onPlay: () => void;
  /** Whether the controls panel is visible. */
  visible: boolean;
  /** Called to dismiss the controls. */
  onDismiss: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TTSControls({ onPlay, visible, onDismiss }: TTSControlsProps) {
  const theme = useTheme<MD3Theme>();
  const {
    isSpeaking,
    rate,
    pitch,
    selectedVoice,
    availableVoices,
    stop,
    setRate,
    setPitch,
    setVoice,
    loadVoices,
  } = useTTSStore();

  const [voiceMenuVisible, setVoiceMenuVisible] = useState(false);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices]);

  const handlePlayStop = useCallback(() => {
    if (isSpeaking) {
      void stop();
    } else {
      onPlay();
    }
  }, [isSpeaking, stop, onPlay]);

  const handleRateSelect = useCallback(
    (value: number) => {
      void setRate(value);
    },
    [setRate],
  );

  const handlePitchSelect = useCallback(
    (value: number) => {
      void setPitch(value);
    },
    [setPitch],
  );

  const handleVoiceSelect = useCallback(
    (voiceId: string | undefined) => {
      void setVoice(voiceId);
      setVoiceMenuVisible(false);
    },
    [setVoice],
  );

  // Filter Vietnamese voices for the selector
  const vietnameseVoices = availableVoices.filter(
    (v) => v.language.startsWith('vi'),
  );
  const displayVoices = vietnameseVoices.length > 0 ? vietnameseVoices : availableVoices.slice(0, 10);

  const selectedVoiceName = availableVoices.find(
    (v) => v.identifier === selectedVoice,
  )?.name ?? 'Mặc định';

  if (!visible) {
    return null;
  }

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      elevation={4}
    >
      {/* Header row with title and close */}
      <View style={styles.headerRow}>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
          Đọc bài
        </Text>
        <IconButton
          icon="close"
          size={20}
          onPress={onDismiss}
          accessibilityLabel="Đóng điều khiển đọc bài"
        />
      </View>

      <Divider />

      {/* Play/Stop button */}
      <View style={styles.playRow}>
        <Button
          mode={isSpeaking ? 'outlined' : 'contained'}
          icon={isSpeaking ? 'stop' : 'play'}
          onPress={handlePlayStop}
          style={styles.playButton}
          contentStyle={styles.playButtonContent}
          accessibilityLabel={isSpeaking ? 'Dừng đọc' : 'Đọc bài'}
        >
          {isSpeaking ? 'Dừng' : 'Đọc bài'}
        </Button>
      </View>

      {/* Rate presets */}
      <View style={styles.presetSection}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
        >
          Tốc độ đọc
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.presetRow}>
            {RATE_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                mode={rate === preset.value ? 'flat' : 'outlined'}
                selected={rate === preset.value}
                onPress={() => handleRateSelect(preset.value)}
                compact
                style={styles.presetChip}
                accessibilityLabel={`Tốc độ đọc ${preset.label}`}
                accessibilityRole="button"
              >
                {preset.label}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Pitch presets */}
      <View style={styles.presetSection}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
        >
          Cao độ
        </Text>
        <View style={styles.presetRow}>
          {PITCH_PRESETS.map((preset) => (
            <Chip
              key={preset.value}
              mode={pitch === preset.value ? 'flat' : 'outlined'}
              selected={pitch === preset.value}
              onPress={() => handlePitchSelect(preset.value)}
              compact
              style={styles.presetChip}
              accessibilityLabel={`Cao độ ${preset.label}`}
              accessibilityRole="button"
            >
              {preset.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Voice selector */}
      {displayVoices.length > 0 && (
        <View style={styles.voiceSection}>
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
          >
            Giọng đọc
          </Text>
          <Menu
            visible={voiceMenuVisible}
            onDismiss={() => setVoiceMenuVisible(false)}
            anchor={
              <Chip
                mode="outlined"
                onPress={() => setVoiceMenuVisible(true)}
                accessibilityLabel={`Giọng đọc: ${selectedVoiceName}`}
                accessibilityRole="button"
                compact
              >
                {selectedVoiceName}
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => handleVoiceSelect(undefined)}
              title="Mặc định"
            />
            <ScrollView style={styles.voiceMenu}>
              {displayVoices.map((voice) => (
                <Menu.Item
                  key={voice.identifier}
                  onPress={() => handleVoiceSelect(voice.identifier)}
                  title={voice.name}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>
      )}
    </Surface>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  playRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  playButton: {
    borderRadius: 12,
    minWidth: 160,
  },
  playButtonContent: {
    minHeight: 44,
  },
  presetSection: {
    paddingVertical: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    marginRight: 4,
  },
  voiceSection: {
    paddingVertical: 8,
  },
  voiceMenu: {
    maxHeight: 200,
  },
});
