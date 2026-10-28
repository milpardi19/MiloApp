import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED, registerNarrationStopHandler } from '@/lib/narration';
import { setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
import {
  checkCloudNarrator,
  isCloudNarratorActive,
  NarratorBlockedError,
  NarratorCloudUnavailableError,
  pauseCloudNarration,
  playCloudNarration,
  prefetchCloudNarration,
  resumeCloudNarration,
  stopCloudNarration,
  unlockCloudPlayback,
} from './cloudNarrator';
import {
  type NarratorLocale,
  type NarratorSpeed,
  narratorRateFor,
  resolveNarratorVoice,
  selectedNarratorLabel,
} from './voiceCast';

/**
 * The lesson narrator engine.
 *
 * One warm female voice per language reads the sentence a learner is looking
 * at. It prefers the human-sounding cloud narrator when it is deployed and
 * never falls back to the device speech engine. All lesson screens share this
 * single engine, so a tap on any speaker control and the automatic narrator can
 * never talk over each other.
 */

export type NarratorStatus = 'idle' | 'loading' | 'speaking' | 'paused' | 'blocked' | 'error';
export type NarratorEngineKind = 'cloud' | null;

export interface NarratorSnapshot {
  status: NarratorStatus;
  engine: NarratorEngineKind;
  voiceLabel: string;
  qualityLabel: string;
  auto: boolean;
  speed: NarratorSpeed;
  settingsReady: boolean;
  cloudAvailable: boolean;
  cloudChecked: boolean;
  message: string;
  locale: NarratorLocale | null;
  text: string;
}

const SETTINGS_KEY = 'mml_narrator_settings_v1';

type PersistedSettings = { auto?: boolean; speed?: NarratorSpeed };

let snapshot: NarratorSnapshot = {
  status: 'idle',
  engine: null,
  voiceLabel: 'در حال شناسایی صدا…',
  qualityLabel: '',
  auto: true,
  speed: 'normal',
  settingsReady: false,
  cloudAvailable: false,
  cloudChecked: false,
  message: '',
  locale: null,
  text: '',
};

const listeners = new Set<() => void>();
let requestId = 0;
let lastRequest: { text: string; locale: NarratorLocale } | null = null;
let settingsWriteTimer: ReturnType<typeof setTimeout> | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function update(patch: Partial<NarratorSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  emit();
}

export function getNarratorSnapshot(): NarratorSnapshot {
  return snapshot;
}

export function subscribeNarrator(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persistSettings(): void {
  if (settingsWriteTimer) clearTimeout(settingsWriteTimer);
  settingsWriteTimer = setTimeout(() => {
    const settings: PersistedSettings = { auto: snapshot.auto, speed: snapshot.speed };
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  }, 250);
}

async function loadSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PersistedSettings) : {};
    update({
      auto: parsed.auto !== false,
      speed: parsed.speed === 'slow' || parsed.speed === 'fast' ? parsed.speed : 'normal',
      settingsReady: true,
    });
  } catch {
    update({ settingsReady: true });
  }
}

void loadSettings();

/** Keeps the device audio session warm so iOS plays the narrator in silent mode. */
let audioSessionPrepared = false;
async function prepareAudioSession(): Promise<void> {
  if (audioSessionPrepared || Platform.OS === 'web') return;
  audioSessionPrepared = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
  } catch {
    audioSessionPrepared = false;
  }
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * True while the engine itself calls `Speech.stop()`. The registered cleanup
 * must not mistake that internal stop for a learner pressing another button.
 */
let internalStop = false;
let turkishDeviceFallbackEnabled = false;

/**
 * Enables graceful female `tr-TR` voice fallback exclusively for App #4 Turkish
 * lessons in case the cloud Edge Function has not been redeployed with `tr` yet
 * or the device is momentarily offline. Cloud neural audio always remains first.
 */
export function setTurkishDeviceFallbackEnabled(enabled: boolean): void {
  turkishDeviceFallbackEnabled = enabled;
}

async function speakTurkishDeviceFallback(
  text: string,
  speed: NarratorSpeed,
  id: number,
): Promise<boolean> {
  try {
    const resolved = await resolveNarratorVoice('tr-TR');
    if (id !== requestId || !resolved.voice) return false;
    update({
      status: 'speaking',
      engine: null,
      voiceLabel: `${resolved.label} · ${resolved.quality}`,
      qualityLabel: resolved.quality,
      message: '',
    });
    await new Promise<void>((resolve, reject) => {
      Speech.speak(text, {
        language: resolved.language,
        voice: resolved.voice,
        rate: narratorRateFor('tr-TR', speed),
        pitch: 1,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => reject(new Error('TR_DEVICE_TTS_FAILED')),
      });
    });
    if (id === requestId) {
      update({ status: snapshot.status === 'paused' ? 'paused' : 'idle' });
    }
    return true;
  } catch {
    return false;
  }
}

function haltPlayback(): void {
  stopCloudNarration();
  internalStop = true;
  try {
    void Speech.stop();
  } finally {
    internalStop = false;
  }
}

/**
 * Reads one sentence with the professional narrator.
 * Resolves when the voice finishes, pauses, or is replaced by a newer request.
 */
