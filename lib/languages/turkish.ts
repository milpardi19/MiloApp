import type { LearningLesson } from './types';
import { createCourseProgressStore } from '../createCourseProgressStore';
import { TURKISH_FOUNDATION_LESSONS_A } from './turkishFoundationLessons';
import { TURKISH_FOUNDATION_LESSONS_B } from './turkishFoundationLessonsB';
import { TURKISH_SURVIVAL_LESSONS } from './turkishSurvivalLessons';
import { TURKISH_SURVIVAL_LESSONS_B } from './turkishSurvivalLessonsB';
import { TURKISH_A2_LESSONS_A } from './turkishA2LessonsA';
import { TURKISH_A2_LESSONS_B } from './turkishA2LessonsB';
import { TURKISH_COMMUNICATION_LESSONS } from './turkishCommunicationLessons';

/**
 * دورهٔ ترکی استانبولی برای فارسی‌زبان‌ها — نسخهٔ دوم Milo.
 *
 * همان اصول دورهٔ روسی و آلمانی: جمله‌محور، از پرکاربردترین جمله‌ها شروع
 * می‌کند و واژه را در بافت می‌آموزد. تفاوت اصلی زبان ترکی «چسبندگی پسوندها»
 * است؛ هر جمله با یک الگوی کوتاه همراه است تا زبان‌آموز ببیند کدام پسوند
 * کجا می‌نشیند. تلفظ تقریبی فارسی برای هر جمله نوشته شده و صدا با لوکال
 * tr-TR خوانده می‌شود.
 */

export const TURKISH_LESSON_STAGES = [
  { id: 'situation', labelFa: 'موقعیت', labelEn: 'Situation' },
  { id: 'core-sentences', labelFa: 'جمله‌های اصلی', labelEn: 'Core Sentences' },
  { id: 'listening', labelFa: 'شنیدن', labelEn: 'Listening' },
  { id: 'shadowing', labelFa: 'سایه‌خوانی', labelEn: 'Shadowing' },
  { id: 'sentence-building', labelFa: 'ساخت جمله', labelEn: 'Sentence Building' },
  { id: 'vocabulary', labelFa: 'واژگان از جمله', labelEn: 'Vocabulary From Sentences' },
  { id: 'grammar-through-usage', labelFa: 'دستور در کاربرد', labelEn: 'Grammar Through Usage' },
  { id: 'conversation', labelFa: 'مکالمه', labelEn: 'Conversation Practice' },
  { id: 'review', labelFa: 'مرور هوشمند', labelEn: 'Spaced Review' },
] as const;

/** حروف ویژهٔ الفبای ترکی که برای فارسی‌زبان تازه‌اند. */
export const TURKISH_SPECIAL_LETTERS = ['ç', 'ş', 'ğ', 'ı', 'İ', 'ö', 'ü'] as const;

export type TurkishLevelId = 0 | 1 | 2 | 3;

export interface TurkishCourseLevel {
  id: TurkishLevelId;
  title: string;
  cefr: string;
  description: string;
  color: string;
  modules: readonly string[];
  status: 'available' | 'planned';
}

export interface TurkishCourseLesson extends LearningLesson {
  levelId: TurkishLevelId;
  order: number;
  subtitle: string;
}

export const TURKISH_LEVELS: readonly TurkishCourseLevel[] = [
  {
    id: 0,
    title: 'Foundation Turkish',
    cefr: 'سطح ۱ · پایه (A1)',
    description:
      '۱۴ درس پایهٔ A1 مطابق ترتیب برنامهٔ آموزشی: از سلام و احوال‌پرسی تا مکان و موقعیت مکانی پایه؛ ۱۱۲ جمله با تلفظ و الگوی پسوندها.',
    color: '#C2410C',
    modules: [
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
    ],
    status: 'available',
  },
  {
    id: 1,
    title: 'Survival Turkish',
    cefr: 'کاربرد روزمره (A1)',
    description:
      '۲۰ موضوع کاربردی A1 به ترتیب برنامه، همراه با ۴ درس تکمیلیِ موجود که برای حفظ کامل محتوای قبلی نگه داشته شده‌اند؛ ۲۴ درس و ۱۹۲ جمله با تلفظ و الگوی پسوندها.',
    color: '#0F766E',
    modules: [
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
    ],
    status: 'available',
  },
  {
    id: 2,
    title: 'Everyday Turkish',
    cefr: 'سطح ۲ · گسترش (A2)',
    description:
      '۲۴ درس A2 به همان ترتیب برنامهٔ گسترش: از معرفی کامل و توصیف ظاهر تا شرط، نظر و روایت یک اتفاق؛ ۱۹۲ جمله با تلفظ و الگوی پسوندها.',
    color: '#1D4ED8',
    modules: [
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
    ],
    status: 'available',
  },
  {
    id: 3,
    title: 'Communication Turkish',
    cefr: 'بیان مستقل (B1)',
    description:
      '۴ درس برای بیان منسجم: روایت تجربه، توصیه و خواهش، شرط و تصمیم، تلفن و قرار.',
    color: '#7C3AED',
    modules: ['روایت تجربه', 'توصیه، خواهش و اجازه', 'شرط، برنامه و تصمیم', 'تلفن، پیام و قرار'],
    status: 'available',
  },
];

