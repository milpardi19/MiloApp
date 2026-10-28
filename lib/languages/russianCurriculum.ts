import { RUSSIAN_LESSONS, type RussianLevelId } from './russian';

export type RussianCefrLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type RussianCurriculumStatus = 'available' | 'planned';
export type RussianUnitStatus = 'available' | 'planned';
export type RussianGrammarFeatureId = 'grammatical-cases' | 'verb-aspect' | 'agreement';

/**
 * A planning layer over the five-level Russian UI (Foundation through Advanced).
 * Foundation and Survival both map to A1; this is internal curriculum planning, not certification.
 */
export const RUSSIAN_LEVEL_TO_CEFR: Readonly<Record<RussianLevelId, RussianCefrLevel>> = {
  0: 'A1',
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'B2',
};

export const RUSSIAN_CEFR_POLICY = {
  basis: 'internal-curriculum-planning',
  officialLevelClaim: false,
  officialAssessment: false,
  lessonCompletionMeansMastery: false,
  readinessEvidence: 'independent-transfer-in-a-new-context',
} as const;

export interface RussianCurriculumUnit {
  id: string;
  levelId: RussianCefrLevel;
  titleFa: string;
  outcomeFa: string;
  objectiveId: string;
  status: RussianUnitStatus;
  lessonIds: readonly string[];
  legacyLevelId?: RussianLevelId;
  /** Existing quizzes are formative checks, not independent transfer evidence. */
  lessonCheckCount: number;
  independentTransferPrompts: number;
}

export interface RussianCefrBand {
  id: RussianCefrLevel;
  titleFa: string;
  goalFa: string;
  legacyLevelIds: readonly RussianLevelId[];
  status: RussianCurriculumStatus;
  units: readonly RussianCurriculumUnit[];
}

function lessonUnit(lesson: (typeof RUSSIAN_LESSONS)[number], levelId: RussianCefrLevel): RussianCurriculumUnit {
  return {
    id: `unit-${lesson.id}`,
    levelId,
    titleFa: lesson.title,
    outcomeFa: lesson.situation,
    objectiveId: `objective-${lesson.id}`,
    status: 'available',
    lessonIds: [lesson.id],
    legacyLevelId: lesson.levelId,
    lessonCheckCount: lesson.checks?.length ?? 0,
    independentTransferPrompts: 0,
  };
}

// A1 band: Foundation and Survival (levels 0 and 1).
const A1_UNITS: readonly RussianCurriculumUnit[] = RUSSIAN_LESSONS
  .filter(lesson => RUSSIAN_LEVEL_TO_CEFR[lesson.levelId] === 'A1')
  .map(lesson => lessonUnit(lesson, 'A1'));

// A2 band: the Everyday Russian lessons (level 2).
const A2_UNITS: readonly RussianCurriculumUnit[] = RUSSIAN_LESSONS
  .filter(lesson => RUSSIAN_LEVEL_TO_CEFR[lesson.levelId] === 'A2')
  .map(lesson => lessonUnit(lesson, 'A2'));

function plannedUnit(levelId: RussianCefrLevel, id: string, titleFa: string, outcomeFa: string): RussianCurriculumUnit {
  return {
    id: `unit-${levelId.toLowerCase()}-${id}`,
    levelId,
    titleFa,
    outcomeFa,
    objectiveId: `objective-${levelId.toLowerCase()}-${id}`,
    status: 'planned',
    lessonIds: [],
    lessonCheckCount: 0,
    independentTransferPrompts: 0,
  };
}

/** Four internal CEFR planning bands; levels are not formal certification. */
export const RUSSIAN_CEFR_BANDS: readonly RussianCefrBand[] = [
  {
    id: 'A1',
    titleFa: 'جمله‌سازی پایه',
    goalFa: 'کافه، خرید، مسیر، زمان، نیازهای روزمره و افعال پرکاربرد',
    legacyLevelIds: [0, 1],
    status: 'available',
    units: A1_UNITS,
  },
  {
    id: 'A2',
    titleFa: 'گسترش و ترکیب جمله‌ها',
    goalFa: 'گذشته و آینده، توصیف، مقایسه، درخواست و ارتباط میان جمله‌ها',
    legacyLevelIds: [2],
    status: 'available',
    units: A2_UNITS,
  },
  {
    id: 'B1',
    titleFa: 'بیان مستقل منظور',
    goalFa: 'روایت، توضیح دلیل، بیان تجربه، نظر، هدف و ارتباط میان ایده‌ها',
    legacyLevelIds: [3],
    status: 'available',
    units: RUSSIAN_LESSONS.filter(lesson => RUSSIAN_LEVEL_TO_CEFR[lesson.levelId] === 'B1').map(lesson => lessonUnit(lesson, 'B1')),
  },
  {
    id: 'B2',
    titleFa: 'بیان دقیق و انعطاف‌پذیر',
    goalFa: 'استدلال، شرط، فرض، ظرافت معنایی، ساختارهای پیچیده و بحث‌های تخصصی‌تر',
    legacyLevelIds: [4],
    status: 'available',
    units: RUSSIAN_LESSONS.filter(lesson => RUSSIAN_LEVEL_TO_CEFR[lesson.levelId] === 'B2').map(lesson => lessonUnit(lesson, 'B2')),
  },
];

