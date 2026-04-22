/**
 * TTSService — Text-to-Speech wrapper around expo-speech.
 *
 * Provides speak, stop, pause, resume, and voice management.
 * Default language is Vietnamese (vi-VN).
 */
import * as Speech from 'expo-speech';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TTSVoice {
  identifier: string;
  name: string;
  language: string;
}

export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

// ─── Default config ──────────────────────────────────────────────────────────

const DEFAULT_LANGUAGE = 'vi-VN';
const DEFAULT_RATE = 1.0;
const DEFAULT_PITCH = 1.0;
const MIN_RATE = 0.5;
const MAX_RATE = 2.0;
const MIN_PITCH = 0.5;
const MAX_PITCH = 2.0;

// ─── Internal state ──────────────────────────────────────────────────────────

let currentRate = DEFAULT_RATE;
let currentPitch = DEFAULT_PITCH;
let currentVoice: string | undefined;

// ─── Service functions ───────────────────────────────────────────────────────

/**
 * Speak the given text with optional overrides.
 * Stops any current speech before starting.
 */
export async function speak(text: string, options?: TTSOptions): Promise<void> {
  // Stop any ongoing speech first
  await stop();

  const rate = clamp(options?.rate ?? currentRate, MIN_RATE, MAX_RATE);
  const pitch = clamp(options?.pitch ?? currentPitch, MIN_PITCH, MAX_PITCH);
  const language = options?.language ?? DEFAULT_LANGUAGE;
  const voice = options?.voice ?? currentVoice;

  Speech.speak(text, {
    language,
    rate,
    pitch,
    voice,
    onStart: options?.onStart,
    onDone: options?.onDone,
    onStopped: options?.onStopped,
    onError: options?.onError,
  });
}

/** Stop all current speech. */
export async function stop(): Promise<void> {
  Speech.stop();
}

/** Check if the engine is currently speaking. */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/** Get all available voices on the device. */
export async function getVoices(): Promise<TTSVoice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v) => ({
    identifier: v.identifier,
    name: v.name,
    language: v.language,
  }));
}

/** Set the default speech rate (0.5–2.0). */
export function setRate(rate: number): void {
  currentRate = clamp(rate, MIN_RATE, MAX_RATE);
}

/** Set the default pitch (0.5–2.0). */
export function setPitch(pitch: number): void {
  currentPitch = clamp(pitch, MIN_PITCH, MAX_PITCH);
}

/** Set the default voice identifier. */
export function setVoice(voiceId: string | undefined): void {
  currentVoice = voiceId;
}

/** Get current rate. */
export function getRate(): number {
  return currentRate;
}

/** Get current pitch. */
export function getPitch(): number {
  return currentPitch;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
