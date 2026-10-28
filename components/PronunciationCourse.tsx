import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import ArrowLeft from 'lucide-react-native/dist/esm/icons/arrow-left';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { useRouter } from 'expo-router';
import { AppBottomNav } from '@/components/AppBottomNav';
import { GermanBottomNav } from '@/components/GermanBottomNav';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { LuxuryPalette, LuxuryShadows } from '@/components/luxuryTheme';
import { RussianBottomNav } from '@/components/RussianBottomNav';
import { preloadSpeechVoices, resolveSpeechOptions } from '@/lib/speechLanguage';
import { Typography } from '@/lib/theme';
import { toPersianDigits as fa } from '@/lib/format';
import {
  PRONUNCIATION_COURSES,
  type PronunciationLanguage,
} from '@/lib/languages/pronunciationCourse';
import {
  loadPronunciationMarks,
  savePronunciationMark,
  type PronunciationMark,
  type PronunciationMarks,
} from '@/lib/languages/pronunciationProgress';

const SHARED_LUXURY_THEME = {
  accent: LuxuryPalette.primary,
  accentDark: LuxuryPalette.primaryDeep,
  soft: LuxuryPalette.primarySoft,
  canvas: LuxuryPalette.canvas,
  surface: LuxuryPalette.surface,
  ink: LuxuryPalette.ink,
  text: LuxuryPalette.inkBody,
  muted: LuxuryPalette.inkMuted,
  border: LuxuryPalette.border,
  gold: LuxuryPalette.goldLight,
} as const;

const THEMES = {
  en: {
    ...SHARED_LUXURY_THEME,
    home: '/lang',
    locale: 'en-US' as const,
    languageFa: 'انگلیسی',
    brand: 'ENGLISH PRONUNCIATION',
  },
  de: {
    ...SHARED_LUXURY_THEME,
    home: '/learn/de',
    locale: 'de-DE' as const,
    languageFa: 'آلمانی',
    brand: 'DEUTSCH PRONUNCIATION',
  },
  ru: {
    ...SHARED_LUXURY_THEME,
    home: '/learn/ru',
    locale: 'ru-RU' as const,
    languageFa: 'روسی',
    brand: 'RUSSIAN PRONUNCIATION',
  },
} as const;

