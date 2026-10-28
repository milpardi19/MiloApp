import { useEffect, useMemo, useState } from 'react';
import { Typography } from '@/lib/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LearningSentence } from '@/lib/languages/types';
import { GermanPalette as Palette } from './germanTheme';

function normalizeSentence(value: string) {
  return value.normalize('NFC').toLocaleLowerCase('de-DE').replace(/ß/g, 'ss')
    .replace(/[.,!?;:„“”…]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shuffleTokens(tokens: string[]) {
  if (tokens.length < 2) return tokens;
  const shift = Math.max(1, Math.floor(tokens.length / 2));
  const rotated = [...tokens.slice(shift), ...tokens.slice(0, shift)];
  return rotated.every((token, index) => token === tokens[index]) ? [...tokens].reverse() : rotated;
}

export function GermanSentenceBuilder({ sentence }: { sentence: LearningSentence }) {
  const tokens = useMemo(() => sentence.text.trim().split(/\s+/).filter(Boolean), [sentence.text]);
  const shuffled = useMemo(() => shuffleTokens(tokens), [tokens]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const built = chosen.map(index => shuffled[index]).join(' ');
  const complete = chosen.length === shuffled.length;
  const correct = complete && normalizeSentence(built) === normalizeSentence(sentence.text);

  useEffect(() => {
    setChosen([]);
    setChecked(false);
  }, [sentence.id]);

  const choose = (index: number) => {
    if (chosen.includes(index)) return;
    setChosen(current => [...current, index]);
    setChecked(false);
  };
  const remove = (position: number) => {
    setChosen(current => current.filter((_, index) => index !== position));
    setChecked(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>جمله‌سازی · واژه‌ها را به ترتیب بچینید</Text>
      <Text style={styles.translation}>{sentence.fa}</Text>
      <View accessibilityLabel="جمله ساخته‌شده" style={styles.answerArea}>
        {chosen.length ? chosen.map((tokenIndex, position) => (
          <Pressable
            key={`${tokenIndex}-${position}`}
            accessibilityRole="button"
            accessibilityLabel={`حذف واژه ${shuffled[tokenIndex]}`}
            onPress={() => remove(position)}
            style={styles.answerChip}
          >
            <Text style={styles.answerText}>{shuffled[tokenIndex]}</Text>
          </Pressable>
        )) : <Text style={styles.placeholder}>واژه‌ها را از بانک زیر انتخاب کنید.</Text>}
      </View>
      <View style={styles.wordBank}>
        {shuffled.map((word, index) => {
          const used = chosen.includes(index);
          return (
            <Pressable
              key={`${sentence.id}-${index}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: used }}
              disabled={used}
              onPress={() => choose(index)}
              style={[styles.wordChip, used && styles.usedChip]}
            >
              <Text style={[styles.wordText, used && styles.usedText]}>{word}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => setChecked(true)}>
          <Text style={styles.primaryButtonText}>بررسی ترتیب</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => { setChosen([]); setChecked(false); }}>
          <Text style={styles.secondaryButtonText}>از نو</Text>
        </Pressable>
      </View>
      {checked ? (
        <Text accessibilityLiveRegion="polite" style={[styles.feedback, correct ? styles.success : styles.tryAgain]}>
          {correct ? 'جمله درست ساخته شد.' : complete ? 'ترتیب واژه‌ها را دوباره بررسی کنید.' : `هنوز ${shuffled.length - chosen.length} واژه باقی مانده است.`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: Palette.surface, borderRadius: 22, borderWidth: 1, borderColor: Palette.border, padding: 18, gap: 14, shadowColor: '#0B1838', shadowOpacity: 0.045, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  kicker: { fontFamily: 'Vazir', fontSize: 12, lineHeight: 20, fontWeight: '700', color: Palette.primary, textAlign: 'right', writingDirection: 'rtl' },
  translation: { fontFamily: 'Vazir', fontSize: 17, lineHeight: 28, fontWeight: '700', color: Palette.ink, textAlign: 'right', writingDirection: 'rtl' },
  answerArea: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: Palette.primary, backgroundColor: Palette.primarySoft, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  placeholder: { flex: 1, fontFamily: 'Vazir', fontSize: 12.5, lineHeight: 20, color: Palette.muted, textAlign: 'right', writingDirection: 'rtl' },
  answerChip: { borderRadius: 11, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.primary, paddingHorizontal: 11, paddingVertical: 8 },
  answerText: { fontFamily: 'Inter-ExtraBold', color: Palette.ink, fontSize: 13.5, fontWeight: '800', writingDirection: 'ltr' },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
  wordChip: { borderRadius: 11, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 12, paddingVertical: 9 },
  usedChip: { opacity: .42 },
  wordText: { fontFamily: 'Inter-ExtraBold', color: Palette.ink, fontSize: 13.5, fontWeight: '800', writingDirection: 'ltr' },
  usedText: { color: Palette.muted },
  actions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  primaryButton: { flex: 1, minHeight: 48, backgroundColor: Palette.primary, borderRadius: 14, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'Vazir', color: '#FFFFFF', fontSize: 14, fontWeight: '800', writingDirection: 'rtl' },
  secondaryButton: { minHeight: 48, backgroundColor: Palette.surfaceMuted, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'Vazir', color: Palette.ink, fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  feedback: { fontFamily: 'Vazir', fontSize: 13, lineHeight: 21, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  success: { color: Palette.success },
  tryAgain: { color: Palette.warning },
});
