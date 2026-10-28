import type { LanguageDefinition, LanguageId } from './types';
import { FEATURES } from '../features';

/**
 * Lightweight language catalog — zero course-data imports.
 *
 * The home screen (`app/languages.tsx`) only needs display metadata and a few
 * counts. Importing the full lesson arrays here used to pull ~7 MB of course
 * content into the startup path before the first screen could paint. The
 * counts are static constants; `lib/languages/catalog.ts` (which does load the
 * real arrays) asserts in development that they stay in sync with the data.
 */
export interface LanguageMeta extends LanguageDefinition {
  sentencesCount: number;
}

export const ALL_LANGUAGE_META: readonly LanguageMeta[] = [
  {
    id: 'en',
    name: 'انگلیسی',
    nativeName: 'English',
    speechLocale: 'en-US',
    accent: '#6356d9',
    lessonsCount: 174,
    sentencesCount: 3862,
    description: 'جمله‌های کاربردی، کارگاه تلفظ، مرور و مجموعه ۵۰۴',
    status: 'available',
    home: '/lang',
  },
  {
    id: 'de',
    name: 'آلمانی',
    nativeName: 'Deutsch',
    speechLocale: 'de-DE',
    accent: '#087e75',
    lessonsCount: 95,
    sentencesCount: 4715,
    description: 'درس‌های جمله‌محور، کارگاه تلفظ و تمرین واژگان در چهار مرحله',
    status: 'available',
    home: '/learn/de',
  },
  {
    id: 'ru',
    name: 'روسی',
    nativeName: 'Русский',
    speechLocale: 'ru-RU',
    accent: '#4267a8',
    lessonsCount: 120,
    sentencesCount: 3800,
    description: '۱۲۰ درس از Foundation تا Advanced، با ۳۸۰۰ جمله و واژه‌های پیوندخورده با بافت',
    status: 'available',
    home: '/learn/ru',
  },
  {
    id: 'tr',
    name: 'ترکی استانبولی',
    nativeName: 'Türkçe',
    speechLocale: 'tr-TR',
    accent: '#C2410C',
    lessonsCount: 66,
    sentencesCount: 528,
    description: '۶۶ درس جمله‌محور؛ ۱۴ درس A1 Foundation، ۲۰ موضوع A1 Survival با ۴ درس تکمیلی حفظ‌شده، ۲۴ درس A2 و ۴ درس B1، با ۵۲۸ جمله و الگوی پسوندها',
    status: 'available',
    home: '/learn/tr',
  },
];

/** The 3 courses available in the With-Login Learner App (managed by Admin). */
export const LOGIN_APP_LANGUAGE_META: readonly LanguageMeta[] = ALL_LANGUAGE_META.filter(
  language => language.id !== 'ru',
);

export function isBuildLanguageEnabled(id: LanguageId | string): boolean {
  switch (id) {
    case 'en':
      return FEATURES.englishCourse;
    case 'de':
      return FEATURES.germanCourse;
    case 'ru':
      return FEATURES.russianCourse;
    case 'tr':
      return FEATURES.turkishCourse;
    default:
      return false;
  }
}

/**
 * Build-filtered language catalog:
 *  - App #2 (`en_ru`, no login)        → English, Russian
 *  - App #3 (`all_four`, no login)     → English, German, Russian, Turkish
 *  - App #4 (`login_en_de_tr`, login)  → English, German, Turkish (NEVER Russian)
 *  - Plain Node default (unit tests)   → English, German, Russian
 */
export const LANGUAGE_META: readonly LanguageMeta[] = ALL_LANGUAGE_META.filter(
  language => isBuildLanguageEnabled(language.id),
);

/** Same shape as the old `LANGUAGES` export, without the extra count field. */
export const LANGUAGES: readonly LanguageDefinition[] = LANGUAGE_META.map(
  ({ sentencesCount: _sentencesCount, ...definition }) => definition,
);

export const TOTAL_LESSON_COUNT = LANGUAGE_META.reduce((sum, language) => sum + language.lessonsCount, 0);
export const TOTAL_SENTENCE_COUNT = LANGUAGE_META.reduce((sum, language) => sum + language.sentencesCount, 0);

export function findLanguageMeta(id: string | undefined): LanguageMeta | undefined {
  return LANGUAGE_META.find(language => language.id === id);
}

export type { LanguageId };
