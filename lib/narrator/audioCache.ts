import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const CACHE_VERSION = 'lesson-audio-v1';
const CACHE_DIR = `${FileSystem.cacheDirectory || ''}${CACHE_VERSION}/`;
const inflight = new Map<string, Promise<string>>();

/** A stuck CDN/edge request must not keep the narrator in "loading" forever. */
const DOWNLOAD_TIMEOUT_MS = 15000;
/**
 * Upper bound for the on-device audio cache. Lessons hold thousands of short
 * sentences and the cache was never pruned, so it could grow to hundreds of
 * megabytes and pressure the device.
 */
const MAX_CACHED_FILES = 300;

function safeName(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function audioCacheEnabled(): boolean {
  return Platform.OS !== 'web' && Boolean(FileSystem.cacheDirectory);
}

/** Deletes the oldest cached clips when the cache grows past its cap. */
async function pruneCacheDir(keepFile: string): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(CACHE_DIR);
    if (names.length <= MAX_CACHED_FILES) return;
    const entries = await Promise.all(names.map(async name => {
      const uri = `${CACHE_DIR}${name}`;
      try {
        const info = await FileSystem.getInfoAsync(uri);
        return info.exists && 'modificationTime' in info ? { uri, at: info.modificationTime ?? 0 } : null;
      } catch {
        return null;
      }
    }));
    const removable = entries
      .filter((entry): entry is { uri: string; at: number } => Boolean(entry) && !entry!.uri.endsWith(keepFile))
      .sort((a, b) => a.at - b.at);
    const excess = names.length - MAX_CACHED_FILES;
    await Promise.all(removable.slice(0, excess).map(entry => FileSystem.deleteAsync(entry.uri, { idempotent: true })));
  } catch {
    // Pruning is housekeeping; a failure must never block playback.
  }
}

async function downloadWithTimeout(url: string, localUri: string): Promise<string> {
  const resumable = FileSystem.createDownloadResumable(url, localUri, { headers: { Accept: 'audio/mpeg' } });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void resumable.pauseAsync().catch(() => undefined);
  }, DOWNLOAD_TIMEOUT_MS);

  try {
    const result = await resumable.downloadAsync();
    if (timedOut) throw new Error('Audio download timed out');
    if (!result) throw new Error('Audio download cancelled');
    if (result.status < 200 || result.status >= 300) throw new Error(`Audio download failed: ${result.status}`);
    return result.uri;
  } catch (error) {
    if (timedOut) {
      try { await FileSystem.deleteAsync(localUri, { idempotent: true }); } catch { /* ignore */ }
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function cacheAudioFile(url: string, key: string): Promise<string> {
  if (!audioCacheEnabled()) return url;
  const existing = inflight.get(url);
  if (existing) return existing;
  const task = (async () => {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    const fileName = `${safeName(key)}.mp3`;
    const localUri = `${CACHE_DIR}${fileName}`;
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists && info.size && info.size > 0) return localUri;
    const uri = await downloadWithTimeout(url, localUri);
    void pruneCacheDir(fileName);
    return uri;
  })();
  inflight.set(url, task);
  try { return await task; } finally { inflight.delete(url); }
}

export async function clearNarratorCache(): Promise<void> {
  if (!audioCacheEnabled()) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
}