const TURKISH_LESSON_META: Record<string, { levelId: TurkishLevelId; subtitle: string }> = {
  /* A1 Foundation — شناسه‌ها و متن درس‌های پایهٔ حفظ‌شده */
  'tr-l1-01-greetings': { levelId: 0, subtitle: 'سلام، احوال‌پرسی و گفتن نام' },
  'tr-l1-02-introduce': { levelId: 0, subtitle: 'معرفی دوست و همکار به دیگران' },
  'tr-l1-03-pronouns': { levelId: 0, subtitle: 'من، تو، او، ما، شما، آن‌ها' },
  'tr-l1-04-nominal-sentences': { levelId: 0, subtitle: 'هستم، هستی، است بدون فعل بودن' },
  'tr-l1-05-nationality': { levelId: 0, subtitle: 'ملیت، زبان و شهری که در آن زندگی می‌کنید' },
  'tr-l1-06-present-continuous': { levelId: 0, subtitle: 'همین حالا چه می‌کنید؛ زمان حال استمراری' },
  'tr-l1-07-questions': { levelId: 0, subtitle: 'چه، کی، کجا، چرا و کدام' },
  'tr-l1-08-negative': { levelId: 0, subtitle: 'نمی‌فهمم، نمی‌دانم و درخواست تکرار' },
  'tr-l1-09-numbers-age': { levelId: 0, subtitle: 'اعداد، قیمت، سن و شمارهٔ تلفن' },
  'tr-l1-10-family': { levelId: 0, subtitle: 'خانواده، var/yok و «مال کی»' },
  'tr-l1-11-nouns-plural': { levelId: 0, subtitle: 'جمع بستن اسم و پسوندهای ملکی' },
  'tr-l1-12-describing': { levelId: 0, subtitle: 'بلند، بزرگ، تمیز، شلوغ و کهنه' },
  'tr-l1-13-needs': { levelId: 0, subtitle: 'نیاز دارم، می‌خواهم، دوست دارم' },
  'tr-l1-14-location': { levelId: 0, subtitle: 'روی، داخل، کنار، راست و چپ' },
  'tr-l1-15-time': { levelId: 1, subtitle: 'روزهای هفته، ساعت و برنامهٔ روز' },
  'tr-l1-16-ability-request': { levelId: 1, subtitle: 'می‌توانم، لطفاً و اجازه گرفتن' },
  'tr-l1-17-motion': { levelId: 1, subtitle: 'به، در، از همراه فعل‌های رفتن و آمدن' },
  'tr-l1-18-past': { levelId: 1, subtitle: 'دیروز چه کار کردید؛ پسوند گذشته' },
  'tr-l1-19-future': { levelId: 1, subtitle: 'فردا چه خواهید کرد؛ زمان آینده' },
  'tr-l1-20-conjunctions': { levelId: 1, subtitle: 'و، ولی، چون، یا و ترتیب رویداد' },
  /* A1 Survival — هشت درس موجود، با شناسه و محتوای ثابت */
  'tr-l2-cafe': { levelId: 1, subtitle: 'سفارش نوشیدنی و صورت‌حساب' },
  'tr-l2-restaurant': { levelId: 1, subtitle: 'منو، سفارش غذا و پرداخت' },
  'tr-l2-shopping': { levelId: 1, subtitle: 'قیمت، سایز، پرو و کارت' },
  'tr-l2-directions': { levelId: 1, subtitle: 'مترو، راست/چپ و مسیر' },
  'tr-l2-time': { levelId: 1, subtitle: 'ساعت چند است و قرار چه ساعتی' },
  'tr-l2-transport': { levelId: 1, subtitle: 'تاکسی، بلیت و پیاده شدن' },
  'tr-l2-hotel': { levelId: 1, subtitle: 'رزرو، اتاق، صبحانه و کلید' },
  'tr-l2-health': { levelId: 1, subtitle: 'درد، دارو و کمک فوری' },
  /* A1 Survival — ده درس تازه برای موضوع‌های فاقد پوشش */
  'tr-survival-01-social-introduction': { levelId: 1, subtitle: 'آشنایی در جمع و آغاز گفت‌وگوی کوتاه' },
  'tr-survival-02-travel-tourism': { levelId: 1, subtitle: 'دیدنی‌ها، تور، ساعت بازدید و اطلاعات گردشگری' },
  'tr-survival-03-tickets-departures': { levelId: 1, subtitle: 'بلیت رفت‌وبرگشت، سکو و ساعت حرکت' },
  'tr-survival-04-market-conversation': { levelId: 1, subtitle: 'مقدار، کالا، بسته‌بندی و پرداخت در بازار' },
  'tr-survival-05-help-and-problems': { levelId: 1, subtitle: 'گم‌شدن، جاگذاشتن وسایل و درخواست کمک' },
  'tr-survival-06-work-and-school': { levelId: 1, subtitle: 'کلاس، جلسه، تکلیف و برنامهٔ محیط کار' },
  'tr-survival-07-weather': { levelId: 1, subtitle: 'هوا، پیش‌بینی، باران و دما' },
  'tr-survival-08-phone-and-messages': { levelId: 1, subtitle: 'تماس، پیامک، نشانی و هماهنگی' },
  'tr-survival-09-invitations': { levelId: 1, subtitle: 'دعوت، پاسخ مثبت یا منفی و زمان جایگزین' },
  'tr-survival-10-ability-and-inability': { levelId: 1, subtitle: 'توانستن و نتوانستن در موقعیت‌های روزمره' },
  /* سطح ۲ (A2) — ترتیب رسمی ۲۴موضوعی */
  'tr-l2-01-about-me': { levelId: 2, subtitle: 'زادگاه، تحصیل، شغل و سرگرمی‌ها' },
  'tr-l2-02-appearance': { levelId: 2, subtitle: 'ظاهر، اخلاق و ویژگی‌های افراد' },
  'tr-l2-03-habits': { levelId: 2, subtitle: 'کارهایی که هر روز و هر هفته تکرار می‌شوند' },
  'tr-l2-04-dates': { levelId: 2, subtitle: 'تاریخ، ساعت و ترتیب رویدادها' },
  'tr-l2-05-past-experience': { levelId: 2, subtitle: 'سفر و تجربهٔ گذشتهٔ شما' },
  'tr-l2-06-future-plans': { levelId: 2, subtitle: 'برنامه و پیش‌بینی روزهای آینده' },
  'tr-l2-07-comparing': { levelId: 2, subtitle: 'تر، ترین و به‌اندازهٔ ... نه' },
  'tr-l2-08-preferences': { levelId: 2, subtitle: 'ترجیح می‌دهم، خوشم می‌آید، حالم خوب است' },
  'tr-l2-09-obligation': { levelId: 2, subtitle: 'باید، لازم است، مجبورم' },
  'tr-l2-10-polite': { levelId: 2, subtitle: 'می‌شود ...؟، پیشنهاد می‌کنم' },
  'tr-l2-11-possibility': { levelId: 2, subtitle: 'می‌توانم، نمی‌توانم، شاید' },
  'tr-l2-12-directions': { levelId: 2, subtitle: 'راست، چپ، مستقیم و آدرس' },
  'tr-l2-13-bargaining': { levelId: 2, subtitle: 'قیمت، تخفیف و چانه‌زنی' },
  'tr-l2-14-restaurant': { levelId: 2, subtitle: 'منو، سفارش غذا و صورت‌حساب' },
  'tr-l2-15-travel': { levelId: 2, subtitle: 'رزرو، پرواز و چمدان' },
  'tr-l2-16-health': { levelId: 2, subtitle: 'درد، تب، دارو و دکتر' },
  'tr-l2-17-work': { levelId: 2, subtitle: 'رشته، شغل، حقوق و تیم' },
  'tr-l2-18-reason': { levelId: 2, subtitle: 'چون، به‌خاطر، در نتیجه' },
  'tr-l2-19-condition': { levelId: 2, subtitle: 'اگر ... باشد، اگر ... بود' },
  'tr-l2-20-opinion': { levelId: 2, subtitle: 'به نظر من، موافقم، مخالفم' },
  'tr-l2-21-experience': { levelId: 2, subtitle: 'تا حالا ... کرده‌ام، بار اول' },
  'tr-l2-22-connectors': { levelId: 2, subtitle: 'هم ... هم، ولی، خلاصه' },
  'tr-l2-23-multi-questions': { levelId: 2, subtitle: 'چه، کجا، چند و چرا در یک گفت‌وگو' },
  'tr-l2-24-story': { levelId: 2, subtitle: 'روایت یک اتفاق در چند جمله' },
  'tr-l4-experience': { levelId: 3, subtitle: 'روایت تجربه و افسوس' },
  'tr-l4-advice': { levelId: 3, subtitle: 'باید، نباید و خواهش' },
  'tr-l4-plans': { levelId: 3, subtitle: 'اگر، شرط و تصمیم مشترک' },
  'tr-l4-phone': { levelId: 3, subtitle: 'تلفن، وقت گرفتن و جابه‌جایی قرار' },
};

