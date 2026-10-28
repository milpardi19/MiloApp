import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import Brain from 'lucide-react-native/dist/esm/icons/brain';
import Check from 'lucide-react-native/dist/esm/icons/check';
import CheckCircle2 from 'lucide-react-native/dist/esm/icons/circle-check';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import Clock3 from 'lucide-react-native/dist/esm/icons/clock-3';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import * as Speech from '@/lib/narration';
import { AppBottomNav } from '@/components/AppBottomNav';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { luxuryReviewStyles as styles } from '@/components/luxuryReviewStyles';
import { LuxuryPalette } from '@/components/luxuryTheme';
import { SENTENCE_LESSONS } from '@/lib/courseContent';
import {
  getCourseProgress,
  getDueReviewCards,
  rateReviewCard,
  type CourseProgress,
  type ReviewRating,
  type SentenceReviewCard,
} from '@/lib/courseProgress';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { toPersianDigits } from '@/lib/format';
import { useEnglishStudyTimer } from '@/components/useEnglishStudyTimer';

const ratingOptions: Array<{ id: ReviewRating; label: string; hint: string; color: string }> = [
  { id: 'again', label: 'فراموش کردم', hint: '۱۰ دقیقه', color: Palette.danger },
  { id: 'hard', label: 'سخت بود', hint: 'فردا', color: Palette.warning },
  { id: 'good', label: 'خوب بود', hint: 'زمان مناسب', color: Palette.primary },
  { id: 'easy', label: 'آسان بود', hint: 'فاصله بیشتر', color: Palette.success },
];

function contentForCard(card: SentenceReviewCard) {
  const lesson = SENTENCE_LESSONS.find((item) => item.id === card.lessonId);
  const sentence = lesson?.sentences.find((item) => item.id === card.sentenceId);
  return lesson && sentence ? { lesson, sentence } : null;
}

