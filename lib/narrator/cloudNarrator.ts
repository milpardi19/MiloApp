import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { SUPABASE_PUBLIC_URL } from '@/lib/supabaseConfig';
import { cacheAudioFile } from './audioCache';
import { NARRATOR_PERSONA_TAG, prepareTextForTts, type NarratorLocale } from './voiceCast';

/**
 * Optional cloud narrator.
 *
 * When the `narration-tts` Edge Function or approved CDN is available, the
 * lesson narrator speaks with the selected cloud voice. The function is
 * discovered automatically. The narrator never falls back to device speech;
 * unavailable audio is reported clearly.
 *
 * Only the sentence being taught is sent — never learner data or audio.
 */

export type CloudNarratorMode = 'auto' | 'on' | 'off';

export class NarratorBlockedError extends Error {
  constructor() {
    super('Narrator playback needs one tap from the learner.');
    this.name = 'NarratorBlockedError';
  }
}

export class NarratorCloudUnavailableError extends Error {
  constructor(message = 'Cloud narrator is unavailable.') {
    super(message);
    this.name = 'NarratorCloudUnavailableError';
  }
}

const HEALTH_KEY = 'mml_narrator_cloud_health_v1';
const HEALTH_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;
/** ~40 ms of silence, used to unlock playback inside a tap handler. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';

let health: { ok: boolean; checkedAt: number } | null = null;
let webAudio: HTMLAudioElement | null = null;
let nativePlayer: AudioPlayer | null = null;
let playing = false;
let finishCurrent: ((error?: Error) => void) | null = null;

export function cloudNarratorMode(): CloudNarratorMode {
  const raw = (process.env.EXPO_PUBLIC_NARRATOR_CLOUD || 'auto').trim().toLowerCase();
  if (raw === 'off' || raw === 'false') return 'off';
  if (raw === 'on' || raw === 'true') return 'on';
  return 'auto';
}

export function narratorCdnEndpoint(): string | null {
  const configured = (process.env.EXPO_PUBLIC_NARRATOR_CDN_URL || '').trim();
  if (!configured || /placeholder|example\.com/i.test(configured)) return null;
  return configured.replace(/\/+$/, '');
}

export function cloudNarratorEndpoint(): string | null {
  if (cloudNarratorMode() === 'off') return null;
  const configured = (process.env.EXPO_PUBLIC_NARRATION_TTS_URL || '').trim();
  const base = configured || (SUPABASE_PUBLIC_URL ? `${SUPABASE_PUBLIC_URL.replace(/\/+$/, '')}/functions/v1/narration-tts` : '');
  if (!base) return null;
  if (/placeholder|your-project|example\.com/i.test(base)) return null;
  return base.replace(/\/+$/, '');
}

function readStoredHealth(): boolean | null {
  if (health) return health.ok;
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(HEALTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ok?: boolean; checkedAt?: number };
    if (typeof parsed.checkedAt !== 'number' || Date.now() - parsed.checkedAt > HEALTH_TTL_MS) return null;
    health = { ok: parsed.ok === true, checkedAt: parsed.checkedAt };
    return health.ok;
  } catch {
    return null;
  }
}

function storeHealth(ok: boolean): void {
  health = { ok, checkedAt: Date.now() };
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(HEALTH_KEY, JSON.stringify(health));
    }
  } catch {
    // A blocked storage API must never stop the narrator.
  }
}

function languageCode(locale: NarratorLocale): string {
  return locale.slice(0, 2).toLowerCase();
}

function buildUrl(text: string, locale: NarratorLocale): string {
  const endpoint = cloudNarratorEndpoint();
  if (!endpoint) throw new NarratorCloudUnavailableError('Cloud narrator is not configured.');
  const spokenText = prepareTextForTts(text, locale);
  // Built by hand: Hermes on Android has no URLSearchParams.
  // The voice is always synthesised at its natural pace; "slow" is applied at
  // playback (pitch-preserving) so the prosody stays fully human.
  const params = [
    `lang=${encodeURIComponent(languageCode(locale))}`,
    `text=${encodeURIComponent(spokenText)}`,
    `speed=1`,
    `persona=${encodeURIComponent(NARRATOR_PERSONA_TAG)}`,
  ];
  const token = (process.env.EXPO_PUBLIC_NARRATION_TTS_TOKEN || '').trim();
  if (token) params.push(`token=${encodeURIComponent(token)}`);
  return `${endpoint}?${params.join('&')}`;
}


function stableAudioKey(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function buildCdnUrl(text: string, locale: NarratorLocale): string | null {
  const base = narratorCdnEndpoint();
  if (!base) return null;
  const extension = (process.env.EXPO_PUBLIC_NARRATOR_CDN_FORMAT || 'mp3').trim().toLowerCase();
  const safeExtension = extension === 'm4a' || extension === 'opus' ? extension : 'mp3';
  return `${base}/${languageCode(locale)}/${stableAudioKey(text)}.${safeExtension}`;
}

function audioUrls(text: string, locale: NarratorLocale): string[] {
  const urls = [buildCdnUrl(text, locale)];
  if (cloudNarratorEndpoint()) urls.push(buildUrl(text, locale));
  return urls.filter((url): url is string => Boolean(url));
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller?.signal,
      headers: { Accept: 'audio/mpeg' },
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Asks the Edge Function once per session whether a human voice is available. */
export async function checkCloudNarrator(): Promise<boolean> {
  if (!cloudNarratorEndpoint() && !narratorCdnEndpoint()) return false;
  // A configured CDN is itself a valid narrator source. Its individual file
  // is checked in playCloudNarration, so a failing Edge health endpoint must
  // never block already-published CDN audio.
  if (narratorCdnEndpoint()) return true;
  const stored = readStoredHealth();
  if (stored !== null) return stored;

  try {
    const endpoint = cloudNarratorEndpoint();
    if (!endpoint) { storeHealth(true); return true; }
    const response = await fetchWithTimeout(`${endpoint}?health=1`, 5000);
    let ok = false;
    if (response.ok) {
      const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      ok = body?.ok === true;
    }
    storeHealth(ok);
    return ok;
  } catch {
    storeHealth(false);
    return false;
  }
}

