import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

/**
 * Route-level error boundary.
 *
 * Expo Router renders a route's exported `ErrorBoundary` when that route throws
 * during render. Keeping the failure local means a broken lesson shows this
 * card while the rest of the app (navigation, other languages, review) keeps
 * working — instead of the whole app being replaced by an error screen.
 */
export interface RouteErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

export function RouteErrorBoundary({ error, retry }: RouteErrorBoundaryProps) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>این صفحه باز نشد</Text>
      <Text style={styles.body}>
        پیشرفت ذخیره‌شدهٔ شما تغییری نکرده است. یک‌بار «تلاش دوباره» را بزنید؛ اگر مشکل ادامه داشت به فهرست زبان‌ها برگردید.
      </Text>

      <Pressable accessibilityRole="button" style={styles.primary} onPress={retry}>
        <Text style={styles.primaryText}>تلاش دوباره</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={styles.secondary}
        onPress={() => {
          retry();
          router.replace('/languages' as never);
        }}
      >
        <Text style={styles.secondaryText}>بازگشت به فهرست زبان‌ها</Text>
      </Pressable>

      <View style={styles.box}>
        <Text style={styles.errorText} selectable>{error?.message ?? String(error)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F6FB' },
  content: { padding: Spacing.xl, paddingTop: 72, gap: 14 },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#1F2A44',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    lineHeight: 23,
    color: '#475569',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  primary: {
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: Colors.onColor,
    writingDirection: 'rtl',
  },
  secondary: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#D8DEEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#1F2A44',
    writingDirection: 'rtl',
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9F2',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    lineHeight: 18,
    color: '#64748B',
  },
});
