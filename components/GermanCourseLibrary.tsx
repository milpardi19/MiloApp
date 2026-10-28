import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BookOpen from 'lucide-react-native/dist/esm/icons/book-open';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import Check from 'lucide-react-native/dist/esm/icons/check';
import ChevronDown from 'lucide-react-native/dist/esm/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronUp from 'lucide-react-native/dist/esm/icons/chevron-up';
import Clock3 from 'lucide-react-native/dist/esm/icons/clock-3';
import Play from 'lucide-react-native/dist/esm/icons/play';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import {
  EnglishLevelRail,
  EnglishProgressTrack,
  displayEnglishModuleLabel,
} from '@/components/EnglishUI';
import { GermanPalette as Palette, GERMAN_LEVEL_GRADIENTS } from '@/components/germanTheme';
import { GermanBottomNav } from '@/components/GermanBottomNav';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { luxuryLibraryStyles as styles } from '@/components/luxuryLibraryStyles';
import { LuxuryPalette } from '@/components/luxuryTheme';
import type { CourseLevelId } from '@/lib/courseContent';
import { toPersianDigits as fa } from '@/lib/format';
import {
  GERMAN_SENTENCE_LEVELS,
  GERMAN_SENTENCE_LESSONS,
  germanSentenceLevelMetrics,
  getGermanSentenceResumeLesson,
  type GermanSentenceCourseLevel,
  type GermanSentenceLevelId,
} from '@/lib/languages/germanSentenceCourse';
import { germanProgress } from '@/lib/languages/catalog';
import { clearGermanSentenceSession } from '@/lib/languages/germanSentenceSession';
import type { CourseProgress } from '@/lib/createCourseProgressStore';

const LESSONS_PER_GROUP = 10;

function resolveLevel(value?: string): GermanSentenceLevelId | null {
  if (value === undefined) return null;
  const byLabel = GERMAN_SENTENCE_LEVELS.find(level => level.cefr === value || level.title === value);
  if (byLabel) return byLabel.id;
  const number = Number(value);
  return GERMAN_SENTENCE_LEVELS.some(level => level.id === number) ? (number as GermanSentenceLevelId) : null;
}

function levelStatus(level: GermanSentenceCourseLevel) {
  return `${level.cefr} · ${fa(germanSentenceLevelMetrics(level.id).lessonCount)} درس`;
}

