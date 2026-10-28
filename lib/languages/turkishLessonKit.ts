import type { LearningLesson, LearningSentence } from './types';

/**
 * سازنده‌های مشترک درس‌های ترکی.
 *
 * هر جملهٔ ترکی با چهار چیز همراه است: متن ترکی، معنی فارسی، تلفظ تقریبی با
 * حروف فارسی و یک واژهٔ کلیدی که از همان جمله بیرون آمده است. الگوی جمله
 * (`pattern`) هم اختیاری است و در پنل «دستور در کاربرد» نشان داده می‌شود.
 */
export const trSentence = (
  id: string,
  text: string,
  fa: string,
  pronunciation: string,
  word: string,
  meaning: string,
  pattern?: string,
): LearningSentence => ({
  id,
  text,
  fa,
  pronunciation,
  ...(pattern ? { pattern } : {}),
  vocabulary: [{ word, meaning }],
});

export const trLesson = (
  id: string,
  title: string,
  situation: string,
  sentences: LearningSentence[],
  dialogue: LearningLesson['dialogue'],
  checks: NonNullable<LearningLesson['checks']>,
  teachingFa?: string,
): LearningLesson => ({
  id,
  title,
  situation,
  durationMinutes: 10,
  sentences,
  dialogue,
  checks,
  ...(teachingFa ? { teachingFa } : {}),
});
