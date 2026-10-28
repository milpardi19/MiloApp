import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import Headphones from 'lucide-react-native/dist/esm/icons/headphones';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import Mic2 from 'lucide-react-native/dist/esm/icons/mic-vocal';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
const RUSSIAN_LESSON_GRADIENTS: Record<number, [string, string]> = {
  0: ['#142047', '#C79A50'],
  1: ['#0B1A3E', '#255EE8'],
  2: ['#102554', '#1868A8'],
  3: ['#0E244D', '#1550B8'],
  4: ['#0A1938', '#1E469C'],
};
import { PageNavigation } from '@/components/PageNavigation';
import { LessonNarrator } from '@/components/LessonNarrator';
import RussianSentenceBuilder from '@/components/RussianSentenceBuilder';
import RussianDialoguePractice from '@/components/RussianDialoguePractice';
import { clearRussianLessonSession, loadRussianLessonSession, saveRussianLessonSession } from '@/lib/languages/russianStudyState';
import { findLanguage } from '@/lib/languages/catalog';
import { RUSSIAN_LESSONS, RUSSIAN_LEVELS, RUSSIAN_LESSON_STAGES, russianProgress, type RussianCourseLesson } from '@/lib/languages/russian';
import type { RussianLessonSession } from '@/lib/languages/russianStudyState';
import { toPersianDigits as fa } from '@/lib/format';
import { Typography } from '@/lib/theme';
import { narrate, stopNarration } from '@/lib/narrator/engine';

const stages = RUSSIAN_LESSON_STAGES;

/** سرعت پخش: معمولی برای شنیدن خودکار و آهسته برای تکرار دقیق‌تر. */
const NORMAL_SPEECH_RATE = 0.85;
const SLOW_SPEECH_RATE = 0.5;

