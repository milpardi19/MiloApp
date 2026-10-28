import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from '@/lib/narration';
import { narrate, primeNarrator, setTurkishDeviceFallbackEnabled, stopNarration } from '@/lib/narrator/engine';
import { FEATURES } from '@/lib/features';
import BookOpen from 'lucide-react-native/dist/esm/icons/book-open';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronDown from 'lucide-react-native/dist/esm/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronUp from 'lucide-react-native/dist/esm/icons/chevron-up';
import Cloud from 'lucide-react-native/dist/esm/icons/cloud';
import Compass from 'lucide-react-native/dist/esm/icons/compass';
import Flame from 'lucide-react-native/dist/esm/icons/flame';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import Play from 'lucide-react-native/dist/esm/icons/play';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { EnglishLevelRail, EnglishProgressTrack, displayEnglishModuleLabel } from '@/components/EnglishUI';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { LUXURY_JOURNEY_GRADIENTS, luxuryHomeStyles as styles } from '@/components/luxuryHomeStyles';
import { TurkishBottomNav } from '@/components/TurkishBottomNav';
import { TURKISH_LEVELS, TURKISH_LESSONS, turkishProgress, type TurkishLevelId } from '@/lib/languages/turkish';
import { clearTurkishLessonSession, loadTurkishLessonSession } from '@/lib/languages/turkishStudyState';
import type { CourseProgress } from '@/lib/courseProgress';
import { bidiIsolate, toPersianDigits as fa } from '@/lib/format';
import { preloadSpeechVoices, resolveSpeechOptions } from '@/lib/speechLanguage';

export const SHARED_JOURNEY_GRADIENTS: Record<number, [string, string]> = LUXURY_JOURNEY_GRADIENTS;

const TURKISH_RAIL_LEVELS = TURKISH_LEVELS.map(level => ({
  ...level,
  color: LUXURY_JOURNEY_GRADIENTS[level.id]?.[0] ?? Palette.primary,
}));