const TURKISH_A1_SOURCE_LESSONS: readonly LearningLesson[] = [
  ...TURKISH_FOUNDATION_LESSONS_A,
  ...TURKISH_FOUNDATION_LESSONS_B,
  ...TURKISH_SURVIVAL_LESSONS,
  ...TURKISH_SURVIVAL_LESSONS_B,
];

const TURKISH_A1_LESSON_BY_ID = new Map<string, LearningLesson>();
for (const lesson of TURKISH_A1_SOURCE_LESSONS) {
  if (TURKISH_A1_LESSON_BY_ID.has(lesson.id)) {
    throw new Error(`شناسهٔ تکراری در درس‌های A1 ترکی: ${lesson.id}`);
  }
  TURKISH_A1_LESSON_BY_ID.set(lesson.id, lesson);
}

const TURKISH_FOUNDATION_ORDER = [
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
] as const;

/** بیست درس اصلی به ترتیب سرفصل‌های درخواستی، همراه با چهار درس پیشینِ تکمیلی در جایگاه‌های مرتبط. */
const TURKISH_SURVIVAL_ORDER = [
  'tr-l2-shopping',
  'tr-l2-cafe',
  'tr-l2-restaurant',
  'tr-l2-directions',
  'tr-l1-17-motion',
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
  'tr-l1-15-time',
  'tr-survival-07-weather',
  'tr-survival-08-phone-and-messages',
  'tr-survival-09-invitations',
  'tr-l1-16-ability-request',
  'tr-survival-10-ability-and-inability',
  'tr-l1-18-past',
  'tr-l1-19-future',
  // درس پیونددهندهٔ پیشین نیز به‌عنوان محتوای تکمیلی نگه داشته می‌شود.
  'tr-l1-20-conjunctions',
] as const;

