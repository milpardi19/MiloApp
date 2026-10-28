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
import { EnglishLevelRail, EnglishProgressTrack, displayEnglishModuleLabel, ENGLISH_LEVEL_GRADIENTS } from '@/components/EnglishUI';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { luxuryLibraryStyles as styles } from '@/components/luxuryLibraryStyles';
import { LuxuryPalette } from '@/components/luxuryTheme';
import { RussianBottomNav } from '@/components/RussianBottomNav';
import { RUSSIAN_LEVELS, RUSSIAN_LESSONS, russianProgress, type RussianLevelId } from '@/lib/languages/russian';
import type { CourseProgress } from '@/lib/courseProgress';
import { clearRussianLessonSession, loadAllRussianLessonSessions, type RussianLessonSession } from '@/lib/languages/russianStudyState';
import { toPersianDigits as fa } from '@/lib/format';

const LESSONS_PER_GROUP = 10;

function lessonStatus(lessonId: string, progress: CourseProgress | null, sessions: Record<string, RussianLessonSession | null>) {
  if (progress?.completedLessonIds.includes(lessonId)) return 'تکمیل‌شده';
  const session = sessions[lessonId];
  if (session && (session.stage > 0 || session.sentenceIndex > 0)) {
    return `ادامه · مرحله ${fa(session.stage + 1)}`;
  }
  return 'شروع درس';
}

