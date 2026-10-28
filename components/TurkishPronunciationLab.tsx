import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { TurkishBottomNav } from '@/components/TurkishBottomNav';
import { FEATURES } from '@/lib/features';
import {
  getNarratorSnapshot,
  narrate,
  setTurkishDeviceFallbackEnabled,
} from '@/lib/narrator/engine';
import { resolveSpeechOptions } from '@/lib/speechLanguage';
import { Typography } from '@/lib/theme';

const TURKISH_CLOUD_NARRATOR =
  FEATURES.turkishCloudNarrator || process.env.EXPO_PUBLIC_TURKISH_CLOUD_NARRATOR === 'true';

if (TURKISH_CLOUD_NARRATOR) {
  setTurkishDeviceFallbackEnabled(true);
}

/**
 * کارگاه صداها و حروف ویژهٔ ترکی.
 *
 * سطح ۱ دوره با سلام و احوال‌پرسی شروع می‌شود (طبق برنامهٔ آموزشی)، پس درس
 * جداگانهٔ الفبا از ترتیب درس‌ها بیرون آمد و به این کارگاه منتقل شد: همان
 * آموزش حروف ç، ş، ğ، ı، ö، ü در قالب نمونه‌های واقعی دوره، بدون اینکه
 * شمارهٔ درس‌های ۲۰گانه را به هم بزند.
 */
interface SoundCard {
  letter: string;
  soundFa: string;
  noteFa: string;
  words: Array<{ word: string; meaning: string }>;
}

const SOUNDS: readonly SoundCard[] = [
  {
    letter: 'ç',
    soundFa: 'چ',
    noteFa: 'همیشه «چ» خوانده می‌شود، حتی در پایان واژه.',
    words: [
      { word: 'çay', meaning: 'چای' },
      { word: 'çok', meaning: 'خیلی' },
      { word: 'geç', meaning: 'دیر' },
    ],
  },
  {
    letter: 'ş',
    soundFa: 'ش',
    noteFa: 'مانند «ش» فارسی؛ ç و ş را با c و s اشتباه نگیرید.',
    words: [
      { word: 'şimdi', meaning: 'الان' },
      { word: 'şeker', meaning: 'شکر' },
      { word: 'kişi', meaning: 'نفر' },
    ],
  },
  {
    letter: 'ğ',
    soundFa: 'کشیده (ی نرم)',
    noteFa: 'نوشته می‌شود اما صدای مستقل ندارد؛ واکهٔ پیش از خود را کشیده می‌کند.',
    words: [
      { word: 'öğretmen', meaning: 'معلم' },
      { word: 'ağır', meaning: 'سنگین' },
      { word: 'değil', meaning: 'نیست' },
    ],
  },
  {
    letter: 'ı',
    soundFa: 'ـِ کوتاه',
    noteFa: 'بدون گردی لب؛ شبیه «ـِ» فارسی در «دِل». با i (ای) فرق دارد.',
    words: [
      { word: 'kız', meaning: 'دختر' },
      { word: 'yıl', meaning: 'سال' },
      { word: 'sarı', meaning: 'زرد' },
    ],
  },
  {
    letter: 'ö',
    soundFa: 'اُ با لب گرد',
    noteFa: 'لب‌ها گرد و جلو آمده‌اند؛ به «اُ» فارسی نزدیک است.',
    words: [
      { word: 'göl', meaning: 'دریاچه' },
      { word: 'önce', meaning: 'اول' },
      { word: 'söz', meaning: 'قول / حرف' },
    ],
  },
  {
    letter: 'ü',
    soundFa: 'او باریک',
    noteFa: 'مانند «ü» آلمانی؛ «او» را با لب گرد و زبان جلو بگویید.',
    words: [
      { word: 'gün', meaning: 'روز' },
      { word: 'üç', meaning: 'سه' },
      { word: 'güzel', meaning: 'قشنگ' },
    ],
  },
];

