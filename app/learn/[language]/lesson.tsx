import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import Headphones from 'lucide-react-native/dist/esm/icons/headphones';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from '@/lib/narration';
import { CoursePage } from '@/components/LanguageCourseUI';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { LuxuryPalette, setLastActiveLanguage } from '@/components/luxuryTheme';
import { PageNavigation } from '@/components/PageNavigation';
import { findGermanLesson, germanProgress } from '@/lib/languages/catalog';
import { findRussianLesson, type RussianCourseLesson } from '@/lib/languages/russian';
import { findTurkishLesson } from '@/lib/languages/turkish';
import RussianLesson from '@/components/RussianLesson';
import TurkishLesson from '@/components/TurkishLesson';
import { GERMAN_SENTENCE_LESSONS } from '@/lib/languages/germanSentenceCourse';
import { GermanSentenceBuilder } from '@/components/GermanSentenceBuilder';
import { LessonNarrator } from '@/components/LessonNarrator';
import {
  clearGermanSentenceSession,
  loadGermanSentenceSession,
  saveGermanSentenceSession,
} from '@/lib/languages/germanSentenceSession';
import type { GermanSentenceStage } from '@/lib/languages/germanSentenceSession';
import type { LearningLesson } from '@/lib/languages/types';
import { toPersianDigits as fa } from '@/lib/format';
import { Typography } from '@/lib/theme';
import { narrate, stopNarration } from '@/lib/narrator/engine';

const stages = ['موقعیت', 'جمله‌ها', 'شنیدن', 'جمله‌سازی', 'مکالمه', 'لغات'];
const PAGE_SIZE = 5;
const NORMAL_SPEECH_RATE = 0.85;
const SLOW_SPEECH_RATE = 0.5;

export default function LanguageLessonRoute() {
  const { language, id } = useLocalSearchParams<{ language: string; id: string }>();
  const lesson =
    language === 'de'
      ? findGermanLesson(id)
      : language === 'ru'
        ? findRussianLesson(id)
        : language === 'tr'
          ? findTurkishLesson(id)
          : undefined;
  if (!lesson) {
    return (
      <CoursePage title="درس پیدا نشد" subtitle="از صفحه انتخاب زبان، یک درس معتبر باز کنید.">
        {null}
      </CoursePage>
    );
  }
  if (language === 'ru') {
    return <RussianLesson key={lesson.id} lesson={lesson as RussianCourseLesson} />;
  }
  if (language === 'tr') {
    return <TurkishLesson key={lesson.id} lesson={lesson as Parameters<typeof TurkishLesson>[0]['lesson']} />;
  }
  return <GermanLesson key={lesson.id} lesson={lesson} />;
}