export function PronunciationCourse({ language }: { language: PronunciationLanguage }) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const speechGeneration = useRef(0);
  const units = PRONUNCIATION_COURSES[language];
  const theme = THEMES[language];
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<PronunciationMarks>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [retryStorage, setRetryStorage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const unit = units[index];
  const mark = marks[unit.id]?.mark ?? undefined;
  const practicedCount = Object.values(marks).filter(value => value?.mark === 'practiced').length;
  const reviewCount = Object.values(marks).filter(value => value?.mark === 'review').length;

  useEffect(() => {
    let active = true;
    setMarks({});
    setStorageReady(false);
    setStorageError('');
    void preloadSpeechVoices();
    void loadPronunciationMarks(language).then(next => {
      if (!active) return;
      setMarks(next);
      setStorageReady(true);
      setStorageMessage('');
    }).catch(() => {
      if (!active) return;
      setStorageError('یادداشت محلی تلفظ خوانده نشد. دوباره تلاش کنید.');
    });
    return () => { active = false; };
  }, [language, retryStorage]);

  useEffect(() => () => {
    speechGeneration.current += 1;
    void Speech.stop().catch(() => undefined);
  }, []);

  useEffect(() => setIndex(0), [language]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const stopSpeech = () => {
    const request = ++speechGeneration.current;
    setSpeaking(false);
    setSpeechMessage('');
    void Speech.stop().catch(() => {
      if (request === speechGeneration.current) setSpeechMessage('توقف صدا ممکن نشد.');
    });
  };

  const speak = async (text: string, rate: 'slow' | 'normal') => {
    if (!NARRATION_ENABLED) return;
    const request = ++speechGeneration.current;
    setSpeaking(true);
    setSpeechMessage('');
    try {
      await Speech.stop();
      if (request !== speechGeneration.current) return;
      const targetVoice = await resolveSpeechOptions(theme.locale);
      if (request !== speechGeneration.current) return;
      Speech.speak(text, {
        ...targetVoice,
        rate: rate === 'slow' ? 0.62 : 0.86,
        onDone: () => {
          if (request !== speechGeneration.current) return;
          setSpeaking(false);
        },
        onStopped: () => {
          if (request !== speechGeneration.current) return;
          setSpeaking(false);
        },
        onError: () => {
          if (request !== speechGeneration.current) return;
          setSpeaking(false);
          setSpeechMessage(`صدای ${theme.languageFa} در دسترس نبود.`);
        },
      });
    } catch {
      if (request !== speechGeneration.current) return;
      setSpeaking(false);
      setSpeechMessage(`پخش صدای ${theme.languageFa} انجام نشد.`);
    }
  };

  const saveMark = async (nextMark: PronunciationMark | null) => {
    if (!storageReady || saving) return;
    setSaving(true);
    setStorageMessage('');
    try {
      const next = await savePronunciationMark(language, unit.id, nextMark);
      setMarks(next);
      setStorageMessage(nextMark === null
        ? 'علامت پاک شد.'
        : nextMark === 'practiced'
          ? 'به عنوان تمرین‌شده ثبت شد.'
          : 'برای مرور بعدی نشانه‌گذاری شد.');
    } catch {
      setStorageMessage('ذخیره انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  const goTo = (nextIndex: number) => {
    stopSpeech();
    if (nextIndex < 0 || nextIndex >= units.length) return;
    setIndex(nextIndex);
  };

  const next = () => {
    if (index + 1 < units.length) goTo(index + 1);
    else {
      stopSpeech();
      router.replace(theme.home as never);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.canvas }]}>
      <StatusBar style="dark" />
      <View style={styles.headerWrap}>
        <LuxuryTopBar
          language={language}
          eyebrow={theme.brand}
          title={`کارگاه تلفظ ${theme.languageFa}`}
          backFallbackHref={theme.home}
          leftAccessory={
            <View style={[styles.headerCount, { backgroundColor: theme.soft }]}>
              <Text style={[styles.headerCountText, { color: theme.accentDark }]}>{fa(index + 1)} / {fa(units.length)}</Text>
            </View>
          }
        />
      </View>

      <View style={styles.trackWrap}>
        <View style={[styles.track, { backgroundColor: theme.border }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: units.length, now: index + 1 }}>
          <View style={[styles.trackFill, { width: `${((index + 1) / units.length) * 100}%`, backgroundColor: theme.accent }]} />
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <LinearGradient colors={LuxuryPalette.heroGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.hero}>
            <View pointerEvents="none" style={styles.heroOrb} />
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}><Volume2 size={20} color={theme.gold} /></View>
              <View style={styles.heroTag}><Text style={styles.heroEyebrow}>تمرین {fa(index + 1)} از {fa(units.length)}</Text></View>
            </View>
            <Text accessibilityRole="header" style={styles.heroTitle}>{unit.title}</Text>
            <Text style={styles.heroFocus}>{unit.focusFa}</Text>
            <View style={styles.heroProgressRow}>
              <Text style={styles.heroProgress}>{fa(practicedCount)} تمرین‌شده · {fa(reviewCount)} نشانه‌گذاری‌شده</Text>
            </View>
          </LinearGradient>

          <View style={[styles.noticeCard, { backgroundColor: theme.soft, borderColor: theme.border }]}>
            <Text style={[styles.noticeTitle, { color: theme.accentDark }]}>تمرین خودارزیابی</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>نکتهٔ آوایی این گام</Text>
            <Text style={[styles.body, { color: theme.text }]}>{unit.explanationFa}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>شنیدن و مقایسه</Text>
              <View style={[styles.smallBadge, { backgroundColor: theme.soft }]}>
                <Text style={[styles.smallBadgeText, { color: theme.accentDark }]}>{fa(unit.examples.length)} نمونه</Text>
              </View>
            </View>
            {unit.examples.map((example, exampleIndex) => (
              <View key={`${unit.id}-${exampleIndex}`} style={[styles.example, { borderColor: theme.border, backgroundColor: LuxuryPalette.surfaceSoft }]}>
                <Text style={[styles.exampleText, { color: theme.ink }]}>{example.text}</Text>
                <Text style={[styles.exampleMeaning, { color: theme.text }]}>{example.meaningFa}</Text>
                <Text style={[styles.exampleFocus, { color: theme.muted }]}>{example.focusFa}</Text>
                <View style={styles.audioButtons}>
                  <AudioButton
                    title="پخش آهسته"
                    accessibilityLabel={`پخش آهستهٔ ${example.text} به ${theme.languageFa}`}
                    accent={theme.accent}
                    soft={theme.soft}
                    disabled={false}
                    onPress={() => void speak(example.text, 'slow')}
                  />
                  <AudioButton
                    title="پخش عادی"
                    accessibilityLabel={`پخش عادی ${example.text} به ${theme.languageFa}`}
                    accent={theme.accent}
                    soft={theme.soft}
                    disabled={false}
                    onPress={() => void speak(example.text, 'normal')}
                  />
                </View>
              </View>
            ))}
          </View>

          <LinearGradient colors={LuxuryPalette.heroAltGradient} start={{ x: 0.95, y: 0 }} end={{ x: 0.05, y: 1 }} style={styles.practiceCard}>
            <Text style={styles.practiceLabel}>تمرین در بافت جمله</Text>
            <Text style={styles.practiceText}>{unit.practiceText}</Text>
            <Text style={styles.practiceMeaning}>{unit.practiceMeaningFa}</Text>
            <Text style={styles.practiceInstruction}>{unit.practiceFa}</Text>
            <View style={styles.audioButtons}>
              <AudioButton
                title="پخش آهستهٔ جمله"
                accessibilityLabel={`پخش آهستهٔ جمله به ${theme.languageFa}`}
                accent="#FFFFFF"
                soft="rgba(255,255,255,0.14)"
                disabled={false}
                onPress={() => void speak(unit.practiceText, 'slow')}
                light
              />
              <AudioButton
                title="پخش عادی جمله"
                accessibilityLabel={`پخش عادی جمله به ${theme.languageFa}`}
                accent="#FFFFFF"
                soft="rgba(255,255,255,0.14)"
                disabled={false}
                onPress={() => void speak(unit.practiceText, 'normal')}
                light
              />
            </View>
          </LinearGradient>

          <View style={[styles.selfCheck, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>وضعیت تمرین</Text>
            {!storageReady && !storageError ? <Text style={[styles.smallText, { color: theme.muted }]}>در حال بارگذاری وضعیت…</Text> : null}
            {storageError ? (
              <View style={styles.storageErrorWrap}>
                <Text accessibilityRole="alert" style={styles.storageError}>{storageError}</Text>
                <ActionButton title="تلاش دوباره" accent={theme.accent} soft={theme.soft} onPress={() => setRetryStorage(value => value + 1)} />
              </View>
            ) : null}
            <View style={styles.markButtons}>
              <ActionButton
                title={mark === 'practiced' ? '✓ تمرین شد' : 'تمرین شد'}
                style={styles.footerAction}
                accent={theme.accent}
                soft={theme.soft}
                selected={mark === 'practiced'}
                disabled={!storageReady || saving}
                onPress={() => void saveMark('practiced')}
              />
              <ActionButton
                title={mark === 'review' ? '✓ نشانه‌گذاری مرور' : 'نیاز به مرور'}
                style={styles.footerAction}
                accent={theme.accent}
                soft={theme.soft}
                selected={mark === 'review'}
                disabled={!storageReady || saving}
                onPress={() => void saveMark('review')}
              />
            </View>
            {!!mark && storageReady ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                onPress={() => void saveMark(null)}
                style={styles.clearMark}
              >
                <RotateCcw size={14} color={theme.muted} />
                <Text style={[styles.clearMarkText, { color: theme.muted }]}>پاک‌کردن علامت</Text>
              </Pressable>
            ) : null}
            {!!storageMessage ? <Text accessibilityLiveRegion="polite" style={[styles.smallText, { color: theme.muted }]}>{storageMessage}</Text> : null}
          </View>

          {!!speechMessage ? <Text accessibilityLiveRegion="polite" style={[styles.audioStatus, { color: LuxuryPalette.coral }]}>{speechMessage}</Text> : null}
          {speaking ? (
            <ActionButton title="توقف صدا" accent={theme.accent} soft={theme.soft} secondary onPress={stopSpeech} />
          ) : null}

          <View style={styles.stepActionsRow}>
            <ActionButton
              title="گام قبلی"
              style={styles.footerAction}
              accent={theme.accent}
              soft={theme.soft}
              secondary
              disabled={index === 0 || saving}
              icon={<ChevronRight size={17} color={theme.accent} />}
              onPress={() => goTo(index - 1)}
            />
            <ActionButton
              title={index + 1 === units.length ? 'پایان و بازگشت' : 'گام بعدی'}
              style={styles.footerAction}
              accent={theme.accent}
              soft={theme.soft}
              disabled={saving}
              icon={index + 1 === units.length ? <ArrowLeft size={17} color="#FFFFFF" /> : <ChevronLeft size={17} color="#FFFFFF" />}
              onPress={next}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavWrap}>
        {language === 'de' ? <GermanBottomNav /> : language === 'ru' ? <RussianBottomNav /> : <AppBottomNav />}
      </View>
    </View>
  );
}

