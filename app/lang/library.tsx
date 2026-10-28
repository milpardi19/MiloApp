import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { COURSE_LEVELS, SENTENCE_LESSONS, type CourseLevelId, type SentenceLesson } from '@/lib/courseContent';
import { getCourseProgress, type CourseProgress } from '@/lib/courseProgress';
import { freshSession, loadStudy, saveLessonSession, type StudyState } from '@/lib/englishStudyState';
import { ENGLISH_ENGINE_BLUEPRINT, getAdvancedContentComposition, getEnglishLevelMetrics } from '@/lib/englishLearningEngine';
import { ENGLISH_PHONEME_LICENSE } from '@/lib/englishPhonemeLicense';
import { AppBottomNav } from '@/components/AppBottomNav';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import {
  ENGLISH_LEVEL_GRADIENTS,
  EnglishLevelRail,
  EnglishProgressTrack,
  displayEnglishModuleLabel,
} from '@/components/EnglishUI';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { luxuryLibraryStyles as styles } from '@/components/luxuryLibraryStyles';
import { LuxuryPalette } from '@/components/luxuryTheme';
import { toPersianDigits } from '@/lib/format';

const LESSONS_PER_GROUP = 10;
const sentenceTotal = SENTENCE_LESSONS.reduce((total, lesson) => total + lesson.sentences.length, 0);

function lessonStatus(lesson: SentenceLesson, progress: CourseProgress | null, study: StudyState | null) {
  if (progress?.completedLessonIds.includes(lesson.id)) return 'تکمیل‌شده';
  const session = study?.sessions[lesson.id];
  if (session && (session.stage > 0 || session.sentenceIndex > 0)) {
    return `ادامه · مرحله ${toPersianDigits(session.stage + 1)}`;
  }
  return 'شروع درس';
}

