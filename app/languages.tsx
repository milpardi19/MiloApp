import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MiloLogoMotion } from '@/components/MiloLogoMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/dist/esm/icons/arrow-left';
import BarChart3 from 'lucide-react-native/dist/esm/icons/chart-column';
import ChevronDown from 'lucide-react-native/dist/esm/icons/chevron-down';
import Headphones from 'lucide-react-native/dist/esm/icons/headphones';
import LifeBuoy from 'lucide-react-native/dist/esm/icons/life-buoy';
import LockKeyhole from 'lucide-react-native/dist/esm/icons/lock-keyhole';
import Mic2 from 'lucide-react-native/dist/esm/icons/mic-vocal';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Target from 'lucide-react-native/dist/esm/icons/target';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
// Lightweight metadata only: the home screen must not pull the multi-MB
// lesson arrays into the startup path (see lib/languages/catalogMeta.ts).
import { LANGUAGES, TOTAL_LESSON_COUNT, TOTAL_SENTENCE_COUNT } from '@/lib/languages/catalogMeta';
import { ensureSupportConversation } from '@/lib/conversations';
import { readableSupabaseError } from '@/lib/errors';
import { FEATURES, RUSSIAN_ONLY_BUILD } from '@/lib/features';
import { getActiveLanguage, setActiveLanguage } from '@/lib/activeLanguage';
import type { LanguageId } from '@/lib/languages/types';
import { LuxuryPalette, LuxuryShadows } from '@/components/luxuryTheme';
import { toPersianDigits as fa } from '@/lib/format';
import { LtrDirection, Typography } from '@/lib/theme';

// Narrator removed: welcome-voice.wav is kept in assets without auto-playing on startup.

const languageMeta = {
  en: {
    flag: '🇬🇧',
    code: 'EN',
    persianName: 'انگلیسی',
    nativeName: 'English',
    badgeColors: ['#0D214F', '#1E4ED8'] as [string, string],
  },
  de: {
    flag: '🇩🇪',
    code: 'DE',
    persianName: 'آلمانی',
    nativeName: 'Deutsch',
    badgeColors: ['#102554', '#1868A8'] as [string, string],
  },
  ru: {
    flag: '🇷🇺',
    code: 'RU',
    persianName: 'روسی',
    nativeName: 'Русский',
    badgeColors: ['#0B1A3E', '#255EE8'] as [string, string],
  },
  tr: {
    flag: '🇹🇷',
    code: 'TR',
    persianName: 'ترکی استانبولی',
    nativeName: 'Türkçe',
    badgeColors: ['#7C2D12', '#EA580C'] as [string, string],
  },
} as const;

const learningSteps = [
  { icon: Headphones, number: '۰۱', title: 'بشنو', detail: 'جمله را با صدای طبیعی بشنو' },
  { icon: Mic2, number: '۰۲', title: 'تکرار کن', detail: 'با سرعت خودت تمرین کن' },
  { icon: Target, number: '۰۳', title: 'به‌خاطر بسپار', detail: 'با مرور هوشمند تثبیت کن' },
] as const;

const buildLearningStats = (languageCount: number) => [
  {
    value: fa(TOTAL_LESSON_COUNT),
    label: 'درس گام‌به‌گام',
  },
  {
    value: fa(TOTAL_SENTENCE_COUNT),
    label: 'جملهٔ کاربردی',
  },
  { value: `${fa(languageCount)} زبان`, label: 'مسیر یکپارچه' },
];

const productFeatures = [
  {
    icon: Volume2,
    title: 'شنیدن هوشمند',
    detail: 'سرعت طبیعی و آهسته برای درک دقیق‌تر',
    color: LuxuryPalette.primary,
    soft: LuxuryPalette.primarySoft,
  },
  {
    icon: RefreshCw,
    title: 'مرور شخصی',
    detail: 'تمرین دوباره در زمان مناسب یادگیری',
    color: '#1868A8',
    soft: '#E9F4FD',
  },
  {
    icon: ShieldCheck,
    title: 'پیشرفت محفوظ',
    detail: 'ادامهٔ مسیر از همان نقطهٔ قبلی',
    color: LuxuryPalette.emerald,
    soft: LuxuryPalette.emeraldSoft,
  },
] as const;

