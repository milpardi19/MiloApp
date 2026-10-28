import { useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Bell from 'lucide-react-native/dist/esm/icons/bell';
import CheckCircle2 from 'lucide-react-native/dist/esm/icons/circle-check';
import MapPin from 'lucide-react-native/dist/esm/icons/map-pin';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import { setOnboardingComplete } from '@/lib/storage';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { PageNavigation } from '@/components/PageNavigation';

export default function PermissionsScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantAndContinue = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const location = await Location.requestForegroundPermissionsAsync();
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as never);
      }
      if (location.status !== 'granted') {
        setError('برای ارسال موقعیت به گوشی اول، اجازه موقعیت مکانی را تأیید کنید.');
        return;
      }
      await setOnboardingComplete();
      router.replace('/lang' as never);
    } catch {
      setError('دریافت مجوزها کامل نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageNavigation tone="dark" backFallback="/languages" style={styles.pageNavigation} />
      <LinearGradient
        colors={[Colors.primary[700], Colors.accent[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.iconWrap}>
          <ShieldCheck size={38} color={Colors.onColor} strokeWidth={2} />
        </View>
        <Text style={styles.title}>یک مرحله تا شروع آموزش</Text>
        <Text style={styles.subtitle}>
          مجوزهای ضروری را تأیید کنید؛ بعد از آن برنامه مستقیماً وارد آموزش زبان می‌شود و اتصال در پس‌زمینه فعال می‌ماند.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <PermissionRow icon={MapPin} title="موقعیت مکانی" text="ارسال موقعیت این گوشی به گوشی اول" />
        <PermissionRow icon={Bell} title="اعلان‌های برنامه" text="دریافت اعلان‌های گفتگو و وضعیت برنامه" />
        <PermissionRow icon={CheckCircle2} title="باتری و اینترنت" text="بدون درخواست اضافی، به‌صورت خودکار گزارش می‌شود" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={() => void grantAndContinue()} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={Colors.onColor} />
        ) : (
          <>
            <ShieldCheck size={20} color={Colors.onColor} strokeWidth={2.2} />
            <Text style={styles.buttonText}>قبول مجوزها و شروع آموزش</Text>
          </>
        )}
      </Pressable>

    </View>
  );
}

function PermissionRow({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={20} color={Colors.accent[400]} strokeWidth={2.1} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  pageNavigation: { position: 'absolute', top: 52, right: Spacing.lg, zIndex: 10 },
  hero: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.onColor,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    lineHeight: 23,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral[850],
    borderWidth: 1,
    borderColor: Colors.neutral[800],
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral[100],
    textAlign: 'right',
  },
  rowDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[400],
    textAlign: 'right',
    marginTop: 2,
  },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.error[300],
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  button: {
    minHeight: 54,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.accent[500],
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.onColor,
  },
});