function GermanLesson({ lesson }: { lesson: LearningLesson }) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [stage, setStage] = useState(0);
  // Sentence index in the sentence and build stages; page index in listening and vocabulary.
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'unavailable' | 'unsaved'>('loading');
  const [sessionRestoreError, setSessionRestoreError] = useState('');
  const [sessionSaveState, setSessionSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [sessionSaveError, setSessionSaveError] = useState('');
  const [resumed, setResumed] = useState(false);
  const [restoreRetry, setRestoreRetry] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const current = lesson.sentences[index] ?? lesson.sentences[0];
  const pageCount = Math.ceil(lesson.sentences.length / PAGE_SIZE);
  const pageStart = index * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, lesson.sentences.length);
  const pageSentences = lesson.sentences.slice(pageStart, pageEnd);
  const pagedStage = lesson.sentences.length > PAGE_SIZE && (stage === 2 || stage === 5);
  const sentenceStage = stage === 1 || stage === 3;
  const progressPercent = Math.round(((stage + 1) / stages.length) * 100);

  useEffect(() => {
    setLastActiveLanguage('de');
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stage, index]);

  useEffect(() => {
    let active = true;
    setSessionState('loading');
    setSessionRestoreError('');
    void loadGermanSentenceSession(lesson.id)
      .then(saved => {
        if (!active) return;
        if (saved) {
          setStage(saved.stage);
          setIndex(saved.index);
          setResumed(true);
        } else {
          setStage(0);
          setIndex(0);
          setResumed(false);
        }
        setSessionSaveState('idle');
        setSessionSaveError('');
        setSessionState('ready');
      })
      .catch(() => {
        if (!active) return;
        setSessionRestoreError(
          'جلسهٔ قبلی بازیابی نشد. پیش‌نویس موجود را خودکار پاک یا بازنویسی نمی‌کنیم. می‌توانید دوباره تلاش کنید یا این درس را بدون بازیابی ادامه دهید.',
        );
        setSessionState('unavailable');
      });
    return () => {
      active = false;
    };
  }, [lesson.id, restoreRetry]);

  useEffect(() => {
    if (sessionState !== 'ready' || finishing) return;
    let active = true;
    setSessionSaveState('saving');
    void saveGermanSentenceSession({
      schemaVersion: 1,
      lessonId: lesson.id,
      stage: stage as GermanSentenceStage,
      index,
      updatedAt: new Date().toISOString(),
    })
      .then(() => {
        if (!active) return;
        setSessionSaveState('saved');
        setSessionSaveError('');
      })
      .catch(() => {
        if (!active) return;
        setSessionSaveState('error');
        setSessionSaveError(
          'محل درس ذخیره نشد؛ اگر از صفحه خارج شوید، ممکن است مجبور شوید از بخش قبلی ادامه دهید.',
        );
      });
    return () => {
      active = false;
    };
  }, [sessionState, lesson.id, stage, index, finishing]);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  const speak = (text: string, rate = NORMAL_SPEECH_RATE) => {
    setError('');
    void narrate(text, 'de-DE', { speed: rate < 0.7 ? 'slow' : 'normal' }).catch(() =>
      setError('فایل صوتی تأییدشدهٔ آلمانی در دسترس نیست؛ متن درس همچنان در دسترس است.'),
    );
  };

  const lessonIndex = GERMAN_SENTENCE_LESSONS.findIndex(item => item.id === lesson.id);
  const firstLesson = GERMAN_SENTENCE_LESSONS[0];
  const prevLesson = lessonIndex > 0 ? GERMAN_SENTENCE_LESSONS[lessonIndex - 1] : undefined;
  const canGoBackInSentence = sentenceStage && index > 0;
  const canGoBackInPage = pagedStage && index > 0;
  const canGoBack = canGoBackInSentence || canGoBackInPage || stage > 0 || Boolean(prevLesson);
  const previousLabel = canGoBackInSentence
    ? 'جملهٔ قبلی'
    : canGoBackInPage
      ? 'صفحه قبل'
      : stage > 0
        ? 'مرحلهٔ قبلی'
        : 'درس قبلی';

  const previous = () => {
    if (busy || sessionState === 'loading' || sessionState === 'unavailable') return;
    stopNarration();
    void Speech.stop();
    setError('');
    if (canGoBackInSentence || canGoBackInPage) {
      setIndex(value => Math.max(0, value - 1));
      return;
    }
    if (stage > 0) {
      const targetStage = stage - 1;
      setStage(targetStage);
      if (targetStage === 1 || targetStage === 3) {
        setIndex(Math.max(0, lesson.sentences.length - 1));
      } else if (lesson.sentences.length > PAGE_SIZE && (targetStage === 2 || targetStage === 5)) {
        setIndex(Math.max(0, pageCount - 1));
      } else {
        setIndex(0);
      }
      return;
    }
    if (prevLesson) {
      router.replace({ pathname: '/learn/[language]/lesson', params: { language: 'de', id: prevLesson.id } } as never);
    }
  };

  const continueWithoutRestore = () => {
    setStage(0);
    setIndex(0);
    setResumed(false);
    setSessionState('unsaved');
    setSessionSaveState('error');
  };

  const restartFromBeginning = () => {
    stopNarration();
    void Speech.stop();
    setStage(0);
    setIndex(0);
    setResumed(false);
    setError('');
  };

  const goToFirstLesson = () => {
    if (busy) return;
    stopNarration();
    void Speech.stop();
    void clearGermanSentenceSession(firstLesson.id).catch(() => undefined).finally(() => {
      if (lesson.id === firstLesson.id) {
        restartFromBeginning();
      } else {
        router.replace({ pathname: '/learn/[language]/lesson', params: { language: 'de', id: firstLesson.id } } as never);
      }
    });
  };

  const next = async () => {
    if (busy) return;
    void Speech.stop();
    setError('');
    if (sentenceStage && index < lesson.sentences.length - 1) {
      setIndex(value => value + 1);
      return;
    }
    if (pagedStage && index < pageCount - 1) {
      setIndex(value => value + 1);
      return;
    }
    if (stage < 5) {
      setStage(value => value + 1);
      setIndex(0);
      return;
    }
    setBusy(true);
    setFinishing(true);
    try {
      const nextLesson =
        GERMAN_SENTENCE_LESSONS[GERMAN_SENTENCE_LESSONS.findIndex(item => item.id === lesson.id) + 1];
      await germanProgress.completeSentenceLesson(lesson.id, nextLesson?.id);
      try {
        await clearGermanSentenceSession(lesson.id);
      } catch {
        setSessionSaveState('error');
        setSessionSaveError('پیشرفت درس ثبت شد، اما پیش‌نویس جلسه پاک نشد.');
      }
      router.replace(
        nextLesson
          ? ({ pathname: '/learn/[language]/lesson', params: { language: 'de', id: nextLesson.id } } as never)
          : ('/learn/de' as never),
      );
    } catch {
      setError('پیشرفت ذخیره نشد. فضای ذخیره‌سازی دستگاه را بررسی و دوباره تلاش کنید.');
      setFinishing(false);
    } finally {
      setBusy(false);
    }
  };

  const nextTitle = busy
    ? 'در حال ذخیره…'
    : pagedStage && index < pageCount - 1
      ? 'صفحه بعدی'
      : stage === 5
        ? 'پایان درس'
        : sentenceStage && index < lesson.sentences.length - 1
          ? 'جمله بعدی'
          : 'ادامه';

  const footerDisabled = busy || sessionState === 'loading' || sessionState === 'unavailable';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={LuxuryPalette.heroGradient}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <PageNavigation tone="dark" backFallback="/learn/de" />
          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>DEUTSCH · SATZKURS</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {lesson.title}
            </Text>
            <Text style={styles.headerSub}>
              {stages[stage]} · مرحله {fa(stage + 1)} از {fa(stages.length)}
            </Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percent}>{fa(progressPercent)}٪</Text>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.headerInfoChip}>
            <BookOpenCheck size={13} color="#D9DBFF" />
            <Text style={styles.headerInfoText}>مسیر اصلی جمله‌محور</Text>
          </View>
          <Text style={styles.headerInfoText}>{fa(lesson.sentences.length)} جملهٔ اصلی</Text>
        </View>
      </LinearGradient>

      <View style={styles.stepperCard}>
        <View style={styles.stepperHeading}>
          <Text style={styles.stepperTitle}>جریان این درس</Text>
          <Text style={styles.stepperNowFa}>{stages[stage]}</Text>
        </View>
        <View style={styles.stepSegments}>
          {stages.map((label, stepIdx) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`${label} · مرحله ${fa(stepIdx + 1)} از ${fa(stages.length)}`}
              style={styles.stepSegmentBtn}
              onPress={() => {
                if (busy || sessionState === 'loading' || sessionState === 'unavailable') return;
                stopNarration();
                void Speech.stop();
                setStage(stepIdx);
                setIndex(0);
                setError('');
              }}
            >
              <View
                style={[
                  styles.stepSegment,
                  stepIdx <= stage && styles.stepSegmentDone,
                  stepIdx === stage && styles.stepSegmentCurrent,
                ]}
              />
            </Pressable>
          ))}
        </View>
        {(stage > 0 || index > 0 || lesson.id !== firstLesson.id) ? (
          <View style={styles.stepperQuickRow}>
            {(stage > 0 || index > 0) ? (
              <Pressable accessibilityRole="button" style={styles.stepperQuickPill} onPress={restartFromBeginning}>
                <RotateCcw size={13} color={Palette.primaryDark} />
                <Text style={styles.stepperQuickText}>از ابتدای این درس</Text>
              </Pressable>
            ) : null}
            {lesson.id !== firstLesson.id ? (
              <Pressable accessibilityRole="button" style={styles.stepperQuickPill} onPress={goToFirstLesson}>
                <RotateCcw size={13} color={Palette.primary} />
                <Text style={styles.stepperQuickText}>بازگشت به درس اول</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sessionState === 'loading' ? (
          <View style={styles.stateCard}>
            <Text style={styles.stageDesc}>در حال بازیابی محل توقف درس…</Text>
          </View>
        ) : null}

        {sessionState === 'unavailable' ? (
          <View style={styles.stateCard}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {sessionRestoreError}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.secondaryActionBtn}
              onPress={() => setRestoreRetry(value => value + 1)}
            >
              <Text style={styles.secondaryActionText}>تلاش دوباره برای بازیابی</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.primaryActionBtn}
              onPress={continueWithoutRestore}
            >
              <Text style={styles.primaryActionText}>شروع از ابتدا بدون بازنویسی پیش‌نویس قبلی</Text>
            </Pressable>
          </View>
        ) : null}

        {(sessionState === 'ready' || sessionState === 'unsaved') && (
          <>
            {/* Professional narrator: warm female German voice, automatic on the sentence stages. */}
            <LessonNarrator
              locale="de-DE"
              text={current.text}
              enabled={stage <= 2}
              accent={Palette.primary}
              accentDeep={Palette.primaryDark}
              accentSoft={Palette.primarySoft}
            />

            {resumed ? (
              <View style={styles.resumeBanner}>
                <View style={styles.resumeTextCol}>
                  <Text style={styles.resumeTitle}>ادامه از جلسهٔ ذخیره‌شده</Text>
                  <Text style={styles.resumeSub}>
                    بخش «{stages[stage]}» · مرحلهٔ {fa(stage + 1)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={styles.resumeResetBtn}
                  onPress={restartFromBeginning}
                >
                  <Text style={styles.resumeResetText}>شروع از ابتدا</Text>
                </Pressable>
              </View>
            ) : null}

            {sessionState === 'ready' && sessionSaveState !== 'idle' ? (
              <Text
                accessibilityLiveRegion="polite"
                style={sessionSaveState === 'error' ? styles.errorBanner : styles.hiddenStatus}
              >
                {sessionSaveState === 'saving'
                  ? 'در حال ذخیرهٔ محل توقف…'
                  : sessionSaveState === 'saved'
                    ? 'محل توقف درس روی همین دستگاه ذخیره شد.'
                    : sessionSaveError}
              </Text>
            ) : null}

            {sessionState === 'unsaved' ? (
              <Text style={styles.hiddenStatus}>
                درس را می‌توانید ادامه دهید، اما محل توقف این جلسه ذخیره نمی‌شود. پیشرفت پایان درس همچنان جداگانه ثبت خواهد شد.
              </Text>
            ) : null}

            {stage === 0 && (
              <View style={styles.centerStage}>
                <View style={styles.bigIcon}>
                  <Sparkles size={30} color={Palette.warning} />
                </View>
                <Text style={styles.stageEyebrow}>موقعیت واقعی</Text>
                <Text style={styles.stageTitle}>{lesson.title}</Text>
                <Text style={styles.situation}>{lesson.situation}</Text>
                <View style={styles.promiseCard}>
                  <Text style={styles.promiseTitle}>در پایان این درس می‌توانید:</Text>
                  <Text style={styles.promiseText}>
                    با {fa(lesson.sentences.length)} جمله کوتاه، این موقعیت را به آلمانی مدیریت کنید.
                  </Text>
                </View>
                {lesson.teachingFa ? (
                  <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>نکتهٔ کوتاه به فارسی</Text>
                    <Text style={styles.noteText}>{lesson.teachingFa}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {stage === 1 && (
              <View style={styles.sentenceStage}>
                <Text style={styles.counter}>
                  جمله {fa(index + 1)} از {fa(lesson.sentences.length)}
                </Text>
                <View style={styles.sentenceCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`شنیدن جملهٔ آلمانی: ${current.text}`}
                    accessibilityHint="جملهٔ این مرحله را با تلفظ آلمانی پخش می‌کند"
                    style={styles.soundButton}
                    onPress={() => speak(current.text, NORMAL_SPEECH_RATE)}
                  >
                    <Volume2 size={25} color="#FFFFFF" />
                  </Pressable>
                  <Text style={styles.germanSentence} onPress={() => speak(current.text, NORMAL_SPEECH_RATE)}>
                    {current.text}
                  </Text>
                  <Text style={styles.pronunciation}>{current.pronunciation}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.persian}>{current.fa}</Text>
                  {current.pattern ? (
                    <View style={styles.pattern}>
                      <Text style={styles.patternLabel}>الگو:</Text>
                      <Text style={styles.patternText}>{current.pattern}</Text>
                    </View>
                  ) : null}

                  {!!current.vocabulary.length && (
                    <View style={styles.inlineVocabSection}>
                      {current.vocabulary.map((word, wordIndex) => (
                        <Pressable
                          key={`${current.id}-${word.word}-${wordIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`تلفظ واژه آلمانی: ${word.word}`}
                          style={styles.inlineVocabRow}
                          onPress={() => speak(word.word, NORMAL_SPEECH_RATE)}
                        >
                          <View style={styles.inlineVocabLeft}>
                            <Volume2 size={15} color={Palette.primary} />
                            <Text style={styles.inlineVocabWord}>{word.word}</Text>
                          </View>
                          <Text style={styles.inlineVocabMeaning}>{word.meaning}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.replayRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="پخش آهستهٔ جمله"
                    style={styles.replayButton}
                    onPress={() => speak(current.text, SLOW_SPEECH_RATE)}
                  >
                    <Volume2 size={17} color={Palette.primary} />
                    <Text style={styles.replayText}>آهسته</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="پخش معمولی جمله"
                    style={styles.replayButton}
                    onPress={() => speak(current.text, NORMAL_SPEECH_RATE)}
                  >
                    <Volume2 size={17} color={Palette.primary} />
                    <Text style={styles.replayText}>معمولی</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {stage === 2 && (
              <View style={styles.centerStage}>
                <View style={styles.bigIcon}>
                  <Headphones size={30} color={Palette.primary} />
                </View>
                <Text style={styles.stageTitle}>شنیدن جمله‌ها</Text>
                <Text style={styles.stageDesc}>
                  هر جمله را جداگانه گوش دهید و با صدای خودتان تکرار کنید.
                </Text>
                {pagedStage ? (
                  <Text style={styles.pageMeta}>
                    صفحه {fa(index + 1)} از {fa(pageCount)} · جمله‌های {fa(pageStart + 1)} تا {fa(pageEnd)} از{' '}
                    {fa(lesson.sentences.length)}
                  </Text>
                ) : null}
                <View style={styles.listenList}>
                  {pageSentences.map((item, pageItemIndex) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`شنیدن جمله: ${item.text}`}
                      style={styles.listenRow}
                      onPress={() => speak(item.text)}
                    >
                      <View style={styles.listenNumber}>
                        <Text style={styles.listenNumberText}>{fa(pageStart + pageItemIndex + 1)}</Text>
                      </View>
                      <View style={styles.listenTextCol}>
                        <Text style={styles.listenGerman}>{item.text}</Text>
                        <Text style={styles.listenPersian}>{item.fa}</Text>
                      </View>
                      <Volume2 size={19} color={Palette.primary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {stage === 3 && (
              <View style={styles.centerStage}>
                <View style={styles.bigIcon}>
                  <RotateCcw size={30} color={Palette.success} />
                </View>
                <Text style={styles.stageTitle}>ساخت جمله</Text>
                <Text style={styles.stageDesc}>
                  جمله {fa(index + 1)} از {fa(lesson.sentences.length)} را با واژه‌های همین درس بسازید.
                </Text>
                <GermanSentenceBuilder key={current.id} sentence={current} />
                <View style={styles.dots}>
                  {lesson.sentences.map((sentence, dotIndex) => (
                    <Pressable
                      key={sentence.id}
                      accessibilityRole="button"
                      accessibilityLabel={`جمله ${fa(dotIndex + 1)}`}
                      onPress={() => setIndex(dotIndex)}
                      style={[styles.dot, dotIndex === index && styles.dotActive]}
                    />
                  ))}
                </View>
              </View>
            )}

            {stage === 4 && (
              <View style={styles.centerStage}>
                <View style={styles.bigIcon}>
                  <MessageCircle size={30} color={Palette.primary} />
                </View>
                <Text style={styles.stageTitle}>مکالمهٔ هدایت‌شده</Text>
                <Text style={styles.stageDesc}>
                  گفت‌وگوی کاربردی این موقعیت را بشنوید و نقش خود را با صدای بلند تمرین کنید.
                </Text>
                <View style={styles.dialogueList}>
                  {lesson.dialogue.map((item, itemIndex) => {
                    const isLearner = itemIndex % 2 === 1;
                    return (
                      <View
                        key={`${lesson.id}-dlg-${itemIndex}`}
                        style={[styles.bubble, isLearner ? styles.bubbleLearner : styles.bubblePartner]}
                      >
                        <View style={styles.bubbleHeader}>
                          <Text style={styles.bubbleSpeaker}>{item.speaker}</Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`شنیدن این بخش گفتگو: ${item.text}`}
                            style={styles.bubblePlayBtn}
                            onPress={() => speak(item.text)}
                          >
                            <Volume2 size={15} color={Palette.primary} />
                            <Text style={styles.bubblePlayText}>شنیدن</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.bubbleGerman}>{item.text}</Text>
                        <Text style={styles.bubblePersian}>{item.fa}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {stage === 5 && (
              <View style={styles.centerStage}>
                <View style={styles.bigIcon}>
                  <Sparkles size={30} color={Palette.warning} />
                </View>
                <Text style={styles.stageTitle}>واژگان از دل جمله‌ها</Text>
                <Text style={styles.stageDesc}>
                  واژه‌ها و حرف تعریف اسم‌ها را در کنار جملهٔ اصلی یاد بگیرید.
                </Text>
                {pagedStage ? (
                  <Text style={styles.pageMeta}>
                    صفحه {fa(index + 1)} از {fa(pageCount)} · جمله‌های {fa(pageStart + 1)} تا {fa(pageEnd)} از{' '}
                    {fa(lesson.sentences.length)}
                  </Text>
                ) : null}
                <View style={styles.vocabList}>
                  {pageSentences.map(item => (
                    <View key={item.id} style={styles.vocabCard}>
                      {item.vocabulary.map((word, wordIndex) => (
                        <Pressable
                          key={`${word.word}-${wordIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`تلفظ واژه آلمانی: ${word.word}`}
                          style={styles.vocabWordRow}
                          onPress={() => speak(word.word, NORMAL_SPEECH_RATE)}
                        >
                          <View style={styles.inlineVocabLeft}>
                            <Volume2 size={15} color={Palette.primary} />
                            <Text style={styles.vocabWord}>{word.word}</Text>
                          </View>
                          <Text style={styles.vocabMeaning}>{word.meaning}</Text>
                        </Pressable>
                      ))}
                      <View style={styles.vocabExampleWrap}>
                        <Text
                          style={styles.vocabExample}
                          onPress={() => speak(item.text, NORMAL_SPEECH_RATE)}
                        >
                          {item.text}
                        </Text>
                        <Text style={styles.vocabExampleFa}>{item.fa}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`شنیدن مثال: ${item.text}`}
                          style={styles.bubblePlayBtn}
                          onPress={() => speak(item.text)}
                        >
                          <Volume2 size={15} color={Palette.primary} />
                          <Text style={styles.bubblePlayText}>شنیدن مثال</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!error && (
              <Text accessibilityRole="alert" style={styles.errorBanner}>
                {error}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: footerDisabled }}
              disabled={footerDisabled}
              style={[styles.prevPageButton, footerDisabled && styles.nextButtonDisabled]}
              onPress={previous}
            >
              <ChevronRight size={18} color={Palette.primaryDark} />
              <Text style={styles.prevPageText}>{previousLabel}</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: footerDisabled }}
            disabled={footerDisabled}
            style={[styles.nextButton, footerDisabled && styles.nextButtonDisabled]}
            onPress={() => void next()}
          >
            <Text style={styles.nextText}>{nextTitle}</Text>
            {stage === 5 && (!pagedStage || index >= pageCount - 1) ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <ChevronLeft size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.canvas },
  header: {
    width: '100%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: '#091533',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  headerTop: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  headerText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  headerEyebrow: {
    fontFamily: 'Inter-ExtraBold',
    color: '#F6D992',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    writingDirection: 'ltr',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSub: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  percentBadge: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  percent: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  headerBottom: {
    display: 'none',
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  headerInfoChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  headerInfoText: {
    fontFamily: Typography.fontFamily,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    writingDirection: 'rtl',
  },
  stepperCard: {
    width: '94%',
    maxWidth: 840,
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 8,
    shadowColor: '#0B1838',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  stepperHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepperTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '800',
    color: Palette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stepperNowFa: {
    fontFamily: Typography.fontFamily,
    color: Palette.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  stepSegments: { flexDirection: 'row-reverse', gap: 5 },
  stepSegmentBtn: { flex: 1, paddingVertical: 4 },
  stepSegment: { width: '100%', height: 5, borderRadius: 999, backgroundColor: Palette.surfaceMuted },
  stepperQuickRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  stepperQuickPill: {
    minHeight: 32,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  stepperQuickText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  stepSegmentDone: { backgroundColor: Palette.success },
  stepSegmentCurrent: { backgroundColor: Palette.primary },
  content: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 14,
  },
  stateCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    gap: 12,
  },
  primaryActionBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryActionText: {
    fontFamily: Typography.fontFamily,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  secondaryActionBtn: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    fontFamily: Typography.fontFamily,
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  resumeBanner: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.primarySoft,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resumeTextCol: { flex: 1, alignItems: 'flex-end', gap: 2 },
  resumeTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  resumeSub: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  resumeResetBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeResetText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  hiddenStatus: { display: 'none' },
  errorBanner: {
    width: '100%',
    padding: 13,
    borderRadius: 14,
    backgroundColor: Palette.dangerSoft,
    color: Palette.danger,
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    color: Palette.danger,
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  centerStage: { alignItems: 'center', width: '100%' },
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Palette.primarySoft,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  stageEyebrow: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primary,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  stageTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 23,
    lineHeight: 34,
    fontWeight: '900',
    color: Palette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  stageDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '500',
    color: Palette.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    lineHeight: 23,
    marginTop: 6,
    marginBottom: 8,
  },
  situation: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: Palette.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    lineHeight: 27,
    marginTop: 10,
  },
  promiseCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: Palette.primarySoft,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    padding: 18,
    marginTop: 18,
    gap: 5,
  },
  promiseTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  promiseText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '500',
    color: Palette.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 23,
    marginTop: 4,
  },
  noteCard: {
    width: '100%',
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 18,
    gap: 8,
    shadowColor: '#0B1838',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  noteTitle: {
    fontFamily: Typography.fontFamily,
    color: Palette.primaryDark,
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noteText: {
    fontFamily: Typography.fontFamily,
    color: Palette.text,
    fontSize: 13,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sentenceStage: { alignItems: 'center', paddingTop: 10, width: '100%' },
  counter: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.muted,
    marginBottom: 10,
    alignSelf: 'flex-end',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sentenceCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0B1838',
    shadowOpacity: 0.055,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soundButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Palette.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  germanSentence: {
    fontFamily: 'Inter-ExtraBold',
    width: '100%',
    fontSize: 23,
    lineHeight: 34,
    fontWeight: '800',
    color: Palette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  pronunciation: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primaryDark,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  divider: { width: '100%', height: 1, backgroundColor: Palette.border, marginVertical: 18 },
  persian: {
    fontFamily: Typography.fontFamily,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 28,
    color: Palette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  pattern: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    alignSelf: 'flex-end',
    backgroundColor: Palette.warningSoft,
    borderWidth: 1,
    borderColor: '#F1DFB6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 14,
  },
  patternLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '800',
    color: Palette.warning,
    writingDirection: 'rtl',
  },
  patternText: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12.5,
    fontWeight: '800',
    color: Palette.warning,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  inlineVocabSection: {
    width: '100%',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    gap: 8,
  },
  inlineVocabRow: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inlineVocabLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  inlineVocabWord: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 14,
    fontWeight: '800',
    color: Palette.ink,
    writingDirection: 'ltr',
  },
  inlineVocabMeaning: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  replayRow: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginTop: 14 },
  replayButton: {
    minHeight: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  replayText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  pageMeta: {
    alignSelf: 'flex-end',
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  listenList: { width: '100%', gap: 10, marginTop: 14 },
  listenRow: {
    minHeight: 66,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0B1838',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  listenNumber: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: Palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenNumberText: {
    fontFamily: Typography.numberFontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  listenTextCol: { flex: 1, gap: 3 },
  listenGerman: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
    fontWeight: '800',
    color: Palette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  listenPersian: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    fontWeight: '500',
    color: Palette.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.border },
  dotActive: { width: 24, backgroundColor: Palette.primary },
  dialogueList: { width: '100%', gap: 12, marginTop: 14 },
  bubble: { width: '94%', borderRadius: 20, padding: 16, borderWidth: 1, gap: 8 },
  bubblePartner: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderBottomLeftRadius: 5,
  },
  bubbleLearner: {
    alignSelf: 'flex-end',
    backgroundColor: Palette.primarySoft,
    borderColor: '#CBDCFF',
    borderBottomRightRadius: 5,
  },
  bubbleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bubbleSpeaker: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bubblePlayBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(30,78,216,0.08)',
  },
  bubblePlayText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  bubbleGerman: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
    fontWeight: '800',
    color: Palette.ink,
    lineHeight: 25,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  bubblePersian: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '500',
    color: Palette.text,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  vocabList: { width: '100%', gap: 12, marginTop: 14 },
  vocabCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    gap: 10,
    shadowColor: '#0B1838',
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  vocabWordRow: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  vocabWord: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
    fontWeight: '800',
    color: Palette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  vocabMeaning: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  vocabExampleWrap: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    gap: 6,
    alignItems: 'flex-start',
  },
  vocabExample: {
    width: '100%',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 22,
    color: Palette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  vocabExampleFa: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    lineHeight: 20,
    color: Palette.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    shadowColor: '#0B1838',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 5,
  },
  footerInner: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  prevPageButton: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  prevPageText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    writingDirection: 'rtl',
  },
  nextButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: Palette.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Palette.primary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  nextButtonDisabled: { opacity: 0.45 },
  nextText: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
});