export function isCloudNarratorActive(): boolean {
  return playing;
}

/**
 * A single HTML audio element is reused for every sentence. Browsers unlock an
 * element on the first user gesture, so reusing it keeps later sentences
 * playable even when the browser refuses fresh autoplay.
 */
function ensureWebAudio(): HTMLAudioElement {
  if (!webAudio) {
    const audio = new Audio();
    audio.preload = 'auto';
    webAudio = audio;
  }
  return webAudio;
}

export async function unlockCloudPlayback(): Promise<boolean> {
  if (Platform.OS !== 'web') return true;
  try {
    const audio = ensureWebAudio();
    audio.src = SILENT_WAV;
    const started = audio.play();
    if (started && typeof started.then === 'function') await started;
    audio.pause();
    return true;
  } catch {
    return false;
  }
}

export function pauseCloudNarration(): boolean {
  if (webAudio && !webAudio.paused) {
    try {
      webAudio.pause();
      return true;
    } catch {
      return false;
    }
  }
  if (nativePlayer?.playing) {
    try {
      nativePlayer.pause();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function resumeCloudNarration(): boolean {
  if (webAudio && webAudio.paused && webAudio.src) {
    try {
      void webAudio.play();
      playing = true;
      return true;
    } catch {
      return false;
    }
  }
  if (nativePlayer && !nativePlayer.playing) {
    try {
      nativePlayer.play();
      playing = true;
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Stops the cloud voice and resolves any waiting narration promise. */
export function stopCloudNarration(): void {
  const finish = finishCurrent;
  finishCurrent = null;
  playing = false;

  if (Platform.OS === 'web') {
    if (webAudio) {
      try {
        webAudio.pause();
        webAudio.onended = null;
        webAudio.onerror = null;
        // Keep the element itself (it carries the browser's playback unlock)
        // but drop the finished source so nothing resumes by accident.
        webAudio.removeAttribute('src');
        webAudio.load();
      } catch {
        // Ignore a partially constructed element.
      }
    }
  } else if (nativePlayer) {
    try {
      nativePlayer.pause();
      nativePlayer.remove();
    } catch {
      // The player may already be released.
    }
    nativePlayer = null;
  }

  finish?.();
}

function playWeb(url: string, cancelled: () => boolean, playbackRate: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const audio = ensureWebAudio();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      playing = false;
      if (finishCurrent === finish) finishCurrent = null;
      audio.onended = null;
      audio.onerror = null;
      if (error) reject(error);
      else resolve();
    };
    finishCurrent = finish;

    audio.crossOrigin = 'anonymous';
    audio.src = url;
    try {
      audio.preservesPitch = true;
      audio.playbackRate = playbackRate;
    } catch {
      // Older engines ignore pitch-preserving playback rate.
    }
    audio.onended = () => finish();
    audio.onerror = () => finish(new NarratorCloudUnavailableError('Narrator audio could not be decoded.'));

    if (cancelled()) {
      finish();
      return;
    }

    const started = audio.play();
    playing = true;
    if (started && typeof started.then === 'function') {
      started.then(
        () => {
          if (cancelled()) {
            try { audio.pause(); } catch { /* ignore */ }
            finish();
          }
        },
        error => {
          const name = (error as { name?: string } | undefined)?.name;
          finish(name === 'NotAllowedError'
            ? new NarratorBlockedError()
            : new NarratorCloudUnavailableError('Narrator audio was blocked.'));
        },
      );
    }
  });
}

function playNative(url: string, cancelled: () => boolean, playbackRate: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const player = createAudioPlayer({ uri: url }, { updateInterval: 250, downloadFirst: true });
    nativePlayer = player;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      playing = false;
      if (finishCurrent === finish) finishCurrent = null;
      try { player.remove(); } catch { /* ignore */ }
      if (nativePlayer === player) nativePlayer = null;
      if (error) reject(error);
      else resolve();
    };
    finishCurrent = finish;

    player.addListener('playbackStatusUpdate', status => {
      if (cancelled()) {
        finish();
        return;
      }
      if (status.didJustFinish) finish();
    });

    try {
      player.playbackRate = playbackRate;
      player.play();
      playing = true;
    } catch {
      finish(new NarratorCloudUnavailableError('Narrator audio could not start.'));
    }

    if (cancelled()) finish();
  });
}

