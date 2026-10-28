import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from '@/lib/narration';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
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
import Square from 'lucide-react-native/dist/esm/icons/square';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { COURSE_LEVELS, getSentenceLesson, SENTENCE_LESSONS } from '@/lib/courseContent';
import { completeSentenceLesson } from '@/lib/courseProgress';
import { evaluateSpokenSentence, type SpeechEvaluation } from '@/lib/speechPractice';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { toPersianDigits } from '@/lib/format';

import { LessonNarrator } from '@/components/LessonNarrator';
import { EnglishLessonEvidence } from '@/components/EnglishLessonEvidence';
import { EnglishSentenceBuilder } from '@/components/EnglishSentenceBuilder';
import { EnglishDialoguePractice } from '@/components/EnglishDialoguePractice';
import { ENGLISH_ENGINE_STEPS, getLessonPatterns, getLessonVocabulary } from '@/lib/englishLearningEngine';
import { ENGLISH_LEVEL_GRADIENTS } from '@/components/EnglishUI';
import { PageNavigation } from '@/components/PageNavigation';

import { loadStudy, saveLessonSession, freshSession } from '@/lib/englishStudyState';
import { loadSupplement } from '@/lib/englishSupplement/progress';
import { CORE_LESSON_EVIDENCE, isCoreLessonEvidenceComplete } from '@/lib/englishFoundationEvidence';
import { useEnglishStudyTimer } from '@/components/useEnglishStudyTimer';
import { PAID_AI_ENABLED, PAID_AI_DISABLED_MESSAGE } from '@/lib/paidAI';
import { narrate, stopNarration } from '@/lib/narrator/engine';

const stages = ENGLISH_ENGINE_STEPS;
const NORMAL_SPEECH_RATE = 0.85;
const SLOW_SPEECH_RATE = 0.5;