export default function LanguagesHome() {
  const router = useRouter();
  const [openingSupport, setOpeningSupport] = useState(false);
  const [switchingLanguage, setSwitchingLanguage] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const languageSectionY = useRef(0);

  const openSupport = () => {
    if (openingSupport) return;
    setOpeningSupport(true);
    ensureSupportConversation()
      .then(conversationId =>
        router.push({
          pathname: '/conversations/human/[conversationId]',
          params: { conversationId, name: 'پشتیبانی Milo' },
        } as never),
      )
      .catch(cause => Alert.alert('پشتیبانی', readableSupabaseError(cause)))
      .finally(() => setOpeningSupport(false));
  };

  const openLanguage = async (languageId: LanguageId, home: string) => {
    if (switchingLanguage) return;
    setSwitchingLanguage(true);
    try {
      const previous = await getActiveLanguage();
      if (previous && previous !== languageId) {
        const previousName = languageMeta[previous as keyof typeof languageMeta]?.persianName ?? previous;
        const nextName = languageMeta[languageId as keyof typeof languageMeta]?.persianName ?? languageId;
        const message = `مسیر «${previousName}» بسته نمی‌شود و پیشرفت آن محفوظ می‌ماند. می‌خواهی وارد مسیر «${nextName}» شوی؟`;
        const confirmed = Platform.OS === 'web'
          ? typeof window !== 'undefined' && window.confirm(message)
          : await new Promise<boolean>(resolve => Alert.alert('تغییر مسیر یادگیری', message, [
            { text: 'ادامه در همین مسیر', style: 'cancel', onPress: () => resolve(false) },
            { text: 'تغییر زبان', onPress: () => resolve(true) },
          ]));
        if (!confirmed) return;
      }
      await setActiveLanguage(languageId);
      router.push(home as never);
    } finally {
      setSwitchingLanguage(false);
    }
  };

  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const compact = !ready || width < 720;
  const tiny = !ready || width < 390;
  const languages = LANGUAGES.filter(language =>
    language.id === 'ru'
      ? FEATURES.russianCourse
      : language.id === 'tr'
        ? FEATURES.turkishCourse
        : !RUSSIAN_ONLY_BUILD,
  );
  const learningStats = buildLearningStats(languages.length);
  const languageNamesFa = languages
    .map(language => languageMeta[language.id as keyof typeof languageMeta]?.persianName ?? language.name)
    .join('، ')
    .replace(/، ([^،]*)$/, ' و $1');

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.page, compact && styles.pageCompact]}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <MiloLogoMotion size="header" play={false} />
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="گفتگو با پشتیبانی"
                disabled={openingSupport}
                style={({ pressed }) => [styles.actionIconBtn, pressed && styles.pressed]}
                onPress={openSupport}
              >
                <LifeBuoy size={17} color={LuxuryPalette.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تنظیم قفل برنامه"
                style={({ pressed }) => [styles.actionIconBtn, pressed && styles.pressed]}
                onPress={() => router.push('/app-lock' as never)}
              >
                <LockKeyhole size={17} color={LuxuryPalette.primary} />
              </Pressable>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>آمادهٔ یادگیری</Text>
              </View>
            </View>
          </View>

          <View style={[styles.hero, compact && styles.heroCompact]}>
            <View pointerEvents="none" style={styles.heroGoldEdge} />
            <View style={[styles.heroTopline, compact && styles.heroToplineCompact]}>
              <View style={styles.eyebrow}>
                <Sparkles size={13} color={LuxuryPalette.goldLight} />
                <Text style={styles.eyebrowText}>آکادمی چندزبانهٔ میلو</Text>
              </View>
            </View>

            {/*
              Compact (mobile) uses a plain column with visual-first JSX order instead of
              column-reverse: some Android Paper Yoga builds drop the card's horizontal padding
              for reversed subtrees, which pushed this block (and its CTA) flush to the card
              edges. The visual-first order with a normal column renders identically.
            */}
            <View style={[styles.heroMain, compact && styles.heroMainCompact]}>
              <View style={[styles.heroVisual, compact && styles.heroVisualCompact]}>
                <LinearGradient colors={['#315FD4', '#10265D']} style={styles.heroArtDisk} />
                <View pointerEvents="none" style={styles.heroArtRing} />
                <Image
                  source={require('../assets/images/milo-hero-sculpture-cutout.png')}
                  resizeMode="contain"
                  accessibilityLabel="کتاب باز با جریان طلایی و سه حباب گفت‌وگو"
                  style={styles.heroArtwork}
                />
              </View>

              <View style={[styles.heroCopy, !compact && styles.heroCopyDesktop]}>
                <Text accessibilityRole="header" style={[styles.heroTitle, tiny && styles.heroTitleTiny]}>
                  با جمله‌های واقعی،{`\n`}روان‌تر حرف بزن
                </Text>
                <Text style={styles.heroDescription}>
                  {languageNamesFa} را با تمرین‌های کوتاه و هدفمند یاد بگیر.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="انتخاب زبان برای شروع یادگیری"
                  onPress={() => scrollRef.current?.scrollTo({ y: languageSectionY.current, animated: true })}
                  style={({ pressed }) => [styles.heroCta, compact && styles.heroCtaCompact, pressed && styles.pressed]}
                >
                  <Text style={styles.heroCtaText}>شروع مسیر یادگیری</Text>
                  <ArrowLeft size={16} color="#F5D993" strokeWidth={2.7} />
                </Pressable>
              </View>
            </View>

          </View>

          <View
            style={styles.languageSection}
            onLayout={event => { languageSectionY.current = event.nativeEvent.layout.y; }}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionEyebrow}>انتخاب مسیر یادگیری</Text>
                <Text style={styles.sectionTitle}>می‌خواهی کدام زبان را تمرین کنی؟</Text>
              </View>
            </View>

            <View style={[styles.languageGrid, compact && styles.languageGridCompact]}>
              {languages.map(language => {
                const meta = languageMeta[language.id as keyof typeof languageMeta];
                return compact ? (
                  <Pressable
                    key={language.id}
                    accessibilityRole="button"
                    accessibilityLabel={`ورود به زبان ${language.name}، ${fa(language.lessonsCount)} درس`}
                    onPress={() => void openLanguage(language.id, language.home)}
                    style={({ pressed }) => [styles.languageRowCard, styles.languageRowCardCompact, pressed && styles.pressed]}
                  >
                    <View style={styles.languageCompactTop}>
                      <LinearGradient
                        colors={meta.badgeColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.monogramWrapCompact}
                      >
                        <Text style={styles.monogramCode}>{meta.code}</Text>
                      </LinearGradient>
                      <Text style={styles.flagCompact}>{meta.flag}</Text>
                    </View>

                    <View style={styles.languageIdentityCompact}>
                      <Text style={styles.languagePersianNameCompact} numberOfLines={1}>{meta.persianName}</Text>
                      <Text style={styles.languageNativeNameCompact} numberOfLines={1}>{meta.nativeName}</Text>
                      <Text style={styles.languageLessonCompact} numberOfLines={2}>{fa(language.lessonsCount)} درس جمله‌محور</Text>
                    </View>

                    <View style={styles.languageArrowCompact}>
                      <Text style={styles.enterText}>ورود</Text>
                      <ArrowLeft size={13} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    key={language.id}
                    accessibilityRole="button"
                    accessibilityLabel={`ورود به زبان ${language.name}`}
                    onPress={() => void openLanguage(language.id, language.home)}
                    style={({ pressed }) => [
                      styles.languageCard,
                      styles.languageCardDesktop,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.languageCardTop}>
                      <LinearGradient
                        colors={meta.badgeColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.monogramWrap}
                      >
                        <Text style={styles.monogramCode}>{meta.code}</Text>
                      </LinearGradient>

                      <View style={styles.languageIdentity}>
                        <View style={styles.languageNameRow}>
                          <Text style={styles.languagePersianName}>{meta.persianName}</Text>
                          <Text style={styles.flag}>{meta.flag}</Text>
                        </View>
                        <Text style={styles.languageNativeName}>{meta.nativeName}</Text>
                      </View>
                    </View>

                    <View style={styles.languageCardFooter}>
                      <View style={styles.lessonCountBadge}>
                        <Text style={styles.languageLessonCount}>{fa(language.lessonsCount)} درس جمله‌محور</Text>
                      </View>
                      <View style={styles.languageArrow}>
                        <Text style={styles.enterText}>ورود</Text>
                        <ArrowLeft size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.statsStrip, compact && styles.statsStripCompact]}>
            <View style={[styles.statsLead, !compact && styles.statsLeadDesktop]}>
              <View style={styles.statsLeadIcon}>
                <BarChart3 size={18} color={LuxuryPalette.primary} />
              </View>
              <View style={styles.statsLeadCopy}>
                <Text style={styles.statsLeadTitle}>یک ساختار یکپارچه برای هر سه زبان</Text>
                <Text style={styles.statsLeadDetail}>درس، کتابخانه، تلفظ و مرور فاصله‌دار هماهنگ</Text>
              </View>
            </View>
            <View style={[styles.statsValues, !compact ? styles.statsValuesDesktop : styles.statsValuesCompact]}>
              {learningStats.map((item, index) => (
                <View key={item.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {index < learningStats.length - 1 ? <View style={styles.statDivider} /> : null}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <View style={styles.flowTitleCol}>
                <Text style={styles.flowEyebrow}>روش یادگیری میلو</Text>
                <Text style={styles.flowTitle}>چرخهٔ کوتاه و مؤثر روزانه</Text>
              </View>
              <View style={styles.minutesBadge}>
                <Text style={styles.minutesValue}>۱۰</Text>
                <Text style={styles.minutesText}>دقیقه در روز</Text>
              </View>
            </View>
            {compact ? (
              <View style={styles.stepsColumnCompact}>
                {learningSteps.map(step => {
                  const Icon = step.icon;
                  return (
                    <View key={step.number} style={styles.stepRowCompact}>
                      <View style={styles.stepIcon}>
                        <Icon size={18} color={LuxuryPalette.primary} />
                      </View>
                      <View style={styles.stepCopyCompact}>
                        <View style={styles.stepTitleRowCompact}>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                          <Text style={styles.stepNumber}>{step.number}</Text>
                        </View>
                        <Text style={styles.stepDetailCompact}>{step.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.stepsRow}>
                {learningSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <View key={step.number} style={styles.stepWrap}>
                      <View style={styles.step}>
                        <View style={styles.stepIcon}>
                          <Icon size={18} color={LuxuryPalette.primary} />
                        </View>
                        <Text style={styles.stepNumber}>{step.number}</Text>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDetail}>{step.detail}</Text>
                      </View>
                      {index < learningSteps.length - 1 ? <View style={styles.connector} /> : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.advantagesSection}>
            <View style={[styles.advantagesGrid, compact && styles.advantagesGridCompact]}>
              {productFeatures.map(feature => {
                const Icon = feature.icon;
                return (
                  <View
                    key={feature.title}
                    style={[styles.advantageCard, !compact && styles.advantageCardDesktop]}
                  >
                    <View style={[styles.advantageIcon, { backgroundColor: feature.soft }]}>
                      <Icon size={19} color={feature.color} />
                    </View>
                    <View style={styles.advantageCopy}>
                      <Text style={styles.advantageTitle}>{feature.title}</Text>
                      <Text style={styles.advantageDetail}>{feature.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>MILO LANGUAGE ACADEMY</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...LtrDirection,
    flex: 1,
    backgroundColor: LuxuryPalette.canvas,
  },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  page: {
    width: '100%',
    maxWidth: 1020,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
    gap: 20,
  },
  pageCompact: { paddingHorizontal: 15, paddingTop: 8, gap: 14 },
  header: {
    width: '100%',
    minHeight: 46,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    ...LuxuryShadows.soft,
  },
  statusPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LuxuryPalette.emerald },
  statusText: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkSoft,
    fontSize: 10.5,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  hero: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    padding: 22,
    gap: 15,
    backgroundColor: '#FBF8F0',
    borderWidth: 1,
    borderColor: '#E8DCC3',
    ...LuxuryShadows.soft,
  },
  heroCompact: {
    borderRadius: 22,
    // Horizontal padding is intentionally 0 on compact: the topline and heroMain carry
    // their own horizontal margins so Android Paper Yoga cannot drop the insets.
    paddingHorizontal: 0,
    paddingVertical: 16,
    gap: 7,
  },
  heroToplineCompact: { marginHorizontal: 16 },
  heroGoldEdge: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: '#D8B76E',
  },
  heroTopline: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D9BB',
  },
  eyebrowText: {
    fontFamily: Typography.fontFamily,
    color: '#806027',
    fontSize: 10.5,
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  heroMain: {
    minHeight: 270,
    // JSX order is visual-first, copy-second, so a plain row keeps visual on the left
    // and copy on the right (previously achieved with row-reverse + reversed JSX).
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroMainCompact: {
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    marginHorizontal: 16,
  },
  heroCopy: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 1,
  },
  heroCopyDesktop: { maxWidth: 500, gap: 13 },
  heroTitle: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 31,
    lineHeight: 44,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroTitleTiny: { fontSize: 25, lineHeight: 36 },
  heroDescription: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkSoft,
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroCta: {
    minHeight: 46,
    minWidth: 185,
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 3,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor: '#1D4FC4',
    borderWidth: 1,
    borderColor: '#416FE0',
    ...LuxuryShadows.soft,
  },
  heroCtaCompact: { alignSelf: 'stretch' },
  heroCtaText: {
    fontFamily: Typography.fontFamily,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  heroVisual: {
    width: 320,
    height: 285,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroVisualCompact: {
    // Stretched by heroMainCompact (alignItems: 'stretch'); no percentage width, which
    // also resolves against the wrong box on some Android Yoga builds.
    height: 218,
    marginTop: -5,
    marginBottom: 2,
  },
  heroArtDisk: {
    position: 'absolute',
    width: 166,
    height: 166,
    borderRadius: 83,
    alignSelf: 'center',
    top: 24,
  },
  heroArtRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
    top: 7,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 40, 0.38)',
  },
  heroArtwork: { width: '100%', height: '100%' },
  languageSection: { width: '100%', gap: 11 },
  sectionHeaderRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderCopy: { width: '100%', alignItems: 'flex-end', gap: 2 },
  sectionEyebrow: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.primary,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 18.5,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  languageGrid: {
    width: '100%',
    flexDirection: 'row-reverse',
    gap: 14,
    alignItems: 'stretch',
  },
  languageGridCompact: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 8,
  },
  languageRowCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: LuxuryPalette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...LuxuryShadows.card,
  },
  languageRowCardCompact: {
    flex: 1,
    minWidth: 0,
    minHeight: 146,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  languageCompactTop: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monogramWrapCompact: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  languageIdentityCompact: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  languagePersianNameCompact: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  languageNativeNameCompact: {
    fontFamily: 'Inter-ExtraBold',
    color: LuxuryPalette.inkMuted,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  languageLessonCompact: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.primaryDeep,
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  flagCompact: { fontSize: 16 },
  languageArrowCompact: {
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: LuxuryPalette.primary,
  },
  languageCard: {
    backgroundColor: LuxuryPalette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    padding: 18,
    gap: 16,
    justifyContent: 'space-between',
    ...LuxuryShadows.card,
  },
  languageCardDesktop: {
    flex: 1,
    minWidth: 0,
  },
  languageCardTop: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  monogramWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  monogramCode: {
    fontFamily: 'Inter-ExtraBold',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    writingDirection: 'ltr',
  },
  languageIdentity: { flex: 1, alignItems: 'flex-end', gap: 2 },
  languageNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  languagePersianName: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  flag: { fontSize: 18 },
  languageNativeName: {
    fontFamily: 'Inter-ExtraBold',
    color: LuxuryPalette.inkMuted,
    fontSize: 11.5,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  languageCardFooter: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LuxuryPalette.border,
    gap: 10,
  },
  lessonCountBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: LuxuryPalette.primarySoft,
  },
  languageLessonCount: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.primaryDeep,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  languageArrow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: LuxuryPalette.primary,
  },
  enterText: {
    fontFamily: Typography.fontFamily,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  statsStrip: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    ...LuxuryShadows.soft,
  },
  statsStripCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  statsLead: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  statsLeadDesktop: { flex: 1.25, width: undefined, minWidth: 0 },
  statsLeadIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: LuxuryPalette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLeadCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  statsLeadTitle: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsLeadDetail: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkMuted,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsValues: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around' },
  statsValuesDesktop: { flex: 1.5 },
  statsValuesCompact: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LuxuryPalette.border,
  },
  statItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  statValue: {
    fontFamily: Typography.numberFontFamily,
    color: LuxuryPalette.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  statLabel: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statDivider: { position: 'absolute', left: 0, width: 1, height: 28, backgroundColor: LuxuryPalette.border },
  flowCard: {
    width: '100%',
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    ...LuxuryShadows.soft,
  },
  flowHeader: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flowTitleCol: { flex: 1, alignItems: 'flex-end', gap: 2 },
  flowEyebrow: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.primary,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  flowTitle: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  minutesBadge: {
    minWidth: 70,
    borderRadius: 14,
    backgroundColor: LuxuryPalette.goldSoft,
    borderWidth: 1,
    borderColor: '#EFE0BA',
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  minutesValue: {
    fontFamily: Typography.numberFontFamily,
    writingDirection: 'rtl',
    color: LuxuryPalette.gold,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },
  minutesText: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkSoft,
    fontSize: 10,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  stepsColumnCompact: {
    width: '100%',
    gap: 9,
  },
  stepRowCompact: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: LuxuryPalette.surfaceSoft,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
  },
  stepCopyCompact: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  stepTitleRowCompact: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  stepDetailCompact: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stepsRow: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  stepWrap: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center', gap: 5 },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: LuxuryPalette.primarySoft,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontFamily: Typography.numberFontFamily,
    color: LuxuryPalette.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  stepTitle: {
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  stepDetail: {
    maxWidth: 130,
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkMuted,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  connector: { width: 20, height: 1, marginTop: 20, backgroundColor: LuxuryPalette.borderStrong },
  advantagesSection: { width: '100%', gap: 12 },
  advantagesGrid: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'center', gap: 12 },
  advantagesGridCompact: { flexDirection: 'column', gap: 10 },
  advantageCard: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    ...LuxuryShadows.soft,
  },
  advantageCardDesktop: {
    flex: 1,
    width: undefined,
    minWidth: 0,
  },
  advantageIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  advantageCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  advantageTitle: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.ink,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  advantageDetail: {
    width: '100%',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.inkMuted,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: { paddingVertical: 6, alignItems: 'center' },
  footerBrand: {
    fontFamily: 'Inter-ExtraBold',
    color: LuxuryPalette.inkMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    writingDirection: 'ltr',
  },
});
