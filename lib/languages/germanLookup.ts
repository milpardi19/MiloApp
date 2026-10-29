import { createCourseProgressStore } from '../createCourseProgressStore';
import { GERMAN_SENTENCE_LESSONS } from './germanSentenceCourse';

/**
 * German-only lookup helpers.
 *
 * `lib/languages/catalog.ts` imports every course at once (English, German,
 * Russian and Turkish), which is ~7 MB of literal data and ~350 ms of module
 * evaluation on a desktop CPU — several times that on a phone. Every German
 * screen needs only the German lessons, so it imports this module instead and
 * the other three courses are never evaluated when the learner studies German.
 *
 * `catalog.ts` re-exports these same objects, so both import paths share one
 * progress store instance and one lesson array.
 */
export { GERMAN_SENTENCE_LESSONS };

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

export function findGermanLesson(id: string | undefined) {
  return GERMAN_SENTENCE_LESSONS.find(lesson => lesson.id === id);
}