export default function GermanCourseLibrary() {
  const router = useRouter();
  const { level: levelParam } = useLocalSearchParams<{ level?: string }>();
  const selectedLevelId = resolveLevel(levelParam);
  const selectedLevel = selectedLevelId === null ? undefined : GERMAN_SENTENCE_LEVELS.find(level => level.id === selectedLevelId);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [expandedGroup, setExpandedGroup] = useState(0);
  const [showTopics, setShowTopics] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void germanProgress.getCourseProgress().then(value => {
      if (alive) { setProgress(value); setError(''); }
    }).catch(() => {
      if (alive) setError('پیشرفت ذخیره‌شده خوانده نشد؛ فهرست درس‌ها همچنان قابل استفاده است.');
    });
    return () => { alive = false; };
  }, [retry]));

  useEffect(() => {
    setExpandedGroup(0);
    setShowTopics(false);
  }, [selectedLevel?.id]);

  const selectedLessons = useMemo(
    () => selectedLevel ? GERMAN_SENTENCE_LESSONS.filter(lesson => lesson.levelId === selectedLevel.id) : [],
    [selectedLevel?.id],
  );
  const lessonGroups = useMemo(() => {
    const groups: typeof selectedLessons[] = [];
    for (let index = 0; index < selectedLessons.length; index += LESSONS_PER_GROUP) {
      groups.push(selectedLessons.slice(index, index + LESSONS_PER_GROUP));
    }
    return groups;
  }, [selectedLessons]);
  const completedIds = progress?.completedLessonIds ?? [];

  const levelRows = GERMAN_SENTENCE_LEVELS.map(level => {
    const lessons = GERMAN_SENTENCE_LESSONS.filter(lesson => lesson.levelId === level.id);
    const metrics = germanSentenceLevelMetrics(level.id);
    const completed = lessons.filter(lesson => completedIds.includes(lesson.id)).length;
    return { level, lessons, metrics, completed };
  });
  const activeLesson = getGermanSentenceResumeLesson(progress?.currentLessonId, completedIds);
  const activeLevelId = activeLesson?.levelId ?? 0;
  const railCounts = Object.fromEntries(levelRows.map(row => [row.level.id, {
    completed: row.completed,
    total: row.metrics.lessonCount,
  }])) as Partial<Record<CourseLevelId, { completed: number; total: number }>>;
  const selectedMetrics = selectedLevel ? germanSentenceLevelMetrics(selectedLevel.id) : null;
  const selectedCompleted = selectedLessons.filter(lesson => completedIds.includes(lesson.id)).length;
  const selectedPercent = selectedMetrics?.lessonCount ? (selectedCompleted / selectedMetrics.lessonCount) * 100 : 0;

  const openLevel = (id: number) => router.push(`/learn/de/library?level=${id}` as never);
  const openLesson = (id: string) => router.push({
    pathname: '/learn/[language]/lesson',
    params: { language: 'de', id },
  } as never);
  const openFirstLesson = () => {
    const first = GERMAN_SENTENCE_LESSONS[0];
    void clearGermanSentenceSession(first.id).catch(() => undefined).finally(() => {
      openLesson(first.id);
    });
  };

  const { totalGermanSentences, totalGermanWords } = useMemo(() => ({
    totalGermanSentences: GERMAN_SENTENCE_LESSONS.reduce((count, lesson) => count + lesson.sentences.length, 0),
    totalGermanWords: new Set(GERMAN_SENTENCE_LESSONS.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(word => word.word)))).size,
  }), []);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {!selectedLevel ? (
            <>
              <LuxuryTopBar
                language="de"
                eyebrow="DEUTSCH LIBRARY"
                title="کتابخانهٔ درس‌های آلمانی"
                backFallbackHref="/learn/de"
              />

              <LinearGradient colors={LuxuryPalette.heroGradient} start={{ x: 0.95, y: 0.1 }} end={{ x: 0.05, y: 0.95 }} style={styles.overviewHero}>
                <View pointerEvents="none" style={styles.heroOrb} />
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIcon}><BookOpenCheck size={18} color="#FFFFFF" /></View>
                  <View style={styles.heroPill}><Sparkles size={13} color={LuxuryPalette.goldLight} /><Text style={styles.heroPillText}>۴ سطح آموزشی</Text></View>
                </View>
                <Text style={styles.overviewEyebrow}>DEUTSCH LERNEN · IM KONTEXT</Text>
                <Text style={styles.overviewTitle}>مسیر جمله‌محور و ساختاریافته</Text>
                <Text style={styles.overviewText}>سطح موردنظر را انتخاب کنید تا درس‌ها، جمله‌ها و تمرین‌های تعاملی آن باز شوند.</Text>
                <View style={styles.overviewMetrics}>
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(GERMAN_SENTENCE_LESSONS.length)}</Text><Text style={styles.overviewMetricLabel}>کل درس‌ها</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(totalGermanSentences)}</Text><Text style={styles.overviewMetricLabel}>جمله‌های کاربردی</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(totalGermanWords)}</Text><Text style={styles.overviewMetricLabel}>واژهٔ یکتا</Text></View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="شروع از درس اول آلمانی"
                  style={({ pressed }) => [styles.firstLessonQuickBtn, pressed && styles.pressed]}
                  onPress={openFirstLesson}
                >
                  <RotateCcw size={15} color={LuxuryPalette.goldLight} />
                  <Text style={styles.firstLessonQuickText}>شروع از درس اول</Text>
                </Pressable>
              </LinearGradient>

              <View style={styles.levelRailCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderCopy}>
                    <Text style={styles.sectionEyebrow}>YOUR LEVEL TRACK</Text>
                    <Text style={styles.sectionTitle}>گام فعلی در مسیر</Text>
                  </View>
                </View>
                <View style={styles.railWrap}>
                  <EnglishLevelRail activeLevelId={activeLevelId as CourseLevelId} counts={railCounts} levels={GERMAN_SENTENCE_LEVELS} startLabel="مقدماتی" direction="rtl" accentColor={Palette.primary} successColor={Palette.success} activeLabelColor={Palette.primaryDark} numberOffset={1} onSelect={openLevel} />
                </View>
                <Text style={styles.railCurrent}>سطح فعال · {activeLesson ? GERMAN_SENTENCE_LEVELS.find(level => level.id === activeLesson.levelId)?.title : GERMAN_SENTENCE_LEVELS[0].title}</Text>
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>CHOOSE A LEVEL</Text>
                  <Text style={styles.sectionTitle}>انتخاب سطح</Text>
                </View>
              </View>

              <View style={styles.levelList}>
                {levelRows.map(({ level, metrics, completed }) => {
                  const percent = metrics.lessonCount ? (completed / metrics.lessonCount) * 100 : 0;
                  const color = GERMAN_LEVEL_GRADIENTS[level.id as GermanSentenceLevelId][0];
                  return (
                    <Pressable
                      key={level.id}
                      accessibilityRole="button"
                      accessibilityLabel={`فهرست درس‌های ${level.cefr}`}
                      style={({ pressed }) => [styles.levelOption, pressed && styles.pressed]}
                      onPress={() => openLevel(level.id)}
                    >
                      <LinearGradient colors={GERMAN_LEVEL_GRADIENTS[level.id as GermanSentenceLevelId]} style={styles.levelOptionMark}>
                        <Text style={styles.levelOptionNumber}>{fa(level.id + 1)}</Text>
                      </LinearGradient>
                      <View style={styles.levelOptionContent}>
                        <View style={styles.levelOptionTitleRow}>
                          <Text style={styles.levelOptionTitle}>{level.title}</Text>
                          <Text style={[styles.levelOptionBand, { color }]}>{level.cefr}</Text>
                        </View>
                        <Text style={styles.levelOptionDescription} numberOfLines={2}>{level.description}</Text>
                        <View style={styles.levelOptionMeta}>
                          <Text style={styles.levelOptionStatus}>{levelStatus(level)}</Text>
                          <Text style={styles.levelOptionMetaText}>{fa(metrics.lessonCount)} درس</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{fa(metrics.sentenceCount)} جمله</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{fa(metrics.vocabularyCount)} واژهٔ یکتا</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{fa(completed)} تکمیل</Text>
                        </View>
                        <EnglishProgressTrack value={percent} color={color} trackColor={Palette.border} height={6} />
                      </View>
                      <ChevronLeft size={19} color={Palette.muted} />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.disclaimer}>این سطح‌بندی، نقشهٔ آموزشی داخلی برنامه است و گواهی یا اعتبارسنجی رسمی CEFR نیست.</Text>
            </>
          ) : (
            <>
              <LuxuryTopBar
                language="de"
                eyebrow={`LEVEL ${selectedLevel.id + 1} · ${selectedLevel.cefr}`}
                title={selectedLevel.title}
                backFallbackHref="/learn/de/library"
                onBack={() => router.replace('/learn/de/library' as never)}
              />

              <LinearGradient colors={GERMAN_LEVEL_GRADIENTS[selectedLevel.id as GermanSentenceLevelId]} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.levelHero}>
                <View pointerEvents="none" style={styles.levelHeroOrb} />
                <View style={styles.levelHeroTop}>
                  <View style={styles.levelHeroTag}><Text style={styles.levelHeroTagText}>LEVEL {selectedLevel.id + 1}</Text></View>
                  <Text style={styles.levelHeroBand}>{selectedLevel.cefr}</Text>
                </View>
                <Text style={styles.selectedTitle}>{selectedLevel.title}</Text>
                <Text style={styles.selectedDescription}>{selectedLevel.description}</Text>
                <View style={styles.selectedProgressHeading}>
                  <Text style={styles.selectedProgressLabel}>پیشرفت این سطح</Text>
                  <Text style={styles.selectedProgressValue}>{fa(selectedCompleted)} از {fa(selectedMetrics?.lessonCount ?? 0)} درس</Text>
                </View>
                <View style={styles.selectedProgressTrack}><View style={[styles.selectedProgressFill, { width: `${Math.min(100, selectedPercent)}%` }]} /></View>
                <View style={styles.metricGrid}>
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(selectedMetrics?.lessonCount ?? 0)}</Text><Text style={styles.heroMetricLabel}>درس</Text></View>
                  <View style={styles.heroMetricDivider} />
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(selectedMetrics?.sentenceCount ?? 0)}</Text><Text style={styles.heroMetricLabel}>جمله</Text></View>
                  <View style={styles.heroMetricDivider} />
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(selectedMetrics?.vocabularyCount ?? 0)}</Text><Text style={styles.heroMetricLabel}>واژهٔ یکتا</Text></View>
                </View>
              </LinearGradient>

              <View style={styles.focusCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showTopics }}
                  style={styles.focusToggleHeader}
                  onPress={() => setShowTopics(value => !value)}
                >
                  <View style={styles.focusHeadingRow}>
                    <View style={styles.focusIcon}><Sparkles size={17} color={Palette.primary} /></View>
                    <View style={styles.focusHeadingCopy}>
                      <Text style={styles.focusEyebrow}>LEVEL TOPICS</Text>
                      <Text style={styles.focusTitle}>سرفصل‌ها و موضوعات این سطح</Text>
                    </View>
                  </View>
                  {showTopics ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.muted} />}
                </Pressable>
                <Text style={styles.focusDescription}>{selectedLevel.description}</Text>
                {showTopics ? (
                  <View style={styles.moduleGrid}>
                    {selectedLevel.modules.map((module, index) => (
                      <View key={`${selectedLevel.id}-${index}-${module}`} style={styles.moduleChip}>
                        <View style={[styles.moduleDot, { backgroundColor: GERMAN_LEVEL_GRADIENTS[selectedLevel.id as GermanSentenceLevelId][0] }]} />
                        <Text style={styles.moduleText}>{displayEnglishModuleLabel(module)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.focusFootnote}>هر موضوع از جمله‌های ثبت‌شده در همین مرحله می‌آید.</Text>
              </View>

              <View style={styles.lessonSectionHeading}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>ORDERED LESSONS</Text>
                  <Text style={styles.lessonSectionTitle}>فهرست درس‌ها</Text>
                </View>
                <View style={styles.lessonCountPill}><BookOpen size={13} color={Palette.primary} /><Text style={styles.lessonCountText}>{fa(selectedMetrics?.lessonCount ?? 0)} درس</Text></View>
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.groupList}>
                {lessonGroups.map((group, groupIndex) => {
                  const first = group[0];
                  const last = group[group.length - 1];
                  if (!first || !last) return null;
                  const completed = group.filter(lesson => completedIds.includes(lesson.id)).length;
                  const expanded = expandedGroup === groupIndex;
                  return (
                    <View key={`${first.id}-${last.id}`} style={styles.group}>
                      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} style={styles.groupHeader} onPress={() => setExpandedGroup(expanded ? -1 : groupIndex)}>
                        <View style={[styles.groupNumber, expanded && styles.groupNumberActive]}>
                          <Text style={[styles.groupNumberText, expanded && styles.groupNumberTextActive]}>{fa(groupIndex + 1)}</Text>
                        </View>
                        <View style={styles.groupHeaderCopy}>
                          <Text style={styles.groupTitle}>بخش {fa(groupIndex + 1)} · درس‌های {fa(first.order)} تا {fa(last.order)}</Text>
                          <Text style={styles.groupMeta}>{fa(group.length)} درس · {fa(completed)} تکمیل‌شده</Text>
                        </View>
                        {expanded ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.muted} />}
                      </Pressable>
                      {expanded ? (
                        <View style={styles.lessonList}>
                          {group.map(lesson => {
                            const complete = completedIds.includes(lesson.id);
                            const preview = lesson.sentences[0];
                            return (
                              <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={`${lesson.order}. ${lesson.title}`} style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]} onPress={() => openLesson(lesson.id)}>
                                <View style={[styles.lessonOrder, complete && styles.lessonOrderComplete]}>
                                  {complete ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : <Text style={styles.lessonOrderText}>{fa(lesson.order)}</Text>}
                                </View>
                                <View style={styles.lessonCopy}>
                                  <View style={styles.lessonTitleLine}>
                                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                    <View style={[styles.lessonStatus, complete && styles.lessonStatusDone]}>
                                      <Text style={[styles.lessonStatusText, complete && styles.lessonStatusTextDone]}>{complete ? 'تکمیل‌شده' : 'شروع درس'}</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.lessonSubtitle} numberOfLines={1}>{lesson.subtitle}</Text>
                                  {preview ? (
                                    <View style={styles.lessonSentencePreview}>
                                      <View style={styles.lessonSentenceHeader}><Volume2 size={13} color={Palette.primary} /><Text style={styles.lessonSentenceEyebrow}>جملهٔ نمونه</Text></View>
                                      <Text style={styles.lessonSentenceTarget} numberOfLines={1}>{preview.text}</Text>
                                      <Text style={styles.lessonSentenceFa} numberOfLines={1}>{preview.fa}</Text>
                                      <View style={styles.lessonVocabRow}>
                                        {preview.vocabulary.slice(0, 3).map(item => <Text key={`${preview.id}-${item.word}`} style={styles.lessonVocabChip}>{item.word} · {item.meaning}</Text>)}
                                      </View>
                                    </View>
                                  ) : null}
                                  {preview?.pattern ? <Text style={styles.lessonPattern}>الگو: {preview.pattern}</Text> : null}
                                  <View style={styles.lessonFooter}>
                                    <View style={styles.lessonFooterItem}><Clock3 size={12} color={Palette.muted} /><Text style={styles.lessonFooterText}>{fa(lesson.durationMinutes)} دقیقه</Text></View>
                                    <Text style={styles.lessonFooterDot}>·</Text>
                                    <Text style={styles.lessonFooterText}>{fa(lesson.sentences.length)} جمله</Text>
                                  </View>
                                </View>
                                <View style={styles.lessonPlayIcon}><Play size={13} color={Palette.primary} fill={Palette.primary} /></View>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.disclaimer}>این سطح‌بندی نقشهٔ آموزشی داخلی برنامه است؛ گواهی یا اعتبارسنجی رسمی CEFR نیست.</Text>
            </>
          )}
          {error && !selectedLevel ? (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {progress === null && !error ? <Text style={styles.loading}>در حال خواندن پیشرفت آلمانی…</Text> : null}
          {error ? <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => setRetry(value => value + 1)}><Text style={styles.retryText}>تلاش دوباره</Text></Pressable> : null}
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <GermanBottomNav />
      </View>
    </View>
  );
}