function AudioButton({
  title,
  accessibilityLabel,
  accent,
  soft,
  onPress,
  disabled,
  light = false,
}: {
  title: string;
  accessibilityLabel: string;
  accent: string;
  soft: string;
  onPress: () => void;
  disabled: boolean;
  light?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.audioButton,
        { backgroundColor: soft, borderColor: light ? 'rgba(255,255,255,0.24)' : LuxuryPalette.primaryBorder },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Volume2 size={15} color={accent} />
      <Text style={[styles.audioButtonText, { color: accent }]}>{title}</Text>
    </Pressable>
  );
}

function ActionButton({
  title,
  accent,
  soft,
  onPress,
  disabled = false,
  secondary = false,
  selected = false,
  icon,
  style,
}: {
  title: string;
  accent: string;
  soft: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  selected?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        style,
        { backgroundColor: secondary ? '#FFFFFF' : accent, borderColor: secondary ? LuxuryPalette.border : 'transparent' },
        selected && { backgroundColor: soft, borderColor: accent },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      <Text style={[styles.actionButtonText, { color: secondary || selected ? LuxuryPalette.primaryDeep : '#FFFFFF' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, direction: 'ltr' },
  headerWrap: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  headerCount: { minWidth: 58, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: LuxuryPalette.primaryBorder },
  headerCountText: { fontFamily: Typography.numberFontFamily, fontSize: 11.5, fontWeight: '800', writingDirection: 'ltr' },
  trackWrap: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 4 },
  track: { height: 6, width: '100%', borderRadius: 999, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 999, alignSelf: 'flex-end' },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 15 },
  bottomNavWrap: { paddingHorizontal: 14 },

  hero: { position: 'relative', overflow: 'hidden', padding: 22, borderRadius: 26, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', ...LuxuryShadows.hero },
  heroOrb: { position: 'absolute', top: -70, left: -45, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(120, 170, 255, 0.14)' },
  heroTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  heroTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(246, 217, 146, 0.16)', borderWidth: 1, borderColor: 'rgba(246, 217, 146, 0.34)' },
  heroEyebrow: { fontFamily: Typography.fontFamily, color: LuxuryPalette.goldLight, fontSize: 11.5, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  heroTitle: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 23, lineHeight: 34, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  heroFocus: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.84)', fontSize: 13, lineHeight: 22, fontWeight: '500', textAlign: 'right', writingDirection: 'rtl' },
  heroProgressRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  heroProgress: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.80)', fontSize: 11.5, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },

  noticeCard: { display: 'none', padding: 14, borderRadius: 17, borderWidth: 1, gap: 6 },
  noticeTitle: { fontSize: 12 },

  card: { padding: 18, borderRadius: 24, borderWidth: 1, gap: 12, ...LuxuryShadows.card },
  sectionHeadingRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontFamily: Typography.fontFamily, flex: 1, fontSize: 16, lineHeight: 25, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  body: { fontFamily: Typography.fontFamily, fontSize: 13, lineHeight: 23, textAlign: 'right', writingDirection: 'rtl' },
  smallBadge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: LuxuryPalette.primaryBorder },
  smallBadgeText: { fontFamily: Typography.fontFamily, fontSize: 11, fontWeight: '800', writingDirection: 'rtl' },

  example: { padding: 15, borderRadius: 18, borderWidth: 1, gap: 6 },
  exampleText: { fontFamily: 'Inter-ExtraBold', fontSize: 19, lineHeight: 30, fontWeight: '800', textAlign: 'left', writingDirection: 'ltr' },
  exampleMeaning: { fontFamily: Typography.fontFamily, fontSize: 12.5, lineHeight: 20, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  exampleFocus: { fontFamily: Typography.fontFamily, fontSize: 11.5, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  audioButtons: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  audioButton: { minHeight: 38, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  audioButtonText: { fontFamily: Typography.fontFamily, fontSize: 11.5, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },

  practiceCard: { padding: 20, borderRadius: 24, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', ...LuxuryShadows.hero },
  practiceLabel: { fontFamily: Typography.fontFamily, color: LuxuryPalette.goldLight, fontSize: 12, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  practiceText: { fontFamily: 'Inter-ExtraBold', color: '#FFFFFF', fontSize: 20, lineHeight: 32, fontWeight: '800', textAlign: 'left', writingDirection: 'ltr' },
  practiceMeaning: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 21, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  practiceInstruction: { fontFamily: Typography.fontFamily, color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },

  selfCheck: { padding: 18, borderRadius: 24, borderWidth: 1, gap: 12, ...LuxuryShadows.card },
  markButtons: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  stepActionsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  actionButton: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 11 },
  footerAction: { flex: 1, minWidth: 0 },
  actionButtonText: { fontFamily: Typography.fontFamily, flexShrink: 1, fontSize: 13, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  clearMark: { minHeight: 36, flexDirection: 'row-reverse', alignItems: 'center', alignSelf: 'flex-end', gap: 5, paddingHorizontal: 4 },
  clearMarkText: { fontFamily: Typography.fontFamily, fontSize: 11.5, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  smallText: { fontFamily: Typography.fontFamily, fontSize: 11.5, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  storageErrorWrap: { gap: 8 },
  storageError: { fontFamily: Typography.fontFamily, color: LuxuryPalette.coral, backgroundColor: LuxuryPalette.coralSoft, borderWidth: 1, borderColor: '#F2D1D8', padding: 12, borderRadius: 14, fontSize: 12, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  audioStatus: { fontFamily: Typography.fontFamily, fontSize: 12, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
});
