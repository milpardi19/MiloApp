import { Platform } from 'react-native';

export type SupportedLuxuryLanguage = 'en' | 'de' | 'ru' | 'tr';

export const LuxuryPalette = {
  canvas: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFE',
  surfaceMuted: '#EEF3FB',
  border: '#E2EAF6',
  borderStrong: '#CCD9EE',
  ink: '#0C1836',
  inkSoft: '#3A4E70',
  inkBody: '#3A4E70',
  inkMuted: '#6E82A3',
  primary: '#1E4ED8',
  primaryDeep: '#143599',
  primarySoft: '#EBF1FF',
  primaryBorder: '#CBDCFF',
  gold: '#B88628',
  goldLight: '#F6D992',
  goldSoft: '#FDF7EA',
  goldBorder: '#F1DFB6',
  emerald: '#0F8A5F',
  emeraldSoft: '#E8F8F2',
  emeraldBorder: '#BCEAD9',
  amber: '#C2781A',
  amberSoft: '#FEF5E7',
  coral: '#D14343',
  coralSoft: '#FDEEEE',
  rose: '#D14343',
  roseSoft: '#FDEEEE',
  shadow: '#0B1838',
  heroGradient: ['#0B1533', '#152B6B', '#2146AD'] as const,
  heroAltGradient: ['#0E1B3D', '#1A347D', '#2852C4'] as const,
  cardCtaGradient: ['#1E4ED8', '#15389E'] as const,
};

export interface LuxuryLevelAccent {
  solid: string;
  soft: string;
  gradient: readonly [string, string];
}

export const LUXURY_LEVEL_ACCENTS: LuxuryLevelAccent[] = [
  { solid: '#1E4ED8', soft: '#EBF1FF', gradient: ['#14348F', '#2558E0'] },
  { solid: '#0F8A5F', soft: '#E8F8F2', gradient: ['#0B6646', '#15996B'] },
  { solid: '#1868A8', soft: '#E9F4FD', gradient: ['#114D7D', '#2179C2'] },
  { solid: '#5538B8', soft: '#F1EDFD', gradient: ['#3D268A', '#6546D1'] },
  { solid: '#A86B19', soft: '#FDF5E8', gradient: ['#7D4E10', '#C48123'] },
  { solid: '#9E2A5B', soft: '#FCEEF4', gradient: ['#751D42', '#BA356D'] },
];

export function getLuxuryLevelAccent(levelId: number): LuxuryLevelAccent {
  const index = Math.abs(Math.trunc(levelId)) % LUXURY_LEVEL_ACCENTS.length;
  return LUXURY_LEVEL_ACCENTS[index] ?? LUXURY_LEVEL_ACCENTS[0];
}

export interface LuxuryLanguageMeta {
  id: SupportedLuxuryLanguage;
  code: 'EN' | 'DE' | 'RU' | 'TR';
  eyebrow: string;
  nameFa: string;
  studioTitleFa: string;
  libraryTitleFa: string;
  reviewTitleFa: string;
  pronunciationTitleFa: string;
  homeHref: string;
  libraryHref: string;
  reviewHref: string;
  pronunciationHref: string;
}

export const LUXURY_LANGUAGE_META: Record<SupportedLuxuryLanguage, LuxuryLanguageMeta> = {
  en: {
    id: 'en',
    code: 'EN',
    eyebrow: 'ENGLISH STUDIO',
    nameFa: 'انگلیسی',
    studioTitleFa: 'مسیر جامع انگلیسی',
    libraryTitleFa: 'کتابخانهٔ درس‌های انگلیسی',
    reviewTitleFa: 'مرور هوشمند انگلیسی',
    pronunciationTitleFa: 'کارگاه تلفظ انگلیسی',
    homeHref: '/lang',
    libraryHref: '/lang/library',
    reviewHref: '/review',
    pronunciationHref: '/learn/en/pronunciation',
  },
  de: {
    id: 'de',
    code: 'DE',
    eyebrow: 'DEUTSCH STUDIO',
    nameFa: 'آلمانی',
    studioTitleFa: 'مسیر جامع آلمانی',
    libraryTitleFa: 'کتابخانهٔ درس‌های آلمانی',
    reviewTitleFa: 'مرور هوشمند آلمانی',
    pronunciationTitleFa: 'کارگاه تلفظ آلمانی',
    homeHref: '/learn/de',
    libraryHref: '/learn/de/library',
    reviewHref: '/learn/de/reviews',
    pronunciationHref: '/learn/de/pronunciation',
  },
  ru: {
    id: 'ru',
    code: 'RU',
    eyebrow: 'RUSSIAN STUDIO',
    nameFa: 'روسی',
    studioTitleFa: 'مسیر جامع روسی',
    libraryTitleFa: 'کتابخانهٔ درس‌های روسی',
    reviewTitleFa: 'مرور هوشمند روسی',
    pronunciationTitleFa: 'کارگاه تلفظ روسی',
    homeHref: '/learn/ru',
    libraryHref: '/learn/ru/library',
    reviewHref: '/learn/ru/review',
    pronunciationHref: '/learn/ru/pronunciation',
  },
  tr: {
    id: 'tr',
    code: 'TR',
    eyebrow: 'TURKISH STUDIO',
    nameFa: 'ترکی استانبولی',
    studioTitleFa: 'مسیر جامع ترکی',
    libraryTitleFa: 'کتابخانهٔ درس‌های ترکی',
    reviewTitleFa: 'مرور هوشمند ترکی',
    pronunciationTitleFa: 'کارگاه تلفظ ترکی',
    homeHref: '/learn/tr',
    libraryHref: '/learn/tr/library',
    reviewHref: '/learn/tr/review',
    pronunciationHref: '/learn/tr/pronunciation',
  },
};

const ACTIVE_LANG_UI_KEY = 'lj_ui_active_lang_v1';
let memoryActiveLanguage: SupportedLuxuryLanguage = 'en';

export function setLastActiveLanguage(language: SupportedLuxuryLanguage) {
  memoryActiveLanguage = language;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.sessionStorage?.setItem(ACTIVE_LANG_UI_KEY, language);
    } catch {
      // UI-only hint; safe to ignore storage errors.
    }
  }
}

export function getLastActiveLanguage(): SupportedLuxuryLanguage {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const saved = window.sessionStorage?.getItem(ACTIVE_LANG_UI_KEY);
      if (saved === 'en' || saved === 'de' || saved === 'ru' || saved === 'tr') {
        memoryActiveLanguage = saved;
        return saved;
      }
    } catch {
      // Ignore storage access issues.
    }
  }
  return memoryActiveLanguage;
}

export const LuxuryShadows = {
  card: {
    shadowColor: LuxuryPalette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.055,
    shadowRadius: 22,
    elevation: 3,
  },
  hero: {
    shadowColor: LuxuryPalette.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
  soft: {
    shadowColor: LuxuryPalette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
};
