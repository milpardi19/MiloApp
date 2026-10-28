import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import BookOpen from 'lucide-react-native/dist/esm/icons/book-open';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronDown from 'lucide-react-native/dist/esm/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronUp from 'lucide-react-native/dist/esm/icons/chevron-up';
import Cloud from 'lucide-react-native/dist/esm/icons/cloud';
import Compass from 'lucide-react-native/dist/esm/icons/compass';
import Download from 'lucide-react-native/dist/esm/icons/download';
import Flame from 'lucide-react-native/dist/esm/icons/flame';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import Play from 'lucide-react-native/dist/esm/icons/play';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { EnglishLevelRail, EnglishProgressTrack } from '@/components/EnglishUI';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { GermanBottomNav } from '@/components/GermanBottomNav';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { LUXURY_JOURNEY_GRADIENTS } from '@/components/luxuryHomeStyles';
import type { CourseLevelId } from '@/lib/courseContent';
import { toPersianDigits as fa } from '@/lib/format';
import {
  GERMAN_SENTENCE_LEVELS,
  GERMAN_SENTENCE_LESSONS,
  germanSentenceLevelMetrics,
  getGermanSentenceResumeLesson,
} from '@/lib/languages/germanSentenceCourse';
import { clearGermanSentenceSession, loadGermanSentenceSession } from '@/lib/languages/germanSentenceSession';
import { germanProgress } from '@/lib/languages/catalog';
import { syncPersonalLearningData } from '@/lib/personalLearningSync';
import type { CourseProgress } from '@/lib/createCourseProgressStore';
import { preloadSpeechVoices, resolveRequiredSpeechOptions } from '@/lib/speechLanguage';
import { germanHomeStyles as styles } from './germanHomeStyles';

const GERMAN_RAIL_LEVELS = GERMAN_SENTENCE_LEVELS.map((level, index) => ({
  ...level,
  color: LUXURY_JOURNEY_GRADIENTS[index]?.[0] ?? Palette.primary,
}));