export default function RussianLibrary() {
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level?: string }>();
  const [hydrated, setHydrated] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(0);
  const [showTopics, setShowTopics] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [sessions, setSessions] = useState<Record<string, RussianLessonSession | null>>({});
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => setHydrated(true), []);
  const selected = hydrated ? RUSSIAN_LEVELS.find(item => String(item.id) === String(level)) : undefined;
  const selectedLessons = useMemo(() => selected ? RUSSIAN_LESSONS.filter(item => item.levelId === selected.id) : [], [selected?.id]);
  const lessonGroups = useMemo(() => {
    const groups: typeof selectedLessons[] = [];
    for (let index = 0; index < selectedLessons.length; index += LESSONS_PER_GROUP) groups.push(selectedLessons.slice(index, index + LESSONS_PER_GROUP));
    return groups;
  }, [selectedLessons]);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void Promise.all([
      russianProgress.getCourseProgress(),
      loadAllRussianLessonSessions(),
    ]).then(([nextProgress, nextSessions]) => {
      if (!alive) return;
      setProgress(nextProgress);
      setSessions(nextSessions);
      setError('');
    }).catch(() => { if (alive) setError('وضعیت ذخیره‌شده خوانده نشد؛ فهرست درس‌ها همچنان در دسترس است.'); });
    return () => { alive = false; };
  }, [retry]));

  useEffect(() => {
    setExpandedGroup(0);
    setShowTopics(false);
  }, [selected?.id]);

  const completedIds = progress?.completedLessonIds ?? [];
  const firstUnfinished = RUSSIAN_LESSONS.find(item => !completedIds.includes(item.id)) ?? RUSSIAN_LESSONS[RUSSIAN_LESSONS.length - 1];
  const activeLevelId = firstUnfinished.levelId;
  const countFor = (levelId: RussianLevelId) => {
    const lessons = RUSSIAN_LESSONS.filter(item => item.levelId === levelId);
    return { total: lessons.length, completed: lessons.filter(item => completedIds.includes(item.id)).length };
  };
  const { sentenceCount, words } = useMemo(() => ({
    sentenceCount: selectedLessons.reduce((count, lesson) => count + lesson.sentences.length, 0),
    words: new Set(selectedLessons.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word)))),
  }), [selectedLessons]);
  const { allWords, totalSentences } = useMemo(() => ({
    allWords: new Set(RUSSIAN_LESSONS.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(item => item.word)))),
    totalSentences: RUSSIAN_LESSONS.reduce((count, lesson) => count + lesson.sentences.length, 0),
  }), []);

  const openLevel = (levelId: RussianLevelId) => router.push(`/learn/ru/library?level=${levelId}` as never);
  const openLesson = (id: string) => router.push(`/learn/ru/lesson?id=${encodeURIComponent(id)}` as never);
  const openFirstLesson = () => {
    const first = RUSSIAN_LESSONS[0];
    void clearRussianLessonSession(first.id).catch(() => undefined).finally(() => {
      openLesson(first.id);
    });
  };
  const railLevels = RUSSIAN_LEVELS.map((item, idx) => ({ ...item, id: idx as 0 | 1 | 2 | 3 }));
  const railCounts = Object.fromEntries(RUSSIAN_LEVELS.map((item, idx) => [idx, countFor(item.id)]));
  const activeRailIndex = Math.max(0, RUSSIAN_LEVELS.findIndex(item => item.id === activeLevelId)) as 0 | 1 | 2 | 3 | 4;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {!selected ? (
            <>
              <LuxuryTopBar
                language="ru"
                eyebrow="RUSSIAN LIBRARY"
                title="کتابخانهٔ درس‌های روسی"
                backFallbackHref="/learn/ru"
              />

              <LinearGradient colors={LuxuryPalette.heroGradient} start={{ x: 0.95, y: 0.1 }} end={{ x: 0.05, y: 0.95 }} style={styles.overviewHero}>
                <View pointerEvents="none" style={styles.heroOrb} />
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIcon}><BookOpenCheck size={18} color="#FFFFFF" /></View>
                  <View style={styles.heroPill}><Sparkles size={13} color={LuxuryPalette.goldLight} /><Text style={styles.heroPillText}>{fa(RUSSIAN_LEVELS.length)} سطح آموزشی</Text></View>
                </View>
                <Text style={styles.overviewEyebrow}>FROM THE FIRST SENTENCE ONWARD</Text>
                <Text style={styles.overviewTitle}>مسیر جمله‌محور و ساختاریافته</Text>
                <Text style={styles.overviewText}>سطح موردنظر را انتخاب کنید تا درس‌ها، جمله‌ها و تمرین‌های تعاملی آن باز شوند.</Text>
                <View style={styles.overviewMetrics}>
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(RUSSIAN_LESSONS.length)}</Text><Text style={styles.overviewMetricLabel}>کل درس‌ها</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(totalSentences)}</Text><Text style={styles.overviewMetricLabel}>جمله‌های کاربردی</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{fa(allWords.size)}</Text><Text style={styles.overviewMetricLabel}>واژهٔ یکتا</Text></View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="شروع از درس اول روسی"
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
                  <EnglishLevelRail
                    activeLevelId={activeRailIndex}
                    counts={railCounts}
                    levels={railLevels}
                    startLabel={RUSSIAN_LEVELS[0].cefr}
                    numberOffset={1}
                    direction="rtl"
                    onSelect={railIdx => {
                      const target = RUSSIAN_LEVELS[railIdx];
                      if (target) openLevel(target.id);
                    }}
                  />
                </View>
                <Text style={styles.railCurrent}>سطح فعال · {RUSSIAN_LEVELS.find(item => item.id === activeLevelId)?.title}</Text>
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>CHOOSE A LEVEL</Text>
                  <Text style={styles.sectionTitle}>انتخاب سطح</Text>
                </View>
              </View>

              <View style={styles.levelList}>
                {RUSSIAN_LEVELS.map(item => {
                  const stats = countFor(item.id);
                  const levelLessons = RUSSIAN_LESSONS.filter(lesson => lesson.levelId === item.id);
                  const levelSentenceTotal = levelLessons.reduce((count, lesson) => count + lesson.sentences.length, 0);
                  const levelWordTotal = new Set(levelLessons.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocabulary.map(word => word.word)))).size;
                  const pct = stats.total ? (stats.completed / stats.total) * 100 : 0;
                  const accent = ENGLISH_LEVEL_GRADIENTS[item.id][0];
                  return (
                    <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`فهرست درس‌های ${item.title}`} style={({ pressed }) => [styles.levelOption, pressed && styles.pressed]} onPress={() => openLevel(item.id)}>
                      <LinearGradient colors={ENGLISH_LEVEL_GRADIENTS[item.id]} style={styles.levelOptionMark}>
                        <Text style={styles.levelOptionNumber}>{fa(item.id + 1)}</Text>
                      </LinearGradient>
                      <View style={styles.levelOptionContent}>
                        <View style={styles.levelOptionTitleRow}>
                          <Text style={styles.levelOptionTitle}>{item.title}</Text>
                          <Text style={[styles.levelOptionBand, { color: accent }]}>{item.cefr}</Text>
                        </View>
                        <Text style={styles.levelOptionDescription} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.levelOptionMeta}>
                          <Text style={styles.levelOptionMetaText}>{fa(stats.total)} درس</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{fa(levelSentenceTotal)} جمله</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{fa(levelWordTotal)} واژهٔ یکتا</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{item.status === 'planned' ? 'در نقشهٔ آینده' : `${fa(stats.completed)} تکمیل`}</Text>
                        </View>
                        <EnglishProgressTrack value={pct} color={accent} height={6} />
                      </View>
                      <ChevronLeft size={19} color={Palette.muted} />
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <LuxuryTopBar
                language="ru"
                eyebrow={`LEVEL ${selected.id + 1} · ${selected.cefr}`}
                title={selected.title}
                backFallbackHref="/learn/ru/library"
                onBack={() => router.replace('/learn/ru/library' as never)}
              />

              <LinearGradient colors={ENGLISH_LEVEL_GRADIENTS[selected.id]} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.levelHero}>
                <View pointerEvents="none" style={styles.levelHeroOrb} />
                <View style={styles.levelHeroTop}>
                  <View style={styles.levelHeroTag}><Text style={styles.levelHeroTagText}>LEVEL {selected.id + 1}</Text></View>
                  <Text style={styles.levelHeroBand}>{selected.cefr}</Text>
                </View>
                <Text style={styles.selectedTitle}>{selected.title}</Text>
                <Text style={styles.selectedDescription}>{selected.description}</Text>
                <View style={styles.selectedProgressHeading}>
                  <Text style={styles.selectedProgressLabel}>پیشرفت این سطح</Text>
                  <Text style={styles.selectedProgressValue}>{fa(countFor(selected.id).completed)} از {fa(selectedLessons.length)} درس</Text>
                </View>
                <View style={styles.selectedProgressTrack}><View style={[styles.selectedProgressFill, { width: `${selectedLessons.length ? (countFor(selected.id).completed / selectedLessons.length) * 100 : 0}%` }]} /></View>
                <View style={styles.metricGrid}>
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(selectedLessons.length)}</Text><Text style={styles.heroMetricLabel}>درس</Text></View>
                  <View style={styles.heroMetricDivider} />
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(sentenceCount)}</Text><Text style={styles.heroMetricLabel}>جمله</Text></View>
                  <View style={styles.heroMetricDivider} />
                  <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{fa(words.size)}</Text><Text style={styles.heroMetricLabel}>واژهٔ یکتا</Text></View>
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
                <Text style={styles.focusDescription}>{selected.description}</Text>
                {showTopics ? (
                  <View style={styles.moduleGrid}>
                    {selected.modules.map((module, index) => (
                      <View key={`${index}-${module}`} style={styles.moduleChip}>
                        <View style={[styles.moduleDot, { backgroundColor: ENGLISH_LEVEL_GRADIENTS[selected.id][0] }]} />
                        <Text style={styles.moduleText}>{displayEnglishModuleLabel(module)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.focusFootnote}>{selected.status === 'planned' ? 'این سطح بخشی از نقشهٔ آینده است.' : ''}</Text>
              </View>

              <View style={styles.lessonSectionHeading}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>ORDERED LESSONS</Text>
                  <Text style={styles.lessonSectionTitle}>فهرست درس‌ها</Text>
                </View>
                <View style={styles.lessonCountPill}><BookOpen size={13} color={Palette.primary} /><Text style={styles.lessonCountText}>{fa(selectedLessons.length)} درس</Text></View>
              </View>

              {selectedLessons.length ? (
                <View style={styles.groupList}>
                  {lessonGroups.map((group, index) => {
                    const first = group[0];
                    const last = group[group.length - 1];
                    const groupCompleted = group.filter(item => completedIds.includes(item.id)).length;
                    const open = expandedGroup === index;
                    return (
                      <View key={`${first.id}-${last.id}`} style={styles.group}>
                        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.groupHeader} onPress={() => setExpandedGroup(open ? -1 : index)}>
                          <View style={[styles.groupNumber, open && styles.groupNumberActive]}><Text style={[styles.groupNumberText, open && styles.groupNumberTextActive]}>{fa(index + 1)}</Text></View>
                          <View style={styles.groupHeaderCopy}>
                            <Text style={styles.groupTitle}>بخش {fa(index + 1)} · درس‌های {fa(first.order)} تا {fa(last.order)}</Text>
                            <Text style={styles.groupMeta}>{fa(group.length)} درس · {fa(groupCompleted)} تکمیل‌شده</Text>
                          </View>
                          {open ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.muted} />}
                        </Pressable>
                        {open && (
                          <View style={styles.lessonList}>
                            {group.map(item => {
                              const status = lessonStatus(item.id, progress, sessions);
                              const complete = progress?.completedLessonIds.includes(item.id) ?? false;
                              const resumable = !complete && status.startsWith('ادامه');
                              const sentence = item.sentences[0];
                              return (
                                <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.order}. ${item.title}`} style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]} onPress={() => openLesson(item.id)}>
                                  <View style={[styles.lessonOrder, complete && styles.lessonOrderComplete]}>
                                    {complete ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={styles.lessonOrderText}>{fa(item.order)}</Text>}
                                  </View>
                                  <View style={styles.lessonCopy}>
                                    <View style={styles.lessonTitleLine}>
                                      <Text style={styles.lessonTitle}>{item.title}</Text>
                                      <View style={[styles.lessonStatus, complete && styles.lessonStatusDone, resumable && styles.lessonStatusResume]}>
                                        <Text style={[styles.lessonStatusText, complete && styles.lessonStatusTextDone, resumable && styles.lessonStatusTextResume]}>{status}</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.lessonSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                    <View style={styles.lessonSentencePreview}>
                                      <View style={styles.lessonSentenceHeader}><Volume2 size={12} color={Palette.primary} /><Text style={styles.lessonSentenceEyebrow}>جملهٔ آغازین</Text></View>
                                      <Text style={styles.lessonSentenceTarget} numberOfLines={1}>{sentence.text}</Text>
                                      <Text style={styles.lessonSentenceFa} numberOfLines={1}>{sentence.fa}</Text>
                                      {sentence.pattern ? <Text style={styles.lessonPattern}>الگوی جمله‌سازی: {sentence.pattern}</Text> : null}
                                      {!!sentence.vocabulary.length && (
                                        <View style={styles.lessonVocabRow}>
                                          {sentence.vocabulary.slice(0, 3).map(word => <Text key={word.word} style={styles.lessonVocabChip}>{word.word} · {word.meaning}</Text>)}
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.lessonFooter}>
                                      <View style={styles.lessonFooterItem}><Clock3 size={12} color={Palette.muted} /><Text style={styles.lessonFooterText}>{fa(item.durationMinutes)} دقیقه</Text></View>
                                      <Text style={styles.lessonFooterDot}>·</Text>
                                      <Text style={styles.lessonFooterText}>{fa(item.sentences.length)} جمله</Text>
                                    </View>
                                  </View>
                                  <View style={styles.lessonPlayIcon}><Play size={13} color={Palette.primary} fill={Palette.primary} /></View>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyLevel}>
                  <View style={styles.emptyIcon}><Sparkles size={24} color={Palette.primary} /></View>
                  <Text style={styles.emptyTitle}>درس‌های این سطح در حال تدوین است</Text>
                  <Text style={styles.emptyDescription}>لطفاً یکی از سطح‌های فعال مسیر را انتخاب کنید.</Text>
                </View>
              )}
            </>
          )}
          {!!error && (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}><Text style={styles.retryText}>تلاش دوباره</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <RussianBottomNav />
      </View>
    </View>
  );
}
