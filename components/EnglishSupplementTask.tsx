import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import { isCorrect, SKILLS, type Task } from '@/lib/englishSupplement/content';
import { Typography } from '@/lib/theme';
import { recordEvidence, type SupplementProgress } from '@/lib/englishSupplement/progress';

export const EnglishPalette = {
  canvas: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FB',
  ink: '#0C1836',
  text: '#3A4E70',
  muted: '#6E82A3',
  border: '#E2EAF6',
  primary: '#1E4ED8',
  primaryDark: '#143599',
  primarySoft: '#EBF1FF',
  teal: '#1868A8',
  tealSoft: '#E9F4FD',
  success: '#0F8A5F',
  successSoft: '#E8F8F2',
  warning: '#B88628',
  warningSoft: '#FDF7EA',
  danger: '#D14343',
  dangerSoft: '#FDEEEE',
};

export const supplementStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: EnglishPalette.canvas },
  pageContent: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 12, paddingBottom: 34, gap: 12 },
  pageTitle: { fontFamily: Typography.fontFamily, color: EnglishPalette.ink, fontSize: 28, lineHeight: 39, fontWeight: '400', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { fontFamily: Typography.fontFamily, color: EnglishPalette.ink, fontSize: 21, lineHeight: 31, fontWeight: '400', textAlign: 'right', writingDirection: 'rtl' },
  levelHeader: { backgroundColor: EnglishPalette.surface, borderColor: EnglishPalette.border, borderWidth: 1, borderRadius: 22, padding: 18, gap: 12, shadowColor: '#20264A', shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  levelMeta: { fontFamily: Typography.fontFamily, color: EnglishPalette.muted, fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },
  unitCard: { marginVertical: 0, padding: 16 },
  backButton: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: EnglishPalette.surface, borderColor: EnglishPalette.border },
  card: {
    backgroundColor: EnglishPalette.surface,
    borderColor: EnglishPalette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    marginVertical: 4,
    width: '100%',
    shadowColor: '#0B1838', shadowOpacity: 0.045, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  text: { fontFamily: Typography.fontFamily, color: EnglishPalette.text, fontSize: 14, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  heading: { fontFamily: Typography.fontFamily, color: EnglishPalette.ink, fontSize: 18, lineHeight: 28, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  eyebrow: { fontFamily: Typography.fontFamily, color: EnglishPalette.primary, fontSize: 12, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  sentenceCard: { backgroundColor: EnglishPalette.surfaceMuted, borderColor: EnglishPalette.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  sentenceEnglishRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  sentenceSoundButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: EnglishPalette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sentenceEnglish: { flex: 1, fontFamily: Typography.latinFontFamily, color: EnglishPalette.ink, fontSize: 15, fontWeight: '800', lineHeight: 25, textAlign: 'left', writingDirection: 'ltr' },
  sentencePersian: { fontFamily: Typography.fontFamily, color: EnglishPalette.text, fontSize: 14, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  sentencePattern: { fontFamily: Typography.latinFontFamily, color: EnglishPalette.primaryDark, fontSize: 11, fontWeight: '700', lineHeight: 19, textAlign: 'left', writingDirection: 'ltr' },
  english: { fontFamily: Typography.latinFontFamily, color: EnglishPalette.ink, fontSize: 15, fontWeight: '800', lineHeight: 27, textAlign: 'left', writingDirection: 'ltr' },
  input: {
    fontFamily: Typography.latinFontFamily,
    color: EnglishPalette.ink,
    backgroundColor: EnglishPalette.surfaceMuted,
    borderColor: EnglishPalette.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 50,
    fontSize: 16,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  button: { backgroundColor: EnglishPalette.primary, borderRadius: 14, padding: 13, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  secondaryButton: { backgroundColor: EnglishPalette.surface, borderColor: EnglishPalette.border, borderWidth: 1, borderRadius: 14, padding: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: Typography.fontFamily, color: EnglishPalette.ink, fontSize: 13.5, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
  disabled: { opacity: 0.48 },
  error: { fontFamily: Typography.fontFamily, color: EnglishPalette.danger, backgroundColor: EnglishPalette.dangerSoft, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  success: { fontFamily: Typography.fontFamily, color: EnglishPalette.success, backgroundColor: EnglishPalette.successSoft, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  tabRow: { flexDirection: 'row-reverse', gap: 7, backgroundColor: '#E9EEF5', borderRadius: 15, padding: 5 },
  tab: { flex: 1, minHeight: 44, borderRadius: 11, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: EnglishPalette.surface },
  tabText: { fontFamily: Typography.fontFamily, color: EnglishPalette.muted, fontSize: 12, fontWeight: '400', textAlign: 'center', writingDirection: 'rtl' },
  tabTextActive: { color: EnglishPalette.primaryDark, fontWeight: '800' },
  chip: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: EnglishPalette.primarySoft, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontFamily: Typography.fontFamily, color: EnglishPalette.primaryDark, fontSize: 11, fontWeight: '400', textAlign: 'center', writingDirection: 'rtl' },
  progressTrack: { height: 8, width: '100%', borderRadius: 999, backgroundColor: '#E8EDF5', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: EnglishPalette.primary, alignSelf: 'flex-end' },
});
const s = supplementStyles;

export function EnglishSupplementTask({
  task,
  onResult,
  onSave,
  lockAfterSave = false,
  deferFeedback = false,
}: {
  task: Task;
  onResult?: (progress: SupplementProgress, correct: boolean) => void;
  onSave?: (task: Task, correct: boolean, heard: boolean) => Promise<unknown>;
  lockAfterSave?: boolean;
  deferFeedback?: boolean;
}) {
  const [answer, setAnswer] = useState('');
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  useEffect(() => () => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    void Speech.stop();
  }, []);

  async function listen() {
    // Narration is off: there is no audio to wait for, so the answer can be
    // submitted straight away instead of blocking on a playback callback.
    if (!NARRATION_ENABLED) { setHeard(true); setPlaying(false); setError(''); return; }
    const token = ++run.current;
    setError('');
    setPlaying(true);
    setHeard(false);
    const finish = (ok: boolean) => {
      if (token !== run.current) return;
      if (timer.current) clearTimeout(timer.current);
      setPlaying(false);
      setHeard(ok);
      if (!ok) setError('صدا کامل پخش نشد. صدای دستگاه و صدای انگلیسی را بررسی و دوباره تلاش کنید.');
    };
    try {
      await Speech.stop();
      if (token !== run.current) return;
      timer.current = setTimeout(() => { finish(false); run.current++; void Speech.stop(); }, 60000);
      Speech.speak(task.audio!, { language: 'en-US', rate: 0.78, onDone: () => finish(true), onError: () => finish(false), onStopped: () => finish(false) });
    } catch { finish(false); }
  }

  async function submit() {
    if (saving.current || !answer.trim() || (task.audio && !heard && NARRATION_ENABLED)) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const correct = isCorrect(task, answer);
      const heardForRecord = heard || !NARRATION_ENABLED;
      if (onSave) await onSave(task, correct, heardForRecord);
      else {
        const progress = await recordEvidence(task, correct, heardForRecord);
        onResult?.(progress, correct);
      }
      setResult(correct);
    } catch {
      setError('پاسخ ذخیره نشد؛ اطلاعات قبلی حفظ شده است. دوباره تلاش کنید.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const locked = busy || (lockAfterSave && result !== null);
  return <View style={s.card}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={s.eyebrow}>{SKILLS[task.skill]}</Text>
      {task.audio ? <View style={s.chip}><Text style={s.chipText}>استماع</Text></View> : null}
    </View>
    {task.source ? <View style={{ backgroundColor: EnglishPalette.surfaceMuted, borderRadius: 12, padding: 12 }}><Text style={s.english}>{task.source}</Text></View> : null}
    <Text style={s.heading}>{task.prompt}</Text>
    {task.audio ? <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'در حال پخش فایل شنیداری' : heard ? 'پخش دوبارهٔ فایل شنیداری' : 'شنیدن فایل شنیداری سؤال'} accessibilityState={{ disabled: playing || busy }} disabled={playing || busy} style={[s.secondaryButton, (playing || busy) && s.disabled]} onPress={() => void listen()}><Text style={s.secondaryButtonText}>{playing ? 'در حال پخش…' : heard ? 'پخش دوباره' : 'شنیدن سؤال'}</Text></Pressable> : null}
    {task.options
      ? task.options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: answer === option, disabled: locked }} disabled={locked} style={[s.input, { minHeight: 48, justifyContent: 'center', backgroundColor: answer === option ? EnglishPalette.primarySoft : EnglishPalette.surfaceMuted, borderColor: answer === option ? EnglishPalette.primary : EnglishPalette.border }]} onPress={() => { setAnswer(option); setResult(null); }}><Text style={s.english}>{option}</Text></Pressable>)
      : <TextInput accessibilityLabel={task.prompt} editable={!locked} style={s.input} value={answer} onChangeText={value => { setAnswer(value); setResult(null); }} placeholder="پاسخ خود را بنویسید" placeholderTextColor={EnglishPalette.muted} autoCapitalize="none" autoCorrect={false} maxLength={500} />}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: locked || !answer.trim() || (!!task.audio && !heard && NARRATION_ENABLED) }} disabled={locked || !answer.trim() || (!!task.audio && !heard && NARRATION_ENABLED)} style={[s.button, (locked || !answer.trim() || (!!task.audio && !heard && NARRATION_ENABLED)) && s.disabled]} onPress={() => void submit()}><Text style={s.buttonText}>{busy ? 'در حال ذخیره…' : 'بررسی پاسخ'}</Text></Pressable>
    {result !== null && !deferFeedback ? <Text accessibilityLiveRegion="polite" style={result ? s.success : s.error}>{result ? 'پاسخ درست ثبت شد.' : `هنوز درست نیست. ${task.explanation} دوباره پاسخ دهید.`}</Text> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}
  </View>;
}