export default function GermanSentenceHome() {
  const router = useRouter();
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [hasFirstLessonSession, setHasFirstLessonSession] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void preloadSpeechVoices();
    const refreshLocal = () => Promise.all([
      germanProgress.getCourseProgress(),
      germanProgress.getDueReviewCards(),
      loadGermanSentenceSession(GERMAN_SENTENCE_LESSONS[0].id).catch(() => null),
    ])
      .then(([nextProgress, due, firstSaved]) => {
        if (!alive) return;
        setProgress(nextProgress);
        setDueCount(due.length);
        setHasFirstLessonSession(Boolean(firstSaved && (firstSaved.stage > 0 || firstSaved.index > 0)));
        setError('');
      })
      .catch(() => { if (alive) setError('پیشرفت ذخیره‌شده خوانده نشد؛ درس‌ها همچنان از کتابخانه در دسترس‌اند.'); });
    void refreshLocal();
    void syncPersonalLearningData().then(result => {
      if (result.status === 'synced') return refreshLocal();
      return undefined;
    }).catch(() => undefined);
    return () => { alive = false; void Speech.stop(); };
  }, [retry]));

  const speakGerman = useCallback((text: string) => {
    if (!NARRATION_ENABLED) return;
    void Speech.stop();
    void resolveRequiredSpeechOptions('de-DE').then(targetVoice => {
      if (!targetVoice) {
        setError('صدای آلمانیِ آفلاین پیدا نشد؛ در تنظیمات گفتار دستگاه، صدای آلمانی (آلمان) را دانلود کنید و دوباره امتحان کنید.');
        return;
      }
      Speech.speak(text, { ...targetVoice, rate: 0.78 });
    });
  }, []);

  const completedIds = progress?.completedLessonIds ?? [];
  const completed = GERMAN_SENTENCE_LESSONS.filter(lesson => completedIds.includes(lesson.id)).length;
  const currentLesson = getGermanSentenceResumeLesson(progress?.currentLessonId, completedIds);
  const currentLevel = GERMAN_RAIL_LEVELS.find(level => level.id === currentLesson.levelId) ?? GERMAN_RAIL_LEVELS[0];
  const currentSentence = currentLesson.sentences[0];
  const currentMetrics = germanSentenceLevelMetrics(currentLevel.id);
  const currentCompleted = GERMAN_SENTENCE_LESSONS.filter(lesson => lesson.levelId === currentLevel.id && completedIds.includes(lesson.id)).length;
  const levelRows = GERMAN_RAIL_LEVELS.map(level => {
    const metrics = germanSentenceLevelMetrics(level.id);
    const done = GERMAN_SENTENCE_LESSONS.filter(lesson => lesson.levelId === level.id && completedIds.includes(lesson.id)).length;
    return { level, metrics, completed: done };
  });
  const levelCounts = Object.fromEntries(levelRows.map(row => [row.level.id, {
    completed: row.completed,
    total: row.metrics.lessonCount,
  }])) as Partial<Record<CourseLevelId, { completed: number; total: number }>>;
  const lessonCount = GERMAN_SENTENCE_LESSONS.length;
  const { totalSentenceCount, uniqueWordCount } = useMemo(() => ({
    totalSentenceCount: GERMAN_SENTENCE_LESSONS.reduce((count, lesson) => count + lesson.sentences.length, 0),
    uniqueWordCount: new Set(
      GERMAN_SENTENCE_LESSONS.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word))),
    ).size,
  }), []);
  const progressPercent = lessonCount ? (completed / lessonCount) * 100 : 0;
  const isCourseComplete = lessonCount > 0 && completed === lessonCount;
  const heroGradient = LUXURY_JOURNEY_GRADIENTS[currentLevel.id] ?? LUXURY_JOURNEY_GRADIENTS[0];

  const firstLesson = GERMAN_SENTENCE_LESSONS[0];
  const openLevel = (levelId: number) => router.push(`/learn/de/library?level=${levelId}` as never);
  const openLesson = (id: string) => router.push({ pathname: '/learn/[language]/lesson', params: { language: 'de', id } } as never);
  const openFirstLesson = () => {
    void clearGermanSentenceSession(firstLesson.id).catch(() => undefined).finally(() => {
      openLesson(firstLesson.id);
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <LuxuryTopBar
            language="de"
            eyebrow="DEUTSCH STUDIO"
            title="مسیر جامع آلمانی"
            backFallbackHref="/languages"
          />

          <LinearGradient colors={heroGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroOrbLarge} />
            <View pointerEvents="none" style={styles.heroOrbSmall} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroLevelBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroLevelText}>LEVEL {currentLevel.id} · {currentLevel.cefr === 'مقدماتی' ? 'PRE-A1' : currentLevel.cefr}</Text>
              </View>
              <Text style={styles.heroCourseLabel}>مسیر اصلی</Text>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{isCourseComplete ? 'همهٔ درس‌های این مسیر تکمیل شده‌اند' : 'درس بعدی شما'}</Text>
              <Text style={styles.heroTitle}>{currentLesson.title}</Text>
              <Text style={styles.heroDescription}>{currentLesson.subtitle}</Text>
            </View>

            {currentSentence ? (
              <View style={styles.sentenceShowcase}>
                <Pressable accessibilityRole="button" accessibilityLabel={`پخش تلفظ آلمانی: ${currentSentence.text}`} style={styles.sentenceShowcaseTop} onPress={() => speakGerman(currentSentence.text)}>
                  <View style={styles.sentenceLabelIcon}><Volume2 size={15} color="#FFFFFF" /></View>
                  <Text style={styles.sentenceLabel}>جملهٔ کلیدی این درس</Text>
                  <Text style={styles.sentenceLabelEn}>CORE SENTENCE</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن جمله: ${currentSentence.text}`} onPress={() => speakGerman(currentSentence.text)}>
                  <Text style={styles.sentenceGerman}>{currentSentence.text}</Text>
                </Pressable>
                <Text style={styles.sentencePersian}>{currentSentence.fa}</Text>
                {currentSentence.pattern ? (
                  <View style={styles.sentencePattern}>
                    <Text style={styles.sentencePatternLabel}>الگوی جمله‌سازی:</Text>
                    <Text style={styles.sentencePatternText}>{currentSentence.pattern}</Text>
                  </View>
                ) : null}
                {!!currentSentence.vocabulary.length && (
                  <View style={styles.wordChipRow}>
                    {currentSentence.vocabulary.map(item => (
                      <Pressable key={`${currentSentence.id}-${item.word}`} accessibilityRole="button" accessibilityLabel={`تلفظ واژه آلمانی: ${item.word}`} style={styles.wordChip} onPress={() => speakGerman(item.word)}>
                        <Text style={styles.wordChipEn}>{item.word}</Text>
                        <Text style={styles.wordChipDivider}>·</Text>
                        <Text style={styles.wordChipFa}>{item.meaning}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]} onPress={() => isCourseComplete ? router.push('/learn/de/library' as never) : openLesson(currentLesson.id)}>
                <Play size={16} color={Palette.primaryDark} fill={Palette.primaryDark} />
                <Text style={styles.continueButtonText}>{isCourseComplete ? 'مشاهدهٔ کتابخانه' : completed ? 'ادامه یادگیری' : 'شروع از پایه'}</Text>
                <ChevronLeft size={17} color={Palette.primaryDark} />
              </Pressable>
              <View style={styles.sentenceCount}>
                <Text style={styles.sentenceCountValue}>{fa(currentLesson.sentences.length)}</Text>
                <Text style={styles.sentenceCountLabel}>جملهٔ درس</Text>
              </View>
            </View>
            {(currentLesson.id !== firstLesson.id || completed > 0 || hasFirstLessonSession) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بازگشت به درس اول آلمانی"
                style={({ pressed }) => [styles.firstLessonButton, pressed && styles.buttonPressed]}
                onPress={openFirstLesson}
              >
                <RotateCcw size={15} color="#F6D992" />
                <Text style={styles.firstLessonButtonText}>
                  {currentLesson.id === firstLesson.id ? 'شروع دوباره از ابتدای درس اول' : 'بازگشت به درس اول'}
                </Text>
              </Pressable>
            ) : null}
          </LinearGradient>

          {!!error && (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}><Text style={styles.retryText}>تلاش دوباره</Text></Pressable>
            </View>
          )}

          <View style={styles.pathPanel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelEyebrow}>CURRICULUM ROADMAP</Text>
                <Text style={styles.panelTitle}>مسیر و سطح‌های یادگیری</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.libraryLink} onPress={() => router.push('/learn/de/library' as never)}>
                <Text style={styles.libraryLinkText}>کتابخانه</Text>
                <ChevronLeft size={15} color={Palette.primaryDark} />
              </Pressable>
            </View>

            <View style={styles.railWrap}>
              <EnglishLevelRail
                activeLevelId={currentLevel.id as CourseLevelId}
                counts={levelCounts}
                levels={GERMAN_RAIL_LEVELS.map((level, index) => ({ ...level, title: index === 0 ? 'مقدماتی' : level.cefr }))}
                startLabel="مقدماتی"
                accessibilityLabelPrefix="فهرست درس‌های"
                direction="rtl"
                accentColor={Palette.primary}
                successColor={Palette.success}
                activeLabelColor={Palette.primaryDark}
                numberOffset={1}
                onSelect={openLevel}
              />
            </View>

            <View style={styles.currentLevelRow}>
              <View style={styles.currentLevelCopy}>
                <Text style={styles.currentLevelEyebrow}>سطح فعلی · {currentLevel.cefr}</Text>
                <Text style={styles.currentLevelName}>{currentLevel.title}</Text>
                <Text style={styles.currentLevelDescription}>{currentLevel.description}</Text>
              </View>
              <View style={[styles.levelCountBadge, { backgroundColor: `${currentLevel.color}12`, borderColor: `${currentLevel.color}36` }]}>
                <Text style={[styles.levelCountValue, { color: currentLevel.color }]}>{fa(currentCompleted)} از {fa(currentMetrics.lessonCount)}</Text>
                <View style={styles.levelCountMeta}>
                  <View style={[styles.levelCountDot, { backgroundColor: currentLevel.color }]} />
                  <Text style={styles.levelCountLabel}>درس تکمیل‌شده</Text>
                </View>
              </View>
            </View>
            <EnglishProgressTrack value={currentMetrics.lessonCount ? (currentCompleted / currentMetrics.lessonCount) * 100 : 0} color={currentLevel.color} trackColor={Palette.border} />

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showRoadmap }} style={styles.mapToggle} onPress={() => setShowRoadmap(value => !value)}>
              <View style={styles.mapToggleIcon}><Compass size={16} color={Palette.primary} /></View>
              <View style={styles.mapToggleText}>
                <Text style={styles.mapToggleTitle}>{showRoadmap ? 'بستن نقشهٔ کامل سطح‌ها' : 'نمایش نقشهٔ کامل سطح‌ها'}</Text>
                <Text style={styles.mapToggleMeta}>{currentLevel.modules.slice(0, 3).join(' · ')}</Text>
              </View>
              {showRoadmap ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.primary} />}
            </Pressable>

            {showRoadmap ? (
              <View style={styles.fullRoadmap}>
                {levelRows.map(row => {
                  const color = row.level.color;
                  const isComplete = row.metrics.lessonCount > 0 && row.completed === row.metrics.lessonCount;
                  return (
                    <Pressable key={row.level.id} accessibilityRole="button" accessibilityLabel={`فهرست درس‌های ${row.level.cefr}`} style={({ pressed }) => [styles.levelCard, row.level.id === currentLevel.id && styles.levelCardActive, pressed && styles.buttonPressed]} onPress={() => openLevel(row.level.id)}>
                      <View style={[styles.levelNumber, { backgroundColor: `${color}16` }]}>
                        {isComplete ? <Check size={18} color={color} strokeWidth={2.6} /> : <Text style={[styles.levelNumberText, { color }]}>{fa(row.level.id)}</Text>}
                      </View>
                      <View style={styles.levelText}>
                        <View style={styles.levelTitleRow}>
                          <Text style={styles.levelTitle}>{row.level.title}</Text>
                          <Text style={[styles.levelCefr, { color }]}>{row.level.cefr}</Text>
                        </View>
                        <Text style={styles.levelDesc} numberOfLines={2}>{row.level.description}</Text>
                        <Text style={styles.levelStats}>{fa(row.completed)} از {fa(row.metrics.lessonCount)} درس · {fa(row.metrics.sentenceCount)} جمله · {fa(row.metrics.vocabularyCount)} واژهٔ یکتا</Text>
                      </View>
                      <ChevronLeft size={18} color={Palette.muted} />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>PROGRESS OVERVIEW</Text>
              <Text style={styles.sectionTitle}>خلاصهٔ پیشرفت</Text>
            </View>
            <View style={styles.todayPill}>
              <Flame size={14} color={Palette.warning} />
              <Text style={styles.todayPillText}>{fa(dueCount)} جمله آمادهٔ مرور</Text>
            </View>
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayCardTop}>
              <View style={styles.todayMetricCopy}>
                <Text style={styles.todayValue}>{fa(completed)} از {fa(lessonCount)} <Text style={styles.todayValueUnit}>درس</Text></Text>
                <Text style={styles.todayLabel}>پیشرفت ثبت‌شده در مسیر جامع آلمانی</Text>
              </View>
              <View style={styles.todayIcon}><BookOpenCheck size={20} color={Palette.primary} /></View>
            </View>
            <View style={styles.todayProgressRow}>
              <Text style={styles.todayProgressText}>{fa(Math.round(progressPercent))}٪</Text>
              <View style={styles.todayProgressTrack}><EnglishProgressTrack value={progressPercent} color={Palette.primary} trackColor={Palette.border} height={9} /></View>
            </View>
            <View style={styles.todayFootnote}>
              <BookOpen size={14} color={Palette.teal} />
              <Text style={styles.todayFootnoteText}>{fa(totalSentenceCount)} جملهٔ کاربردی · {fa(uniqueWordCount)} واژه و عبارت یکتا</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>PRACTICE STUDIO</Text>
              <Text style={styles.sectionTitle}>بخش‌های تمرین</Text>
            </View>
          </View>

          <View style={styles.studioGrid}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/reviews' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.tealSoft }]}><RefreshCw size={19} color={Palette.teal} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>مرور هوشمند</Text>
                <Text style={styles.quickDesc}>کارت‌های زمان‌بندی‌شده</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" accessibilityLabel="باز کردن کارگاه تلفظ آلمانی" accessibilityHint="تمرین آواهای مهم آلمانی، تکیه و آهنگ جمله؛ بدون ضبط میکروفن" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/pronunciation' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.primarySoft }]}><Volume2 size={19} color={Palette.primary} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>کارگاه تلفظ</Text>
                <Text style={styles.quickDesc}>آواها، تکیه و آهنگ جمله</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/library' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.primarySoft }]}><MessageCircle size={19} color={Palette.primary} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>کتابخانهٔ درس‌ها</Text>
                <Text style={styles.quickDesc}>مرور سطح‌ها و سرفصل‌ها</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" accessibilityLabel="ورود ایمیلی و همگام‌سازی شخصی" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/personal-sync' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.warningSoft }]}><Cloud size={19} color={Palette.warning} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>حساب و همگام‌سازی</Text>
                <Text style={styles.quickDesc}>ذخیرهٔ ابری پیشرفت</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.utilityPillRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="سنجش آغازین آلمانی برای انتخاب نقطهٔ شروع" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push({ pathname: '/placement', params: { language: 'de' } } as never)}>
              <Compass size={15} color={Palette.primary} />
              <Text style={styles.utilityPillText}>تعیین نقطهٔ شروع</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/backup' as never)}>
              <Download size={15} color={Palette.warning} />
              <Text style={styles.utilityPillText}>پشتیبان پیشرفت</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/workshop' as never)}>
              <MessageCircle size={15} color={Palette.teal} />
              <Text style={styles.utilityPillText}>کارگاه مکالمه</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/de/unit?unit=de-a1-skills' as never)}>
              <BookOpenCheck size={15} color={Palette.primaryDark} />
              <Text style={styles.utilityPillText}>مهارت‌های A1</Text>
            </Pressable>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}><Sparkles size={17} color="#D07A1E" /></View>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>نقشهٔ سطح‌ها، یادگیری در بافت جمله</Text>
              <Text style={styles.tipText}>نام‌گذاری سطح‌ها نقشهٔ داخلی دوره است و گواهی رسمی CEFR نیست؛ هر واژه همراه با تلفظ بومی آلمانی و جملهٔ کاربردی می‌آید.</Text>
            </View>
          </View>
          {!progress && !error ? <Text style={styles.loading}>در حال آماده‌کردن مسیر…</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <GermanBottomNav />
      </View>
    </View>
  );
}
