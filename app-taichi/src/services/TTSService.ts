import * as Speech from 'expo-speech';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  onDone?: () => void;
  onStopped?: () => void;
}

/** Thin wrapper around expo-speech for Vietnamese TTS. */
export const TTSService = {
  speak(text: string, options: SpeakOptions = {}): void {
    Speech.speak(text, {
      language: options.language ?? 'vi-VN',
      rate: options.rate ?? 1.0,
      pitch: options.pitch ?? 1.0,
      onDone: options.onDone,
      onStopped: options.onStopped,
    });
  },

  stop(): void {
    Speech.stop();
  },

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },
};
