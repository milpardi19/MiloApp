import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const APP_LOCK_KEY = 'milo_app_lock_v1';

export interface AppLockConfig {
  version: 1;
  patternEnabled: boolean;
  deviceEnabled: boolean;
  patternSalt?: string;
  patternHash?: string;
}

export const DEFAULT_APP_LOCK_CONFIG: AppLockConfig = {
  version: 1,
  patternEnabled: false,
  deviceEnabled: false,
};

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(APP_LOCK_KEY);
  }
  return SecureStore.getItemAsync(APP_LOCK_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(APP_LOCK_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(APP_LOCK_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getAppLockConfig(): Promise<AppLockConfig> {
  try {
    const raw = await readRaw();
    if (!raw) return DEFAULT_APP_LOCK_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppLockConfig>;
    const patternReady = parsed.patternEnabled === true
      && typeof parsed.patternSalt === 'string'
      && typeof parsed.patternHash === 'string';
    return {
      version: 1,
      patternEnabled: patternReady,
      deviceEnabled: parsed.deviceEnabled === true && Platform.OS !== 'web',
      ...(patternReady ? { patternSalt: parsed.patternSalt, patternHash: parsed.patternHash } : {}),
    };
  } catch {
    return DEFAULT_APP_LOCK_CONFIG;
  }
}

export const isAppLockEnabled = (config: AppLockConfig) => config.patternEnabled || config.deviceEnabled;

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');

async function patternDigest(pattern: number[], salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pattern.join('-')}`,
  );
}

export async function savePattern(pattern: number[]): Promise<AppLockConfig> {
  if (pattern.length < 4 || new Set(pattern).size !== pattern.length || pattern.some(value => value < 1 || value > 9)) {
    throw new Error('الگو باید حداقل چهار نقطهٔ متفاوت داشته باشد.');
  }
  const current = await getAppLockConfig();
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(24));
  const next: AppLockConfig = {
    ...current,
    patternEnabled: true,
    patternSalt: salt,
    patternHash: await patternDigest(pattern, salt),
  };
  await writeRaw(JSON.stringify(next));
  return next;
}

export async function verifyPattern(pattern: number[]): Promise<boolean> {
  const config = await getAppLockConfig();
  if (!config.patternEnabled || !config.patternSalt || !config.patternHash) return false;
  return (await patternDigest(pattern, config.patternSalt)) === config.patternHash;
}

export async function setPatternEnabled(enabled: boolean): Promise<AppLockConfig> {
  const current = await getAppLockConfig();
  const next: AppLockConfig = enabled && current.patternHash && current.patternSalt
    ? { ...current, patternEnabled: true }
    : { version: 1, deviceEnabled: current.deviceEnabled, patternEnabled: false };
  await writeRaw(JSON.stringify(next));
  return next;
}

export async function authenticateWithDeviceLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level < LocalAuthentication.SecurityLevel.SECRET) {
    throw new Error('ابتدا قفل صفحهٔ اصلی گوشی را در تنظیمات دستگاه فعال کنید.');
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'بازکردن قفل MiloMultilang',
    cancelLabel: 'انصراف',
    fallbackLabel: 'استفاده از قفل اصلی گوشی',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function setDeviceLockEnabled(enabled: boolean): Promise<AppLockConfig> {
  const current = await getAppLockConfig();
  const next = { ...current, deviceEnabled: enabled && Platform.OS !== 'web' };
  await writeRaw(JSON.stringify(next));
  return next;
}