export async function narrate(
  text: string,
  locale: NarratorLocale,
  options: { speed?: NarratorSpeed } = {},
): Promise<void> {
  if (!NARRATION_ENABLED) return;
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return;

  const id = ++requestId;
  lastRequest = { text: clean, locale };
  const speed = options.speed ?? snapshot.speed;

  haltPlayback();
  // `speechSynthesis.cancel()` needs a tick to settle; speaking immediately
  // clips the first syllable and makes even a good voice sound broken.
  if (Platform.OS === 'web') await delay(45);
  await prepareAudioSession();
  if (id !== requestId) return;

  update({ status: 'loading', message: '', locale, text: clean });

  const cloud = await checkCloudNarrator();
  if (id !== requestId) return;
  update({ cloudAvailable: cloud, cloudChecked: true });

  if (cloud) {
    try {
      update({ status: 'speaking', engine: 'cloud', voiceLabel: selectedNarratorLabel(locale), qualityLabel: 'CDN/ابری تأییدشده' });
      await playCloudNarration({
        text: clean,
        locale,
        playbackRate: narratorRateFor(locale, speed),
        cancelled: () => id !== requestId,
      });
      if (id !== requestId) return;
      update({ status: snapshot.status === 'paused' ? 'paused' : 'idle' });
      return;
    } catch (error) {
      if (id !== requestId) return;
      if (error instanceof NarratorBlockedError) {
        update({ status: 'blocked', message: 'برای شنیدن نریتور، یک‌بار دکمهٔ پخش را لمس کنید.' });
        return;
      }
      if (locale === 'tr-TR' && turkishDeviceFallbackEnabled) {
        const spokeFallback = await speakTurkishDeviceFallback(clean, speed, id);
        if (spokeFallback || id !== requestId) return;
      }
      update({
        ...(locale === 'tr-TR' ? {} : { cloudAvailable: false }),
        status: 'error',
        engine: null,
        message: 'فایل صوتی تأییدشدهٔ این جمله در CDN یا سرویس نریتور در دسترس نیست.',
      });
      return;
    }
  }

  if (locale === 'tr-TR' && turkishDeviceFallbackEnabled) {
    const spokeFallback = await speakTurkishDeviceFallback(clean, speed, id);
    if (spokeFallback || id !== requestId) return;
  }

  if (id === requestId) {
    update({ status: 'error', engine: null, message: 'نریتور ابری/CDN پیکربندی نشده است؛ صدای دستگاه عمداً استفاده نمی‌شود.' });
  }
}

/** Stops narration and clears the current request. */
export function stopNarration(): void {
  requestId += 1;
  stopCloudNarration();
  void Speech.stop();
  update({ status: 'idle', message: '', engine: null });
}

/** Pauses the approved cloud/CDN narrator. */
export async function pauseNarration(): Promise<void> {
  if (snapshot.status !== 'speaking' && snapshot.status !== 'loading') return;
  pauseCloudNarration();
  update({ status: 'paused' });
}

/** Resumes after a pause, or replays when the engine could not pause. */
export async function resumeNarration(): Promise<void> {
  if (snapshot.status !== 'paused') return;
  if (resumeCloudNarration()) {
    update({ status: 'speaking', engine: 'cloud' });
    return;
  }
  if (lastRequest) await narrate(lastRequest.text, lastRequest.locale);
}

/**
 * Called inside a user gesture after the browser blocked autoplay.
 * Unlocks the audio element, then restarts the sentence.
 */
export async function unlockAndReplay(): Promise<void> {
  await unlockCloudPlayback();
  update({ status: 'idle', message: '' });
  if (lastRequest) await narrate(lastRequest.text, lastRequest.locale);
}

export function setNarratorAuto(auto: boolean): void {
  update({ auto });
  persistSettings();
  if (!auto) stopNarration();
}

export function setNarratorSpeed(speed: NarratorSpeed): void {
  update({ speed });
  persistSettings();
  if (snapshot.status === 'paused' || snapshot.status === 'blocked') return;
  if (lastRequest) void narrate(lastRequest.text, lastRequest.locale, { speed });
}

/** Warms the voice list and the cloud availability check before the first word. */
export async function primeNarrator(locale: NarratorLocale, text?: string): Promise<void> {
  const cloud = await checkCloudNarrator();
  update({ cloudAvailable: cloud, cloudChecked: true });
  if (cloud && text) void prefetchCloudNarration(text, locale);
}

/** Warms the sentence audio ahead of the automatic reading. */
export function prefetchSentence(text: string, locale: NarratorLocale): void {
  void prefetchCloudNarration(text, locale);
}

export function isNarratorBusy(): boolean {
  return isCloudNarratorActive() || snapshot.status === 'speaking' || snapshot.status === 'loading';
}

/**
 * Any screen that calls the shared narration stop hook also silences the cloud
 * narrator, so lesson audio is never left playing behind a new sentence.
 */
registerNarrationStopHandler(() => {
  stopCloudNarration();
  if (internalStop) return;
  if (snapshot.engine === 'cloud' && snapshot.status !== 'blocked') {
    update({ status: 'idle', engine: null });
  }
});
