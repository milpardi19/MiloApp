import type { LanguageDefinition } from './types';
import { ALL_LANGUAGE_META, LANGUAGES } from './catalogMeta';
import { SENTENCE_LESSONS } from '../courseContent';
import { GERMAN_SENTENCE_LESSONS } from './germanSentenceCourse';
import { RUSSIAN_LESSONS, russianProgress } from './russian';
import { TURKISH_LESSONS, turkishProgress } from './turkish';
import { createCourseProgressStore } from '../createCourseProgressStore';

export { LANGUAGES };
export { russianProgress };
export { turkishProgress };
export { TURKISH_LESSONS };

/**
 * The home screen reads static counts from the lightweight `catalogMeta`
 * module so it never has to load the full lesson arrays. This module is the
 * only place that imports both the static metadata and the real data, so it
 * owns the drift check: if a course gains or loses a lesson/sentence, update
 * the constants in catalogMeta.ts.
 */
if (process.env.NODE_ENV !== 'production') {
  const liveCounts = {
    en: { lessons: SENTENCE_LESSONS.length, sentences: SENTENCE_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0) },
    de: { lessons: GERMAN_SENTENCE_LESSONS.length, sentences: GERMAN_SENTENCE_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0) },
    ru: { lessons: RUSSIAN_LESSONS.length, sentences: RUSSIAN_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0) },
    tr: { lessons: TURKISH_LESSONS.length, sentences: TURKISH_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0) },
  } as const;
  for (const meta of ALL_LANGUAGE_META) {
    const live = liveCounts[meta.id];
    if (meta.lessonsCount !== live.lessons || meta.sentencesCount !== live.sentences) {
      throw new Error(
        `catalogMeta drift for ${meta.id}: metadata says ${meta.lessonsCount} lessons / ${meta.sentencesCount} sentences, ` +
          `course data has ${live.lessons} / ${live.sentences}. Update lib/languages/catalogMeta.ts.`,
      );
    }
  }
}

export function findLanguage(id: string | undefined) {
  return LANGUAGES.find((language: LanguageDefinition) => language.id === id);
}

export const germanProgress = createCourseProgressStore({
  key: 'sentence_course_progress_de_v2',
  lessons: GERMAN_SENTENCE_LESSONS,
  cloudSync: false,
  recordEstimatedTime: false,
  afterLocalSave: () => {
    void import('../personalLearningSync')
      .then(({ schedulePersonalLearningSync }) => schedulePersonalLearningSync())
      .catch(() => undefined);
  },
});
export function findGermanLesson(id: string | undefined) { return GERMAN_SENTENCE_LESSONS.find(l => l.id === id); }

export function findTurkishCourseLesson(id: string | undefined) { return TURKISH_LESSONS.find(l => l.id === id); }