/**
 * Plays one sentence with the cloud narrator and resolves when it ends.
 * Throws `NarratorBlockedError` when the browser needs a user gesture first.
 */
export async function playCloudNarration(params: {
  text: string;
  locale: NarratorLocale;
  playbackRate?: number;
  cancelled: () => boolean;
}): Promise<void> {
  const { text, locale, playbackRate = 1, cancelled } = params;
  if (!(await checkCloudNarrator())) throw new NarratorCloudUnavailableError();
  if (cancelled()) return;

  const key = `${locale}|${text}`;
  let selectedUrl = prefetchedPlayableUrls.get(key) ?? null;
  if (!selectedUrl) {
    const urls = audioUrls(text, locale);
    if (!urls.length) throw new NarratorCloudUnavailableError('No CDN or cloud narrator endpoint is configured.');
    // Do not make a second health/download request before playback. The audio
    // element/player reports decode or network failure and the prefetch cache
    // will handle the next visit without adding a full extra round trip.
    selectedUrl = urls[0] ?? null;
  }
  if (!selectedUrl) throw new NarratorCloudUnavailableError('Narrator audio is unavailable.');
  if (cancelled()) return;

  stopCloudNarration();
  const playableUrl = Platform.OS === 'web'
    ? selectedUrl
    : await cacheAudioFile(selectedUrl, `${languageCode(locale)}-${stableAudioKey(text)}`);
  if (cancelled()) return;
  if (Platform.OS === 'web') return playWeb(playableUrl, cancelled, playbackRate);
  return playNative(playableUrl, cancelled, playbackRate);
}

const prefetched = new Set<string>();
const prefetchedPlayableUrls = new Map<string, string>();

/**
 * Warms the sentence audio while the lesson screen is still settling so the
 * narrator starts instantly, in one continuous human phrase.
 */
export async function prefetchCloudNarration(text: string, locale: NarratorLocale): Promise<void> {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || clean.length > 320) return;
  const key = `${locale}|${clean}`;
  if (prefetched.has(key)) return;
  prefetched.add(key);
  if (prefetched.size > 60) {
    const oldest = prefetched.values().next().value;
    if (oldest) {
      prefetched.delete(oldest);
      const oldUrl = prefetchedPlayableUrls.get(oldest);
      if (oldUrl?.startsWith('blob:') && typeof URL !== 'undefined') URL.revokeObjectURL(oldUrl);
      prefetchedPlayableUrls.delete(oldest);
    }
  }
  try {
    if (!(await checkCloudNarrator())) return;
    const url = audioUrls(clean, locale)[0];
    if (url) {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        if (Platform.OS !== 'web') {
          await cacheAudioFile(url, `${languageCode(locale)}-${stableAudioKey(clean)}`);
          prefetchedPlayableUrls.set(key, url);
        } else if (typeof URL !== 'undefined' && typeof response.blob === 'function') {
          const blob = await response.blob();
          prefetchedPlayableUrls.set(key, URL.createObjectURL(blob));
        } else {
          prefetchedPlayableUrls.set(key, url);
        }
      }
    }
  } catch {
    // Prefetch is an optimisation only; playback has its own error handling.
  }
}
