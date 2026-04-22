/**
 * ttsStore — Zustand store for Text-to-Speech state management.
 *
 * Manages speaking state, rate, pitch, voice selection.
 * Persists rate/pitch/voice preferences in AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TTSService from '@/services/TTSService';
import type { TTSVoice } from '@/services/TTSService';

// ─── AsyncStorage keys ───────────────────────────────────────────────────────

const KEY_TTS_RATE = '@tts_rate';
const KEY_TTS_PITCH = '@tts_pitch';
const KEY_TTS_VOICE = '@tts_voice';

// ─── State ───────────────────────────────────────────────────────────────────

interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  rate: number;
  pitch: number;
  selectedVoice: string | undefined;
  availableVoices: TTSVoice[];
}

interface TTSActions {
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  togglePause: () => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setPitch: (pitch: number) => Promise<void>;
  setVoice: (voiceId: string | undefined) => Promise<void>;
  loadVoices: () => Promise<void>;
  loadPreferences: () => Promise<void>;
}

type TTSStore = TTSState & TTSActions;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTTSStore = create<TTSStore>((set, get) => ({
  // State
  isSpeaking: false,
  isPaused: false,
  rate: 1.0,
  pitch: 1.0,
  selectedVoice: undefined,
  availableVoices: [],

  // Actions

  speak: async (text: string) => {
    const { rate, pitch, selectedVoice } = get();

    set({ isSpeaking: true, isPaused: false });

    await TTSService.speak(text, {
      rate,
      pitch,
      voice: selectedVoice,
      onDone: () => {
        set({ isSpeaking: false, isPaused: false });
      },
      onStopped: () => {
        set({ isSpeaking: false, isPaused: false });
      },
      onError: () => {
        set({ isSpeaking: false, isPaused: false });
      },
    });
  },

  stop: async () => {
    await TTSService.stop();
    set({ isSpeaking: false, isPaused: false });
  },

  togglePause: async () => {
    // expo-speech does not natively support pause/resume on all platforms.
    // On Android, stopping and re-speaking is the only reliable approach.
    // For simplicity, togglePause acts as stop.
    const { isSpeaking } = get();
    if (isSpeaking) {
      await TTSService.stop();
      set({ isSpeaking: false, isPaused: false });
    }
  },

  setRate: async (rate: number) => {
    const clamped = Math.min(Math.max(rate, 0.5), 2.0);
    TTSService.setRate(clamped);
    set({ rate: clamped });
    try {
      await AsyncStorage.setItem(KEY_TTS_RATE, String(clamped));
    } catch {
      // Silently ignore storage errors
    }
  },

  setPitch: async (pitch: number) => {
    const clamped = Math.min(Math.max(pitch, 0.5), 2.0);
    TTSService.setPitch(clamped);
    set({ pitch: clamped });
    try {
      await AsyncStorage.setItem(KEY_TTS_PITCH, String(clamped));
    } catch {
      // Silently ignore storage errors
    }
  },

  setVoice: async (voiceId: string | undefined) => {
    TTSService.setVoice(voiceId);
    set({ selectedVoice: voiceId });
    try {
      if (voiceId) {
        await AsyncStorage.setItem(KEY_TTS_VOICE, voiceId);
      } else {
        await AsyncStorage.removeItem(KEY_TTS_VOICE);
      }
    } catch {
      // Silently ignore storage errors
    }
  },

  loadVoices: async () => {
    try {
      const voices = await TTSService.getVoices();
      set({ availableVoices: voices });
    } catch {
      set({ availableVoices: [] });
    }
  },

  loadPreferences: async () => {
    try {
      const [rateStr, pitchStr, voiceId] = await Promise.all([
        AsyncStorage.getItem(KEY_TTS_RATE),
        AsyncStorage.getItem(KEY_TTS_PITCH),
        AsyncStorage.getItem(KEY_TTS_VOICE),
      ]);

      const rate = rateStr ? parseFloat(rateStr) : 1.0;
      const pitch = pitchStr ? parseFloat(pitchStr) : 1.0;

      const clampedRate = Math.min(Math.max(isNaN(rate) ? 1.0 : rate, 0.5), 2.0);
      const clampedPitch = Math.min(Math.max(isNaN(pitch) ? 1.0 : pitch, 0.5), 2.0);

      TTSService.setRate(clampedRate);
      TTSService.setPitch(clampedPitch);
      TTSService.setVoice(voiceId ?? undefined);

      set({
        rate: clampedRate,
        pitch: clampedPitch,
        selectedVoice: voiceId ?? undefined,
      });
    } catch {
      // Use defaults on error
    }
  },
}));