export function russianCefrForLegacyLevel(levelId: RussianLevelId): RussianCefrLevel {
  return RUSSIAN_LEVEL_TO_CEFR[levelId];
}

export function findRussianCefrBand(levelId: RussianCefrLevel): RussianCefrBand | undefined {
  return RUSSIAN_CEFR_BANDS.find(band => band.id === levelId);
}

export function russianCefrForLesson(lessonId: string): RussianCefrLevel | undefined {
  const lesson = RUSSIAN_LESSONS.find(item => item.id === lessonId);
  return lesson ? russianCefrForLegacyLevel(lesson.levelId) : undefined;
}

export interface RussianGrammarThread {
  id: RussianGrammarFeatureId;
  titleFa: string;
  purposeFa: string;
  progression: Readonly<Record<RussianCefrLevel, string>>;
  currentA1Status: 'in-context' | 'exposure-only' | 'not-yet-authored';
  /** No annotation in this planning layer is shown as a new lesson explanation. */
  candidateSentenceIds: readonly string[];
  editorialStatus: 'requires-russian-editor-review';
}

/**
 * Russian-specific grammar strands are curriculum metadata. A1 annotations point
 * only to existing notes/examples; they do not add or rewrite learner-facing content.
 */
export const RUSSIAN_GRAMMAR_THREADS: readonly RussianGrammarThread[] = [
  {
    id: 'grammatical-cases',
    titleFa: 'حالت‌های دستوری',
    purposeFa: 'پیگیری تدریجی تغییر شکل اسم و ضمیر بر اساس نقش آن‌ها در جمله.',
    progression: {
      A1: 'دیدن چند شکل پرتکرار در عبارت‌ها و مثال‌های همین مسیر.',
      A2: 'مقایسهٔ نقش‌ها و گسترش شکل‌های پرتکرار در جمله‌های تازه.',
      B1: 'به‌کارگیری حالت‌ها در روایت، دلیل‌آوری و جمله‌های پیوسته.',
      B2: 'انتخاب دقیق‌تر حالت در ساختارهای پیچیده و بافت‌های تخصصی.',
    },
    currentA1Status: 'in-context',
    candidateSentenceIds: ['ru2-04', 'ru2-14', 'ru2-18', 'ru2-24'],
    editorialStatus: 'requires-russian-editor-review',
  },
  {
    id: 'verb-aspect',
    titleFa: 'صرف و نمود فعل',
    purposeFa: 'پیگیری صرف فعل و تفاوت کاربردی میان نمودهای فعلی در بافت.',
    progression: {
      A1: 'تشخیص صورت‌های آشنا؛ آموزش تقابل کامل/ناقص هنوز برای این مسیر تألیف نشده است.',
      A2: 'آشنایی هدفمند با جفت‌ها و انتخاب نمود در موقعیت‌های پرتکرار.',
      B1: 'به‌کارگیری نمود در روایت تجربه و بیان توالی یا نتیجهٔ عمل.',
      B2: 'انتخاب دقیق‌تر نمود برای ظرافت معنایی و ساختارهای پیچیده.',
    },
    currentA1Status: 'not-yet-authored',
    candidateSentenceIds: [],
    editorialStatus: 'requires-russian-editor-review',
  },
  {
    id: 'agreement',
    titleFa: 'تطابق دستوری',
    purposeFa: 'پیگیری هماهنگی اسم، صفت، ضمیر و فعل در ساختارهای مرتبط.',
    progression: {
      A1: 'توجه به چند نمونهٔ سادهٔ جنس دستوری در عبارت‌های آشنا.',
      A2: 'گسترش تطابق در توصیف‌ها و جمله‌های ترکیبی.',
      B1: 'حفظ تطابق در روایت و ارجاع به افراد و اشیا در چند جمله.',
      B2: 'کنترل تطابق در ساختارهای پیچیده و بیان دقیق‌تر.',
    },
    currentA1Status: 'in-context',
    candidateSentenceIds: [
      'ru2-10', 'ru2-25', 'ru2-26',
      'ru2-31',
    ],
    editorialStatus: 'requires-russian-editor-review',
  },
];

export interface RussianVocabularyExample {
  lessonId: string;
  sentenceId: string;
  sentenceText: string;
  sentenceFa: string;
  /** Existing hint is sentence-level; it is not presented as word pronunciation. */
  sentencePronunciationHint: string;
}

