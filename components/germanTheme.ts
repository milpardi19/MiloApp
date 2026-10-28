import type { GermanSentenceLevelId } from '@/lib/languages/germanSentenceCourse';

/** Unified luxury identity across all languages: Royal Sapphire & Champagne Gold. */
export const GermanPalette = {
  canvas: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FB',
  ink: '#0C1836',
  text: '#3A4E70',
  muted: '#6E82A3',
  border: '#E2EAF6',
  primary: '#1E4ED8',
  primaryDark: '#143599',
  primarySoft: '#EBF1FF',
  teal: '#1868A8',
  tealSoft: '#E9F4FD',
  success: '#0F8A5F',
  successSoft: '#E8F8F2',
  warning: '#B88628',
  warningSoft: '#FDF7EA',
  danger: '#D14343',
  dangerSoft: '#FDEEEE',
  gold: '#B88628',
  goldSoft: '#FDF7EA',
  forest: '#1E4ED8',
  forestDeep: '#0B1533',
} as const;

export const GERMAN_LEVEL_GRADIENTS: Record<GermanSentenceLevelId, [string, string]> = {
  0: ['#2558E0', '#14348F'],
  1: ['#15996B', '#0B6646'],
  2: ['#2179C2', '#114D7D'],
  3: ['#C48123', '#7D4E10'],
};