export default function RussianLesson({ lesson }: { lesson: RussianCourseLesson }) {
  const router = useRouter();
  const courseLevel = RUSSIAN_LEVELS.find(item => item.id === lesson.levelId) ?? RUSSIAN_LEVELS[0];
  const [stage, setStage] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showCheckAnswers, setShowCheckAnswers] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [loadingRetry, setLoadingRetry] = useState(0);
  const [saveRetry, setSaveRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const completing = useRef(false);
  const current = lesson.sentences[sentenceIndex];
  const checks = lesson.checks ?? [];
  const allChecksPassed = checks.every((question, index) => answers[String(index)] === question.correctIndex);
  const progressPercent = Math.round(((stage + 1) / stages.length) * 100);
  const vocabulary = useMemo(() => {
    const byWord = new Map<string, { word: LearningLessonVocabulary; sentence: RussianCourseLesson['sentences'][number] }>();
    lesson.sentences.forEach(sentence => sentence.vocabulary.forEach(word => {
      if (!byWord.has(word.word)) byWord.set(word.word, { word, sentence });
    }));
    return [...byWord.values()];
  }, [lesson]);
  const grammarPatterns = lesson.sentences.flatMap(sentence => sentence.pattern ? [{ sentence, pattern: sentence.pattern }] : []);

  useEffect(() => {
    let alive = true;
    completing.current = false;
    setSessionReady(false);
    setSessionError('');
    setCompletionError('');
    void loadRussianLessonSession(lesson.id).then(saved => {
      if (!alive) return;
      setStage(saved.stage);
      setSentenceIndex(Math.min(saved.sentenceIndex, lesson.sentences.length - 1));
      setRevealed(saved.revealed);
      setAnswers(saved.answers);
      setShowCheckAnswers(saved.showCheckAnswers);
      setSessionReady(true);
    }).catch(() => {
      if (alive) setSessionError('جلسهٔ قبلی خوانده نشد؛ برای حفظ اطلاعات، ذخیره متوقف است. دوباره تلاش کنید.');
    });
    return () => { alive = false; void Speech.stop(); };
  }, [lesson.id, lesson.sentences.length, loadingRetry]);

  useEffect(() => {
    if (!sessionReady || completing.current) return;
    const nextSession: RussianLessonSession = { stage, sentenceIndex, revealed, answers, showCheckAnswers };
    void saveRussianLessonSession(lesson.id, nextSession)
      .then(() => setSessionError(''))
      .catch(() => setSessionError('جلسه ذخیره نشد؛ پیشرفت درس کامل ثبت نشده است. دوباره ذخیره کنید.'));
  }, [lesson.id, sessionReady, stage, sentenceIndex, revealed, answers, showCheckAnswers, saveRetry]);

  const speak = useCallback((text: string, rate = 0.78) => {
    if (!NARRATION_ENABLED) return;
    setSpeechError('');
    void narrate(text, 'ru-RU', { speed: rate < 0.7 ? 'slow' : 'normal' })
      .catch(() => setSpeechError('فایل صوتی تأییدشدهٔ روسی در دسترس نیست؛ متن و راهنمای خوانش همچنان دیده می‌شوند.'));
  }, []);

  const selectSentence = (index: number, rate = 0.72) => {
    setSentenceIndex(index);
    setRevealed(false);
    setSpeechError('');
    speak(lesson.sentences[index].text, rate);
  };

  const lessonIndex = RUSSIAN_LESSONS.findIndex(item => item.id === lesson.id);
  const firstLesson = RUSSIAN_LESSONS[0];
  const prevLesson = lessonIndex > 0 ? RUSSIAN_LESSONS[lessonIndex - 1] : undefined;
  const canGoBackInSentence = (stage === 1 || stage === 3 || stage === 4) && sentenceIndex > 0;
  const canGoBack = canGoBackInSentence || stage > 0 || Boolean(prevLesson);
  const previousLabel = canGoBackInSentence
    ? 'جملهٔ قبلی'
    : stage > 0
      ? 'مرحلهٔ قبلی'
      : 'درس قبلی';

  const restartCurrentLesson = () => {
    if (saving) return;
    stopNarration();
    void Speech.stop();
    setStage(0);
    setSentenceIndex(0);
    setRevealed(false);
    setSpeechError('');
  };

  const goToFirstLesson = () => {
    if (saving) return;
    stopNarration();
    void Speech.stop();
    void clearRussianLessonSession(firstLesson.id).catch(() => undefined).finally(() => {
      if (lesson.id === firstLesson.id) {
        restartCurrentLesson();
      } else {
        router.replace(`/learn/ru/lesson?id=${encodeURIComponent(firstLesson.id)}` as never);
      }
    });
  };

  const previous = () => {
    if (!sessionReady || sessionError || completing.current || saving) return;
    stopNarration();
    void Speech.stop();
    setCompletionError('');
    setSpeechError('');
    if (canGoBackInSentence) {
      setSentenceIndex(value => Math.max(0, value - 1));
      setRevealed(false);
      return;
    }
    if (stage > 0) {
      const targetStage = stage - 1;
      setStage(targetStage);
      setSentenceIndex(targetStage === 1 ? Math.max(0, lesson.sentences.length - 1) : 0);
      setRevealed(false);
      return;
    }
    if (prevLesson) {
      router.replace(`/learn/ru/lesson?id=${encodeURIComponent(prevLesson.id)}` as never);
    }
  };

  const next = async () => {
    if (!sessionReady || sessionError || completing.current || saving) return;
    void Speech.stop();
    setCompletionError('');
    if (stage === 1 && sentenceIndex < lesson.sentences.length - 1) {
      const nextIndex = sentenceIndex + 1;
      setSentenceIndex(nextIndex);
      setRevealed(false);
      return;
    }
    if (stage < stages.length - 1) {
      const nextStage = stage + 1;
      setStage(nextStage);
      setSentenceIndex(0);
      setRevealed(false);
      return;
    }
    if (!allChecksPassed && !showCheckAnswers) return;
    completing.current = true;
    setSaving(true);
    try {
      const index = RUSSIAN_LESSONS.findIndex(item => item.id === lesson.id);
      const nextLesson = RUSSIAN_LESSONS[index + 1];
      await russianProgress.completeSentenceLesson(lesson.id, nextLesson?.id);
      await clearRussianLessonSession(lesson.id);
      router.replace(nextLesson
        ? ({ pathname: '/learn/[language]/lesson', params: { language: 'ru', id: nextLesson.id } } as never)
        : '/learn/ru' as never);
    } catch {
      completing.current = false;
      setCompletionError('پایان درس ذخیره نشد؛ دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  if (!sessionReady) return <View style={styles.root}><PageNavigation backFallback="/learn/ru" accentColor={Palette.primary} borderColor={Palette.border} /><View style={styles.loadingCard}><ActivityIndicator color={Palette.primary} /><Text accessibilityRole={sessionError ? 'alert' : undefined} style={styles.loadingText}>{sessionError || 'در حال بازیابی جلسهٔ روسی…'}</Text>{sessionError ? <Pressable accessibilityRole="button" style={styles.loadingButton} onPress={() => setLoadingRetry(value => value + 1)}><Text style={styles.loadingButtonText}>تلاش دوباره</Text></Pressable> : null}</View></View>;

  return (
    <View style={styles.root}>
      <LinearGradient colors={RUSSIAN_LESSON_GRADIENTS[courseLevel.id]} start={{ x: .95, y: 0 }} end={{ x: .05, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <PageNavigation tone="dark" backFallback="/learn/ru" />
          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>LEVEL {courseLevel.id + 1} · {courseLevel.title.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.headerSub}>{stages[stage].labelFa} · مرحلهٔ {fa(stage + 1)} از {fa(stages.length)}</Text>
          </View>
          <View style={styles.percentBadge}><Text style={styles.percent}>{fa(progressPercent)}٪</Text><Text style={styles.percentLabel}>پیشرفت</Text></View>
        </View>
        <View style={styles.headerBottom}><View style={styles.headerInfoChip}><BookOpenCheck size={13} color="#D9DBFF" /><Text style={styles.headerInfoText}>مسیر اصلی جمله‌محور</Text></View><Text style={styles.headerInfoText}>{fa(lesson.sentences.length)} جملهٔ اصلی</Text></View>
      </LinearGradient>

      <View style={styles.stepperCard}>
        <View style={styles.stepperHeading}>
          <View><Text style={styles.stepperEyebrow}>LESSON FLOW · 09 STAGES</Text><Text style={styles.stepperTitle}>جریان این درس</Text></View>
          <View style={styles.stepperNow}><Text style={styles.stepperNowEn}>{stages[stage].labelEn}</Text><Text style={styles.stepperNowFa}>{stages[stage].labelFa}</Text></View>
        </View>
        <View style={styles.stepSegments}>
          {stages.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.labelFa} · مرحلهٔ ${fa(index + 1)} از ${fa(stages.length)}`}
              style={styles.stepSegmentBtn}
              onPress={() => {
                if (!sessionReady || sessionError || saving) return;
                stopNarration();
                void Speech.stop();
                setStage(index);
                setSentenceIndex(0);
                setRevealed(false);
              }}
            >
              <View style={[styles.stepSegment, index <= stage && styles.stepSegmentDone, index === stage && styles.stepSegmentCurrent]} />
            </Pressable>
          ))}
        </View>
        {(stage > 0 || sentenceIndex > 0 || lesson.id !== firstLesson.id) ? (
          <View style={styles.stepperQuickRow}>
            {(stage > 0 || sentenceIndex > 0) ? (
              <Pressable accessibilityRole="button" accessibilityLabel="شروع از ابتدای این درس" style={styles.stepperQuickPill} onPress={restartCurrentLesson}>
                <RotateCcw size={13} color={Palette.primaryDark} />
                <Text style={styles.stepperQuickText}>از ابتدای این درس</Text>
              </Pressable>
            ) : null}
            {lesson.id !== firstLesson.id ? (
              <Pressable accessibilityRole="button" accessibilityLabel="بازگشت به درس اول" style={styles.stepperQuickPill} onPress={goToFirstLesson}>
                <RotateCcw size={13} color={Palette.primary} />
                <Text style={styles.stepperQuickText}>بازگشت به درس اول</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={styles.stepperEnds}><Text style={styles.stepperEndText}>Situation</Text><Text style={styles.stepperEndText}>Spaced Review</Text></View>
      </View>

      {!!(sessionError || speechError) && <Text accessibilityRole="alert" style={styles.error}>{sessionError || speechError}</Text>}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional narrator: warm female Russian voice, automatic on the sentence stages. */}
        <LessonNarrator
          locale="ru-RU"
          text={current.text}
          enabled={stage <= 2}
          accent={Palette.primary}
          accentDeep={Palette.primaryDark}
          accentSoft={Palette.primarySoft}
        />
        {stage === 0 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><Sparkles size={34} color={Palette.warning} /></View>
          <Text style={styles.stageEyebrow}>موقعیت واقعی</Text>
          <Text style={styles.stageTitle}>{lesson.title}</Text>
          <Text style={styles.situation}>{lesson.situation}</Text>
          <View style={styles.promiseCard}><Text style={styles.promiseTitle}>در پایان این درس می‌توانید:</Text><Text style={styles.promiseText}>با {fa(lesson.sentences.length)} جملهٔ کوتاه، این موقعیت را مدیریت کنید.</Text></View>
          {lesson.teachingFa ? <View style={styles.noteCard}><Text style={styles.noteTitle}>نکتهٔ روسی به فارسی</Text><Text style={styles.noteText}>{lesson.teachingFa}</Text></View> : null}
        </View>}

        {stage === 1 && <View style={styles.sentenceStage}>
          <Text style={styles.counter}>جملهٔ {fa(sentenceIndex + 1)} از {fa(lesson.sentences.length)}</Text>
          <View style={styles.sentenceCard}>
            <Pressable accessibilityRole="button" accessibilityLabel="شنیدن جملهٔ روسی" style={styles.soundButton} onPress={() => speak(current.text)}><Volume2 size={25} color="#FFFFFF" /></Pressable>
            <Text style={styles.russianSentence}>{current.text}</Text>
            <Text style={styles.pronunciation}>{current.pronunciation}</Text>
            <View style={styles.divider} />
            <Text style={styles.persian}>{current.fa}</Text>
            {current.pattern ? <View style={styles.pattern}><Text style={styles.patternLabel}>الگوی جمله‌سازی:</Text><Text style={styles.patternText}>{current.pattern}</Text></View> : null}
          </View>
          <View style={styles.replayRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="پخش آهستهٔ جمله" style={styles.replayButton} onPress={() => speak(current.text, SLOW_SPEECH_RATE)}><Volume2 size={18} color={Palette.primary} /><Text style={styles.replayText}>آهسته</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="پخش معمولی جمله" style={styles.replayButton} onPress={() => speak(current.text, NORMAL_SPEECH_RATE)}><Volume2 size={18} color={Palette.primary} /><Text style={styles.replayText}>معمولی</Text></Pressable>
          </View>
          <Text style={styles.hint}>برای شنیدن جمله، دکمهٔ پخش را بزنید. می‌توانید آهسته یا معمولی بشنوید و با صدای بلند تکرار کنید.</Text>
        </View>}

        {stage === 2 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><Headphones size={34} color={Palette.primary} /></View>
          <Text style={styles.stageTitle}>شنیدن جمله‌ها</Text>
          <Text style={styles.stageDesc}>هر جمله را جداگانه گوش دهید و معنی همان جمله را به یاد بیاورید. واژه‌ها کنار جملهٔ اصلی می‌مانند.</Text>
          <View style={styles.listenList}>{lesson.sentences.map((sentence, index) => <Pressable key={sentence.id} accessibilityRole="button" accessibilityState={{ selected: index === sentenceIndex }} style={[styles.listenRow, index === sentenceIndex && styles.listenRowActive]} onPress={() => selectSentence(index)}>
            <View style={styles.listenNumber}><Text style={styles.listenNumberText}>{fa(index + 1)}</Text></View>
            <Text style={styles.listenRussian}>{sentence.text}</Text>
            <Volume2 size={19} color={Palette.primary} />
          </Pressable>)}</View>
          <View style={styles.shadowTip}><Headphones size={18} color={Palette.primary} /><Text style={styles.shadowText}>فعلاً فقط گوش دهید؛ مرحلهٔ بعد برای تکرار و سایه‌خوانی است.</Text></View>
        </View>}

        {stage === 3 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><Mic2 size={34} color={Palette.success} /></View>
          <Text style={styles.stageTitle}>سایه‌خوانی · Shadowing</Text>
          <Text style={styles.stageDesc}>نمونه را آهسته پخش کنید، مکث کنید و با همان آهنگ تکرار کنید. ضبط صدا یا ارزیابی گفتار لازم نیست.</Text>
          <View style={styles.speechPractice}>
            <Text style={styles.speechTitle}>جملهٔ انتخاب‌شده</Text>
            <Text style={styles.speechSentence}>{current.text}</Text>
            <Pressable accessibilityRole="button" style={styles.playSlowButton} onPress={() => speak(current.text, .68)}><Volume2 size={18} color="#FFFFFF" /><Text style={styles.recordButtonText}>پخش آهستهٔ نمونه</Text></Pressable>
            <Text style={styles.speechHint}>پس از شنیدن، جمله را با صدای بلند تکرار کنید؛ گفتار ضبط یا نمره‌گذاری نمی‌شود.</Text>
          </View>
          <View style={styles.sentenceStepRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sentenceIndex === 0 }}
              disabled={sentenceIndex === 0}
              style={[styles.sentenceStepBtn, sentenceIndex === 0 && styles.sentenceStepBtnDisabled]}
              onPress={() => selectSentence(Math.max(0, sentenceIndex - 1), .68)}
            >
              <ChevronRight size={16} color={Palette.primaryDark} />
              <Text style={styles.sentenceStepText}>جملهٔ قبلی</Text>
            </Pressable>
            <Text style={styles.sentenceStepCounter}>
              جملهٔ {fa(sentenceIndex + 1)} از {fa(lesson.sentences.length)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sentenceIndex >= lesson.sentences.length - 1 }}
              disabled={sentenceIndex >= lesson.sentences.length - 1}
              style={[styles.sentenceStepBtn, sentenceIndex >= lesson.sentences.length - 1 && styles.sentenceStepBtnDisabled]}
              onPress={() => selectSentence(Math.min(lesson.sentences.length - 1, sentenceIndex + 1), .68)}
            >
              <Text style={styles.sentenceStepText}>جملهٔ بعدی</Text>
              <ChevronLeft size={16} color={Palette.primaryDark} />
            </Pressable>
          </View>
          <View style={styles.dots}>{lesson.sentences.map((sentence, index) => <Pressable key={sentence.id} accessibilityRole="button" accessibilityLabel={`جمله ${fa(index + 1)}`} onPress={() => selectSentence(index, .68)} style={[styles.dot, index === sentenceIndex && styles.dotActive]} />)}</View>
        </View>}

        {stage === 4 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><RotateCcw size={33} color={Palette.success} /></View>
          <Text style={styles.stageTitle}>ساخت جمله</Text>
          <Text style={styles.stageDesc}>معنی و الگوی جمله‌سازی را بخوانید و واژه‌های همان جمله را به ترتیب بچینید؛ تمرین به جمله‌های همین درس متصل است.</Text>
          <RussianSentenceBuilder key={current.id} sentence={current} lessonSentences={lesson.sentences} />
          <View style={styles.sentenceStepRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sentenceIndex === 0 }}
              disabled={sentenceIndex === 0}
              style={[styles.sentenceStepBtn, sentenceIndex === 0 && styles.sentenceStepBtnDisabled]}
              onPress={() => setSentenceIndex(value => Math.max(0, value - 1))}
            >
              <ChevronRight size={16} color={Palette.primaryDark} />
              <Text style={styles.sentenceStepText}>جملهٔ قبلی</Text>
            </Pressable>
            <Text style={styles.sentenceStepCounter}>
              جملهٔ {fa(sentenceIndex + 1)} از {fa(lesson.sentences.length)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sentenceIndex >= lesson.sentences.length - 1 }}
              disabled={sentenceIndex >= lesson.sentences.length - 1}
              style={[styles.sentenceStepBtn, sentenceIndex >= lesson.sentences.length - 1 && styles.sentenceStepBtnDisabled]}
              onPress={() => setSentenceIndex(value => Math.min(lesson.sentences.length - 1, value + 1))}
            >
              <Text style={styles.sentenceStepText}>جملهٔ بعدی</Text>
              <ChevronLeft size={16} color={Palette.primaryDark} />
            </Pressable>
          </View>
          <View style={styles.dots}>{lesson.sentences.map((sentence, index) => <Pressable key={sentence.id} accessibilityRole="button" accessibilityLabel={`جمله ${fa(index + 1)}`} onPress={() => setSentenceIndex(index)} style={[styles.dot, index === sentenceIndex && styles.dotActive]} />)}</View>
        </View>}

        {stage === 5 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><Sparkles size={34} color={Palette.warning} /></View>
          <Text style={styles.stageTitle}>واژگان از دل جمله‌ها</Text>
          <Text style={styles.stageDesc}>هر واژه را همراه معنی و همان جمله‌ای ببینید که از آن آمده است.</Text>
          <View style={styles.vocabList}>{vocabulary.map(({ word, sentence }) => <View key={`${word.word}-${sentence.id}`} style={styles.vocabCard}>
            <View style={styles.vocabTop}><Text style={styles.vocabWord}>{word.word}</Text><Text style={styles.vocabMeaning}>{word.meaning}</Text></View>
            <Text style={styles.vocabExample}>{sentence.text}</Text><Text style={styles.vocabExampleFa}>{sentence.fa}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن مثال: ${sentence.text}`} style={styles.bubbleSound} onPress={() => speak(sentence.text)}><Volume2 size={16} color={Palette.primary} /></Pressable>
          </View>)}</View>
        </View>}

        {stage === 6 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><BookOpenCheck size={33} color={Palette.primary} /></View>
          <Text style={styles.stageTitle}>دستور در کاربرد</Text>
          <Text style={styles.stageDesc}>الگوها فقط از جمله‌های ثبت‌شدهٔ همین درس نمایش داده می‌شوند؛ قاعده یا مثال تازه‌ای به داده‌ها اضافه نمی‌شود.</Text>
          {grammarPatterns.length ? grammarPatterns.map(({ sentence, pattern }) => <View key={sentence.id} style={styles.vocabCard}>
            <Text style={styles.patternText}>{pattern}</Text><Text style={styles.vocabExample}>{sentence.text}</Text><Text style={styles.vocabExampleFa}>{sentence.fa}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن جمله: ${sentence.text}`} onPress={() => speak(sentence.text)} style={styles.bubbleSound}><Volume2 size={16} color={Palette.primary} /></Pressable>
          </View>) : <View style={styles.promiseCard}><Text style={styles.promiseTitle}>یادگیری در بافت جمله</Text><Text style={styles.promiseText}>برای این درس الگوی جداگانه‌ای ثبت نشده است؛ جملهٔ اصلی را بشنوید و ساختارش را در کاربرد ببینید.</Text></View>}
        </View>}

        {stage === 7 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><MessageCircle size={34} color={Palette.primary} /></View>
          <Text style={styles.stageTitle}>مکالمهٔ هدایت‌شده</Text>
          <Text style={styles.stageDesc}>از دیالوگ همین درس نقش‌آفرینی کنید؛ جملهٔ خود را بگویید و سپس نمونه را بشنوید.</Text>
          <RussianDialoguePractice key={lesson.id} dialogue={lesson.dialogue} onSpeak={speak} />
        </View>}

        {stage === 8 && <View style={styles.centerStage}>
          <View style={styles.bigIcon}><RefreshCw size={33} color={Palette.success} /></View>
          <Text style={styles.stageTitle}>مرور فاصله‌دار</Text>
          <Text style={styles.stageDesc}>با پایان درس، جمله‌ها وارد مرور محلی می‌شوند؛ فاصلهٔ بعدی براساس پاسخی که در مرور می‌دهید تنظیم می‌شود.</Text>
          <View style={styles.promiseCard}><Text style={styles.promiseTitle}>خلاصهٔ همین درس</Text><Text style={styles.promiseText}>{fa(lesson.sentences.length)} جمله و {fa(vocabulary.length)} واژه/عبارت یکتا؛ پاسخ‌ها خودآموزند و گواهی سطح ایجاد نمی‌کنند.</Text></View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceTitle}>حالا خودت امتحان کن</Text>
            <Text style={styles.evidenceIntro}>پرسش‌ها به جمله‌های همین درس وصل‌اند. پاسخ نادرست را می‌توانید دوباره امتحان کنید یا توضیح پاسخ نمونه را ببینید.</Text>
            {checks.map((question, index) => <View key={index} style={styles.question}>
              <Text style={styles.questionPrompt}>{fa(index + 1)}. {question.promptFa}</Text>
              {question.choices.map((choice, choiceIndex) => {
                const selected = answers[String(index)] === choiceIndex;
                const shownCorrect = showCheckAnswers && choiceIndex === question.correctIndex;
                const locked = answers[String(index)] === question.correctIndex || showCheckAnswers;
                return <Pressable key={`${index}-${choiceIndex}`} accessibilityRole="radio" accessibilityState={{ checked: selected || shownCorrect, disabled: locked }} disabled={locked} onPress={() => setAnswers(value => ({ ...value, [String(index)]: choiceIndex }))} style={[styles.choice, (selected || shownCorrect) && styles.choiceSelected, shownCorrect && styles.choiceCorrect]}>
                  <Text style={/[А-Яа-яЁё]/.test(choice) ? styles.choiceRussian : styles.choicePersian}>{choice}</Text>
                </Pressable>;
              })}
              {(answers[String(index)] !== undefined || showCheckAnswers) && <View style={styles.feedbackBox}>
                <Text style={showCheckAnswers || answers[String(index)] === question.correctIndex ? styles.feedbackTitle : styles.feedbackError}>{showCheckAnswers && answers[String(index)] !== question.correctIndex ? `پاسخ نمونه: ${question.choices[question.correctIndex]}` : answers[String(index)] === question.correctIndex ? 'پاسخ مناسب است.' : 'این بار درست نبود؛ دوباره تلاش کنید.'}</Text>
                <Text style={styles.feedbackText}>{question.explanationFa}</Text>
                {answers[String(index)] !== undefined && answers[String(index)] !== question.correctIndex && !showCheckAnswers ? <Pressable accessibilityRole="button" style={styles.retryAnswer} onPress={() => setAnswers(value => { const nextAnswers = { ...value }; delete nextAnswers[String(index)]; return nextAnswers; })}><Text style={styles.retryAnswerText}>دوباره امتحان کن</Text></Pressable> : null}
              </View>}
            </View>)}
            {!showCheckAnswers && <Pressable accessibilityRole="button" style={styles.showAnswersButton} onPress={() => setShowCheckAnswers(true)}><Text style={styles.showAnswersText}>نمایش توضیح همهٔ پاسخ‌ها</Text></Pressable>}
            {showCheckAnswers ? <Text style={styles.evidenceNote}>پاسخ‌های نمونه نمایش داده شدند؛ می‌توانید درس را پایان دهید.</Text> : null}
          </View>
        </View>}

        {!!(sessionError || completionError) && <Text accessibilityRole="alert" style={styles.error}>{sessionError || completionError}</Text>}
        {sessionError ? <Pressable accessibilityRole="button" style={styles.retrySaveButton} onPress={() => setSaveRetry(value => value + 1)}><Text style={styles.retrySaveText}>تلاش دوباره برای ذخیرهٔ جلسه</Text></Pressable> : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || !!sessionError }}
              disabled={saving || !!sessionError}
              style={[styles.prevButton, (saving || !!sessionError) && styles.nextButtonDisabled]}
              onPress={previous}
            >
              <ChevronRight size={18} color={Palette.primaryDark} />
              <Text style={styles.prevText}>{previousLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || !!sessionError || (stage === stages.length - 1 && !allChecksPassed && !showCheckAnswers) }} disabled={saving || !!sessionError || (stage === stages.length - 1 && !allChecksPassed && !showCheckAnswers)} style={[styles.nextButton, (saving || (stage === stages.length - 1 && !allChecksPassed && !showCheckAnswers)) && styles.nextButtonDisabled]} onPress={() => void next()}>
            <Text style={styles.nextText}>{saving ? 'در حال ذخیره…' : stage === stages.length - 1 ? 'پایان درس' : stage === 1 && sentenceIndex < lesson.sentences.length - 1 ? 'جملهٔ بعدی' : 'ادامه'}</Text>
            {stage === stages.length - 1 ? <Check size={20} color="#FFFFFF" /> : <ChevronLeft size={20} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type LearningLessonVocabulary = RussianCourseLesson['sentences'][number]['vocabulary'][number];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.canvas },
  loadingCard: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  loadingText: { fontFamily: Typography.fontFamily, color: Palette.text, fontSize: 13.5, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  loadingButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 14, backgroundColor: Palette.primary },
  loadingButtonText: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontWeight: '800', writingDirection: 'rtl' },
  header: { width: '100%', paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16, gap: 10, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, shadowColor: '#091533', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  headerTop: { width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  headerEyebrow: { fontFamily: 'Inter-ExtraBold', color: '#F6D992', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, writingDirection: 'ltr' },
  headerTitle: { fontFamily: Typography.fontFamily, fontSize: 19, lineHeight: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl' },
  headerSub: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.84)', textAlign: 'right', writingDirection: 'rtl' },
  percentBadge: { minWidth: 52, height: 44, paddingHorizontal: 10, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  percent: { fontFamily: Typography.fontFamily, fontSize: 14, lineHeight: 18, fontWeight: '900', color: '#FFFFFF', writingDirection: 'rtl' },
  percentLabel: { display: 'none', fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.72)', fontSize: 7, writingDirection: 'rtl' },
  headerBottom: { display: 'none', width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  headerInfoChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  headerInfoText: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.78)', fontSize: 9, writingDirection: 'rtl' },
  stepperCard: { width: '94%', maxWidth: 840, alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, gap: 8, shadowColor: '#0B1838', shadowOpacity: .045, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  stepperHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stepperEyebrow: { display: 'none', fontFamily: 'Inter-ExtraBold', color: Palette.primary, fontSize: 6, fontWeight: '800', letterSpacing: 1, writingDirection: 'ltr' },
  stepperTitle: { fontFamily: Typography.fontFamily, fontSize: 12.5, lineHeight: 18, fontWeight: '800', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  stepperNow: { alignItems: 'flex-end', gap: 1 },
  stepperNowEn: { display: 'none', fontFamily: 'Inter-ExtraBold', color: Palette.primaryDark, fontSize: 7, fontWeight: '800', writingDirection: 'ltr' },
  stepperNowFa: { fontFamily: Typography.fontFamily, color: Palette.primaryDark, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  stepSegments: { flexDirection: 'row-reverse', gap: 5 },
  stepSegmentBtn: { flex: 1, paddingVertical: 4 },
  stepSegment: { width: '100%', height: 5, borderRadius: 999, backgroundColor: Palette.surfaceMuted },
  stepSegmentDone: { backgroundColor: Palette.success },
  stepSegmentCurrent: { backgroundColor: Palette.primary },
  stepperQuickRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  stepperQuickPill: { minHeight: 32, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border },
  stepperQuickText: { fontFamily: Typography.fontFamily, fontSize: 11.5, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  sentenceStepRow: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  sentenceStepBtn: { minHeight: 40, flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 13, borderRadius: 12, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  sentenceStepBtnDisabled: { opacity: 0.38 },
  sentenceStepText: { fontFamily: Typography.fontFamily, fontSize: 12.5, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  sentenceStepCounter: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: Palette.muted, writingDirection: 'rtl' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  stepperEnds: { display: 'none', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  stepperEndText: { fontFamily: 'Inter-ExtraBold', color: Palette.muted, fontSize: 6, fontWeight: '800', writingDirection: 'ltr' },
  error: { width: '94%', maxWidth: 840, alignSelf: 'center', marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: Palette.dangerSoft, color: Palette.danger, fontFamily: Typography.fontFamily, fontSize: 12.5, fontWeight: '700', lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  retrySaveButton: { alignSelf: 'center', marginBottom: 10, padding: 10 },
  retrySaveText: { fontFamily: Typography.fontFamily, color: Palette.primary, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  content: { width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, gap: 14 },
  centerStage: { alignItems: 'center', width: '100%' },
  bigIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: Palette.primarySoft, borderWidth: 1, borderColor: '#D6E4FF', alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  stageEyebrow: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '800', color: Palette.primary, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  stageTitle: { fontFamily: Typography.fontFamily, fontSize: 23, lineHeight: 34, fontWeight: '900', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  stageDesc: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 23, marginTop: 6 },
  situation: { fontFamily: Typography.fontFamily, fontSize: 15, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 27, marginTop: 10 },
  promiseCard: { width: '100%', borderRadius: 20, backgroundColor: Palette.primarySoft, borderWidth: 1, borderColor: '#D6E4FF', padding: 18, marginTop: 18, gap: 5 },
  promiseTitle: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl' },
  promiseText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', lineHeight: 23, marginTop: 4 },
  noteCard: { width: '100%', marginTop: 14, borderRadius: 20, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 18, gap: 8, shadowColor: '#0B1838', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  noteTitle: { fontFamily: Typography.fontFamily, color: Palette.primaryDark, fontSize: 13.5, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  noteText: { fontFamily: Typography.fontFamily, color: Palette.text, fontSize: 13, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  sentenceStage: { alignItems: 'center', paddingTop: 10, width: '100%' },
  counter: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: Palette.muted, marginBottom: 10, alignSelf: 'flex-end', textAlign: 'right', writingDirection: 'rtl' },
  sentenceCard: { width: '100%', borderRadius: 24, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 24, alignItems: 'center', shadowColor: '#0B1838', shadowOpacity: .055, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  soundButton: { width: 56, height: 56, borderRadius: 20, backgroundColor: Palette.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: Palette.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  russianSentence: { fontFamily: 'Inter-ExtraBold', width: '100%', fontSize: 23, lineHeight: 34, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  pronunciation: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: '600', color: Palette.primaryDark, textAlign: 'center', writingDirection: 'rtl', marginTop: 10 },
  divider: { width: '100%', height: 1, backgroundColor: Palette.border, marginVertical: 18 },
  persian: { fontFamily: Typography.fontFamily, fontSize: 17, fontWeight: '700', lineHeight: 28, color: Palette.ink, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  pattern: { width: '100%', flexDirection: 'column', alignItems: 'flex-end', gap: 4, backgroundColor: Palette.warningSoft, borderWidth: 1, borderColor: '#F1DFB6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginTop: 14 },
  patternLabel: { fontFamily: Typography.fontFamily, fontSize: 11, fontWeight: '800', color: Palette.warning, textAlign: 'right', writingDirection: 'rtl' },
  patternText: { fontFamily: Typography.fontFamily, fontSize: 12.5, lineHeight: 21, fontWeight: '600', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  hint: { display: 'none', fontFamily: Typography.fontFamily, fontSize: 11, color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, marginTop: 14 },
  listenList: { width: '100%', gap: 10, marginTop: 18 },
  listenRow: { minHeight: 62, borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  listenRowActive: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  listenNumber: { width: 32, height: 32, borderRadius: 12, backgroundColor: Palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listenNumberText: { fontFamily: Typography.numberFontFamily, fontSize: 12, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  listenRussian: { fontFamily: 'Inter-ExtraBold', flex: 1, fontSize: 15, fontWeight: '800', lineHeight: 23, color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  shadowTip: { display: 'none', width: '100%', marginTop: 18, borderRadius: 14, backgroundColor: Palette.warningSoft, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  shadowText: { flex: 1, fontFamily: Typography.fontFamily, fontSize: 11, color: Palette.text, textAlign: 'right', writingDirection: 'rtl', lineHeight: 19 },
  speechPractice: { width: '100%', borderRadius: 24, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 20, alignItems: 'center', marginTop: 16, shadowColor: '#0B1838', shadowOpacity: .045, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  speechTitle: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  speechSentence: { fontFamily: 'Inter-ExtraBold', width: '100%', fontSize: 19, lineHeight: 29, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr', marginTop: 10 },
  playSlowButton: { minHeight: 48, minWidth: 170, borderRadius: 14, paddingHorizontal: 18, backgroundColor: Palette.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  recordButtonText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: '#FFFFFF', writingDirection: 'rtl' },
  speechHint: { display: 'none', fontFamily: Typography.fontFamily, fontSize: 11, color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 19, marginTop: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.border },
  dotActive: { width: 24, backgroundColor: Palette.primary },
  vocabList: { width: '100%', gap: 10, marginTop: 18 },
  vocabCard: { width: '100%', borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 16, gap: 7, shadowColor: '#0B1838', shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  vocabTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  vocabWord: { fontFamily: 'Inter-ExtraBold', fontSize: 17, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  vocabMeaning: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl' },
  vocabExample: { fontFamily: 'Inter-ExtraBold', fontSize: 13.5, fontWeight: '800', lineHeight: 22, color: Palette.text, textAlign: 'left', writingDirection: 'ltr' },
  vocabExampleFa: { fontFamily: Typography.fontFamily, fontSize: 12.5, lineHeight: 20, color: Palette.muted, textAlign: 'right', writingDirection: 'rtl' },
  bubbleSound: { alignSelf: 'flex-end', marginTop: 4, padding: 5 },
  evidenceCard: { width: '100%', marginTop: 20, borderRadius: 22, padding: 20, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, gap: 14, shadowColor: '#0B1838', shadowOpacity: 0.045, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  evidenceTitle: { fontFamily: Typography.fontFamily, fontSize: 18, fontWeight: '900', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  evidenceIntro: { fontFamily: Typography.fontFamily, fontSize: 13, lineHeight: 22, color: Palette.text, textAlign: 'right', writingDirection: 'rtl' },
  question: { gap: 9, marginTop: 5 },
  questionPrompt: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: '700', lineHeight: 23, color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  choice: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surfaceMuted, paddingHorizontal: 14, paddingVertical: 11, justifyContent: 'center' },
  choiceSelected: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  choiceCorrect: { borderColor: Palette.success, backgroundColor: Palette.successSoft },
  choiceRussian: { fontFamily: 'Inter-ExtraBold', fontSize: 13.5, fontWeight: '800', lineHeight: 22, color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  choicePersian: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '600', lineHeight: 22, color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  feedbackBox: { borderRadius: 14, padding: 13, backgroundColor: Palette.surfaceMuted, gap: 5 },
  feedbackTitle: { fontFamily: Typography.fontFamily, color: Palette.success, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  feedbackError: { fontFamily: Typography.fontFamily, color: Palette.danger, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  feedbackText: { fontFamily: Typography.fontFamily, color: Palette.text, fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  retryAnswer: { alignSelf: 'flex-start', paddingVertical: 6 },
  retryAnswerText: { fontFamily: Typography.fontFamily, color: Palette.primary, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  showAnswersButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surfaceMuted, marginTop: 4 },
  showAnswersText: { fontFamily: Typography.fontFamily, color: Palette.primaryDark, fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  evidenceNote: { fontFamily: Typography.fontFamily, color: Palette.success, fontSize: 12, fontWeight: '700', lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  footer: { width: '100%', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: Palette.border, shadowColor: '#0B1838', shadowOpacity: .06, shadowRadius: 14, shadowOffset: { width: 0, height: -4 }, elevation: 5 },
  footerInner: { width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  prevButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 4 },
  prevText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  nextButton: { flex: 1, minHeight: 54, borderRadius: 16, backgroundColor: Palette.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Palette.primary, shadowOpacity: .22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  replayRow: { width: '100%', flexDirection: 'row-reverse', gap: 10, justifyContent: 'center', marginTop: 14 },
  replayButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  replayText: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  nextButtonDisabled: { opacity: .45 },
  nextText: { fontFamily: Typography.fontFamily, fontSize: 15, fontWeight: '900', color: '#FFFFFF', writingDirection: 'rtl' },
});