export interface RussianVocabularyEntry {
  id: string;
  sourceForm: string;
  meaningFa: string;
  /** Empty until a Russian-language editor confirms the lemma and inflections. */
  baseForm: string | null;
  pronunciationFa: string | null;
  inflectedForms: readonly { form: string; noteFa?: string }[];
  examples: readonly RussianVocabularyExample[];
  editorialStatus: 'needs-russian-lexical-review';
}

function vocabularyKey(sourceForm: string, meaningFa: string): string {
  return `${sourceForm.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU')}\u0000${meaningFa.normalize('NFC').trim()}`;
}

const vocabularyBuckets = new Map<string, {
  id: string;
  sourceForm: string;
  meaningFa: string;
  examples: RussianVocabularyExample[];
}>();

for (const lesson of RUSSIAN_LESSONS) {
  for (const sentence of lesson.sentences) {
    for (const [wordIndex, item] of sentence.vocabulary.entries()) {
      const key = vocabularyKey(item.word, item.meaning);
      const existing = vocabularyBuckets.get(key);
      const example: RussianVocabularyExample = {
        lessonId: lesson.id,
        sentenceId: sentence.id,
        sentenceText: sentence.text,
        sentenceFa: sentence.fa,
        sentencePronunciationHint: sentence.pronunciation,
      };
      if (existing) existing.examples.push(example);
      else vocabularyBuckets.set(key, {
        id: `ru-vocab-${sentence.id}-${wordIndex + 1}`,
        sourceForm: item.word,
        meaningFa: item.meaning,
        examples: [example],
      });
    }
  }
}

/** Searchable internal index built only from the current Russian lesson vocabulary. */
export const RUSSIAN_VOCABULARY: readonly RussianVocabularyEntry[] = [...vocabularyBuckets.values()].map(entry => ({
  ...entry,
  baseForm: null,
  pronunciationFa: null,
  inflectedForms: [],
  editorialStatus: 'needs-russian-lexical-review',
}));

const vocabularyIdByKey = new Map(
  RUSSIAN_VOCABULARY.map(entry => [vocabularyKey(entry.sourceForm, entry.meaningFa), entry.id] as const),
);

const GRAMMAR_ANNOTATIONS_BY_SENTENCE: Readonly<Record<string, readonly RussianGrammarFeatureId[]>> = {
  'ru2-04': ['grammatical-cases'],
  'ru2-14': ['grammatical-cases'],
  'ru2-18': ['grammatical-cases'],
  'ru2-24': ['grammatical-cases'],
  'ru2-10': ['agreement'],
  'ru2-25': ['agreement'],
  'ru2-26': ['agreement'],
  'ru2-31': ['agreement'],
};

export interface RussianSentenceCurriculumEntry {
  sentenceId: string;
  lessonId: string;
  unitId: string;
  cefrLevelId: RussianCefrLevel;
  objectiveId: string;
  /** Preserved from the existing sentence record; no new example is generated. */
  patternFa: string | null;
  vocabularyEntryIds: readonly string[];
  grammarFeatureIds: readonly RussianGrammarFeatureId[];
  /** Transfer prompts require authored, reviewed material and are currently absent. */
  transferPromptIds: readonly string[];
  editorialStatus: 'existing-content-metadata-needs-review';
}

/** Sentence-to-goal/pattern/vocabulary links; the source lesson content is unchanged. */
export const RUSSIAN_SENTENCE_CURRICULUM: readonly RussianSentenceCurriculumEntry[] = RUSSIAN_LESSONS.flatMap(lesson =>
  lesson.sentences.map(sentence => ({
    sentenceId: sentence.id,
    lessonId: lesson.id,
    unitId: `unit-${lesson.id}`,
    cefrLevelId: russianCefrForLegacyLevel(lesson.levelId),
    objectiveId: `objective-${lesson.id}`,
    patternFa: sentence.pattern ?? null,
    vocabularyEntryIds: sentence.vocabulary.map(item => vocabularyIdByKey.get(vocabularyKey(item.word, item.meaning))!).filter(Boolean),
    grammarFeatureIds: GRAMMAR_ANNOTATIONS_BY_SENTENCE[sentence.id] ?? [],
    transferPromptIds: [],
    editorialStatus: 'existing-content-metadata-needs-review',
  })),
);

export function findRussianVocabularyEntry(id: string): RussianVocabularyEntry | undefined {
  return RUSSIAN_VOCABULARY.find(entry => entry.id === id);
}

export function findRussianSentenceCurriculumEntry(sentenceId: string): RussianSentenceCurriculumEntry | undefined {
  return RUSSIAN_SENTENCE_CURRICULUM.find(entry => entry.sentenceId === sentenceId);
}
