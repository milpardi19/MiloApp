const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');

(async () => {
  const output = path.resolve('node_modules/.cache/russian-course-test.cjs');
  await esbuild.build({
    stdin: {
      contents: [
        "export * from './lib/languages/russian';",
        "export * from './lib/languages/catalog';",
        "export * from './lib/languages/russianStudyState';",
        "export * from './lib/languages/german';",
        "export * from './lib/courseContent';",
        "export * from './lib/englishLearningEngine';",
      ].join('\n'),
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: output,
    plugins: [{
      name: 'local-course-test-stubs',
      setup(build) {
        build.onResolve({ filter: /^\.\/supabase$/ }, args => args.importer.endsWith('/lib/createCourseProgressStore.ts')
          ? { path: 'supabase', namespace: 'russian-supabase-stub' }
          : null);
        build.onLoad({ filter: /.*/, namespace: 'russian-supabase-stub' }, () => ({
          contents: 'export const supabase = { auth: { async getSession() { globalThis.__russianSupabaseCalls = (globalThis.__russianSupabaseCalls || 0) + 1; return { data: { session: null } }; }, async signInAnonymously() { globalThis.__russianSupabaseCalls = (globalThis.__russianSupabaseCalls || 0) + 1; return { data: { user: null }, error: null }; } }, from() { globalThis.__russianSupabaseCalls = (globalThis.__russianSupabaseCalls || 0) + 1; return { upsert: async () => ({ data: null, error: null }) }; } };',
          loader: 'js',
        }));
        build.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: 'async-storage', namespace: 'russian-storage-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'russian-storage-stub' }, () => ({ contents: 'export default { async getItem() { return null; }, async setItem() {}, async removeItem() {} };', loader: 'js' }));
        build.onResolve({ filter: /^expo-constants$/ }, () => ({ path: 'expo-constants', namespace: 'russian-constants-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'russian-constants-stub' }, () => ({ contents: 'export default { expoConfig: { extra: {} } };', loader: 'js' }));
        build.onResolve({ filter: /^react-native$/ }, () => ({ path: 'react-native', namespace: 'russian-platform-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'russian-platform-stub' }, () => ({ contents: 'export const Platform = { OS: "web" };', loader: 'js' }));
      },
    }],
  });

  const app = require(output);
  const checks = [];
  const check = (label, value) => { assert(value, label); checks.push(label); };
  const sentenceCount = app.RUSSIAN_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0);
  const vocabularyOccurrenceCount = app.RUSSIAN_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.reduce((count, sentence) => count + sentence.vocabulary.length, 0), 0);
  const uniqueVocabularyCount = new Set(app.RUSSIAN_LESSONS.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word.trim().toLocaleLowerCase('ru-RU'))))).size;
  const expectedLessonIds = ['ru-l2-cafe','ru-l2-shopping','ru-l2-directions','ru-l2-time','ru-l2-days','ru-l2-daily-routine','ru-l2-emergency','ru-l2-restaurant-order','ru-l2-paying-bill','ru-l2-clothes-sizes','ru-l2-groceries','ru-l2-taxi','ru-l2-bus-tickets','ru-l2-hotel','ru-l2-phone-calls','ru-l2-appointments','ru-l2-pharmacy','ru-l2-lost-property','ru-l2-weekend-plans','ru-l2-invitations','ru-l2-months-dates','ru-l3-past-simple','ru-l3-future-simple','ru-l3-plans','ru-l3-appearance','ru-l3-comparisons','ru-l3-advice','ru-l3-likes-opinions','ru-l3-work-study','ru-l3-home','ru-l3-hobbies-sport','ru-l3-travel','ru-l3-conditions','ru-l3-daily-sequence','ru-l3-shopping-return','ru-l3-health-doctor','ru-l3-phone-internet','ru-l3-public-service','ru-l3-weather-seasons','ru-l3-cooking-food','ru-l3-conversation-tools'];

  check('Cyrillic alphabet has 33 unique letters', app.RUSSIAN_ALPHABET.length === 33 && new Set(app.RUSSIAN_ALPHABET).size === 33);
  check('Russian course contains the new 40-lesson Foundation before the unchanged Survival-to-Advanced sequence', app.RUSSIAN_LESSONS.length === 120
    && app.RUSSIAN_LESSONS.filter(lesson => lesson.levelId === 0).length === 40
    && app.RUSSIAN_LESSONS.slice(0, 40).every(lesson => lesson.id.startsWith('ru-l1-') && lesson.levelId === 0)
    && expectedLessonIds.every(id => app.RUSSIAN_LESSONS.some(lesson => lesson.id === id))
    && app.RUSSIAN_LESSONS.every(lesson => lesson.id.startsWith('ru-') && lesson.title && lesson.situation));
  check('Russian course has 3,800 sentence records, including 1,400 Foundation sentences with exactly 35 per lesson', sentenceCount === 3800
    && app.RUSSIAN_LESSONS.filter(lesson => lesson.levelId === 0).reduce((sum, lesson) => sum + lesson.sentences.length, 0) === 1400
    && app.RUSSIAN_LESSONS.filter(lesson => lesson.levelId === 0).every(lesson => lesson.sentences.length === 35)
    && app.RUSSIAN_LESSONS.filter(lesson => lesson.levelId !== 0).every(lesson => lesson.sentences.length >= 30));
  check('Russian roadmap registers five levels, numbered Foundation 1 through Advanced 5', app.RUSSIAN_LEVELS.map(level => level.id).join('|') === '0|1|2|3|4'
    && app.RUSSIAN_LEVELS.length === 5
    && app.RUSSIAN_LEVELS[0].title === 'Foundation'
    && app.RUSSIAN_LEVELS.every(level => level.title && level.description && level.modules.length > 0));
  check('all five Russian levels retain professionally structured lessons and correct counts', app.RUSSIAN_LESSONS.every((lesson, index) => lesson.order === index + 1 && lesson.subtitle && lesson.sentences.length >= 30)
    && app.RUSSIAN_LEVELS.map(level => app.RUSSIAN_LESSONS.filter(lesson => lesson.levelId === level.id).length).join('|') === '40|30|30|10|10'
    && app.RUSSIAN_LEVELS.every(level => level.status === 'available'));
  check('the Foundation follows the exact 20-topic blueprint in two consecutive lessons per topic', app.RUSSIAN_LEVELS[0].modules.length === 20
    && app.RUSSIAN_LESSONS.slice(0, 40).every((lesson, index) => lesson.title.startsWith(`${app.RUSSIAN_LEVELS[0].modules[Math.floor(index / 2)]} ·`)));
  check('all Russian levels are available as authored lesson routes', app.RUSSIAN_LEVELS.every(level => level.status === 'available'
    && app.RUSSIAN_LESSONS.some(lesson => lesson.levelId === level.id)));
  const allRussianIds = app.RUSSIAN_LESSONS.flatMap(lesson => [lesson.id, ...lesson.sentences.map(sentence => sentence.id)]);
  check('Russian lesson and sentence IDs are unique', new Set(allRussianIds).size === allRussianIds.length);
  check('all Russian sentences have a real pattern, Persian meaning, pure-Persian pronunciation and three contextual vocabulary entries', app.RUSSIAN_LESSONS.every(lesson => lesson.sentences.every(sentence => /[А-Яа-яЁё]/.test(sentence.text)
    && !!sentence.fa && !!sentence.pattern && !!sentence.pronunciation && !/[А-Яа-яЁёA-Za-z]/.test(sentence.pronunciation) && sentence.vocabulary.length >= 3)));
  check('every lesson has a short dialogue and two valid self-study checks', app.RUSSIAN_LESSONS.every(lesson => lesson.dialogue.length >= 3
    && lesson.dialogue.every(line => /[А-Яа-яЁё]/.test(line.text) && !!line.fa)
    && lesson.checks.length === 2 && lesson.checks.every(question => question.choices.length === 3
      && new Set(question.choices).size === 3 && question.correctIndex >= 0 && question.correctIndex < question.choices.length)));
  check('sentence-builder grammar notes stay attached to original Russian examples', app.RUSSIAN_LESSONS.every(lesson => lesson.sentences.filter(sentence => sentence.pattern)
    .every(sentence => sentence.text && sentence.fa)));
  check('Russian stage IDs, order and labels exactly match English nine-stage flow', app.RUSSIAN_LESSON_STAGES.length === 9
    && app.RUSSIAN_LESSON_STAGES.every((stage, index) => stage.id === app.ENGLISH_ENGINE_STEPS[index].id
      && stage.labelFa === app.ENGLISH_ENGINE_STEPS[index].labelFa
      && stage.labelEn === app.ENGLISH_ENGINE_STEPS[index].labelEn));
  check('English lesson scope is 174 lessons and 3862 examples, including 750 Communication and 1000 Everyday examples', app.SENTENCE_LESSONS.length === 174
    && app.SENTENCE_LESSONS.reduce((sum, lesson) => sum + lesson.sentences.length, 0) === 3862
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 0).length === 10
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 0).reduce((sum, lesson) => sum + lesson.sentences.length, 0) === 500
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 2).length === 20
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 2).reduce((sum, lesson) => sum + lesson.sentences.length, 0) === 1000
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 3).length === 15
    && app.SENTENCE_LESSONS.filter(lesson => lesson.levelId === 3).reduce((sum, lesson) => sum + lesson.sentences.length, 0) === 750);
  check('German legacy lesson set remains twelve lessons', app.GERMAN_LESSONS.length === 12);
  check('language picker registers en/de/ru without changing existing locales', app.LANGUAGES.map(language => language.id).join('|') === 'en|de|ru'
    && app.LANGUAGES.find(language => language.id === 'en').speechLocale === 'en-US'
    && app.LANGUAGES.find(language => language.id === 'de').speechLocale === 'de-DE'
    && app.LANGUAGES.find(language => language.id === 'ru').speechLocale === 'ru-RU');
  check('Russian lesson count and home route are registered', app.LANGUAGES.find(language => language.id === 'ru').lessonsCount === 120
    && app.LANGUAGES.find(language => language.id === 'ru').home === '/learn/ru'
    && app.russianProgress && typeof app.russianProgress.completeSentenceLesson === 'function');
  check('Russian has independent progress and draft/session storage namespaces', app.RUSSIAN_STUDY_STORAGE_KEY === 'russian_lesson_sessions_v1'
    && app.RUSSIAN_STUDY_STORAGE_KEY !== 'sentence_course_progress_ru_v2');

  const memory = new Map();
  global.__russianSupabaseCalls = 0;
  global.window = { localStorage: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); },
  } };
  const firstLesson = app.RUSSIAN_LESSONS[0];
  const fresh = await app.loadRussianLessonSession(firstLesson.id);
  check('new Russian session starts at stage one without writing another language key', fresh.stage === 0 && memory.size === 0);
  const saved = { stage: 4, sentenceIndex: 2, revealed: true, answers: { '0': 1 }, showCheckAnswers: false };
  await app.saveRussianLessonSession(firstLesson.id, saved);
  const restored = await app.loadRussianLessonSession(firstLesson.id);
  check('Russian session resumes its stage, sentence and local check answer', JSON.stringify(restored) === JSON.stringify(saved));
  check('session data is stored only under the Russian session key', memory.size === 1 && memory.has(app.RUSSIAN_STUDY_STORAGE_KEY));
  const invalid = { ...saved, stage: 9 };
  await assert.rejects(() => app.saveRussianLessonSession(firstLesson.id, invalid));
  check('invalid Russian session cannot overwrite stored progress', memory.get(app.RUSSIAN_STUDY_STORAGE_KEY) === JSON.stringify({ schema: 1, sessions: { [firstLesson.id]: saved } }));
  await app.clearRussianLessonSession(firstLesson.id);
  check('clearing the Russian session does not touch course-progress storage', memory.size === 0);
  await app.russianProgress.completeSentenceLesson(firstLesson.id, app.RUSSIAN_LESSONS[1].id);
  const savedProgress = await app.russianProgress.getCourseProgress();
  check('Russian lesson completion persists under its own progress key and advances', savedProgress.completedLessonIds.includes(firstLesson.id)
    && savedProgress.currentLessonId === app.RUSSIAN_LESSONS[1].id
    && memory.has('sentence_course_progress_ru_v2')
    && !memory.has('sentence_course_progress_v1')
    && !memory.has('sentence_course_progress_de_v1'));
  check('Russian completion enrolls only its eight sentences in local spaced review', (await app.russianProgress.getDueReviewCards()).length === firstLesson.sentences.length
    && (await app.russianProgress.getDueReviewCards()).every(card => card.lessonId === firstLesson.id));
  check('Russian completion does not invent study minutes or English vocabulary mastery', savedProgress.totalMinutes === 0
    && savedProgress.learnedEssential504Words.length === 0);
  check('Russian progress never calls the Supabase cloud client', global.__russianSupabaseCalls === 0);

  console.log(`${checks.length} Russian curriculum, nine-stage flow, registry, session-resume and language-isolation checks passed (${app.RUSSIAN_LESSONS.length} lessons, ${sentenceCount} sentences, ${vocabularyOccurrenceCount} vocabulary links, ${uniqueVocabularyCount} unique vocabulary forms).`);
})().catch(error => { console.error(error); process.exit(1); });
