/**
 * TTSService — Text-to-Speech wrapper around expo-speech.
 * Handles long text by chunking into smaller pieces.
 * Default language is Vietnamese (vi-VN).
 */
import * as Speech from 'expo-speech';

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

const DEFAULT_LANGUAGE = 'vi-VN';
const DEFAULT_RATE = 1.0;
const DEFAULT_PITCH = 1.0;
const MAX_CHUNK_LENGTH = 500; // Android TTS works best with short chunks

let currentRate = DEFAULT_RATE;
let currentPitch = DEFAULT_PITCH;
let currentVoice: string | undefined;
let isStopped = false;

/**
 * Clean text for TTS — remove special characters that cause issues.
 */
function cleanTextForTTS(text: string): string {
  return text
    .replace(/[─│┌┐└┘├┤┬┴═║╔╗╚╝╠╣╦╩→←↑↓▶▼►◄┼╬╪╫]/g, '') // box-drawing chars
    .replace(/[`*_~#]/g, '') // markdown chars
    .replace(/\{[^}]*\}/g, '') // curly braces content
    .replace(/\[[^\]]*\]/g, '') // square brackets content  
    .replace(/[<>]/g, '') // angle brackets
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\.\s*\./g, '.') // collapse multiple dots
    .trim();
}

/**
 * Split text into chunks at sentence boundaries.
 */
function chunkText(text: string): string[] {
  const cleaned = cleanTextForTTS(text);
  if (cleaned.length <= MAX_CHUNK_LENGTH) {
    return cleaned.length > 0 ? [cleaned] : [];
  }

  const chunks: string[] = [];
  let remaining = cleaned;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find best split point (sentence end)
    let splitAt = -1;
    for (let i = MAX_CHUNK_LENGTH; i > MAX_CHUNK_LENGTH / 2; i--) {
      const ch = remaining[i];
      if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
        splitAt = i + 1;
        break;
      }
    }

    // Fallback: split at space
    if (splitAt === -1) {
      for (let i = MAX_CHUNK_LENGTH; i > MAX_CHUNK_LENGTH / 2; i--) {
        if (remaining[i] === ' ') {
          splitAt = i + 1;
          break;
        }
      }
    }

    // Last resort: hard split
    if (splitAt === -1) {
      splitAt = MAX_CHUNK_LENGTH;
    }

    const chunk = remaining.substring(0, splitAt).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks;
}

/**
 * Speak text — chunks long text and reads sequentially.
 */
export async function speak(text: string, options?: TTSOptions): Promise<void> {
  await stop();
  isStopped = false;

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    options?.onDone?.();
    return;
  }

  const rate = clamp(options?.rate ?? currentRate, 0.5, 2.0);
  const pitch = clamp(options?.pitch ?? currentPitch, 0.5, 2.0);
  const language = options?.language ?? DEFAULT_LANGUAGE;
  const voice = options?.voice ?? currentVoice;

  let started = false;

  // Speak chunks sequentially
  for (let i = 0; i < chunks.length; i++) {
    if (isStopped) {
      options?.onStopped?.();
      return;
    }

    const chunk = chunks[i]!;
    const isLast = i === chunks.length - 1;

    await new Promise<void>((resolve) => {
      Speech.speak(chunk, {
        language,
        rate,
        pitch,
        voice,
        onStart: () => {
          if (!started) {
            started = true;
            options?.onStart?.();
          }
        },
        onDone: () => {
          resolve();
        },
        onStopped: () => {
          isStopped = true;
          resolve();
        },
        onError: (error) => {
          // Skip this chunk, continue with next
          console.warn('[TTS] Chunk error:', error);
          resolve();
        },
      });
    });
  }

  if (!isStopped) {
    options?.onDone?.();
  }
}

export async function stop(): Promise<void> {
  isStopped = true;
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export async function getVoices(): Promise<TTSVoice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v) => ({
    identifier: v.identifier,
    name: v.name,
    language: v.language,
  }));
}

export function setRate(rate: number): void {
  currentRate = clamp(rate, 0.5, 2.0);
}

export function setPitch(pitch: number): void {
  currentPitch = clamp(pitch, 0.5, 2.0);
}

export function setVoice(voiceId: string | undefined): void {
  currentVoice = voiceId;
}

export function getRate(): number { return currentRate; }
export function getPitch(): number { return currentPitch; }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
