import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguageId } from './languages/types';

const ACTIVE_LANGUAGE_KEY = 'learner_active_language_v1';
let memory: LanguageId | null = null;

export async function getActiveLanguage(): Promise<LanguageId | null> {
  if (memory) return memory;
  try {
    const value = Platform.OS === 'web' ? localStorage.getItem(ACTIVE_LANGUAGE_KEY) : await AsyncStorage.getItem(ACTIVE_LANGUAGE_KEY);
    if (value === 'en' || value === 'de' || value === 'ru' || value === 'tr') {
      memory = value;
      return value;
    }
  } catch {
    // A missing or temporarily unavailable preference never blocks language learning.
  }
  return null;
}

export async function setActiveLanguage(language: LanguageId): Promise<void> {
  memory = language;
  try {
    if (Platform.OS === 'web') localStorage.setItem(ACTIVE_LANGUAGE_KEY, language);
    else await AsyncStorage.setItem(ACTIVE_LANGUAGE_KEY, language);
  } catch {
    // The route remains usable even when preference persistence is unavailable.
  }
}
