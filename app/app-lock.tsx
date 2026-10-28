import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Fingerprint from 'lucide-react-native/dist/esm/icons/fingerprint';
import LockKeyhole from 'lucide-react-native/dist/esm/icons/lock-keyhole';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import Unlock from 'lucide-react-native/dist/esm/icons/lock-open';
import { PageNavigation } from '@/components/PageNavigation';
import { PatternGrid } from '@/components/PatternGrid';
import {
  authenticateWithDeviceLock,
  DEFAULT_APP_LOCK_CONFIG,
  getAppLockConfig,
  savePattern,
  setDeviceLockEnabled,
  setPatternEnabled,
  type AppLockConfig,
} from '@/lib/appLock';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

export default function AppLockSettings() {
  const [config, setConfig] = useState<AppLockConfig>(DEFAULT_APP_LOCK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pattern, setPattern] = useState<number[]>([]);
  const [firstPattern, setFirstPattern] = useState<number[] | null>(null);
  const [settingPattern, setSettingPattern] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void getAppLockConfig().then(setConfig).finally(() => setLoading(false));
  }, []);

  const enableDevice = async () => {
    if (busy || Platform.OS === 'web') return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!(await authenticateWithDeviceLock())) {
        setError('قفل اصلی گوشی تأیید نشد و فعال‌سازی انجام نشد.');
        return;
      }
      setConfig(await setDeviceLockEnabled(true));
      setMessage('قفل اصلی گوشی برای ورود به اپ فعال شد.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'قفل اصلی گوشی در دسترس نیست.');
    } finally {
      setBusy(false);
    }
  };

  const disableDevice = async () => {
    setBusy(true);
    try {
      setConfig(await setDeviceLockEnabled(false));
      setMessage('قفل اصلی گوشی غیرفعال شد.');
      setError('');
    } finally {
      setBusy(false);
    }
  };

  const beginPattern = () => {
    setSettingPattern(true);
    setPattern([]);
    setFirstPattern(null);
    setMessage('حداقل چهار نقطه را به‌ترتیب انتخاب کنید.');
    setError('');
  };

  const continuePattern = async () => {
    if (pattern.length < 4 || busy) return;
    if (!firstPattern) {
      setFirstPattern(pattern);
      setPattern([]);
      setMessage('برای تأیید، همان الگو را یک بار دیگر وارد کنید.');
      return;
    }
    if (pattern.join('-') !== firstPattern.join('-')) {
      setPattern([]);
      setFirstPattern(null);
      setError('دو الگو یکسان نبودند؛ از ابتدا دوباره وارد کنید.');
      setMessage('');
      return;
    }
    setBusy(true);
    try {
      setConfig(await savePattern(pattern));
      setSettingPattern(false);
      setPattern([]);
      setFirstPattern(null);
      setError('');
      setMessage('قفل الگویی با موفقیت فعال شد.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ذخیرهٔ الگو انجام نشد.');
    } finally {
      setBusy(false);
    }
  };

  const disablePattern = async () => {
    setBusy(true);
    try {
      setConfig(await setPatternEnabled(false));
      setSettingPattern(false);
      setPattern([]);
      setFirstPattern(null);
      setMessage('قفل الگویی غیرفعال شد.');
      setError('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PageNavigation backFallback="/languages" />
        <View style={styles.headerCopy}><Text style={styles.title}>قفل برنامه</Text><Text style={styles.subtitle}>محافظت از پیشرفت و گفتگوهای خصوصی</Text></View>
        <View style={styles.headerIcon}><LockKeyhole size={23} color={Colors.primary[300]} /></View>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator color={Colors.primary[400]} /></View> : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.summary}>
            <ShieldCheck size={25} color={config.patternEnabled || config.deviceEnabled ? Colors.success[300] : Colors.neutral[500]} />
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>{config.patternEnabled || config.deviceEnabled ? 'قفل برنامه فعال است' : 'قفل برنامه غیرفعال است'}</Text>
              <Text style={styles.summaryText}>بعد از خروج از اپ یا خاموش‌شدن صفحه، برنامه دوباره قفل می‌شود.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}><Fingerprint size={22} color={Colors.primary[300]} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>قفل اصلی گوشی</Text><Text style={styles.cardDescription}>اثر انگشت، تشخیص چهره، PIN، پترن یا رمز تنظیم‌شده روی دستگاه</Text></View></View>
            {Platform.OS === 'web' ? <Text style={styles.unavailable}>این گزینه فقط در نسخهٔ نصب‌شدهٔ موبایل فعال است.</Text> : config.deviceEnabled ? (
              <Pressable style={styles.disableButton} onPress={() => void disableDevice()} disabled={busy}><Unlock size={17} color={Colors.error[300]} /><Text style={styles.disableText}>غیرفعال‌کردن قفل گوشی</Text></Pressable>
            ) : (
              <Pressable style={styles.enableButton} onPress={() => void enableDevice()} disabled={busy}>{busy ? <ActivityIndicator color={Colors.onColor} /> : <Fingerprint size={18} color={Colors.onColor} />}<Text style={styles.enableText}>فعال‌کردن با تأیید گوشی</Text></Pressable>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}><LockKeyhole size={22} color={Colors.accent[300]} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>الگوی اختصاصی برنامه</Text><Text style={styles.cardDescription}>یک پترن امن با حداقل چهار نقطه؛ الگو فقط به‌صورت هش رمزنگاری‌شده ذخیره می‌شود.</Text></View></View>
            {settingPattern ? (
              <View style={styles.patternSetup}>
                <Text style={styles.stepTitle}>{firstPattern ? 'تکرار الگو برای تأیید' : 'ساخت الگوی جدید'}</Text>
                <PatternGrid value={pattern} onChange={next => { setPattern(next); setError(''); }} disabled={busy} />
                <View style={styles.patternActions}>
                  <Pressable style={styles.resetButton} onPress={() => setPattern([])} disabled={!pattern.length || busy}><RotateCcw size={16} color={Colors.neutral[300]} /><Text style={styles.resetText}>پاک‌کردن</Text></Pressable>
                  <Pressable style={[styles.enableButton, (pattern.length < 4 || busy) && styles.disabled]} onPress={() => void continuePattern()} disabled={pattern.length < 4 || busy}><ShieldCheck size={17} color={Colors.onColor} /><Text style={styles.enableText}>{firstPattern ? 'ذخیره و فعال‌سازی' : 'ادامه'}</Text></Pressable>
                </View>
              </View>
            ) : config.patternEnabled ? (
              <View style={styles.enabledActions}>
                <Pressable style={styles.changeButton} onPress={beginPattern}><Text style={styles.changeText}>تغییر الگو</Text></Pressable>
                <Pressable style={styles.disableButton} onPress={() => void disablePattern()} disabled={busy}><Unlock size={17} color={Colors.error[300]} /><Text style={styles.disableText}>غیرفعال‌کردن الگو</Text></Pressable>
              </View>
            ) : (
              <Pressable style={styles.enableButton} onPress={beginPattern}><LockKeyhole size={18} color={Colors.onColor} /><Text style={styles.enableText}>ساخت و فعال‌کردن پترن</Text></Pressable>
            )}
          </View>

          {message ? <Text style={styles.success}>{message}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Text style={styles.note}>اگر هر دو روش را فعال کنید، هنگام ورود می‌توانید با پترن برنامه یا قفل اصلی گوشی وارد شوید.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[950] },
  header: { minHeight: 72, paddingHorizontal: Spacing.md, paddingVertical: 10, backgroundColor: Colors.neutral[900], borderBottomWidth: 1, borderBottomColor: Colors.neutral[800], flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: Typography.fontFamily, color: Colors.neutral[50], fontSize: 21, fontWeight: Typography.weights.bold, textAlign: 'right' },
  subtitle: { fontFamily: Typography.fontFamily, color: Colors.neutral[500], fontSize: 11, textAlign: 'right', marginTop: 2 },
  headerIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: Colors.primary[500] + '18', alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.md, paddingBottom: 40, gap: Spacing.md },
  summary: { borderRadius: Radius.xl, padding: Spacing.lg, backgroundColor: Colors.neutral[900], borderWidth: 1, borderColor: Colors.neutral[800], flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontFamily: Typography.fontFamily, color: Colors.neutral[100], fontSize: 16, textAlign: 'right' },
  summaryText: { fontFamily: Typography.fontFamily, color: Colors.neutral[500], fontSize: 11, lineHeight: 19, textAlign: 'right', marginTop: 3 },
  card: { borderRadius: Radius.xl, padding: Spacing.lg, backgroundColor: Colors.neutral[900], borderWidth: 1, borderColor: Colors.neutral[800], gap: Spacing.md },
  cardHeading: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  cardCopy: { flex: 1 },
  cardTitle: { fontFamily: Typography.fontFamily, color: Colors.neutral[100], fontSize: 16, textAlign: 'right' },
  cardDescription: { fontFamily: Typography.fontFamily, color: Colors.neutral[500], fontSize: 11, lineHeight: 20, textAlign: 'right', marginTop: 3 },
  enableButton: { flex: 1, minHeight: 47, borderRadius: Radius.lg, backgroundColor: Colors.primary[500], flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 },
  enableText: { fontFamily: Typography.fontFamily, color: Colors.onColor, fontSize: 13 },
  disableButton: { minHeight: 45, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.error[500] + '40', backgroundColor: Colors.error[500] + '0D', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14 },
  disableText: { fontFamily: Typography.fontFamily, color: Colors.error[300], fontSize: 12 },
  unavailable: { fontFamily: Typography.fontFamily, color: Colors.warning[300], fontSize: 11, textAlign: 'right' },
  patternSetup: { alignItems: 'stretch' },
  stepTitle: { fontFamily: Typography.fontFamily, color: Colors.accent[300], fontSize: 13, textAlign: 'center', marginBottom: 4 },
  patternActions: { flexDirection: 'row-reverse', gap: 8 },
  resetButton: { minWidth: 96, minHeight: 47, borderRadius: Radius.lg, backgroundColor: Colors.neutral[850], borderWidth: 1, borderColor: Colors.neutral[700], flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  resetText: { fontFamily: Typography.fontFamily, color: Colors.neutral[300], fontSize: 12 },
  enabledActions: { flexDirection: 'row-reverse', gap: 8 },
  changeButton: { flex: 1, minHeight: 45, borderRadius: Radius.lg, backgroundColor: Colors.accent[500] + '12', borderWidth: 1, borderColor: Colors.accent[500] + '35', alignItems: 'center', justifyContent: 'center' },
  changeText: { fontFamily: Typography.fontFamily, color: Colors.accent[300], fontSize: 12 },
  success: { fontFamily: Typography.fontFamily, color: Colors.success[300], backgroundColor: Colors.success[500] + '0D', borderRadius: Radius.md, padding: 12, textAlign: 'center', fontSize: 12 },
  error: { fontFamily: Typography.fontFamily, color: Colors.error[300], backgroundColor: Colors.error[500] + '0D', borderRadius: Radius.md, padding: 12, textAlign: 'center', fontSize: 12 },
  note: { fontFamily: Typography.fontFamily, color: Colors.neutral[500], fontSize: 11, lineHeight: 20, textAlign: 'center' },
  disabled: { opacity: .4 },
});
