import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import Fingerprint from 'lucide-react-native/dist/esm/icons/fingerprint';
import LockKeyhole from 'lucide-react-native/dist/esm/icons/lock-keyhole';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import { PatternGrid } from '@/components/PatternGrid';
import {
  authenticateWithDeviceLock,
  getAppLockConfig,
  isAppLockEnabled,
  verifyPattern,
  type AppLockConfig,
} from '@/lib/appLock';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

export function AppLockGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getAppLockConfig().then(next => {
      if (!active) return;
      setConfig(next);
      enabledRef.current = isAppLockEnabled(next);
      if (!enabledRef.current) setUnlocked(true);
    });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'inactive' || state === 'background') {
        if (enabledRef.current) setUnlocked(false);
      } else if (state === 'active') {
        void getAppLockConfig().then(next => {
          setConfig(next);
          enabledRef.current = isAppLockEnabled(next);
          if (!enabledRef.current) setUnlocked(true);
        });
      }
    });
    return () => subscription.remove();
  }, []);

  if (!config) return <View style={styles.loading}><ActivityIndicator color={Colors.primary[400]} /></View>;
  if (!isAppLockEnabled(config) || unlocked) return <>{children}</>;
  return <UnlockScreen config={config} onUnlock={() => setUnlocked(true)} />;
}

function UnlockScreen({ config, onUnlock }: { config: AppLockConfig; onUnlock: () => void }) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failures, setFailures] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);

  const guarded = blockedUntil > Date.now();

  useEffect(() => {
    if (!blockedUntil) return;
    const timeout = setTimeout(() => {
      setBlockedUntil(0);
      setError('می‌توانید دوباره تلاش کنید.');
    }, Math.max(0, blockedUntil - Date.now()));
    return () => clearTimeout(timeout);
  }, [blockedUntil]);

  const unlockWithPattern = async () => {
    if (busy || guarded || pattern.length < 4) return;
    setBusy(true);
    try {
      if (await verifyPattern(pattern)) {
        setError('');
        onUnlock();
        return;
      }
      const nextFailures = failures + 1;
      setFailures(nextFailures);
      setPattern([]);
      if (nextFailures >= 5) {
        setBlockedUntil(Date.now() + 30_000);
        setFailures(0);
        setError('تلاش‌های ناموفق زیاد بود؛ ۳۰ ثانیه بعد دوباره امتحان کنید.');
      } else {
        setError('الگو درست نیست؛ دوباره تلاش کنید.');
      }
    } finally {
      setBusy(false);
    }
  };

  const unlockWithDevice = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (await authenticateWithDeviceLock()) onUnlock();
      else setError('قفل دستگاه تأیید نشد.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'قفل دستگاه در دسترس نیست.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.logo}><LockKeyhole size={34} color={Colors.primary[300]} /></View>
      <Text style={styles.title}>MiloMultilang قفل است</Text>
      <Text style={styles.description}>برای محافظت از درس‌ها و گفتگوهای خصوصی، هویت خود را تأیید کنید.</Text>

      {config.patternEnabled ? (
        <View style={styles.patternSection}>
          <PatternGrid value={pattern} onChange={next => { setPattern(next); setError(''); }} disabled={busy || guarded} />
          <View style={styles.patternActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="پاک‌کردن الگو" style={styles.secondaryButton} onPress={() => setPattern([])} disabled={!pattern.length || busy}>
              <RotateCcw size={17} color={Colors.neutral[300]} />
              <Text style={styles.secondaryText}>پاک‌کردن</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="تأیید الگو" style={[styles.primaryButton, (pattern.length < 4 || busy || guarded) && styles.disabled]} onPress={() => void unlockWithPattern()} disabled={pattern.length < 4 || busy || guarded}>
              {busy ? <ActivityIndicator color={Colors.onColor} /> : <ShieldCheck size={18} color={Colors.onColor} />}
              <Text style={styles.primaryText}>تأیید الگو</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {config.deviceEnabled ? (
        <Pressable accessibilityRole="button" accessibilityLabel="بازکردن با قفل اصلی گوشی" style={styles.deviceButton} onPress={() => void unlockWithDevice()} disabled={busy}>
          <Fingerprint size={21} color={Colors.primary[300]} />
          <Text style={styles.deviceText}>بازکردن با قفل اصلی گوشی</Text>
        </Pressable>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.neutral[950], alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: Colors.neutral[950], alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primary[500] + '18', borderWidth: 1, borderColor: Colors.primary[500] + '35', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontFamily: Typography.fontFamily, color: Colors.neutral[50], fontSize: 24, fontWeight: Typography.weights.bold, textAlign: 'center' },
  description: { maxWidth: 390, fontFamily: Typography.fontFamily, color: Colors.neutral[400], fontSize: 13, lineHeight: 23, textAlign: 'center', marginTop: 7 },
  patternSection: { marginTop: Spacing.lg, alignItems: 'center' },
  patternActions: { width: 246, flexDirection: 'row-reverse', gap: 8, marginTop: 5 },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: Radius.lg, backgroundColor: Colors.primary[500], flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { fontFamily: Typography.fontFamily, color: Colors.onColor, fontSize: 13 },
  secondaryButton: { minWidth: 96, minHeight: 46, borderRadius: Radius.lg, backgroundColor: Colors.neutral[850], borderWidth: 1, borderColor: Colors.neutral[700], flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryText: { fontFamily: Typography.fontFamily, color: Colors.neutral[300], fontSize: 12 },
  deviceButton: { width: 246, minHeight: 50, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary[500] + '55', backgroundColor: Colors.primary[500] + '10', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.md },
  deviceText: { fontFamily: Typography.fontFamily, color: Colors.primary[200], fontSize: 13 },
  error: { maxWidth: 310, fontFamily: Typography.fontFamily, color: Colors.error[300], fontSize: 12, lineHeight: 21, textAlign: 'center', marginTop: Spacing.md },
  disabled: { opacity: .4 },
});
