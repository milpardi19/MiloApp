import { StyleSheet, Text, View } from 'react-native';
import Database from 'lucide-react-native/dist/esm/icons/database';
import KeyRound from 'lucide-react-native/dist/esm/icons/key-round';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

/** Missing app configuration is not evidence that the database needs setup again. */
export function SupabaseSetupNotice() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Database size={20} color={Colors.warning[400]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>این بخش به اتصال Supabase نیاز دارد</Text>
          <Text style={styles.subtitle}>
            کد دعوت و گفت‌وگوی خصوصی به Supabase نیاز دارند؛ آموزش زبان آفلاین است. این پیام به‌تنهایی به معنی حذف یا خراب‌شدن پروژهٔ قبلی نیست.
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        <Text style={styles.subtitle}>
          اگر قبلاً پروژه را راه‌اندازی کرده‌اید، SQL یا تنظیمات ورود را دوباره اجرا نکنید؛ فقط نشانی و کلید عمومی همان پروژه را بازیابی کنید.
        </Text>
        <Step index="۱" text="فقط برای پروژهٔ تازه یا پایگاه‌دادهٔ راه‌اندازی‌نشده: فایل supabase/SETUP-COPY-PASTE-ONCE.sql را در SQL Editor اجرا کنید. راهنمای کامل در docs/RAH-ANDAZI-BEDOON-TERMINAL.md است." />
        <Step index="۲" text="در Supabase، از Authentication ← Providers گزینهٔ Anonymous sign-ins را روشن کنید؛ اگر از قبل روشن است، تغییری لازم نیست." />
        <Step index="۳" text="مقدارهای Project URL و anon key را در EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY داخل .env بگذارید و اپ را با npx expo start -c دوباره اجرا کنید." />
      </View>

      <View style={styles.footer}>
        <KeyRound size={14} color={Colors.neutral[500]} />
        <Text style={styles.footerText}>
          فقط Project URL و کلید عمومی publishable یا anon لازم است؛ کلید secret یا service_role را هرگز در .env یا Git نگذارید.
        </Text>
      </View>

      <View style={styles.footer}>
        <ShieldCheck size={14} color={Colors.success[400]} />
        <Text style={styles.footerText}>
          درس‌ها، کوییز و مرور فاصله‌دار آفلاین کار می‌کنند. کد دعوت مخاطب هم به Emma یا اعتبار هوش مصنوعی پولی وابسته نیست.
        </Text>
      </View>
    </View>
  );
}

function Step({ index, text }: { index: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE0BA',
    backgroundColor: '#FDF7EA',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.sm },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(184, 134, 40, 0.14)',
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: '#0C1836',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    color: '#3A4E70',
    textAlign: 'right',
    lineHeight: 21,
    marginTop: 4,
    writingDirection: 'rtl',
  },
  steps: { display: 'none', gap: Spacing.sm },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.sm },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning[500] + '26',
  },
  stepIndexText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.warning[700],
  },
  stepText: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    color: '#3A4E70',
    textAlign: 'right',
    lineHeight: 20,
  },
  footer: { display: 'none', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 6 },
  footerText: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    color: '#6E82A3',
    textAlign: 'right',
    lineHeight: 17,
  },
});
