import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ArrowLeft from 'lucide-react-native/dist/esm/icons/arrow-left';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import { COURSE_LEVELS } from '@/lib/courseContent';
import { GERMAN_SENTENCE_LEVELS } from '@/lib/languages/germanSentenceCourse';
import { getPlacementQuestions, scorePlacement, type PlacementLanguage } from '@/lib/placement';
import { PageNavigation } from '@/components/PageNavigation';
import { Typography } from '@/lib/theme';
import { toPersianDigits } from '@/lib/format';

const colors = {
  ink: '#0C1836',
  text: '#3A4E70',
  muted: '#6E82A3',
  canvas: '#F4F7FC',
  surface: '#FFFFFF',
  border: '#E2EAF6',
  violet: '#1E4ED8',
  violetSoft: '#EBF1FF',
  green: '#0F8A5F',
  greenSoft: '#E8F8F2',
  gold: '#B88628',
  goldSoft: '#FDF7EA',
};

const ENGLISH_LEVEL_LABELS = ['پایه', 'موقعیت‌های ضروری', 'روزمره', 'ارتباط', 'پیشرفته'] as const;
const GERMAN_LEVEL_LABELS = ['مقدماتی', 'پایه', 'روزمره', 'بیان و ارتباط'] as const;

function getLevelLabel(language: PlacementLanguage, levelId: number) {
  if (language === 'en') return ENGLISH_LEVEL_LABELS[levelId] ?? COURSE_LEVELS.find(level => level.id === levelId)?.title ?? 'سطح آموزشی';
  return GERMAN_LEVEL_LABELS[levelId] ?? GERMAN_SENTENCE_LEVELS.find(level => level.id === levelId)?.title ?? 'سطح آموزشی';
}

function getLevelRoute(language: PlacementLanguage, levelId: number) {
  return language === 'en'
    ? { pathname: '/lang/library', params: { level: String(levelId) } }
    : { pathname: '/learn/de/library', params: { level: String(levelId) } };
}