export default function ReviewHome() {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [dueCards, setDueCards] = useState<SentenceReviewCard[]>([]);
  const [sessionCards, setSessionCards] = useState<SentenceReviewCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useEnglishStudyTimer(sessionActive && !finished);

  const load = useCallback(async () => {
    const [nextProgress, nextCards] = await Promise.all([getCourseProgress(), getDueReviewCards()]);
    setProgress(nextProgress);
    setDueCards(nextCards);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const currentCard = sessionCards[cardIndex];
  const currentContent = useMemo(() => currentCard ? contentForCard(currentCard) : null, [currentCard]);
  const reviewCount = dueCards.length;

  const startSession = () => {
    if (!dueCards.length) return;
    setSessionCards(dueCards.slice(0, 20));
    setCardIndex(0);
    setRevealed(false);
    setFinished(false);
    setSessionActive(true);
  };

  const rate = async (rating: ReviewRating) => {
    if (!currentCard || saving) return;
    setSaving(true);
    await rateReviewCard(currentCard.id, rating);
    if (cardIndex + 1 >= sessionCards.length) {
      setSessionActive(false);
      setFinished(true);
      await load();
    } else {
      setCardIndex((value) => value + 1);
      setRevealed(false);
    }
    setSaving(false);
  };

  if (sessionActive && currentContent) {
    const { lesson, sentence } = currentContent;
    const vocabulary = sentence.vocabulary.map((item) => `${item.word} · ${item.meaning}`).join('   ');
    return (
      <View style={styles.root} onTouchStart={timer.interact}>
        <View style={styles.header}>
          <LuxuryTopBar
            language="en"
            eyebrow="ACTIVE REVIEW"
            title="مرور امروز"
            subtitle={`کارت ${toPersianDigits(cardIndex + 1)} از ${toPersianDigits(sessionCards.length)} · ${lesson.title}`}
            backFallbackHref="/review"
            onBack={() => setSessionActive(false)}
          />
        </View>
        <View style={styles.sessionProgressWrap}>
          <View style={styles.sessionProgress}>
            <View style={[styles.sessionProgressFill, { width: `${((cardIndex + 1) / sessionCards.length) * 100}%` }]} />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.sessionContent} showsVerticalScrollIndicator={false}>
          {!!timer.error && <Text accessibilityRole="alert" style={styles.error}>{timer.error}</Text>}
          <View style={styles.sessionTopNavRow}>
            <Text style={styles.recallLabel}>جملهٔ انگلیسی را به یاد بیاورید</Text>
            {cardIndex > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                style={({ pressed }) => [styles.prevCardButton, pressed && styles.pressed]}
                onPress={() => {
                  void Speech.stop();
                  setCardIndex(value => Math.max(0, value - 1));
                  setRevealed(false);
                }}
              >
                <ChevronRight size={15} color={LuxuryPalette.primaryDeep} />
                <Text style={styles.prevCardButtonText}>کارت قبلی</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewFa}>{sentence.fa}</Text>
            {!revealed ? (
              <>
                <Text style={styles.sayHint}>پاسخ را با صدای بلند بگویید</Text>
                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.revealButton, pressed && styles.pressed]} onPress={() => setRevealed(true)}>
                  <Text style={styles.revealButtonText}>نمایش پاسخ</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.answerArea}>
                <View style={styles.answerDivider} />
                <Text style={styles.reviewTarget}>{sentence.en}</Text>
                <Text style={[styles.reviewPronunciation, sentence.pronunciation.startsWith('/ ') && { fontFamily: 'Inter-ExtraBold', writingDirection: 'ltr' }]}>{sentence.pronunciation}</Text>
                {sentence.pronunciation.startsWith('/ ') && <Text style={styles.phonemeNote}>راهنمای واجی</Text>}
                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.soundButton, pressed && styles.pressed]} onPress={() => Speech.speak(sentence.en, { language: 'en-US', rate: 0.78 })}>
                  <Volume2 size={17} color={Palette.primary} />
                  <Text style={styles.soundText}>پخش جمله</Text>
                </Pressable>
                {vocabulary ? <View style={styles.vocabChip}><Sparkles size={13} color={Palette.warning} /><Text style={styles.vocabText}>{vocabulary}</Text></View> : null}
              </View>
            )}
          </View>

          {revealed ? (
            <View style={styles.ratingArea}>
              <Text style={styles.ratingTitle}>یادآوری این جمله چطور بود؟</Text>
              <View style={styles.ratingGrid}>
                {ratingOptions.map((option) => (
                  <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} style={({ pressed }) => [styles.ratingButton, { borderColor: `${option.color}55` }, pressed && styles.pressed]} onPress={() => void rate(option.id)}>
                    {saving ? <ActivityIndicator size="small" color={option.color} /> : <Text style={[styles.ratingLabel, { color: option.color }]}>{option.label}</Text>}
                    <Text style={styles.ratingHint}>{option.hint}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root} onTouchStart={timer.interact}>
      <View style={styles.header}>
        <LuxuryTopBar
          language="en"
          eyebrow="ENGLISH REVIEW"
          title="مرور هوشمند انگلیسی"
          backFallbackHref="/lang"
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!timer.error && <Text accessibilityRole="alert" style={styles.error}>{timer.error}</Text>}

        {finished ? (
          <View style={styles.finishedCard}>
            <View style={styles.finishedIcon}><Check size={30} color={Palette.success} strokeWidth={3} /></View>
            <Text style={styles.finishedTitle}>مرور امروز تمام شد</Text>
            <Text style={styles.finishedDesc}>زمان مرور بعدی هر جمله بر اساس پاسخ شما تنظیم شد.</Text>
          </View>
        ) : null}

        <LinearGradient colors={LuxuryPalette.heroGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.summaryCard}>
          <View pointerEvents="none" style={styles.summaryOrb} />
          <View style={styles.summaryTop}>
            <View style={styles.brain}><Brain size={22} color="#FFFFFF" /></View>
            <View style={styles.summaryTag}><RefreshCw size={12} color={LuxuryPalette.goldLight} /><Text style={styles.summaryTagText}>SPACED REVIEW</Text></View>
          </View>
          <Text style={styles.summaryTitle}>{reviewCount ? `${toPersianDigits(reviewCount)} جمله آمادهٔ مرور` : 'فعلاً مروری ندارید'}</Text>
          <Text style={styles.summaryDesc}>{reviewCount ? 'جمله‌های دشوار زودتر و جمله‌های آسان با فاصلهٔ بیشتر بازمی‌گردند.' : progress?.completedLessonIds.length ? 'مرور بعدی در زمان مناسب به‌طور خودکار در این بخش آماده می‌شود.' : 'پس از پایان نخستین درس، جمله‌های آن وارد برنامهٔ مرور می‌شوند.'}</Text>
          <View style={styles.summaryActions}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !reviewCount }} style={({ pressed }) => [styles.startButton, !reviewCount && styles.disabled, pressed && reviewCount > 0 && styles.pressed]} disabled={!reviewCount} onPress={startSession}>
              <RefreshCw size={16} color={Palette.primaryDark} />
              <Text style={styles.startText}>شروع مرور امروز</Text>
            </Pressable>
            {reviewCount ? <View style={styles.time}><Clock3 size={13} color="#FFFFFF" /><Text style={styles.timeText}>حدود {toPersianDigits(Math.max(2, Math.ceil(reviewCount * 0.6)))} دقیقه</Text></View> : null}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>گام‌های مرور هوشمند</Text>
        <View style={styles.methodList}>
          <Method num="۱" title="معنی را ببینید و جمله را بگویید" desc="پیش از نمایش پاسخ، جمله را با صدای بلند به یاد بیاورید." />
          <Method num="۲" title="پاسخ را ببینید و بشنوید" desc="ساختار و تلفظ صحیح را با پاسخ خود مقایسه کنید." />
          <Method num="۳" title="کیفیت یادآوری را ثبت کنید" desc="زمان دقیق مرور بعدی به‌صورت هوشمند تنظیم می‌شود." last />
        </View>

        <View style={styles.note}><CheckCircle2 size={18} color={Palette.success} /><Text style={styles.noteText}>واژگان همراه جملهٔ اصلی مرور می‌شوند.</Text></View>
      </ScrollView>
      <View style={styles.bottomNavWrap}>
        <AppBottomNav />
      </View>
    </View>
  );
}

function Method({ num, title, desc, last }: { num: string; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[styles.method, last && styles.methodLast]}>
      <View style={styles.methodNum}><Text style={styles.methodNumText}>{num}</Text></View>
      <View style={styles.methodText}><Text style={styles.methodTitle}>{title}</Text><Text style={styles.methodDesc}>{desc}</Text></View>
    </View>
  );
}
