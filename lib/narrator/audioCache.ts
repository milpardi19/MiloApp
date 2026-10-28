import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const CACHE_VERSION = 'lesson-audio-v1';
const CACHE_DIR = `${FileSystem.cacheDirectory || ''}${CACHE_VERSION}/`;
const inflight = new Map<string, Promise<string>>();

function safeName(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function audioCacheEnabled(): boolean {
  return Platform.OS !== 'web' && Boolean(FileSystem.cacheDirectory);
}

export async function cacheAudioFile(url: string, key: string): Promise<string> {
  if (!audioCacheEnabled()) return url;
  const existing = inflight.get(url);
  if (existing) return existing;
  const task = (async () => {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    const localUri = `${CACHE_DIR}${safeName(key)}.mp3`;
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists && info.size && info.size > 0) return localUri;
    const result = await FileSystem.downloadAsync(url, localUri, {
      headers: { Accept: 'audio/mpeg' },
    });
    if (result.status < 200 || result.status >= 300) throw new Error(`Audio download failed: ${result.status}`);
    return result.uri;
  })();
  inflight.set(url, task);
  try { return await task; } finally { inflight.delete(url); }
}

export async function clearNarratorCache(): Promise<void> {
  if (!audioCacheEnabled()) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
}
