import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from '@/lib/narration';
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
import { AppBottomNav } from '@/components/AppBottomNav';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { EnglishLevelRail, EnglishProgressTrack, displayEnglishModuleLabel } from '@/components/EnglishUI';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { LUXURY_JOURNEY_GRADIENTS, luxuryHomeStyles as styles } from '@/components/luxuryHomeStyles';
import { COURSE_LEVELS, SENTENCE_LESSONS } from '@/lib/courseContent';
import { getCourseProgress, type CourseProgress } from '@/lib/courseProgress';
import { syncPersonalLearningData } from '@/lib/personalLearningSync';
import { toPersianDigits } from '@/lib/format';
import { freshSession, loadStudy, saveLessonSession, studyDay } from '@/lib/englishStudyState';
import { ENGLISH_ENGINE_BLUEPRINT, getEnglishLevelMetrics } from '@/lib/englishLearningEngine';
import { preloadSpeechVoices, resolveSpeechOptions } from '@/lib/speechLanguage';

const ENGLISH_RAIL_LEVELS = COURSE_LEVELS.map((level, index) => ({
  ...level,
  color: LUXURY_JOURNEY_GRADIENTS[index]?.[0] ?? Palette.primary,
}));

export default function LearningHome() {
  const router = useRouter();
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [measuredMinutes, setMeasuredMinutes] = useState(0);
  const [hasFirstLessonSession, setHasFirstLessonSession] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void preloadSpeechVoices();
    void loadStudy().then(state => {
      if (alive) {
        setMeasuredMinutes(Math.floor((state.days[studyDay()] ?? 0) / 6000) / 10);
        const firstSaved = state.sessions[SENTENCE_LESSONS[0].id];
        setHasFirstLessonSession(Boolean(firstSaved && (firstSaved.stage > 0 || firstSaved.sentenceIndex > 0)));
        setTimeError(false);
      }
    }).catch(() => { if (alive) setTimeError(true); });
    return () => { alive = false; void Speech.stop(); };
  }, []));

  useFocusEffect(useCallback(() => {
    let alive = true;
    const refreshCourse = () => getCourseProgress().then(next => { if (alive) setProgress(next); });
    void refreshCourse();
    void syncPersonalLearningData().then(result => {
      if (result.status === 'synced') return refreshCourse();
      return undefined;
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []));

  const speakEnglish = useCallback((text: string) => {
    void Speech.stop();
    void resolveSpeechOptions('en-US').then(targetVoice => {
      Speech.speak(text, { ...targetVoice, rate: 0.85 });
    });
  }, []);

  const currentLesson = SENTENCE_LESSONS.find(lesson => lesson.id === progress?.currentLessonId) ?? SENTENCE_LESSONS[0];
  const currentLevel = ENGLISH_RAIL_LEVELS.find(level => level.id === currentLesson.levelId) ?? ENGLISH_RAIL_LEVELS[0];
  const currentSentence = currentLesson.sentences[0];
  const completedIds = progress?.completedLessonIds ?? [];
  const completed = completedIds.length;
  const levelMetrics = getEnglishLevelMetrics(currentLevel.id, completedIds);
  const currentBlueprint = ENGLISH_ENGINE_BLUEPRINT.find(level => level.levelId === currentLevel.id);
  const dailyGoal = progress?.dailyGoalMinutes ?? 10;
  const dailyPct = Math.min(100, dailyGoal ? (measuredMinutes / dailyGoal) * 100 : 0);
  const levelCounts = Object.fromEntries(ENGLISH_RAIL_LEVELS.map(level => {
    const metrics = getEnglishLevelMetrics(level.id, completedIds);
    return [level.id, { completed: metrics.completedLessonCount, total: metrics.lessonCount }];
  }));
  const levelProgress = levelMetrics.lessonCount
    ? (levelMetrics.completedLessonCount / levelMetrics.lessonCount) * 100
    : 0;
  const heroGradient = LUXURY_JOURNEY_GRADIENTS[currentLevel.id] ?? LUXURY_JOURNEY_GRADIENTS[0];

  const firstLesson = SENTENCE_LESSONS[0];
  const openLevel = (levelId: number) => router.push({ pathname: '/lang/library', params: { level: String(levelId) } } as never);
  const openCurrentLesson = () => router.push({ pathname: '/course/lesson', params: { id: currentLesson.id } } as never);
  const openFirstLesson = () => {
    void saveLessonSession(firstLesson.id, freshSession()).catch(() => undefined).finally(() => {
      router.push({ pathname: '/course/lesson', params: { id: firstLesson.id } } as never);
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <LuxuryTopBar
            language="en"
            eyebrow="ENGLISH STUDIO"
            title="مسیر جامع انگلیسی"
            backFallbackHref="/languages"
          />

          <LinearGradient colors={heroGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroOrbLarge} />
            <View pointerEvents="none" style={styles.heroOrbSmall} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroLevelBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroLevelText}>LEVEL {currentLevel.id} · {currentLevel.cefr === 'پایه' || currentLevel.id === 0 ? 'FOUNDATION' : currentLevel.cefr}</Text>
              </View>
              <Text style={styles.heroCourseLabel}>مسیر اصلی</Text>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>درس بعدی شما</Text>
              <Text style={styles.heroTitle}>{currentLesson.title}</Text>
              <Text style={styles.heroDescription}>{currentLesson.subtitle}</Text>
            </View>

            {currentSentence ? (
              <View style={styles.sentenceShowcase}>
                <Pressable accessibilityRole="button" accessibilityLabel={`پخش تلفظ انگلیسی: ${currentSentence.en}`} style={styles.sentenceShowcaseTop} onPress={() => speakEnglish(currentSentence.en)}>
                  <View style={styles.sentenceLabelIcon}><Volume2 size={15} color="#FFFFFF" /></View>
                  <Text style={styles.sentenceLabel}>جملهٔ کلیدی این درس</Text>
                  <Text style={styles.sentenceLabelEn}>CORE SENTENCE</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن جمله: ${currentSentence.en}`} onPress={() => speakEnglish(currentSentence.en)}>
                  <Text style={styles.sentenceEnglish}>{currentSentence.en}</Text>
                </Pressable>
                <Text style={styles.sentencePersian}>{currentSentence.fa}</Text>
                {currentSentence.pattern ? (
                  <View style={styles.sentencePatternBox}>
                    <Text style={styles.sentencePatternLabel}>الگوی جمله‌سازی:</Text>
                    <Text style={styles.sentencePatternText}>{currentSentence.pattern}</Text>
                  </View>
                ) : null}
                {!!currentSentence.vocabulary.length && (
                  <View style={styles.wordChipRow}>
                    {currentSentence.vocabulary.map(item => (
                      <Pressable key={`${currentSentence.id}-${item.word}`} accessibilityRole="button" accessibilityLabel={`تلفظ واژه: ${item.word}`} style={styles.wordChip} onPress={() => speakEnglish(item.word)}>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={completed ? 'ادامه یادگیری' : 'شروع از پایه'}
                style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}
                onPress={openCurrentLesson}
              >
                <Play size={16} color={Palette.primaryDark} fill={Palette.primaryDark} />
                <Text style={styles.continueButtonText}>{completed ? 'ادامه یادگیری' : 'شروع از پایه'}</Text>
                <ChevronLeft size={17} color={Palette.primaryDark} />
              </Pressable>
              <View style={styles.sentenceCount}>
                <Text style={styles.sentenceCountValue}>{toPersianDigits(currentLesson.sentences.length)}</Text>
                <Text style={styles.sentenceCountLabel}>جملهٔ درس</Text>
              </View>
            </View>
            {(currentLesson.id !== firstLesson.id || completed > 0 || hasFirstLessonSession) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بازگشت به درس اول انگلیسی"
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

          <View style={styles.pathPanel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelEyebrow}>CURRICULUM ROADMAP</Text>
                <Text style={styles.panelTitle}>مسیر و سطح‌های یادگیری</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.libraryLink} onPress={() => router.push('/lang/library' as never)}>
                <Text style={styles.libraryLinkText}>کتابخانه</Text>
                <ChevronLeft size={15} color={Palette.primaryDark} />
              </Pressable>
            </View>

            <View style={styles.railWrap}>
              <EnglishLevelRail activeLevelId={currentLevel.id} levels={ENGLISH_RAIL_LEVELS} counts={levelCounts} direction="rtl" onSelect={openLevel} />
            </View>

            <View style={styles.currentLevelRow}>
              <View style={styles.currentLevelCopy}>
                <Text style={styles.currentLevelEyebrow}>سطح فعلی · سطح {toPersianDigits(currentLevel.id)}</Text>
                <Text style={styles.currentLevelName}>{currentLevel.title}</Text>
                <Text style={styles.currentLevelDescription}>{currentLevel.description}</Text>
              </View>
              <View style={[styles.levelCountBadge, { backgroundColor: `${currentLevel.color}12`, borderColor: `${currentLevel.color}36` }]}>
                <Text style={[styles.levelCountValue, { color: currentLevel.color }]}>{toPersianDigits(levelMetrics.completedLessonCount)} از {toPersianDigits(levelMetrics.lessonCount)}</Text>
                <View style={styles.levelCountMeta}>
                  <View style={[styles.levelCountDot, { backgroundColor: currentLevel.color }]} />
                  <Text style={styles.levelCountLabel}>درس تکمیل‌شده</Text>
                </View>
              </View>
            </View>
            <EnglishProgressTrack value={levelProgress} color={currentLevel.color} />

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showRoadmap }} style={styles.mapToggle} onPress={() => setShowRoadmap(value => !value)}>
              <View style={styles.mapToggleIcon}><Compass size={16} color={Palette.primary} /></View>
              <View style={styles.mapToggleText}>
                <Text style={styles.mapToggleTitle}>{showRoadmap ? 'بستن نقشهٔ کامل سطح‌ها' : 'نمایش نقشهٔ کامل سطح‌ها'}</Text>
                <Text style={styles.mapToggleMeta}>{currentBlueprint?.modules.slice(0, 3).map(displayEnglishModuleLabel).join(' · ')}</Text>
              </View>
              {showRoadmap ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.primary} />}
            </Pressable>

            {showRoadmap && (
              <View style={styles.fullRoadmap}>
                {ENGLISH_RAIL_LEVELS.map(level => {
                  const metrics = getEnglishLevelMetrics(level.id, completedIds);
                  const passed = metrics.lessonCount > 0 && metrics.completedLessonCount === metrics.lessonCount;
                  return (
                    <Pressable
                      key={level.id}
                      accessibilityRole="button"
                      accessibilityLabel={`فهرست درس‌های ${level.title}`}
                      style={({ pressed }) => [styles.levelCard, level.id === currentLevel.id && styles.levelCardActive, pressed && styles.buttonPressed]}
                      onPress={() => openLevel(level.id)}
                    >
                      <View style={[styles.levelNumber, { backgroundColor: `${level.color}16` }]}>
                        {passed ? <Check size={18} color={level.color} strokeWidth={2.6} /> : <Text style={[styles.levelNumberText, { color: level.color }]}>{toPersianDigits(level.id)}</Text>}
                      </View>
                      <View style={styles.levelText}>
                        <View style={styles.levelTitleRow}>
                          <Text style={styles.levelTitle}>{level.title}</Text>
                          <Text style={[styles.levelBand, { color: level.color }]}>{level.cefr}</Text>
                        </View>
                        <Text style={styles.levelDesc} numberOfLines={2}>{level.description}</Text>
                        <Text style={styles.levelStats}>{toPersianDigits(metrics.completedLessonCount)} از {toPersianDigits(metrics.lessonCount)} درس · {toPersianDigits(metrics.sentenceCount)} جمله · {toPersianDigits(metrics.vocabularyCount)} واژهٔ یکتا</Text>
                      </View>
                      <ChevronLeft size={18} color={Palette.muted} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>PROGRESS OVERVIEW</Text>
              <Text style={styles.sectionTitle}>خلاصهٔ پیشرفت</Text>
            </View>
            <View style={styles.todayPill}>
              <Flame size={14} color={Palette.warning} />
              <Text style={styles.todayPillText}>{toPersianDigits(dailyGoal)} دقیقه هدف روزانه</Text>
            </View>
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayCardTop}>
              <View style={styles.todayMetricCopy}>
                <Text style={styles.todayValue}>{toPersianDigits(completed)} از {toPersianDigits(SENTENCE_LESSONS.length)} <Text style={styles.todayValueUnit}>درس</Text></Text>
                <Text style={styles.todayLabel}>{timeError ? 'پیشرفت ثبت‌شده در مسیر جامع انگلیسی' : `${toPersianDigits(measuredMinutes)} دقیقه مطالعهٔ امروز ثبت شده است`}</Text>
              </View>
              <View style={styles.todayIcon}><BookOpenCheck size={20} color={Palette.primary} /></View>
            </View>
            <View style={styles.todayProgressRow}>
              <Text style={styles.todayProgressText}>{toPersianDigits(Math.round(dailyPct))}٪</Text>
              <View style={styles.todayProgressTrack}><EnglishProgressTrack value={dailyPct} color={Palette.primary} height={9} /></View>
            </View>
            <View style={styles.todayFootnote}>
              <BookOpen size={14} color={Palette.teal} />
              <Text style={styles.todayFootnoteText}>{toPersianDigits(completed)} از {toPersianDigits(SENTENCE_LESSONS.length)} درس اصلی تکمیل‌شده{progress?.currentStreak ? ` · ${toPersianDigits(progress.currentStreak)} روز پیاپی` : ''}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>PRACTICE STUDIO</Text>
              <Text style={styles.sectionTitle}>بخش‌های تمرین</Text>
            </View>
          </View>

          <View style={styles.studioGrid}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/review' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.tealSoft }]}><RefreshCw size={19} color={Palette.teal} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>مرور هوشمند</Text>
                <Text style={styles.quickDesc}>کارت‌های زمان‌بندی‌شده</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="باز کردن کارگاه تلفظ انگلیسی"
              accessibilityHint="تمرین صداهای انگلیسی، تکیه و آهنگ جمله؛ بدون ضبط میکروفن"
              style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]}
              onPress={() => router.push('/learn/en/pronunciation' as never)}
            >
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.primarySoft }]}><Volume2 size={19} color={Palette.primary} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>کارگاه تلفظ</Text>
                <Text style={styles.quickDesc}>آواها، تکیه و آهنگ جمله</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/lang/library' as never)}>
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
            <Pressable accessibilityRole="button" accessibilityLabel="سنجش آغازین انگلیسی برای انتخاب نقطهٔ شروع" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push({ pathname: '/placement', params: { language: 'en' } } as never)}>
              <Compass size={15} color={Palette.primary} />
              <Text style={styles.utilityPillText}>تعیین نقطهٔ شروع</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="پشتیبان‌گیری محلی از پیشرفت انگلیسی" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={() => router.push('/lang/backup' as never)}>
              <Download size={15} color={Palette.warning} />
              <Text style={styles.utilityPillText}>پشتیبان پیشرفت</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.utilityPill, pressed && styles.buttonPressed]} onPress={openCurrentLesson}>
              <MessageCircle size={15} color={Palette.teal} />
              <Text style={styles.utilityPillText}>گفت‌وگوی درس جاری</Text>
            </Pressable>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}><Sparkles size={17} color="#D07A1E" /></View>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>یادگیری در بافت جمله</Text>
              <Text style={styles.tipText}>هر واژه را همراه تلفظ، الگوی جمله‌سازی و موقعیت واقعی‌اش می‌آموزی؛ نه جدا از کاربردش.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <AppBottomNav />
      </View>
    </View>
  );
}