export default function PlacementScreen() {
  const { language: requestedLanguage } = useLocalSearchParams<{ language?: string }>();
  const language: PlacementLanguage = requestedLanguage === 'de' ? 'de' : 'en';
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 620;
  const questions = getPlacementQuestions(language);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    setQuestionIndex(0);
    setAnswers({});
    setFinished(false);
  }, [language]);
  const question = questions[questionIndex];
  const result = useMemo(() => finished ? scorePlacement(language, answers) : null, [answers, finished, language]);
  const languageName = language === 'en' ? 'انگلیسی' : 'آلمانی';
  const selectedAnswer = answers[question.id];
  const hasAnswer = Object.prototype.hasOwnProperty.call(answers, question.id);

  const choose = (answerIndex: number) => setAnswers(current => ({ ...current, [question.id]: answerIndex }));
  const previous = () => setQuestionIndex(current => Math.max(0, current - 1));
  const next = () => {
    if (!hasAnswer) return;
    if (questionIndex === questions.length - 1) setFinished(true);
    else setQuestionIndex(current => Math.min(questions.length - 1, current + 1));
  };
  const restart = () => {
    setQuestionIndex(0);
    setAnswers({});
    setFinished(false);
  };
  const openSuggestedLevel = () => {
    if (result) router.replace(getLevelRoute(language, result.recommendedLevelId) as never);
  };
  const openLanguageHome = () => router.replace((language === 'en' ? '/lang' : '/learn/de') as never);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.page, compact && styles.pageCompact]}>
          <View style={styles.topbar}>
            <PageNavigation backFallback="/languages" />
            <View style={styles.brandMark}><BookOpenCheck size={17} color={colors.violet} /><Text style={styles.brandText}>شروع پیشنهادی · {languageName}</Text></View>
          </View>

          <LinearGradient colors={['#0B1A3E', '#153478', '#1F4FD6']} start={{ x: .96, y: .05 }} end={{ x: .08, y: 1 }} style={[styles.hero, compact && styles.heroCompact]}>
            <View pointerEvents="none" style={styles.heroOrb} />
            <View style={styles.heroIcon}><Sparkles size={17} color="#FFF1B9" /></View>
            <Text style={styles.heroTitle}>{finished ? 'نقشهٔ شروع تو آماده است' : 'با یک بررسی کوتاه شروع کنیم'}</Text>
            <Text style={styles.heroDescription}>
              {finished
                ? 'این نتیجه فقط یک پیشنهاد آموزشی بر اساس چند پرسش از محتوای موجود است؛ هر زمان می‌توانی سطح دیگری را انتخاب کنی.'
                : `برای پیدا کردن نقطهٔ شروع مناسب در مسیر ${languageName}، هر پرسش را بخوان و بهترین پاسخ را انتخاب کن.`}
            </Text>
            {!finished ? (
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMeta}>{toPersianDigits(questions.length)} پرسش</Text>
                <View style={styles.heroMetaDot} />
                <Text style={styles.heroMeta}>حدود ۵ دقیقه</Text>
                <View style={styles.heroMetaDot} />
                <Text style={styles.heroMeta}>بدون ذخیرهٔ پاسخ</Text>
              </View>
            ) : null}
          </LinearGradient>

          {!finished ? (
            <View style={styles.questionCard}>
              <View style={styles.questionTop}>
                <View style={styles.questionCounter}>
                  <Text style={styles.questionCounterText}>پرسش {toPersianDigits(questionIndex + 1)} از {toPersianDigits(questions.length)}</Text>
                </View>
                <Text style={styles.questionLevel}>{getLevelLabel(language, question.levelId)}</Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel="پیشرفت در سنجش آغازین"
                accessibilityValue={{ min: 1, max: questions.length, now: questionIndex + 1 }}
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${((questionIndex + 1) / questions.length) * 100}%` }]} />
              </View>

              <Text style={styles.questionPrompt}>{question.prompt}</Text>
              <View style={styles.passageCard}>
                <Text style={styles.passageLabel}>{language === 'en' ? 'ENGLISH EXAMPLE' : 'GERMAN EXAMPLE'}</Text>
                <Text style={styles.passageText}>{question.passage}</Text>
              </View>

              <View style={styles.options}>
                {question.choices.map((choice, index) => {
                  const selected = selectedAnswer === index;
                  const latinChoice = /[A-Za-z]/.test(choice) && !/[آ-ی]/.test(choice);
                  return (
                    <Pressable
                      key={`${question.id}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`گزینهٔ ${toPersianDigits(index + 1)}: ${choice}`}
                      accessibilityState={{ selected }}
                      onPress={() => choose(index)}
                      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                    >
                      <View style={[styles.optionNumber, selected && styles.optionNumberSelected]}>
                        {selected ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : <Text style={styles.optionNumberText}>{toPersianDigits(index + 1)}</Text>}
                      </View>
                      <Text style={[styles.optionText, latinChoice && styles.optionTextLtr, selected && styles.optionTextSelected]}>{choice}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="نمی‌دانم یا هنوز یاد نگرفته‌ام"
                  accessibilityState={{ selected: selectedAnswer === -1 }}
                  onPress={() => choose(-1)}
                  style={({ pressed }) => [styles.unknownOption, selectedAnswer === -1 && styles.unknownOptionSelected, pressed && styles.pressed]}
                >
                  <Text style={styles.unknownText}>نمی‌دانم / هنوز یاد نگرفته‌ام</Text>
                  {selectedAnswer === -1 ? <Check size={15} color={colors.gold} /> : null}
                </Pressable>
              </View>

              <View style={styles.questionFooter}>
                <Pressable accessibilityRole="button" accessibilityLabel="پرسش قبلی" accessibilityState={{ disabled: questionIndex === 0 }} disabled={questionIndex === 0} onPress={previous} style={({ pressed }) => [styles.backButton, questionIndex === 0 && styles.buttonDisabled, pressed && styles.pressed]}>
                  <ChevronLeft size={17} color={questionIndex === 0 ? '#B9B6C4' : colors.text} />
                  <Text style={[styles.backButtonText, questionIndex === 0 && styles.disabledText]}>قبلی</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: !hasAnswer }} disabled={!hasAnswer} onPress={next} style={({ pressed }) => [styles.nextButton, !hasAnswer && styles.nextButtonDisabled, pressed && styles.pressed]}>
                  <Text style={[styles.nextButtonText, !hasAnswer && styles.nextButtonTextDisabled]}>{questionIndex === questions.length - 1 ? 'دیدن پیشنهاد' : 'پرسش بعدی'}</Text>
                  <ArrowLeft size={16} color={hasAnswer ? '#FFFFFF' : '#AAA7B8'} />
                </Pressable>
              </View>
            </View>
          ) : result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultIcon}><Sparkles size={21} color={colors.green} /></View>
              <Text style={styles.resultEyebrow}>پیشنهاد آغاز</Text>
              <Text style={styles.resultTitle}>{getLevelLabel(language, result.recommendedLevelId)}</Text>
              <Text style={styles.resultSummary}>
                {toPersianDigits(result.correctCount)} پاسخ درست از {toPersianDigits(result.questionCount)} پرسش
                {result.unknownCount ? ` · ${toPersianDigits(result.unknownCount)} مورد «نمی‌دانم»` : ''}
              </Text>

              <View style={styles.bandResults}>
                <Text style={styles.bandHeading}>نمای کلی بر اساس سطح‌های داخلی دوره</Text>
                {result.perLevel.map(level => (
                  <View key={level.levelId} style={styles.bandRow}>
                    <Text style={styles.bandName}>{getLevelLabel(language, level.levelId)}</Text>
                    <View style={styles.bandTrack}><View style={[styles.bandFill, { width: `${(level.correct / level.total) * 100}%`, backgroundColor: level.meetsScreeningThreshold ? colors.green : colors.gold }]} /></View>
                    <Text style={styles.bandScore}>{toPersianDigits(level.correct)} از {toPersianDigits(level.total)}</Text>
                  </View>
                ))}
              </View>

              {result.nonMonotonicPattern ? (
                <View style={styles.cautionBox}>
                  <Text style={styles.cautionText}>پاسخ‌ها در چند سطح الگوی یکنواختی ندارند؛ نتیجه را فقط راهنما بدان و اگر لازم است از فهرست، سطح دیگری را خودت انتخاب کن.</Text>
                </View>
              ) : null}

              <View style={styles.methodNote}>
                <Text style={styles.methodNoteText}>قاعدهٔ پیشنهادی: دست‌کم ۲ پاسخ درست از ۳ پرسش در سطح‌های پیاپی. این غربال کوتاه فقط خواندن و درک معنا را نمونه‌گیری می‌کند؛ آزمون رسمی، ارزیابی گفتار/شنیدن/نوشتن یا گواهی CEFR نیست.</Text>
              </View>
              <View style={styles.resultActions}>
                <Pressable accessibilityRole="button" onPress={openSuggestedLevel} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
                  <Text style={styles.primaryActionText}>رفتن به درس‌های «{getLevelLabel(language, result.recommendedLevelId)}»</Text>
                  <ChevronLeft size={17} color="#FFFFFF" />
                </Pressable>
                <View style={styles.secondaryActions}>
                  <Pressable accessibilityRole="button" onPress={openLanguageHome} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
                    <Text style={styles.secondaryActionText}>دیدن همهٔ سطح‌ها</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="شروع دوبارهٔ سنجش آغازین" onPress={restart} style={({ pressed }) => [styles.restartAction, pressed && styles.pressed]}>
                    <RotateCcw size={15} color={colors.violet} /><Text style={styles.restartText}>آزمون دوباره</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>پاسخ‌ها فقط هنگام بازبودن همین صفحه در حافظهٔ موقت هستند؛ این سنجش داده‌ای را به سرور نمی‌فرستد و پیشرفت درس‌ها را تغییر نمی‌دهد.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 800, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 45, gap: 16 },
  pageCompact: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  topbar: { minHeight: 44, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  brandMark: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  brandText: { fontFamily: Typography.fontFamily, color: colors.violet, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  hero: { position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 26, gap: 10, shadowColor: '#091533', shadowOpacity: .16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  heroCompact: { padding: 20, borderRadius: 22 },
  heroOrb: { position: 'absolute', top: -75, right: '9%', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(246, 217, 146, 0.18)', borderWidth: 1, borderColor: 'rgba(246, 217, 146, 0.36)', alignSelf: 'flex-end' },
  heroTitle: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 23, lineHeight: 34, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  heroDescription: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,.88)', fontSize: 13.5, lineHeight: 23, textAlign: 'right', writingDirection: 'rtl' },
  heroMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  heroMeta: { fontFamily: Typography.fontFamily, color: '#F6D992', fontSize: 11.5, fontWeight: '700', writingDirection: 'rtl' },
  heroMetaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(246, 217, 146, 0.6)' },
  questionCard: { padding: 22, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 16, shadowColor: '#0B1838', shadowOpacity: .05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  questionTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  questionCounter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.violetSoft },
  questionCounterText: { fontFamily: Typography.numberFontFamily, color: colors.violet, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  questionLevel: { fontFamily: Typography.fontFamily, color: colors.muted, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: 999, backgroundColor: '#EEF3FB' },
  progressFill: { height: '100%', alignSelf: 'flex-end', borderRadius: 999, backgroundColor: colors.violet },
  questionPrompt: { fontFamily: Typography.fontFamily, color: colors.ink, fontSize: 17, lineHeight: 28, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  passageCard: { padding: 16, borderRadius: 16, backgroundColor: '#EEF3FB', borderWidth: 1, borderColor: colors.border, gap: 6 },
  passageLabel: { fontFamily: 'Inter-ExtraBold', color: colors.violet, fontSize: 10, letterSpacing: 1, fontWeight: '800', textAlign: 'left', writingDirection: 'ltr' },
  passageText: { fontFamily: 'Inter-ExtraBold', color: colors.ink, fontSize: 15.5, lineHeight: 26, fontWeight: '800', textAlign: 'left', writingDirection: 'ltr' },
  options: { gap: 10 },
  option: { minHeight: 54, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  optionSelected: { backgroundColor: colors.violetSoft, borderColor: colors.violet },
  optionNumber: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#EEF3FB' },
  optionNumberSelected: { backgroundColor: colors.violet },
  optionNumberText: { fontFamily: Typography.numberFontFamily, color: colors.muted, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  optionText: { flex: 1, fontFamily: Typography.fontFamily, color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  optionTextLtr: { fontFamily: 'Inter-ExtraBold', textAlign: 'left', writingDirection: 'ltr' },
  optionTextSelected: { color: '#143599', fontWeight: '800' },
  unknownOption: { minHeight: 46, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E5CFA0', backgroundColor: '#FDF9F0' },
  unknownOptionSelected: { borderStyle: 'solid', borderColor: colors.gold, backgroundColor: colors.goldSoft },
  unknownText: { fontFamily: Typography.fontFamily, color: colors.gold, fontSize: 12.5, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  questionFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 6 },
  backButton: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#EEF3FB' },
  backButtonText: { fontFamily: Typography.fontFamily, color: colors.ink, fontSize: 13.5, fontWeight: '700', writingDirection: 'rtl' },
  buttonDisabled: { opacity: .5 },
  disabledText: { color: colors.muted },
  nextButton: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.violet },
  nextButtonDisabled: { backgroundColor: '#E2EAF6' },
  nextButtonText: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 14, fontWeight: '800', writingDirection: 'rtl' },
  nextButtonTextDisabled: { color: colors.muted },
  pressed: { opacity: .85, transform: [{ scale: .99 }] },
  resultCard: { padding: 24, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 13, shadowColor: '#0B1838', shadowOpacity: .05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  resultIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.greenSoft, alignSelf: 'flex-end' },
  resultEyebrow: { fontFamily: Typography.fontFamily, color: colors.green, fontSize: 12, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  resultTitle: { fontFamily: Typography.fontFamily, color: colors.ink, fontSize: 24, lineHeight: 34, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  resultSummary: { fontFamily: Typography.fontFamily, color: colors.text, fontSize: 13.5, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  bandResults: { marginTop: 4, padding: 16, borderRadius: 18, backgroundColor: '#EEF3FB', gap: 12 },
  bandHeading: { fontFamily: Typography.fontFamily, color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  bandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  bandName: { width: 115, fontFamily: Typography.fontFamily, color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  bandTrack: { flex: 1, height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: '#DDE7F7' },
  bandFill: { height: '100%', alignSelf: 'flex-end', borderRadius: 999 },
  bandScore: { width: 52, fontFamily: Typography.fontFamily, color: colors.muted, fontSize: 11.5, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  cautionBox: { padding: 14, borderRadius: 14, backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: '#EFE0BA' },
  cautionText: { fontFamily: Typography.fontFamily, color: '#7B581E', fontSize: 12.5, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  methodNote: { display: 'none', padding: 12, borderRadius: 13, backgroundColor: '#F2F0FA' },
  methodNoteText: { fontFamily: Typography.fontFamily, color: colors.text, fontSize: 10, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  resultActions: { gap: 10, marginTop: 6 },
  primaryAction: { minHeight: 52, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, borderRadius: 15, backgroundColor: colors.violet },
  primaryActionText: { flex: 1, fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  secondaryActions: { flexDirection: 'row-reverse', gap: 10 },
  secondaryAction: { minHeight: 46, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#EEF3FB' },
  secondaryActionText: { fontFamily: Typography.fontFamily, color: colors.ink, fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  restartAction: { minHeight: 46, flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D6E4FF', backgroundColor: colors.violetSoft },
  restartText: { fontFamily: Typography.fontFamily, color: '#143599', fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  privacyNote: { display: 'none', paddingHorizontal: 5, paddingVertical: 4 },
  privacyText: { fontFamily: Typography.fontFamily, color: colors.muted, fontSize: 9, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
});