const orderTurkishA1Lessons = (ids: readonly string[]) => ids.map(id => {
  const lesson = TURKISH_A1_LESSON_BY_ID.get(id);
  if (!lesson) throw new Error(`درس ترکی A1 در ترتیب برنامه پیدا نشد: ${id}`);
  return lesson;
});

const TURKISH_A1_ORDERED_LESSONS = [
  ...orderTurkishA1Lessons(TURKISH_FOUNDATION_ORDER),
  ...orderTurkishA1Lessons(TURKISH_SURVIVAL_ORDER),
];

const TURKISH_A1_ORDERED_IDS = new Set(TURKISH_A1_ORDERED_LESSONS.map(lesson => lesson.id));
if (
  TURKISH_A1_ORDERED_LESSONS.length !== TURKISH_A1_SOURCE_LESSONS.length
  || TURKISH_A1_ORDERED_IDS.size !== TURKISH_A1_SOURCE_LESSONS.length
  || [...TURKISH_A1_LESSON_BY_ID.keys()].some(id => !TURKISH_A1_ORDERED_IDS.has(id))
) {
  throw new Error('یک یا چند درس ترکی A1 در ترتیب دوره جا افتاده یا تکرار شده است.');
}

const TURKISH_SOURCE_LESSONS: readonly LearningLesson[] = [
  ...TURKISH_A1_ORDERED_LESSONS,
  ...TURKISH_A2_LESSONS_A,
  ...TURKISH_A2_LESSONS_B,
  ...TURKISH_COMMUNICATION_LESSONS,
];

export const TURKISH_LESSONS: readonly TurkishCourseLesson[] = TURKISH_SOURCE_LESSONS.map((item, index) => {
  const meta = TURKISH_LESSON_META[item.id];
  return {
    ...item,
    levelId: meta?.levelId ?? 0,
    subtitle: meta?.subtitle ?? item.subtitle ?? item.goal ?? item.situation,
    order: index + 1,
    durationMinutes: item.durationMinutes || 10,
  } as TurkishCourseLesson;
});

export function findTurkishLesson(id: string | undefined): TurkishCourseLesson | undefined {
  return TURKISH_LESSONS.find(item => item.id === id);
}

export function findTurkishLevel(id: TurkishLevelId): TurkishCourseLevel {
  return TURKISH_LEVELS.find(level => level.id === id) ?? TURKISH_LEVELS[0];
}

export const TURKISH_SENTENCE_COUNT = TURKISH_LESSONS.reduce(
  (sum, lesson) => sum + lesson.sentences.length,
  0,
);

export const TURKISH_VOCABULARY_COUNT = new Set(
  TURKISH_LESSONS.flatMap(lesson =>
    lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word)),
  ),
).size;

export const turkishProgress = createCourseProgressStore({
  key: 'sentence_course_progress_tr_v1',
  lessons: TURKISH_LESSONS,
  cloudSync: false,
  recordEstimatedTime: false,
  markVocabularyOnCompletion: false,
});