export default function EnglishLessonList() {
  const [showLicense, setShowLicense] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(0);
  const { level } = useLocalSearchParams<{ level?: string }>();
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [study, setStudy] = useState<StudyState | null>(null);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  const selected = hydrated ? COURSE_LEVELS.find(item => String(item.id) === level) : undefined;
  useEffect(() => {
    let alive = true;
    void Promise.all([getCourseProgress(), loadStudy()]).then(([nextProgress, nextStudy]) => {
      if (alive) { setProgress(nextProgress); setStudy(nextStudy); }
    }).catch(() => {
      if (alive) setError('وضعیت ذخیره‌شده خوانده نشد؛ فهرست همچنان قابل استفاده است.');
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    setExpandedGroup(0);
    setShowTopics(false);
  }, [selected?.id]);

  const lessons = useMemo(() => selected ? SENTENCE_LESSONS.filter(item => item.levelId === selected.id) : [], [selected?.id]);
  const completedIds = progress?.completedLessonIds ?? [];
  const completed = lessons.filter(item => completedIds.includes(item.id)).length;
  const metrics = selected ? getEnglishLevelMetrics(selected.id, completedIds) : null;
  const blueprint = selected ? ENGLISH_ENGINE_BLUEPRINT.find(item => item.levelId === selected.id) : null;
  const advancedComposition = getAdvancedContentComposition();
  const lessonGroups = useMemo(() => {
    const collections = selected?.id === 4
      ? [
          lessons.filter(item => item.contentKind === 'scenario'),
          lessons.filter(item => item.contentKind === 'vocabulary-practice'),
        ]
      : [lessons];
    const groups: typeof lessons[] = [];
    for (const collection of collections) {
      for (let index = 0; index < collection.length; index += LESSONS_PER_GROUP) {
        groups.push(collection.slice(index, index + LESSONS_PER_GROUP));
      }
    }
    return groups;
  }, [lessons, selected?.id]);
  const activeLesson = SENTENCE_LESSONS.find(item => item.id === progress?.currentLessonId) ?? SENTENCE_LESSONS[0];
  const activeLevelId = activeLesson.levelId;
  const counts = Object.fromEntries(COURSE_LEVELS.map(item => {
    const value = getEnglishLevelMetrics(item.id, completedIds);
    return [item.id, { completed: value.completedLessonCount, total: value.lessonCount }];
  }));
  const allWords = new Set(SENTENCE_LESSONS.flatMap(item => item.sentences.flatMap(sentence => sentence.vocabulary.map(word => word.word))));

  const openLevel = (levelId: CourseLevelId) => router.push({ pathname: '/lang/library', params: { level: String(levelId) } } as never);
  const openFirstLesson = () => {
    const first = SENTENCE_LESSONS[0];
    void saveLessonSession(first.id, freshSession()).catch(() => undefined).finally(() => {
      router.push({ pathname: '/course/lesson', params: { id: first.id } } as never);
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {!selected ? (
            <>
              <LuxuryTopBar
                language="en"
                eyebrow="ENGLISH LIBRARY"
                title="کتابخانهٔ درس‌های انگلیسی"
                backFallbackHref="/lang"
              />

              <LinearGradient colors={LuxuryPalette.heroGradient} start={{ x: 0.95, y: 0.1 }} end={{ x: 0.05, y: 0.95 }} style={styles.overviewHero}>
                <View pointerEvents="none" style={styles.heroOrb} />
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIcon}><BookOpenCheck size={18} color="#FFFFFF" /></View>
                  <View style={styles.heroPill}><Sparkles size={13} color={LuxuryPalette.goldLight} /><Text style={styles.heroPillText}>۵ سطح آموزشی</Text></View>
                </View>
                <Text style={styles.overviewEyebrow}>FROM THE FIRST SENTENCE ONWARD</Text>
                <Text style={styles.overviewTitle}>مسیر جمله‌محور و ساختاریافته</Text>
                <Text style={styles.overviewText}>سطح موردنظر را انتخاب کنید تا درس‌ها، جمله‌ها و تمرین‌های تعاملی آن باز شوند.</Text>
                <View style={styles.overviewMetrics}>
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{toPersianDigits(SENTENCE_LESSONS.length)}</Text><Text style={styles.overviewMetricLabel}>کل درس‌ها</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{toPersianDigits(sentenceTotal)}</Text><Text style={styles.overviewMetricLabel}>جمله‌های کاربردی</Text></View>
                  <View style={styles.overviewMetricDivider} />
                  <View style={styles.overviewMetric}><Text style={styles.overviewMetricValue}>{toPersianDigits(allWords.size)}</Text><Text style={styles.overviewMetricLabel}>واژهٔ یکتا</Text></View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="شروع از درس اول انگلیسی"
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
                <View style={styles.railWrap}><EnglishLevelRail activeLevelId={activeLevelId} counts={counts} direction="rtl" onSelect={openLevel} /></View>
                <Text style={styles.railCurrent}>سطح فعال · {COURSE_LEVELS.find(item => item.id === activeLevelId)?.title}</Text>
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>CHOOSE A LEVEL</Text>
                  <Text style={styles.sectionTitle}>انتخاب سطح</Text>
                </View>
              </View>

              <View style={styles.levelList}>
                {COURSE_LEVELS.map(item => {
                  const stats = getEnglishLevelMetrics(item.id, completedIds);
                  const pct = stats.lessonCount ? (stats.completedLessonCount / stats.lessonCount) * 100 : 0;
                  const accent = ENGLISH_LEVEL_GRADIENTS[item.id][0];
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`فهرست درس‌های ${item.title}`}
                      style={({ pressed }) => [styles.levelOption, pressed && styles.pressed]}
                      onPress={() => openLevel(item.id)}
                    >
                      <LinearGradient colors={ENGLISH_LEVEL_GRADIENTS[item.id]} style={styles.levelOptionMark}>
                        <Text style={styles.levelOptionNumber}>{toPersianDigits(item.id)}</Text>
                      </LinearGradient>
                      <View style={styles.levelOptionContent}>
                        <View style={styles.levelOptionTitleRow}>
                          <Text style={styles.levelOptionTitle}>{item.title}</Text>
                          <Text style={[styles.levelOptionBand, { color: accent }]}>{item.cefr}</Text>
                        </View>
                        <Text style={styles.levelOptionDescription} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.levelOptionMeta}>
                          <Text style={styles.levelOptionMetaText}>{toPersianDigits(stats.lessonCount)} درس</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{toPersianDigits(stats.sentenceCount)} جمله</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{toPersianDigits(stats.vocabularyCount)} واژهٔ یکتا</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.levelOptionMetaText}>{toPersianDigits(stats.completedLessonCount)} تکمیل</Text>
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
                language="en"
                eyebrow={`LEVEL ${selected.id} · ${selected.cefr}`}
                title={selected.title}
                backFallbackHref="/lang/library"
                onBack={() => router.replace('/lang/library' as never)}
              />

              {metrics && (
                <LinearGradient colors={ENGLISH_LEVEL_GRADIENTS[selected.id]} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.levelHero}>
                  <View pointerEvents="none" style={styles.levelHeroOrb} />
                  <View style={styles.levelHeroTop}>
                    <View style={styles.levelHeroTag}><Text style={styles.levelHeroTagText}>LEVEL {selected.id}</Text></View>
                    <Text style={styles.levelHeroBand}>{selected.cefr}</Text>
                  </View>
                  <Text style={styles.selectedTitle}>{selected.title}</Text>
                  <Text style={styles.selectedDescription}>{selected.description}</Text>
                  <View style={styles.selectedProgressHeading}>
                    <Text style={styles.selectedProgressLabel}>پیشرفت این سطح</Text>
                    <Text style={styles.selectedProgressValue}>{toPersianDigits(completed)} از {toPersianDigits(lessons.length)} درس</Text>
                  </View>
                  <View style={styles.selectedProgressTrack}><View style={[styles.selectedProgressFill, { width: `${lessons.length ? (completed / lessons.length) * 100 : 0}%` }]} /></View>
                  <View style={styles.metricGrid}>
                    <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{toPersianDigits(lessons.length)}</Text><Text style={styles.heroMetricLabel}>درس</Text></View>
                    <View style={styles.heroMetricDivider} />
                    <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{toPersianDigits(metrics.sentenceCount)}</Text><Text style={styles.heroMetricLabel}>جمله</Text></View>
                    <View style={styles.heroMetricDivider} />
                    <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{toPersianDigits(metrics.vocabularyCount)}</Text><Text style={styles.heroMetricLabel}>واژهٔ یکتا</Text></View>
                  </View>
                </LinearGradient>
              )}

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
                    {(blueprint?.modules ?? selected.modules).map((module, index) => (
                      <View key={`${index}-${module}`} style={styles.moduleChip}>
                        <View style={[styles.moduleDot, { backgroundColor: ENGLISH_LEVEL_GRADIENTS[selected.id][0] }]} />
                        <Text style={styles.moduleText}>{displayEnglishModuleLabel(module)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.focusFootnote}>
                  {selected.id === 4
                    ? `${toPersianDigits(advancedComposition.scenarioLessonCount)} درس سناریومحور و ${toPersianDigits(advancedComposition.vocabularyPracticeLessonCount)} بستهٔ مرور واژگان`
                    : ''}
                </Text>
              </View>

              <View style={styles.lessonSectionHeading}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>ORDERED LESSONS</Text>
                  <Text style={styles.lessonSectionTitle}>فهرست درس‌ها</Text>
                </View>
                <View style={styles.lessonCountPill}><BookOpen size={13} color={Palette.primary} /><Text style={styles.lessonCountText}>{toPersianDigits(lessons.length)} درس</Text></View>
              </View>

              <View style={styles.groupList}>
                {lessonGroups.map((group, index) => {
                  const first = group[0];
                  const last = group[group.length - 1];
                  const groupCompleted = group.filter(item => completedIds.includes(item.id)).length;
                  const open = expandedGroup === index;
                  const advancedGroup = selected?.id === 4;
                  const groupKind = first.contentKind;
                  const groupNumber = advancedGroup
                    ? lessonGroups.slice(0, index + 1).filter(items => items[0]?.contentKind === groupKind).length
                    : index + 1;
                  const groupTitle = advancedGroup && groupKind === 'scenario'
                    ? `سناریوهای پیشرفته · بستهٔ ${toPersianDigits(groupNumber)}`
                    : advancedGroup && groupKind === 'vocabulary-practice'
                      ? `مرور واژگان · بستهٔ ${toPersianDigits(groupNumber)}`
                      : `بخش ${toPersianDigits(groupNumber)} · درس‌های ${toPersianDigits(first.order)} تا ${toPersianDigits(last.order)}`;
                  return (
                    <View key={`${first.id}-${last.id}`} style={styles.group}>
                      <Pressable accessibilityRole="button" accessibilityLabel={groupTitle} accessibilityState={{ expanded: open }} style={styles.groupHeader} onPress={() => setExpandedGroup(open ? -1 : index)}>
                        <View style={[styles.groupNumber, open && styles.groupNumberActive]}><Text style={[styles.groupNumberText, open && styles.groupNumberTextActive]}>{toPersianDigits(groupNumber)}</Text></View>
                        <View style={styles.groupHeaderCopy}>
                          <Text style={styles.groupTitle}>{groupTitle}</Text>
                          <Text style={styles.groupMeta}>{toPersianDigits(group.length)} درس · {toPersianDigits(groupCompleted)} تکمیل‌شده</Text>
                        </View>
                        {open ? <ChevronUp size={18} color={Palette.primary} /> : <ChevronDown size={18} color={Palette.muted} />}
                      </Pressable>
                      {open && (
                        <View style={styles.lessonList}>
                          {group.map(item => {
                            const status = lessonStatus(item, progress, study);
                            const isComplete = progress?.completedLessonIds.includes(item.id) ?? false;
                            const isResumable = !isComplete && status.startsWith('ادامه');
                            const previewSentence = item.sentences[0];
                            return (
                              <Pressable
                                key={item.id}
                                accessibilityRole="button"
                                accessibilityLabel={`${item.order}. ${item.title}${item.contentKind === 'vocabulary-practice' ? '، مرور واژگان از مثال‌های مستقل' : ''}`}
                                style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}
                                onPress={() => router.push({ pathname: '/course/lesson', params: { id: item.id } } as never)}
                              >
                                <View style={[styles.lessonOrder, isComplete && styles.lessonOrderComplete]}>
                                  {isComplete ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={styles.lessonOrderText}>{toPersianDigits(item.order)}</Text>}
                                </View>
                                <View style={styles.lessonCopy}>
                                  <View style={styles.lessonTitleLine}>
                                    <Text style={styles.lessonTitle}>{item.title}</Text>
                                    <View style={[styles.lessonStatus, isComplete && styles.lessonStatusDone, isResumable && styles.lessonStatusResume]}>
                                      <Text style={[styles.lessonStatusText, isComplete && styles.lessonStatusTextDone, isResumable && styles.lessonStatusTextResume]}>{status}</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.lessonSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                  {item.contentKind === 'vocabulary-practice' ? (
                                    <Text style={styles.contentKindNote}>مجموعهٔ مرجع واژگان · مثال‌های مستقل</Text>
                                  ) : null}
                                  {previewSentence ? (
                                    <View style={styles.lessonSentencePreview}>
                                      <View style={styles.lessonSentenceHeader}><Volume2 size={12} color={Palette.primary} /><Text style={styles.lessonSentenceEyebrow}>جملهٔ آغازین</Text></View>
                                      <Text style={styles.lessonSentenceTarget} numberOfLines={1}>{previewSentence.en}</Text>
                                      <Text style={styles.lessonSentenceFa} numberOfLines={1}>{previewSentence.fa}</Text>
                                      {!!previewSentence.vocabulary.length && (
                                        <View style={styles.lessonVocabRow}>
                                          {previewSentence.vocabulary.slice(0, 3).map(word => <Text key={word.word} style={styles.lessonVocabChip}>{word.word} · {word.meaning}</Text>)}
                                        </View>
                                      )}
                                    </View>
                                  ) : null}
                                  <View style={styles.lessonFooter}>
                                    <View style={styles.lessonFooterItem}><Clock3 size={12} color={Palette.muted} /><Text style={styles.lessonFooterText}>{toPersianDigits(item.durationMinutes)} دقیقه</Text></View>
                                    <Text style={styles.lessonFooterDot}>·</Text>
                                    <Text style={styles.lessonFooterText}>{toPersianDigits(item.sentences.length)} جمله</Text>
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

              <View style={styles.licenseArea}>
                <Text style={styles.licenseIntro}>راهنمای واجی درس‌های ۱۰۴ تا ۱۶۱ از واژه‌نامه مشتق شده؛ جایگزین شنیدن نمونه نیست.</Text>
                <Pressable accessibilityRole="button" style={styles.licenseButton} onPress={() => setShowLicense(value => !value)}>
                  <Text style={styles.licenseButtonText}>{showLicense ? 'بستن منبع راهنمای واجی' : 'منبع و مجوز راهنمای واجی'}</Text>
                  {showLicense ? <ChevronUp size={16} color={Palette.primary} /> : <ChevronDown size={16} color={Palette.primary} />}
                </Pressable>
                {showLicense ? <Text style={styles.licenseText}>{ENGLISH_PHONEME_LICENSE}</Text> : null}
              </View>
            </>
          )}
          {!!error && (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <AppBottomNav />
      </View>
    </View>
  );
}