export default function TurkishPronunciationLab() {
  const [error, setError] = useState('');
  const [active, setActive] = useState('');

  const speak = useCallback((text: string) => {
    if (!NARRATION_ENABLED) return;
    setError('');
    setActive(text);
    const speakWithDevice = () => {
      void Speech.stop();
      void resolveSpeechOptions('tr-TR').then(targetVoice => {
        if (targetVoice.voice) {
          Speech.speak(text, {
            ...targetVoice,
            rate: 0.72,
            onDone: () => setActive(''),
            onError: () => {
              setActive('');
              setError('صدای ترکی روی این دستگاه نصب نیست؛ متن و راهنمای خوانش همچنان دیده می‌شوند.');
            },
          });
        } else {
          setActive('');
          setError('صدای ترکی روی این دستگاه نصب نیست؛ متن و راهنمای خوانش همچنان دیده می‌شوند.');
        }
      });
    };

    if (TURKISH_CLOUD_NARRATOR) {
      void narrate(text, 'tr-TR')
        .then(() => {
          if (getNarratorSnapshot().status === 'error') speakWithDevice();
          else setActive('');
        })
        .catch(speakWithDevice);
      return;
    }

    speakWithDevice();
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <LuxuryTopBar
            language="tr"
            eyebrow="TURKISH SOUNDS"
            title="کارگاه صداها و حروف ویژه"
            backFallbackHref="/learn/tr"
          />

          <View style={styles.intro}>
            <Text style={styles.introTitle}>۲۹ حرف، ۶ صدای تازه</Text>
            <Text style={styles.introText}>
              الفبای ترکی استانبولی آوایی است: هر حرف همیشه یک صدا دارد. این شش حرف برای فارسی‌زبان تازه‌اند؛
              هر کارت را بشنوید و واژه‌ها را با صدای بلند تکرار کنید. درس‌های سطح ۱ از سلام و احوال‌پرسی شروع
              می‌شوند و این صداها همان‌جا در جمله تمرین می‌شوند.
            </Text>
          </View>

          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          {SOUNDS.map(card => (
            <View key={card.letter} style={styles.card}>
              <View style={styles.cardTop}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`شنیدن حرف ${card.letter}`}
                  style={({ pressed }) => [styles.letterButton, pressed && styles.pressed]}
                  onPress={() => speak(card.letter)}
                >
                  <Text style={styles.letter}>{card.letter}</Text>
                  <Volume2 size={16} color="#FFFFFF" />
                </Pressable>
                <View style={styles.cardCopy}>
                  <Text style={styles.soundFa}>صدای «{card.soundFa}»</Text>
                  <Text style={styles.noteFa}>{card.noteFa}</Text>
                </View>
              </View>

              <View style={styles.wordRow}>
                {card.words.map(item => (
                  <Pressable
                    key={item.word}
                    accessibilityRole="button"
                    accessibilityLabel={`شنیدن واژهٔ ${item.word}`}
                    accessibilityState={{ selected: active === item.word }}
                    style={({ pressed }) => [styles.wordChip, active === item.word && styles.wordChipActive, pressed && styles.pressed]}
                    onPress={() => speak(item.word)}
                  >
                    <Text style={styles.word}>{item.word}</Text>
                    <Text style={styles.wordFa}>{item.meaning}</Text>
                    <Volume2 size={13} color={Palette.primary} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>جمع‌بندی هماهنگی واکه‌ها</Text>
            <Text style={styles.summaryText}>
              پسوندها با واکهٔ آخرِ واژه هم‌رنگ می‌شوند: پسوند جمع ‎-ler یا ‎-lar، پسوند مکان ‑de یا ‑da،
              پسوند گذشته ‑di یا ‑dı. مثلاً ev → evler → evde → evdi، اما kitap → kitaplar → kitapta → kitaptı.
            </Text>
          </View>
        </View>
      </ScrollView>
      <TurkishBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfaceMuted, direction: 'ltr' },
  scrollContent: { paddingBottom: 24 },
  page: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 14, gap: 12 },
  intro: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  introTitle: {
    fontFamily: Typography.boldFontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: Palette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  introText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    lineHeight: 23,
    color: Palette.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    lineHeight: 21,
    color: Palette.danger,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    gap: 12,
  },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  letterButton: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  letter: { fontFamily: 'Inter-ExtraBold', fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  cardCopy: { flex: 1, gap: 4 },
  soundFa: {
    fontFamily: Typography.boldFontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noteFa: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    lineHeight: 21,
    color: Palette.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  wordRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
  },
  wordChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  word: { fontFamily: 'Inter-ExtraBold', fontSize: 14, fontWeight: '800', color: Palette.ink },
  wordFa: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    color: Palette.muted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  summaryCard: {
    backgroundColor: Palette.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: Typography.boldFontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryText: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    lineHeight: 22,
    color: Palette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pressed: { opacity: 0.75 },
});