export default function TurkishHome() {
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [hasFirstLessonSession, setHasFirstLessonSession] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void preloadSpeechVoices();
    if (FEATURES.turkishCloudNarrator) setTurkishDeviceFallbackEnabled(true);
    void primeNarrator('tr-TR').catch(() => undefined);
    void Promise.all([
      turkishProgress.getCourseProgress(),
      turkishProgress.getDueReviewCards(),
      loadTurkishLessonSession(TURKISH_LESSONS[0].id).catch(() => null),
    ])
      .then(([nextProgress, cards, firstSaved]) => {
        if (!alive) return;
        setProgress(nextProgress);
        setDueCount(cards.length);
        setHasFirstLessonSession(Boolean(firstSaved && (firstSaved.stage > 0 || firstSaved.sentenceIndex > 0)));
        setError('');
      })
      .catch(() => { if (alive) setError('پیشرفت ترکی خوانده نشد؛ اطلاعات قبلی تغییر نکرده است. دوباره تلاش کنید.'); });
    return () => {
      alive = false;
      stopNarration();
      void Speech.stop();
    };
  }, [retry]));

  const speakTurkish = useCallback((text: string) => {
    void narrate(text, 'tr-TR').catch(() => {
      void Speech.stop();
      void resolveSpeechOptions('tr-TR').then(targetVoice => {
        if (targetVoice.voice) Speech.speak(text, { ...targetVoice, rate: 0.8 });
      });
    });
  }, []);

  const completedIds = progress?.completedLessonIds ?? [];
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const nextLesson = TURKISH_LESSONS.find(lesson => !completedSet.has(lesson.id));
  const heroLesson = nextLesson ?? TURKISH_LESSONS[TURKISH_LESSONS.length - 1];
  const activeLevel = TURKISH_RAIL_LEVELS.find(level => level.id === (nextLesson?.levelId ?? heroLesson.levelId)) ?? TURKISH_RAIL_LEVELS[0];
  const completedCount = TURKISH_LESSONS.filter(lesson => completedSet.has(lesson.id)).length;
  const levelLessons = TURKISH_LESSONS.filter(lesson => lesson.levelId === activeLevel.id);
  const levelCompleted = levelLessons.filter(lesson => completedSet.has(lesson.id)).length;
  const { sentenceCount, uniqueWords, staticLevelStats } = useMemo(() => {
    const perLevel: Partial<Record<TurkishLevelId, { lessons: typeof TURKISH_LESSONS; sentences: number; words: number }>> = {};
    TURKISH_RAIL_LEVELS.forEach(level => {
      const lessons = TURKISH_LESSONS.filter(lesson => lesson.levelId === level.id);
      perLevel[level.id] = {
        lessons,
        sentences: lessons.reduce((sum, lesson) => sum + lesson.sentences.length, 0),
        words: new Set(lessons.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word)))).size,
      };
    });
    return {
      sentenceCount: TURKISH_LESSONS.reduce((count, lesson) => count + lesson.sentences.length, 0),
      uniqueWords: new Set(TURKISH_LESSONS.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word)))).size,
      staticLevelStats: perLevel,
    };
  }, []);
  const firstSentence = heroLesson.sentences[0];
  const levelCounts = {} as Partial<Record<TurkishLevelId, { completed: number; total: number; sentences: number; words: number }>>;
  TURKISH_RAIL_LEVELS.forEach(level => {
    const stat = staticLevelStats[level.id];
    const lessons = stat?.lessons ?? [];
    levelCounts[level.id] = {
      completed: lessons.filter(lesson => completedSet.has(lesson.id)).length,
      total: lessons.length,
      sentences: stat?.sentences ?? 0,
      words: stat?.words ?? 0,
    };
  });

  const firstLesson = TURKISH_LESSONS[0];
  const openLevel = (levelId: TurkishLevelId) => router.push(`/learn/tr/library?level=${levelId}` as never);
  const openNextLesson = () => {
    if (nextLesson) router.push(`/learn/tr/lesson?id=${encodeURIComponent(nextLesson.id)}` as never);
    else openLevel(activeLevel.id);
  };
  const openFirstLesson = () => {
    void clearTurkishLessonSession(firstLesson.id).catch(() => undefined).finally(() => {
      router.push(`/learn/tr/lesson?id=${encodeURIComponent(firstLesson.id)}` as never);
    });
  };
  const railLevels = TURKISH_RAIL_LEVELS.map((item, idx) => ({ ...item, id: idx as 0 | 1 | 2 | 3 }));
  const railCounts = Object.fromEntries(TURKISH_RAIL_LEVELS.map((item, idx) => [idx, levelCounts[item.id]]));
  const activeRailIndex = Math.max(0, TURKISH_RAIL_LEVELS.findIndex(item => item.id === activeLevel.id)) as 0 | 1 | 2 | 3 | 4;

  const heroGradient = LUXURY_JOURNEY_GRADIENTS[activeLevel.id] ?? LUXURY_JOURNEY_GRADIENTS[0];
  const progressPercent = TURKISH_LESSONS.length ? (completedCount / TURKISH_LESSONS.length) * 100 : 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <LuxuryTopBar
            language="tr"
            eyebrow="TURKISH STUDIO"
            title="مسیر جامع ترکی"
            backFallbackHref="/languages"
          />

          <LinearGradient colors={heroGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroOrbLarge} />
            <View pointerEvents="none" style={styles.heroOrbSmall} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroLevelBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroLevelText}>LEVEL {activeLevel.id + 1} · {activeLevel.cefr}</Text>
              </View>
              <Text style={styles.heroCourseLabel}>مسیر اصلی</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{nextLesson ? 'درس بعدی شما' : 'مسیر تکمیل‌شده'}</Text>
              <Text style={styles.heroTitle}>{nextLesson ? heroLesson.title : 'همهٔ درس‌ها تکمیل شد'}</Text>
              <Text style={styles.heroDescription}>{nextLesson ? bidiIsolate(heroLesson.subtitle) : 'درس‌های این مسیر را مرور کنید یا از کتابخانه انتخاب نمایید.'}</Text>
            </View>

            {firstSentence ? (
              <View style={styles.sentenceShowcase}>
                <Pressable accessibilityRole="button" accessibilityLabel={`پخش تلفظ ترکی: ${firstSentence.text}`} style={styles.sentenceShowcaseTop} onPress={() => speakTurkish(firstSentence.text)}>
                  <View style={styles.sentenceLabelIcon}><Volume2 size={15} color="#FFFFFF" /></View>
                  <Text style={styles.sentenceLabel}>جملهٔ کلیدی این درس</Text>
                  <Text style={styles.sentenceLabelEn}>CORE SENTENCE</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`شنیدن جمله: ${firstSentence.text}`} onPress={() => speakTurkish(firstSentence.text)}>
                  <Text style={styles.sentenceTurkish}>{firstSentence.text}</Text>
                </Pressable>
                <Text style={styles.sentencePersian}>{firstSentence.fa}</Text>
                <Text style={styles.sentencePronunciation}>{firstSentence.pronunciation}</Text>
                {firstSentence.pattern ? (
                  <View style={styles.sentencePatternBox}>
                    <Text style={styles.sentencePatternLabel}>الگوی جمله‌سازی:</Text>
                    <Text style={styles.sentencePatternText}>{bidiIsolate(firstSentence.pattern)}</Text>
                  </View>
                ) : null}
                {!!firstSentence.vocabulary.length && (
                  <View style={styles.wordChipRow}>
                    {firstSentence.vocabulary.map(item => (
                      <Pressable key={item.word} accessibilityRole="button" accessibilityLabel={`تلفظ واژه: ${item.word}`} style={styles.wordChip} onPress={() => speakTurkish(item.word)}>
                        <Text style={styles.wordChipTurkish}>{item.word}</Text>
                        <Text style={styles.wordChipDivider}>·</Text>
                        <Text style={styles.wordChipFa}>{item.meaning}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]} onPress={openNextLesson}>
                <Play size={16} color={Palette.primaryDark} fill={Palette.primaryDark} />
                <Text style={styles.continueButtonText}>{nextLesson ? (completedCount ? 'ادامه یادگیری' : 'شروع از پایه') : 'مشاهدهٔ کتابخانه'}</Text>
                <ChevronLeft size={17} color={Palette.primaryDark} />
              </Pressable>
              <View style={styles.sentenceCount}>
                <Text style={styles.sentenceCountValue}>{fa(heroLesson.sentences.length)}</Text>
                <Text style={styles.sentenceCountLabel}>جملهٔ درس</Text>
              </View>
            </View>
            {(heroLesson.id !== firstLesson.id || completedCount > 0 || hasFirstLessonSession) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بازگشت به درس اول ترکی"
                style={({ pressed }) => [styles.firstLessonButton, pressed && styles.buttonPressed]}
                onPress={openFirstLesson}
              >
                <RotateCcw size={15} color="#F6D992" />
                <Text style={styles.firstLessonButtonText}>
                  {heroLesson.id === firstLesson.id ? 'شروع دوباره از ابتدای درس اول' : 'بازگشت به درس اول'}
                </Text>
              </Pressable>
            ) : null}
          </LinearGradient>

          {!!error && (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}>
                <Text style={styles.retryText}>تلاش دوباره</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.pathPanel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelEyebrow}>CURRICULUM ROADMAP</Text>
                <Text style={styles.panelTitle}>مسیر و سطح‌های یادگیری</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.libraryLink} onPress={() => router.push('/learn/tr/library' as never)}>
                <Text style={styles.libraryLinkText}>کتابخانه</Text>
                <ChevronLeft size={15} color={Palette.primaryDark} />
              </Pressable>
            </View>
            <View style={styles.railWrap}>
              <EnglishLevelRail
                activeLevelId={activeRailIndex}
                counts={railCounts}
                levels={railLevels}
                startLabel={TURKISH_RAIL_LEVELS[0].cefr}
                numberOffset={1}
                accessibilityLabelPrefix="فهرست درس‌های"
                direction="rtl"
                onSelect={railIdx => {
                  const target = TURKISH_RAIL_LEVELS[railIdx];
                  if (target) openLevel(target.id);
                }}
              />
            </View>
            <View style={styles.currentLevelRow}>
              <View style={styles.currentLevelCopy}>
                <Text style={styles.currentLevelEyebrow}>سطح فعلی · {activeLevel.cefr}</Text>
                <Text style={styles.currentLevelName}>{activeLevel.title}</Text>
                <Text style={styles.currentLevelDescription}>{activeLevel.description}</Text>
              </View>
              <View style={[styles.levelCountBadge, { backgroundColor: `${activeLevel.color}12`, borderColor: `${activeLevel.color}36` }]}>
                <Text style={[styles.levelCountValue, { color: activeLevel.color }]}>{fa(levelCompleted)} از {fa(levelLessons.length)}</Text>
                <View style={styles.levelCountMeta}>
                  <View style={[styles.levelCountDot, { backgroundColor: activeLevel.color }]} />
                  <Text style={styles.levelCountLabel}>درس تکمیل‌شده</Text>
                </View>
              </View>
            </View>
            <EnglishProgressTrack value={levelLessons.length ? (levelCompleted / levelLessons.length) * 100 : 0} color={activeLevel.color} />

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showRoadmap }} style={styles.mapToggle} onPress={() => setShowRoadmap(value => !value)}>
              <View style={styles.mapToggleIcon}><Compass size={16} color={Palette.primary} /></View>
              <View style={styles.mapToggleText}>
                <Text style={styles.mapToggleTitle}>{showRoadmap ? 'بستن نقشهٔ کامل سطح‌ها' : 'نمایش نقشهٔ کامل سطح‌ها'}</Text>
                <Text style={styles.mapToggleMeta}>{activeLevel.modules.slice(0, 3).map(displayEnglishModuleLabel).join(' · ')}</Text>
              </View>
              {showRoadmap ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.primary} />}
            </Pressable>

            {showRoadmap && (
              <View style={styles.fullRoadmap}>
                {TURKISH_RAIL_LEVELS.map(level => {
                  const count = levelCounts[level.id] ?? { completed: 0, total: 0, sentences: 0, words: 0 };
                  const passed = count.total > 0 && count.completed === count.total;
                  return (
                    <Pressable
                      key={level.id}
                      accessibilityRole="button"
                      accessibilityLabel={`فهرست درس‌های ${level.title}`}
                      style={({ pressed }) => [styles.levelCard, level.id === activeLevel.id && styles.levelCardActive, pressed && styles.buttonPressed]}
                      onPress={() => openLevel(level.id)}
                    >
                      <View style={[styles.levelNumber, { backgroundColor: `${level.color}16` }]}>
                        {passed ? <Check size={18} color={level.color} strokeWidth={2.6} /> : <Text style={[styles.levelNumberText, { color: level.color }]}>{fa(level.id + 1)}</Text>}
                      </View>
                      <View style={styles.levelText}>
                        <View style={styles.levelTitleRow}>
                          <Text style={styles.levelTitle}>{level.title}</Text>
                          <Text style={[styles.levelBand, { color: level.color }]}>{level.cefr}</Text>
                        </View>
                        <Text style={styles.levelDesc} numberOfLines={2}>{level.description}</Text>
                        <Text style={styles.levelStats}>{fa(count.completed)} از {fa(count.total)} درس · {fa(count.sentences)} جمله · {fa(count.words)} واژهٔ یکتا</Text>
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
              <Text style={styles.todayPillText}>{fa(dueCount)} جمله آمادهٔ مرور</Text>
            </View>
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayCardTop}>
              <View style={styles.todayMetricCopy}>
                <Text style={styles.todayValue}>{fa(completedCount)} از {fa(TURKISH_LESSONS.length)} <Text style={styles.todayValueUnit}>درس</Text></Text>
                <Text style={styles.todayLabel}>پیشرفت ثبت‌شده در مسیر جامع ترکی</Text>
              </View>
              <View style={styles.todayIcon}><BookOpenCheck size={20} color={Palette.primary} /></View>
            </View>
            <View style={styles.todayProgressRow}>
              <Text style={styles.todayProgressText}>{fa(Math.round(progressPercent))}٪</Text>
              <View style={styles.todayProgressTrack}><EnglishProgressTrack value={progressPercent} color={Palette.primary} height={9} /></View>
            </View>
            <View style={styles.todayFootnote}>
              <BookOpen size={14} color={Palette.teal} />
              <Text style={styles.todayFootnoteText}>{fa(sentenceCount)} جملهٔ کاربردی · {fa(uniqueWords)} واژه و عبارت یکتا</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>PRACTICE STUDIO</Text>
              <Text style={styles.sectionTitle}>بخش‌های تمرین</Text>
            </View>
          </View>

          <View style={styles.studioGrid}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/tr/review' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.tealSoft }]}><RefreshCw size={19} color={Palette.teal} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>مرور هوشمند</Text>
                <Text style={styles.quickDesc}>کارت‌های زمان‌بندی‌شده</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/tr/pronunciation' as never)}>
              <View style={styles.studioTileTop}>
                <View style={[styles.quickIcon, { backgroundColor: Palette.primarySoft }]}><Volume2 size={19} color={Palette.primary} /></View>
                <ChevronLeft size={16} color={Palette.muted} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>کارگاه تلفظ</Text>
                <Text style={styles.quickDesc}>آواها، تکیه و آهنگ جمله</Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.studioTile, pressed && styles.buttonPressed]} onPress={() => router.push('/learn/tr/library' as never)}>
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

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}><Sparkles size={17} color="#D07A1E" /></View>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>نقشهٔ سطح‌ها، محتوای مستقل ترکی</Text>
              <Text style={styles.tipText}>سطح‌بندی این مسیر داخلی است؛ هر جمله همراه با الگوی جمله‌سازی و تلفظ ارائه می‌شود.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <TurkishBottomNav />
      </View>
    </View>
  );
}