export default function SentenceLessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getSentenceLesson(id || '') ?? SENTENCE_LESSONS[0];
  const courseLevel = COURSE_LEVELS.find(item => item.id === lesson.levelId) ?? COURSE_LEVELS[0];
  const [evidencePassed, setEvidencePassed] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState(0);
  const progressPercent = Math.round(((stage + 1) / stages.length) * 100);

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionReady,setSessionReady]=useState(false);
  const [invalidLesson,setInvalidLesson]=useState(false);
  const [sessionError,setSessionError]=useState('');
  const completing=useRef(false);
  const loadedLesson=useRef<string|null>(null);
  const timer=useEnglishStudyTimer(sessionReady && !!getSentenceLesson(id || ''));
  useEffect(() => {
    let alive = true;
    loadedLesson.current = null;
    setSessionReady(false);
    setInvalidLesson(!!id && !getSentenceLesson(id));
    if (id && !getSentenceLesson(id)) return;

    void loadStudy().then(async state => {
      if (!alive) return;
      const saved = state.sessions[lesson.id] ?? freshSession();
      setStage(saved.stage);
      setSentenceIndex(Math.min(saved.sentenceIndex, lesson.sentences.length - 1));
      setRevealed(saved.revealed);

      if (CORE_LESSON_EVIDENCE[lesson.id]) {
        setEvidencePassed(isCoreLessonEvidenceComplete(lesson.id, state.lessonEvidence[lesson.id] ?? {}));
      } else {
        const proof = await loadSupplement();
        if (!alive) return;
        setEvidencePassed(saved.evidencePassed
          && !!proof.evidence[`legacy-${lesson.id}-listening`]?.correct
          && !!proof.evidence[`legacy-${lesson.id}-listening`]?.heard
          && !!proof.evidence[`legacy-${lesson.id}-writing`]?.correct);
      }

      loadedLesson.current = lesson.id;
      setSessionReady(true);
    }).catch(() => {
      if (alive) setSessionError('جلسه قبلی خوانده نشد؛ برای حفظ اطلاعات، ذخیره متوقف است. صفحه را دوباره باز کنید.');
    });
    return () => { alive = false; void Speech.stop(); };
  }, [lesson.id, lesson.levelId, lesson.sentences.length, id]);
  useEffect(()=>{if(sessionReady&&loadedLesson.current===lesson.id&&!completing.current)void saveLessonSession(lesson.id,{stage,sentenceIndex,revealed,evidencePassed}).then(()=>setSessionError('')).catch(()=>setSessionError('جلسه ذخیره نشد؛ دوباره یکی از کنترل‌های درس را بزنید تا ذخیره تکرار شود.'));},[lesson.id,sessionReady,stage,sentenceIndex,revealed,evidencePassed]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [evaluatingSpeech, setEvaluatingSpeech] = useState(false);
  const [speechResult, setSpeechResult] = useState<SpeechEvaluation | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const current = lesson.sentences[sentenceIndex];
  const vocabulary = getLessonVocabulary(lesson);
  const grammarPatterns = getLessonPatterns(lesson);

  const speak = (text: string, rate?: number) => {
    void narrate(text, 'en-US', { speed: rate !== undefined && rate < 0.7 ? 'slow' : 'normal' });
  };

  const startSpeechPractice = async () => {
    if (!PAID_AI_ENABLED) { setSpeechError(PAID_AI_DISABLED_MESSAGE); return; }
    try {
      setSpeechError(null);
      setSpeechResult(null);
      Speech.stop();
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setSpeechError('برای تمرین گفتاری، اجازه استفاده از میکروفن را فعال کنید.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setSpeechError('ضبط صدا شروع نشد. دوباره تلاش کنید.');
    }
  };

  const stopAndEvaluateSpeech = async () => {
    if (!PAID_AI_ENABLED) { setSpeechError(PAID_AI_DISABLED_MESSAGE); return; }
    if (!recorderState.isRecording || evaluatingSpeech) return;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error('Recording URI is missing');
      setEvaluatingSpeech(true);
      setSpeechError(null);
      setSpeechResult(await evaluateSpokenSentence(recorder.uri, current.en));
    } catch (cause) {
      setSpeechError(cause instanceof Error && cause.message !== 'Recording URI is missing' ? cause.message : 'صدای شما بررسی نشد. دوباره تلاش کنید.');
    } finally {
      setEvaluatingSpeech(false);
    }
  };

  const selectListeningSentence = (index: number) => {
    if (recorderState.isRecording || evaluatingSpeech) return;
    setSentenceIndex(index);
    setSpeechResult(null);
    setSpeechError(null);
    speak(lesson.sentences[index].en);
  };

  const lessonIndex = SENTENCE_LESSONS.findIndex(item => item.id === lesson.id);
  const firstLesson = SENTENCE_LESSONS[0];
  const prevLesson = lessonIndex > 0 ? SENTENCE_LESSONS[lessonIndex - 1] : undefined;
  const canGoBackInSentence = (stage === 1 || stage === 3 || stage === 4) && sentenceIndex > 0;
  const canGoBack = canGoBackInSentence || stage > 0 || Boolean(prevLesson);
  const previousLabel = canGoBackInSentence
    ? 'جملهٔ قبلی'
    : stage > 0
      ? 'مرحلهٔ قبلی'
      : 'درس قبلی';

  const restartCurrentLesson = () => {
    if (recorderState.isRecording || evaluatingSpeech || saving) return;
    stopNarration();
    void Speech.stop();
    setStage(0);
    setSentenceIndex(0);
    setRevealed(false);
    setSpeechResult(null);
    setSpeechError(null);
  };

  const goToFirstLesson = () => {
    if (recorderState.isRecording || evaluatingSpeech || saving) return;
    stopNarration();
    void Speech.stop();
    void saveLessonSession(firstLesson.id, freshSession()).catch(() => undefined).finally(() => {
      if (lesson.id === firstLesson.id) {
        restartCurrentLesson();
      } else {
        router.replace({ pathname: '/course/lesson', params: { id: firstLesson.id } } as never);
      }
    });
  };

  const previous = () => {
    if (!sessionReady || sessionError || completing.current || saving || recorderState.isRecording || evaluatingSpeech) return;
    stopNarration();
    void Speech.stop();
    setSpeechResult(null);
    setSpeechError(null);
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
      router.replace({ pathname: '/course/lesson', params: { id: prevLesson.id } } as never);
    }
  };

  const next = async () => {
    if (!sessionReady || sessionError || completing.current) return;
    if (stage === 1 && sentenceIndex < lesson.sentences.length - 1) {
      setSentenceIndex((value) => value + 1);
      setRevealed(false);
      return;
    }
    if (stage < stages.length - 1) {
      setStage((value) => value + 1);
      setSentenceIndex(0);
      setRevealed(false);
      return;
    }
    if (!evidencePassed || saving) return;
    completing.current=true;
    setSaving(true);
    setCompletionError('');
    try {
    const index = SENTENCE_LESSONS.findIndex((item) => item.id === lesson.id);
    const nextLesson = SENTENCE_LESSONS[index + 1];
    await completeSentenceLesson(lesson.id, nextLesson?.id);
    await saveLessonSession(lesson.id,freshSession());
    router.replace(nextLesson
      ? ({ pathname: '/course/lesson', params: { id: nextLesson.id } } as never)
      : '/lang' as never);
    } catch { setCompletionError('پایان درس ذخیره نشد؛ دوباره تلاش کنید.'); }
    finally { completing.current=false; setSaving(false); }
  };

  if (invalidLesson) return <View style={styles.root}><PageNavigation backFallback="/lang/library" /><Text style={styles.stageDesc}>درس پیدا نشد.</Text><Pressable accessibilityRole="button" onPress={()=>router.replace('/lang/library' as never)}><Text style={styles.stageTitle}>فهرست درس‌ها</Text></Pressable></View>;
  if (!sessionReady) return <View style={styles.root}><PageNavigation backFallback="/lang" /><Text style={styles.stageDesc}>{sessionError || 'در حال بازیابی جلسه…'}</Text></View>;
  return (
    <View style={styles.root} onTouchStart={timer.interact}>
      <LinearGradient colors={ENGLISH_LEVEL_GRADIENTS[courseLevel.id]} start={{ x: .95, y: 0 }} end={{ x: .05, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <PageNavigation tone="dark" backFallback="/lang" />
          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>LEVEL {courseLevel.id} · {courseLevel.title.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.headerSub}>{stages[stage].labelFa} · مرحله {toPersianDigits(stage + 1)} از {toPersianDigits(stages.length)}</Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percent}>{toPersianDigits(progressPercent)}٪</Text>
            <Text style={styles.percentLabel}>پیشرفت</Text>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.headerInfoChip}><BookOpenCheck size={13} color="#D9DBFF" /><Text style={styles.headerInfoText}>مسیر اصلی جمله‌محور</Text></View>
          <Text style={styles.headerInfoText}>{toPersianDigits(lesson.sentences.length)} جملهٔ اصلی</Text>
        </View>
      </LinearGradient>
      <View style={styles.stepperCard}>
        <View style={styles.stepperHeading}>
          <View>
            <Text style={styles.stepperEyebrow}>LESSON FLOW · 09 STAGES</Text>
            <Text style={styles.stepperTitle}>جریان این درس</Text>
          </View>
          <View style={styles.stepperNow}>
            <Text style={styles.stepperNowEn}>{stages[stage].labelEn}</Text>
            <Text style={styles.stepperNowFa}>{stages[stage].labelFa}</Text>
          </View>
        </View>
        <View style={styles.stepSegments}>
          {stages.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.labelFa} · مرحله ${toPersianDigits(index + 1)} از ${toPersianDigits(stages.length)}`}
              style={styles.stepSegmentBtn}
              onPress={() => {
                if (!sessionReady || sessionError || saving || recorderState.isRecording || evaluatingSpeech) return;
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
              <Pressable accessibilityRole="button" style={styles.stepperQuickPill} onPress={restartCurrentLesson}>
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
        <View style={styles.stepperEnds}><Text style={styles.stepperEndText}>Situation</Text><Text style={styles.stepperEndText}>Spaced Review</Text></View>
      </View>

      {!!(sessionError || timer.error) && <Text style={styles.speechError}>{sessionError || timer.error}</Text>}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional narrator: reads the English sentence on entry and on every new sentence. */}
        <LessonNarrator
          locale="en-US"
          text={current.en}
          enabled={stage <= 3}
          accent={Palette.primary}
          accentDeep={Palette.primaryDark}
          accentSoft={Palette.primarySoft}
        />
        {stage === 0 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><Sparkles size={30} color={Palette.warning} /></View>
            <Text style={styles.stageEyebrow}>موقعیت واقعی</Text>
            <Text style={styles.stageTitle}>{lesson.title}</Text>
            <Text style={styles.situation}>{lesson.situation}</Text>
            <View style={styles.promiseCard}>
              <Text style={styles.promiseTitle}>در پایان این درس می‌توانید:</Text>
              <Text style={styles.promiseText}>با {toPersianDigits(lesson.sentences.length)} جمله کوتاه، این موقعیت را مدیریت کنید.</Text>
            </View>
          </View>
        )}

        {stage === 1 && (
          <View style={styles.sentenceStage}>
            <Text style={styles.counter}>جمله {toPersianDigits(sentenceIndex + 1)} از {toPersianDigits(lesson.sentences.length)}</Text>
            <View style={styles.sentenceCard}>
              <Pressable accessibilityRole="button" accessibilityLabel={`پخش نمونهٔ صوتی جمله: ${current.en}`} accessibilityHint="فقط نمونهٔ گفتاری پخش می‌شود؛ میکروفن فعال نیست." style={styles.soundButton} onPress={() => speak(current.en)}>
                <Volume2 size={25} color={Colors.onColor} />
              </Pressable>
              <Text style={styles.english}>{current.en}</Text>
              <Text style={[styles.pronunciation,current.pronunciation.startsWith('/ ')&&{fontFamily:'Inter-ExtraBold',writingDirection:'ltr'}]}>{current.pronunciation}</Text>
              {lesson.order >= 89 && <Text style={styles.hint}>راهنمای واجی آمریکایی از واژه‌نامه؛ بدون تکیه و پیوند گفتار. واژه داخل کروشه آوانویسی نشده است. برای آهنگ جمله به صدا گوش دهید.</Text>}
              <View style={styles.divider} />
              <Text style={styles.persian}>{current.fa}</Text>
              {current.pattern ? <View style={styles.pattern}><Text style={styles.patternLabel}>الگو</Text><Text style={styles.patternEnglish}>{current.pattern}</Text></View> : null}
            </View>
            <View style={styles.replayRow}>
              <Pressable accessibilityRole="button" style={styles.replayButton} onPress={() => speak(current.en, SLOW_SPEECH_RATE)}><Volume2 size={17} color={Palette.primary} /><Text style={styles.replayText}>آهسته</Text></Pressable>
              <Pressable accessibilityRole="button" style={styles.replayButton} onPress={() => speak(current.en, NORMAL_SPEECH_RATE)}><Volume2 size={17} color={Palette.primary} /><Text style={styles.replayText}>معمولی</Text></Pressable>
            </View>
            <Text style={styles.hint}>برای شنیدن جمله، دکمهٔ پخش را بزنید؛ می‌توانید آهسته یا معمولی بشنوید و با صدای بلند تکرار کنید.</Text>
          </View>
        )}

        {stage === 2 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><Headphones size={34} color={Colors.primary[400]} /></View>
            <Text style={styles.stageTitle}>شنیدن جمله‌ها</Text>
            <Text style={styles.stageDesc}>هر جمله را جداگانه گوش دهید و معنی همان جمله را به یاد بیاورید. واژه‌ها همیشه کنار جملهٔ اصلی می‌مانند.</Text>
            <View style={styles.listenList}>
              {lesson.sentences.map((sentence, index) => (
                <Pressable
                  key={sentence.id}
                  accessibilityRole="button"
                  accessibilityLabel={`پخش جملهٔ ${toPersianDigits(index + 1)} از ${toPersianDigits(lesson.sentences.length)}: ${sentence.en}`}
                  style={[styles.listenRow, index === sentenceIndex && styles.listenRowActive]}
                  onPress={() => selectListeningSentence(index)}
                >
                  <View style={styles.listenNumber}><Text style={styles.listenNumberText}>{toPersianDigits(index + 1)}</Text></View>
                  <Text style={styles.listenEnglish}>{sentence.en}</Text>
                  <Volume2 size={19} color={Colors.primary[400]} />
                </Pressable>
              ))}
            </View>
            <View style={styles.shadowTip}>
              <Headphones size={18} color={Colors.primary[400]} />
              <Text style={styles.shadowText}>فعلاً فقط به صدا گوش دهید؛ مرحلهٔ بعد برای تکرار و سایه‌خوانی است.</Text>
            </View>
          </View>
        )}

        {stage === 3 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><Mic2 size={34} color={Colors.success[400]} /></View>
            <Text style={styles.stageTitle}>سایه‌خوانی · Shadowing</Text>
            <Text style={styles.stageDesc}>یک جمله را پخش کنید، مکث کنید و با همان آهنگ تکرار کنید. این تمرین بدون ضبط صدا هم کامل است.</Text>
            <View style={styles.speechPractice}>
              <Text style={styles.speechTitle}>جملهٔ انتخاب‌شده</Text>
              <Text style={styles.speechSentence}>{current.en}</Text>
              <Pressable accessibilityRole="button" style={styles.recordButton} onPress={() => speak(current.en, 0.5)}>
                <Volume2 size={18} color={Colors.onColor} /><Text style={styles.recordButtonText}>پخش آهستهٔ نمونه</Text>
              </Pressable>
              <Text style={styles.speechHint}>{recorderState.isRecording ? `در حال ضبط · ${toPersianDigits(Math.max(1, Math.round(recorderState.durationMillis / 1000)))} ثانیه` : evaluatingSpeech ? 'در حال بررسی…' : PAID_AI_ENABLED ? 'در صورت فعال‌بودن سرویس، می‌توانید ضبط و بررسی آنلاین را هم انتخاب کنید.' : 'میکروفن و ارسال آنلاین در حالت بدون هزینه غیرفعال‌اند؛ جمله را با صدای بلند تکرار کنید.'}</Text>
              <Pressable accessibilityRole="button"
                accessibilityLabel={PAID_AI_ENABLED ? recorderState.isRecording ? 'توقف ضبط و بررسی آنلاین جمله' : 'شروع ضبط اختیاری جمله' : 'ضبط و بررسی آنلاین گفتار غیرفعال است'}
                accessibilityHint={!PAID_AI_ENABLED ? PAID_AI_DISABLED_MESSAGE : 'در صورت فعال‌سازی و رضایت جداگانه، صدا برای بررسی فرستاده می‌شود.'}
                accessibilityState={{ disabled: !PAID_AI_ENABLED || evaluatingSpeech }}
                disabled={!PAID_AI_ENABLED || evaluatingSpeech}
                style={[styles.recordButton, recorderState.isRecording && styles.recordButtonActive, (!PAID_AI_ENABLED || evaluatingSpeech) && styles.recordButtonDisabled]}
                onPress={() => recorderState.isRecording ? void stopAndEvaluateSpeech() : void startSpeechPractice()}
              >
                {evaluatingSpeech ? <Text style={styles.recordButtonText}>در حال بررسی…</Text> : recorderState.isRecording ? <><Square size={17} color={Colors.onColor} fill={Colors.onColor} /><Text style={styles.recordButtonText}>توقف و بررسی</Text></> : <><Mic2 size={19} color={Colors.onColor} /><Text style={styles.recordButtonText}>{PAID_AI_ENABLED ? 'شروع ضبط اختیاری' : 'ضبط آنلاین غیرفعال'}</Text></>}
              </Pressable>
              {speechResult ? (
                <View style={styles.speechResult}>
                  <View style={styles.scoreRow}><Text style={styles.scoreLabel}>شباهت متن تشخیص‌داده‌شده</Text><Text style={styles.scoreValue}>{toPersianDigits(speechResult.score)}٪</Text></View>
                  <Text style={styles.recognizedLabel}>آنچه شنیده شد:</Text>
                  <Text style={styles.recognizedText}>{speechResult.recognized || 'صدای قابل‌تشخیصی دریافت نشد.'}</Text>
                  <Text style={styles.feedbackText}>{speechResult.feedbackFa}</Text>
                  {speechResult.missingWords.length ? <Text style={styles.missingWords}>دوباره تمرین کنید: {speechResult.missingWords.join(' · ')}</Text> : null}
                </View>
              ) : null}
              {speechError ? <Text style={styles.speechError}>{speechError}</Text> : null}
            </View>
            <View style={styles.sentenceStepRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: sentenceIndex === 0 }}
                disabled={sentenceIndex === 0}
                style={[styles.sentenceStepBtn, sentenceIndex === 0 && styles.sentenceStepBtnDisabled]}
                onPress={() => selectListeningSentence(Math.max(0, sentenceIndex - 1))}
              >
                <ChevronRight size={16} color={Palette.primaryDark} />
                <Text style={styles.sentenceStepText}>جملهٔ قبلی</Text>
              </Pressable>
              <Text style={styles.sentenceStepCounter}>
                جمله {toPersianDigits(sentenceIndex + 1)} از {toPersianDigits(lesson.sentences.length)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: sentenceIndex >= lesson.sentences.length - 1 }}
                disabled={sentenceIndex >= lesson.sentences.length - 1}
                style={[styles.sentenceStepBtn, sentenceIndex >= lesson.sentences.length - 1 && styles.sentenceStepBtnDisabled]}
                onPress={() => selectListeningSentence(Math.min(lesson.sentences.length - 1, sentenceIndex + 1))}
              >
                <Text style={styles.sentenceStepText}>جملهٔ بعدی</Text>
                <ChevronLeft size={16} color={Palette.primaryDark} />
              </Pressable>
            </View>
            <View style={styles.dots}>
              {lesson.sentences.map((sentence, index) => (
                <Pressable key={sentence.id} accessibilityRole="button" accessibilityLabel={`جمله ${index + 1}`} onPress={() => selectListeningSentence(index)} style={[styles.dot, index === sentenceIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {stage === 4 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><RotateCcw size={33} color={Colors.success[400]} /></View>
            <Text style={styles.stageTitle}>ساخت جمله</Text>
            <Text style={styles.stageDesc}>معنی جمله را بخوانید و واژه‌های همان جمله را به ترتیب بچینید.</Text>
            <EnglishSentenceBuilder key={current.id} sentence={current} />
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
                جمله {toPersianDigits(sentenceIndex + 1)} از {toPersianDigits(lesson.sentences.length)}
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
            <View style={styles.dots}>
              {lesson.sentences.map((sentence, index) => (
                <Pressable key={sentence.id} accessibilityRole="button" accessibilityLabel={`جمله ${index + 1}`} onPress={() => setSentenceIndex(index)} style={[styles.dot, index === sentenceIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {stage === 5 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><Sparkles size={34} color={Colors.warning[400]} /></View>
            <Text style={styles.stageTitle}>واژگان از دل جمله‌ها</Text>
            <Text style={styles.stageDesc}>هر واژه در کنار معنی و همان جمله‌ای دیده می‌شود که از آن آمده است.</Text>
            <View style={styles.vocabList}>
              {vocabulary.map(item => (
                <View key={item.word} style={styles.vocabCard}>
                  <View style={styles.vocabTop}>
                    <Text style={styles.vocabWord}>{item.word}</Text>
                    <Text style={styles.vocabMeaning}>{item.meaning}</Text>
                  </View>
                  <Text style={styles.vocabExample}>{item.exampleEn}</Text>
                  <Text style={styles.bubbleFa}>{item.exampleFa}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {stage === 6 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><BookOpenCheck size={33} color={Colors.primary[400]} /></View>
            <Text style={styles.stageTitle}>Grammar Through Usage · دستور در کاربرد</Text>
            <Text style={styles.stageDesc}>الگوها فقط از جمله‌های ثبت‌شدهٔ همین درس نمایش داده می‌شوند؛ قاعده یا مثال تازه‌ای به محتوا اضافه نشده است.</Text>
            {grammarPatterns.length ? grammarPatterns.map(item => (
              <View key={item.sentenceId} style={styles.vocabCard}>
                <Text style={styles.patternEnglish}>{item.pattern}</Text>
                <Text style={styles.vocabExample}>{item.exampleEn}</Text>
                <Text style={styles.bubbleFa}>{item.exampleFa}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن جمله: ${item.exampleEn}`} onPress={() => speak(item.exampleEn)} style={styles.bubbleSound}>
                  <Volume2 size={16} color={Colors.primary[400]} />
                </Pressable>
              </View>
            )) : <View style={styles.promiseCard}>
              <Text style={styles.promiseTitle}>یادگیری در بافت جمله</Text>
              <Text style={styles.promiseText}>برای این درس الگوی دستوری جداگانه‌ای ثبت نشده است؛ جملهٔ اصلی را بشنوید و ساختارش را در کاربرد واقعی ببینید.</Text>
            </View>}
          </View>
        )}

        {stage === 7 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><MessageCircle size={34} color={Colors.accent[400]} /></View>
            <Text style={styles.stageTitle}>Conversation Practice · مکالمهٔ هدایت‌شده</Text>
            <Text style={styles.stageDesc}>فعلاً به‌جای سرویس AI آنلاین، از گفت‌وگوی همین درس به شکل تمرین نقش‌آفرینی رایگان استفاده کنید.</Text>
            <EnglishDialoguePractice key={lesson.id} dialogue={lesson.dialogue} />
          </View>
        )}

        {stage === 8 && (
          <View style={styles.centerStage}>
            <View style={styles.bigIcon}><RefreshCw size={33} color={Colors.success[400]} /></View>
            <Text style={styles.stageTitle}>مرور فاصله‌دار</Text>
            <Text style={styles.stageDesc}>با ثبت پایان درس، جمله‌ها و واژه‌های وابسته به آن وارد برنامهٔ مرور می‌شوند؛ مرور بر اساس پاسخ شما فاصله‌گذاری می‌شود.</Text>
            <View style={styles.promiseCard}>
              <Text style={styles.promiseTitle}>خلاصهٔ همین درس</Text>
              <Text style={styles.promiseText}>{toPersianDigits(lesson.sentences.length)} جمله و {toPersianDigits(vocabulary.length)} واژهٔ یکتا؛ محتوا همان محتوای اصلی درس است.</Text>
            </View>
            {evidencePassed
              ? CORE_LESSON_EVIDENCE[lesson.id]
                ? <Text style={styles.stageDesc}>همهٔ {toPersianDigits(CORE_LESSON_EVIDENCE[lesson.id].length)} سنجشِ این درس با پاسخ درست ثبت شد ✓</Text>
                : <View><Text style={styles.stageDesc}>شنیداری: ثبت شد ✓</Text><Text style={styles.stageDesc}>نوشتاری: ثبت شد ✓</Text></View>
              : <EnglishLessonEvidence key={lesson.id} lesson={lesson} onPassed={() => setEvidencePassed(true)} />}
          </View>
        )}
        {!!completionError && <Text style={styles.stageDesc}>{completionError}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || !!sessionError }}
              disabled={saving || !!sessionError}
              style={[styles.prevButton, (saving || !!sessionError) && { opacity: .45 }]}
              onPress={previous}
            >
              <ChevronRight size={18} color={Palette.primaryDark} />
              <Text style={styles.prevText}>{previousLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || !!sessionError || (stage === stages.length - 1 && !evidencePassed) }} disabled={saving || !!sessionError || (stage === stages.length - 1 && !evidencePassed)} style={[styles.nextButton, (saving || (stage === stages.length - 1 && !evidencePassed)) && { opacity: .45 }]} onPress={() => void next()}>
            <Text style={styles.nextText}>{stage === stages.length - 1 ? 'پایان درس' : stage === 1 && sentenceIndex < lesson.sentences.length - 1 ? 'جمله بعدی' : 'ادامه'}</Text>
            {stage === stages.length - 1 ? <Check size={20} color={Colors.onColor} /> : <ChevronLeft size={20} color={Colors.onColor} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.canvas },
  header: { width: '100%', paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16, gap: 10, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, shadowColor: '#091533', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  headerTop: { width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  headerEyebrow: { fontFamily: 'Inter-ExtraBold', color: '#F6D992', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, writingDirection: 'ltr' },
  headerTitle: { fontFamily: Typography.fontFamily, fontSize: 19, lineHeight: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl' },
  headerSub: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.84)', textAlign: 'right', writingDirection: 'rtl' },
  percentBadge: { minWidth: 52, height: 44, paddingHorizontal: 10, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  percent: { fontFamily: Typography.fontFamily, fontSize: 14, lineHeight: 18, fontWeight: '900', color: '#FFFFFF', writingDirection: 'rtl' },
  percentLabel: { display: 'none', fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '400', writingDirection: 'rtl' },
  headerBottom: { display: 'none', width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  headerInfoChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  headerInfoText: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '400', writingDirection: 'rtl' },
  stepperCard: { width: '94%', maxWidth: 840, alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, gap: 8, shadowColor: '#0B1838', shadowOpacity: .045, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  stepperHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stepperEyebrow: { display: 'none', fontFamily: 'Inter-ExtraBold', color: Palette.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1, writingDirection: 'ltr' },
  stepperTitle: { fontFamily: Typography.fontFamily, fontSize: 12.5, lineHeight: 18, fontWeight: '800', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  stepperNow: { alignItems: 'flex-end', gap: 1 },
  stepperNowEn: { display: 'none', fontFamily: 'Inter-ExtraBold', color: Palette.primaryDark, fontSize: 9, fontWeight: '800', writingDirection: 'ltr' },
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
  stepperEnds: { display: 'none', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  stepperEndText: { fontFamily: 'Inter-ExtraBold', color: Palette.muted, fontSize: 8, fontWeight: '800', writingDirection: 'ltr' },
  content: { width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, gap: 14 },
  centerStage: { alignItems: 'center', width: '100%' },
  bigIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: Palette.primarySoft, borderWidth: 1, borderColor: '#D6E4FF', alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  stageEyebrow: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '800', color: Palette.primary, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  stageTitle: { fontFamily: Typography.fontFamily, fontSize: 23, lineHeight: 34, fontWeight: '900', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  stageDesc: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 23, marginTop: 6 },
  situation: { fontFamily: Typography.fontFamily, fontSize: 15, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 27, marginTop: 10 },
  promiseCard: { width: '100%', borderRadius: 20, backgroundColor: Palette.primarySoft, borderWidth: 1, borderColor: '#D6E4FF', padding: 18, marginTop: 18 },
  promiseTitle: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl' },
  promiseText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '500', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', lineHeight: 23, marginTop: 5 },
  sentenceStage: { alignItems: 'center', paddingTop: 10, width: '100%' },
  counter: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: Palette.muted, marginBottom: 10, alignSelf: 'flex-end', textAlign: 'right', writingDirection: 'rtl' },
  sentenceCard: { width: '100%', borderRadius: 24, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 24, alignItems: 'center', shadowColor: '#0B1838', shadowOpacity: 0.055, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  replayRow: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginTop: 14 },
  replayButton: { minHeight: 44, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 18, borderRadius: 999, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  replayText: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  soundButton: { width: 56, height: 56, borderRadius: 20, backgroundColor: Palette.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: Palette.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  english: { fontFamily: 'Inter-ExtraBold', width: '100%', fontSize: 23, lineHeight: 34, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  pronunciation: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: '600', color: Palette.primaryDark, textAlign: 'center', writingDirection: 'rtl', marginTop: 10 },
  divider: { width: '100%', height: 1, backgroundColor: Palette.border, marginVertical: 18 },
  persian: { fontFamily: Typography.fontFamily, fontSize: 17, fontWeight: '700', lineHeight: 28, color: Palette.ink, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  pattern: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8, alignSelf: 'flex-end', backgroundColor: Palette.warningSoft, borderWidth: 1, borderColor: '#F1DFB6', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginTop: 14 },
  patternLabel: { fontFamily: Typography.fontFamily, fontSize: 11.5, fontWeight: '800', color: Palette.warning, writingDirection: 'rtl' },
  patternEnglish: { fontFamily: 'Inter-ExtraBold', fontSize: 12.5, fontWeight: '800', color: Palette.warning, textAlign: 'left', writingDirection: 'ltr' },
  hint: { display: 'none', fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs + 2, fontWeight: '400', color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, marginTop: Spacing.md },
  listenList: { width: '100%', gap: 10, marginTop: 18 },
  listenRow: { minHeight: 62, borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  listenRowActive: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  listenNumber: { width: 32, height: 32, borderRadius: 12, backgroundColor: Palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listenNumberText: { fontFamily: Typography.numberFontFamily, fontSize: 12, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  listenEnglish: { fontFamily: 'Inter-ExtraBold', flex: 1, fontSize: 15, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  speechPractice: { width: '100%', borderRadius: 24, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 20, alignItems: 'center', marginTop: 16, shadowColor: '#0B1838', shadowOpacity: 0.045, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  speechTitle: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch' },
  speechSentence: { fontFamily: 'Inter-ExtraBold', width: '100%', fontSize: 19, lineHeight: 29, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr', marginTop: 10 },
  speechHint: { display: 'none', fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs + 2, fontWeight: '400', color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 19, marginTop: 6 },
  recordButton: { minHeight: 48, minWidth: 170, borderRadius: 14, paddingHorizontal: 18, backgroundColor: Palette.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  recordButtonActive: { backgroundColor: Palette.danger },
  recordButtonDisabled: { opacity: .48 },
  recordButtonText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Colors.onColor, writingDirection: 'rtl' },
  speechResult: { width: '100%', borderRadius: 16, backgroundColor: Palette.successSoft, borderWidth: 1, borderColor: '#BBF7D0', padding: 14, marginTop: 14 },
  scoreRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  scoreLabel: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: Palette.muted, textAlign: 'right', writingDirection: 'rtl' },
  scoreValue: { fontFamily: Typography.numberFontFamily, fontSize: 18, fontWeight: '900', color: Palette.success, writingDirection: 'rtl' },
  recognizedLabel: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  recognizedText: { fontFamily: 'Inter-ExtraBold', fontSize: 15, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr', marginTop: 3 },
  feedbackText: { fontFamily: Typography.fontFamily, fontSize: 12.5, fontWeight: '700', color: Palette.success, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20, marginTop: 8 },
  missingWords: { fontFamily: 'Inter-ExtraBold', fontSize: 12, fontWeight: '800', color: Palette.warning, textAlign: 'left', writingDirection: 'ltr', marginTop: 8 },
  speechError: { fontFamily: Typography.fontFamily, fontSize: 12.5, fontWeight: '700', color: Palette.danger, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20, marginTop: 8 },
  shadowTip: { display: 'none', width: '100%', marginTop: Spacing.md, borderRadius: Radius.lg, backgroundColor: Palette.warningSoft, padding: Spacing.md, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  shadowText: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs + 2, fontWeight: '400', color: Palette.text, textAlign: 'right', writingDirection: 'rtl', lineHeight: 19 },
  practiceCard: { width: '100%', minHeight: 230, borderRadius: 24, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 24, marginTop: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1838', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  practiceFa: { fontFamily: Typography.fontFamily, fontSize: 20, fontWeight: '800', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', lineHeight: 32 },
  revealButton: { marginTop: 18, minHeight: 46, paddingHorizontal: 20, borderRadius: 999, backgroundColor: Palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  revealText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  answerBox: { marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: Palette.successSoft, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  answerText: { fontFamily: 'Inter-ExtraBold', flex: 1, fontSize: 17, fontWeight: '800', color: Palette.success, textAlign: 'left', writingDirection: 'ltr' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.border },
  dotActive: { width: 24, backgroundColor: Palette.primary },
  dialogue: { width: '100%', gap: 10, marginTop: 18 },
  bubble: { maxWidth: '88%', borderRadius: 18, padding: 15, borderWidth: 1 },
  bubblePartner: { alignSelf: 'flex-start', backgroundColor: Palette.surface, borderColor: Palette.border, borderBottomLeftRadius: 5 },
  bubbleLearner: { alignSelf: 'flex-end', backgroundColor: Palette.primarySoft, borderColor: '#CBDCFF', borderBottomRightRadius: 5 },
  bubbleSpeaker: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '800', color: Palette.primaryDark, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' },
  bubbleEn: { fontFamily: 'Inter-ExtraBold', fontSize: 16, fontWeight: '800', color: Palette.ink, lineHeight: 24, textAlign: 'left', writingDirection: 'ltr' },
  bubbleFa: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: '500', color: Palette.muted, textAlign: 'right', writingDirection: 'rtl', marginTop: 5 },
  bubbleSound: { alignSelf: 'flex-end', marginTop: 6, padding: 4 },
  vocabList: { width: '100%', gap: 10, marginTop: 18 },
  vocabCard: { width: '100%', borderRadius: 18, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, padding: 16, gap: 6, shadowColor: '#0B1838', shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  vocabTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  vocabWord: { fontFamily: 'Inter-ExtraBold', fontSize: 17, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr' },
  vocabMeaning: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, textAlign: 'right', writingDirection: 'rtl' },
  vocabExample: { fontFamily: 'Inter-ExtraBold', fontSize: 13.5, fontWeight: '800', color: Palette.text, textAlign: 'left', writingDirection: 'ltr', marginTop: 6 },
  footer: { width: '100%', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: Palette.border, shadowColor: '#0B1838', shadowOpacity: .06, shadowRadius: 14, shadowOffset: { width: 0, height: -4 }, elevation: 5 },
  footerInner: { width: '100%', maxWidth: 840, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  prevButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 4 },
  prevText: { fontFamily: Typography.fontFamily, fontSize: 13.5, fontWeight: '800', color: Palette.primaryDark, writingDirection: 'rtl' },
  nextButton: { flex: 1, minHeight: 54, borderRadius: 16, backgroundColor: Palette.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Palette.primary, shadowOpacity: .22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  nextText: { fontFamily: Typography.fontFamily, fontSize: 15, fontWeight: '900', color: Colors.onColor, writingDirection: 'rtl' },
});
