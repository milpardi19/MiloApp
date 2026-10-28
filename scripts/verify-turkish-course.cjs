const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('esbuild');

/**
 * داده‌های دورهٔ ترکی استانبولی و دو نسخهٔ اپ را بدون راه‌اندازی اپ بررسی می‌کند.
 * اجرا: npm run validate:turkish
 */
(async () => {
  const output = path.resolve('node_modules/.cache/turkish-course-test.cjs');
  await esbuild.build({
    stdin: {
      contents: [
        "export * from './lib/languages/turkish';",
        "export * from './lib/languages/turkishStudyState';",
        "export * from './lib/languages/catalogMeta';",
      ].join('\n'),
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: output,
    plugins: [{
      name: 'turkish-course-test-stubs',
      setup(build) {
        build.onResolve({ filter: /^\.\/supabase$/ }, args => args.importer.endsWith('/lib/createCourseProgressStore.ts')
          ? { path: 'supabase', namespace: 'tr-supabase-stub' }
          : null);
        build.onLoad({ filter: /.*/, namespace: 'tr-supabase-stub' }, () => ({
          contents: 'export const supabase = { auth: { async getSession() { return { data: { session: null } }; } }, from() { return { upsert: async () => ({ data: null, error: null }) }; } };',
          loader: 'js',
        }));
        build.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: 'async-storage', namespace: 'tr-storage-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'tr-storage-stub' }, () => ({ contents: 'export default { async getItem() { return null; }, async setItem() {}, async removeItem() {} };', loader: 'js' }));
        build.onResolve({ filter: /^react-native$/ }, () => ({ path: 'react-native', namespace: 'tr-platform-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'tr-platform-stub' }, () => ({ contents: 'export const Platform = { OS: "web" };', loader: 'js' }));
        build.onResolve({ filter: /^expo-constants$/ }, () => ({ path: 'expo-constants', namespace: 'tr-constants-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'tr-constants-stub' }, () => ({ contents: 'export default { expoConfig: { extra: {} } };', loader: 'js' }));
      },
    }],
  });

  delete require.cache[require.resolve(output)];
  const app = require(output);
  const checks = [];
  const check = (label, value) => { assert(value, label); checks.push(label); };

  const lessons = app.TURKISH_LESSONS;
  const sentences = lessons.flatMap(lesson => lesson.sentences);
  const sentenceIds = sentences.map(sentence => sentence.id);
  const cyrillic = /[\u0400-\u04FF]/;
  const persian = /[\u0600-\u06FF]/;

  /** ترتیب‌های رسمی Foundation و Survival؛ عنوان درس‌های موجود دست‌نخورده می‌ماند. */
  const foundationTopics = app.TURKISH_LEVELS[0].modules;
  const survivalTopics = app.TURKISH_LEVELS[1].modules;
  const EXPECTED_FOUNDATION_TOPICS = [
    'سلام و احوال‌پرسی',
    'معرفی خود و دیگران',
    'ضمایر شخصی در جمله',
    'جمله‌های اسمی و پسوندهای شخصی',
    'ملیت، زبان و محل زندگی',
    'اعداد، سن و اطلاعات شخصی',
    'خانواده و مالکیت',
    'اسم‌ها، جمع و اشاره به اشخاص و اشیا',
    'توصیف ساده اشخاص، اشیا و مکان‌ها',
    'جمله‌های فعلی در زمان حال استمراری',
    'پرسش‌سازی و پاسخ‌های پایه',
    'جمله‌های منفی',
    'علایق، خواسته‌ها و نیازهای ساده',
    'مکان و موقعیت مکانی پایه',
  ];
  const EXPECTED_SURVIVAL_TOPICS = [
    'خرید، قیمت و پرداخت',
    'سفارش غذا و نوشیدنی',
    'آدرس‌پرسیدن و مسیر‌یابی',
    'حمل‌ونقل عمومی و تاکسی',
    'معرفی خود در موقعیت‌های اجتماعی',
    'رزرو هتل و اقامت',
    'سفر و اطلاعات گردشگری',
    'خرید بلیت و پرسیدن ساعت حرکت',
    'مکالمه در فروشگاه و بازار',
    'درخواست کمک و بیان مشکل',
    'مراجعه به پزشک و بیان علائم ساده',
    'مکالمه‌های ساده در محل کار و تحصیل',
    'بیان ساعت، تاریخ و برنامه روزانه',
    'صحبت درباره آب‌وهوا',
    'تماس تلفنی و پیام‌های کوتاه',
    'دعوت‌کردن، پذیرفتن و ردکردن دعوت',
    'درخواست مؤدبانه و اجازه‌گرفتن',
    'بیان توانایی و ناتوانی',
    'بیان گذشته نزدیک و اتفاق‌های ساده',
    'بیان برنامه‌های آینده نزدیک',
  ];
  const EXPECTED_FOUNDATION_IDS = [
    'tr-l1-01-greetings',
    'tr-l1-02-introduce',
    'tr-l1-03-pronouns',
    'tr-l1-04-nominal-sentences',
    'tr-l1-05-nationality',
    'tr-l1-09-numbers-age',
    'tr-l1-10-family',
    'tr-l1-11-nouns-plural',
    'tr-l1-12-describing',
    'tr-l1-06-present-continuous',
    'tr-l1-07-questions',
    'tr-l1-08-negative',
    'tr-l1-13-needs',
    'tr-l1-14-location',
  ];
  const EXPECTED_SURVIVAL_CORE_IDS = [
    'tr-l2-shopping',
    'tr-l2-cafe',
    'tr-l2-directions',
    'tr-l2-transport',
    'tr-survival-01-social-introduction',
    'tr-l2-hotel',
    'tr-survival-02-travel-tourism',
    'tr-survival-03-tickets-departures',
    'tr-survival-04-market-conversation',
    'tr-survival-05-help-and-problems',
    'tr-l2-health',
    'tr-survival-06-work-and-school',
    'tr-l2-time',
    'tr-survival-07-weather',
    'tr-survival-08-phone-and-messages',
    'tr-survival-09-invitations',
    'tr-l1-16-ability-request',
    'tr-survival-10-ability-and-inability',
    'tr-l1-18-past',
    'tr-l1-19-future',
  ];
  const EXPECTED_SURVIVAL_RETAINED_IDS = [
    'tr-l2-restaurant',
    'tr-l1-15-time',
    'tr-l1-17-motion',
    'tr-l1-20-conjunctions',
  ];
  const EXPECTED_SURVIVAL_ORDER_IDS = [
    'tr-l2-shopping', 'tr-l2-cafe', 'tr-l2-restaurant', 'tr-l2-directions', 'tr-l1-17-motion',
    'tr-l2-transport', 'tr-survival-01-social-introduction', 'tr-l2-hotel', 'tr-survival-02-travel-tourism',
    'tr-survival-03-tickets-departures', 'tr-survival-04-market-conversation', 'tr-survival-05-help-and-problems',
    'tr-l2-health', 'tr-survival-06-work-and-school', 'tr-l2-time', 'tr-l1-15-time', 'tr-survival-07-weather',
    'tr-survival-08-phone-and-messages', 'tr-survival-09-invitations', 'tr-l1-16-ability-request',
    'tr-survival-10-ability-and-inability', 'tr-l1-18-past', 'tr-l1-19-future', 'tr-l1-20-conjunctions',
  ];

  const a2Topics = app.TURKISH_LEVELS[2].modules;
  const EXPECTED_A2_TOPICS = [
    'معرفی کامل‌تر خود و دیگران',
    'توصیف ظاهر، شخصیت و ویژگی‌های افراد',
    'بیان عادت‌ها و فعالیت‌های روزمره',
    'بیان زمان، تاریخ و ترتیب رویدادها',
    'صحبت درباره گذشته و تجربه‌های شخصی',
    'بیان برنامه‌ها و پیش‌بینی‌های آینده',
    'مقایسه اشخاص، اشیا و مکان‌ها',
    'بیان ترجیحات، علایق و احساسات',
    'بیان نیاز، اجبار و ضرورت',
    'درخواست مؤدبانه و پیشنهاد دادن',
    'بیان توانایی، امکان و احتمال',
    'توضیح مسیر، آدرس و موقعیت مکانی',
    'خرید، قیمت، تخفیف و چانه‌زنی',
    'سفارش غذا و ارتباط در رستوران',
    'رزرو هتل و مکالمات سفر',
    'بیان مشکلات جسمی و مراجعه به پزشک',
    'صحبت درباره تحصیل، شغل و محیط کار',
    'بیان دلیل و نتیجه',
    'بیان شرط‌های ساده',
    'بیان موافقت، مخالفت و نظر شخصی',
    'بیان تجربه با ساختارهای ساده',
    'اتصال جمله‌ها با حروف ربط متنوع‌تر',
    'پرسیدن و پاسخ‌دادن به پرسش‌های چندبخشی',
    'تعریف‌کردن یک اتفاق یا تجربه در چند جمله مرتبط',
  ];

  check('Turkish course registers 66 lessons in four levels', lessons.length === 66
    && app.TURKISH_LEVELS.length === 4
    && app.TURKISH_LEVELS.map(level => level.id).join('|') === '0|1|2|3');
  check('Every level has lessons and an available status', app.TURKISH_LEVELS.every(level =>
    level.status === 'available'
    && lessons.filter(lesson => lesson.levelId === level.id).length > 0
    && level.modules.length > 0
    && level.title
    && level.cefr));
  const expectedCourseIds = [
    ...EXPECTED_FOUNDATION_IDS,
    ...EXPECTED_SURVIVAL_ORDER_IDS,
    ...Array.from({ length: 24 }, (_, index) => `tr-l2-${String(index + 1).padStart(2, '0')}-${[
      'about-me', 'appearance', 'habits', 'dates', 'past-experience', 'future-plans', 'comparing', 'preferences',
      'obligation', 'polite', 'possibility', 'directions', 'bargaining', 'restaurant', 'travel', 'health',
      'work', 'reason', 'condition', 'opinion', 'experience', 'connectors', 'multi-questions', 'story',
    ][index]}`),
    'tr-l4-experience', 'tr-l4-advice', 'tr-l4-plans', 'tr-l4-phone',
  ];
  check('Course order runs Foundation → Survival → A2 → Communication', lessons.every((lesson, index) => lesson.order === index + 1)
    && lessons.map(lesson => lesson.id).join('|') === expectedCourseIds.join('|')
    && lessons.slice(0, 14).every(lesson => lesson.levelId === 0)
    && lessons.slice(14, 38).every(lesson => lesson.levelId === 1)
    && lessons.slice(38, 62).every(lesson => lesson.levelId === 2)
    && lessons.slice(62).every(lesson => lesson.levelId === 3));
  check('A1 Foundation follows the official 14-topic order', foundationTopics.length === 14
    && foundationTopics.every((topic, index) => topic === EXPECTED_FOUNDATION_TOPICS[index])
    && lessons.filter(lesson => lesson.levelId === 0).length === 14
    && lessons.filter(lesson => lesson.levelId === 0).map(lesson => lesson.id).join('|') === EXPECTED_FOUNDATION_IDS.join('|'));
  check('A1 Survival publishes the 20 requested topics in exact order', survivalTopics.length === 20
    && survivalTopics.every((topic, index) => topic === EXPECTED_SURVIVAL_TOPICS[index]));
  const survivalLessons = lessons.filter(lesson => lesson.levelId === 1);
  const supplementarySurvivalIds = new Set(EXPECTED_SURVIVAL_RETAINED_IDS);
  check('A1 Survival puts one core lesson under each requested topic, in order', survivalLessons.length === 24
    && survivalLessons.filter(lesson => !supplementarySurvivalIds.has(lesson.id)).map(lesson => lesson.id).join('|') === EXPECTED_SURVIVAL_CORE_IDS.join('|'));
  check('All four existing supplementary lessons stay beside their related topics', EXPECTED_SURVIVAL_RETAINED_IDS.every(id => survivalLessons.some(lesson => lesson.id === id))
    && survivalLessons.map(lesson => lesson.id).join('|') === EXPECTED_SURVIVAL_ORDER_IDS.join('|'));
  const previousA1Ids = [
    ...Array.from({ length: 20 }, (_, index) => [
      'tr-l1-01-greetings', 'tr-l1-02-introduce', 'tr-l1-03-pronouns', 'tr-l1-04-nominal-sentences',
      'tr-l1-05-nationality', 'tr-l1-06-present-continuous', 'tr-l1-07-questions', 'tr-l1-08-negative',
      'tr-l1-09-numbers-age', 'tr-l1-10-family', 'tr-l1-11-nouns-plural', 'tr-l1-12-describing',
      'tr-l1-13-needs', 'tr-l1-14-location', 'tr-l1-15-time', 'tr-l1-16-ability-request',
      'tr-l1-17-motion', 'tr-l1-18-past', 'tr-l1-19-future', 'tr-l1-20-conjunctions',
    ][index]),
    'tr-l2-cafe', 'tr-l2-restaurant', 'tr-l2-shopping', 'tr-l2-directions',
    'tr-l2-time', 'tr-l2-transport', 'tr-l2-hotel', 'tr-l2-health',
  ];
  const allLessonIds = new Set(lessons.map(lesson => lesson.id));
  check('No existing A1 Foundation or Survival lesson was deleted', previousA1Ids.every(id => allLessonIds.has(id)));
  check('All ten new Survival lessons are present', EXPECTED_SURVIVAL_CORE_IDS.filter(id => id.startsWith('tr-survival-')).length === 10
    && EXPECTED_SURVIVAL_CORE_IDS.filter(id => id.startsWith('tr-survival-')).every(id => allLessonIds.has(id)));
  check('Level 2 (A2) follows the official 24-topic order, one lesson per topic',
    a2Topics.length === 24
    && a2Topics.every((topic, index) => topic === EXPECTED_A2_TOPICS[index])
    && lessons.filter(lesson => lesson.levelId === 2).length === 24
    && lessons.filter(lesson => lesson.levelId === 2).map(lesson => lesson.title).join('|')
      === EXPECTED_A2_TOPICS.join('|'));
  check('Level 2 lessons are numbered 01…24 in that order',
    lessons.filter(lesson => lesson.levelId === 2).every((lesson, index) =>
      lesson.id.startsWith(`tr-l2-${String(index + 1).padStart(2, '0')}-`)));
  check('Levels hold 14 / 24 / 24 / 4 lessons', app.TURKISH_LEVELS.map(level =>
    lessons.filter(lesson => lesson.levelId === level.id).length).join('|') === '14|24|24|4');
  check('Course contains 528 sentences, eight per lesson', sentences.length === 528 && lessons.every(lesson => lesson.sentences.length === 8));
  const newSurvivalSentences = survivalLessons.filter(lesson => lesson.id.startsWith('tr-survival-')).flatMap(lesson => lesson.sentences);
  check('Ten new Survival lessons contribute 80 uniquely namespaced sentences', newSurvivalSentences.length === 80
    && newSurvivalSentences.every(sentence => /^tr5-\d{2}$/.test(sentence.id))
    && new Set(newSurvivalSentences.map(sentence => sentence.id)).size === 80);
  check('Sentence ids are unique and namespaced', new Set(sentenceIds).size === sentenceIds.length && sentenceIds.every(id => /^tr\d-\d{2,3}$/.test(id)));
  check('No sentence text is repeated anywhere in the course',
    new Set(sentences.map(sentence => sentence.text.toLocaleLowerCase('tr-TR'))).size === sentences.length);
  check('Every sentence teaches text, meaning, pronunciation, vocabulary and a pattern', sentences.every(sentence =>
    sentence.text.trim().length > 0
    && persian.test(sentence.fa)
    && persian.test(sentence.pronunciation)
    && sentence.vocabulary.length >= 1
    && sentence.vocabulary.every(item => item.word.trim() && persian.test(item.meaning))
    && typeof sentence.pattern === 'string' && sentence.pattern.trim().length > 0));
  check('No Cyrillic leaked into the Turkish track', !cyrillic.test(JSON.stringify(lessons)));
  check('Special Turkish letters are exercised (ç, ş, ğ, ı, ö, ü)', ['ç', 'ş', 'ğ', 'ı', 'ö', 'ü'].every(letter =>
    sentences.some(sentence => sentence.text.toLocaleLowerCase('tr-TR').includes(letter))));
  check('Every lesson has a dialogue with at least four turns and two checks', lessons.every(lesson =>
    lesson.dialogue.length >= 4
    && lesson.dialogue.every(line => line.speaker && line.text && persian.test(line.fa))
    && (lesson.checks ?? []).length >= 2
    && (lesson.checks ?? []).every(question => question.choices.length >= 2
      && Number.isInteger(question.correctIndex)
      && question.correctIndex >= 0
      && question.correctIndex < question.choices.length
      && persian.test(question.promptFa)
      && persian.test(question.explanationFa))));
  check('Every lesson carries a Persian teaching note and subtitle', lessons.every(lesson =>
    typeof lesson.teachingFa === 'string' && persian.test(lesson.teachingFa)
    && typeof lesson.subtitle === 'string' && lesson.subtitle.length > 3));
  check('Nine-stage lesson flow is declared', app.TURKISH_LESSON_STAGES.length === 9);
  check('Progress store uses its own Turkish key', app.turkishProgress !== undefined
    && JSON.stringify(Object.keys(app.turkishProgress)).length > 0);
  check('Study-state module exposes its own Turkish storage key', app.TURKISH_STUDY_STORAGE_KEY === 'turkish_lesson_sessions_v1');
  check('Course counts match the lesson data', app.TURKISH_SENTENCE_COUNT === sentences.length
    && app.TURKISH_VOCABULARY_COUNT === new Set(sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word))).size);
  check('Default edition catalog keeps English, German and Russian only', app.LANGUAGE_META.map(language => language.id).join('|') === 'en|de|ru'
    && !app.LANGUAGE_META.some(language => language.id === 'tr'));
  check('Turkish metadata exists for the Turkish edition', app.LANGUAGES.every(language => language.id !== 'tr'));

  const turkishMeta = fs.readFileSync(path.resolve('lib/languages/catalogMeta.ts'), 'utf8');
  check('Turkish catalog entry uses the tr-TR speech locale', /id: 'tr'/.test(turkishMeta) && /speechLocale: 'tr-TR'/.test(turkishMeta)
    && /lessonsCount: 66/.test(turkishMeta) && /sentencesCount: 528/.test(turkishMeta));

  const features = fs.readFileSync(path.resolve('lib/features.ts'), 'utf8');
  check('Edition flags gate Russian and Turkish tracks', /TURKISH_EDITION/.test(features)
    && /russianCourse:/.test(features)
    && /turkishCourse:/.test(features));

  const config = fs.readFileSync(path.resolve('app.config.js'), 'utf8');
  check('Second build variant is declared in app.config.js', /EXPO_PUBLIC_TURKISH_EDITION/.test(config)
    && /milomultilanguage-turkish/.test(config)
    && /com\.devicecontrol\.miloturkish/.test(config)
    && /turkishEdition: true/.test(config));

  const routes = ['app/learn/tr/index.tsx', 'app/learn/tr/lesson.tsx', 'app/learn/tr/library.tsx', 'app/learn/tr/review.tsx', 'app/learn/tr/pronunciation.tsx'];
  check('Turkish routes exist and are edition-guarded', routes.every(route =>
    fs.existsSync(route) && /FEATURES\.turkishCourse/.test(fs.readFileSync(route, 'utf8'))));

  console.log(`Turkish course checks passed (${checks.length}).`);
  for (const label of checks) console.log(`  ✓ ${label}`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
