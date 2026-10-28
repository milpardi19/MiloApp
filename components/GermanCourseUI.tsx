import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { LuxuryTopBar } from '@/components/LuxuryLanguageShell';
import { GermanBottomNav } from '@/components/GermanBottomNav';
import { GermanPalette as Palette } from '@/components/germanTheme';
import { LtrDirection, Radius, Typography } from '@/lib/theme';

export function GermanCoursePage({
  title,
  subtitle,
  children,
  back = '/learn/de',
  progress,
  footer,
  scrollResetKey,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: string;
  progress?: number;
  footer?: ReactNode;
  scrollResetKey?: string | number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [scrollResetKey]);
  const pathname = usePathname();
  const { language } = useLocalSearchParams<{ language?: string }>();
  const isGermanRoute = language === 'de' || pathname.startsWith('/learn/de');
  const normalizedProgress = progress === undefined ? undefined : Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <LuxuryTopBar
          language="de"
          eyebrow="DEUTSCH STUDIO"
          title={title}
          subtitle={subtitle}
          backFallbackHref={back}
          leftAccessory={
            normalizedProgress !== undefined ? (
              <Text style={styles.progressPill}>{Math.round(normalizedProgress * 100)}٪</Text>
            ) : undefined
          }
          style={styles.topBarFill}
        />
      </View>
      {normalizedProgress !== undefined ? (
        <View style={styles.trackWrap}>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: normalizedProgress * 100 }} style={styles.track}>
            <View style={[styles.fill, { width: `${normalizedProgress * 100}%` }]} />
          </View>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, LtrDirection]}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {isGermanRoute && normalizedProgress === undefined ? (
        <View style={styles.bottomNavWrap}>
          <GermanBottomNav />
        </View>
      ) : null}
    </View>
  );
}

export function GermanCourseButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.canvas },
  header: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  topBarFill: { width: '100%' },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  headerCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  brand: { fontFamily: 'Inter-ExtraBold', color: Palette.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1.1, writingDirection: 'ltr' },
  title: { fontFamily: Typography.fontFamily, color: Palette.ink, fontSize: 21, lineHeight: 28, fontWeight: '400', textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { fontFamily: Typography.fontFamily, color: Palette.muted, fontSize: 12, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  progressPill: { fontFamily: Typography.fontFamily, minWidth: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Palette.primarySoft, color: Palette.primaryDark, textAlign: 'center', fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  trackWrap: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 6 },
  track: { height: 6, width: '100%', borderRadius: 999, backgroundColor: Palette.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: Palette.primary, alignSelf: 'flex-end' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  content: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 14 },
  footer: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, backgroundColor: Palette.canvas, borderTopWidth: 1, borderTopColor: Palette.border },
  bottomNavWrap: { paddingHorizontal: 14 },
  card: { width: '100%', padding: 18, borderRadius: 22, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, gap: 12, shadowColor: '#0B1838', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  heading: { fontFamily: Typography.fontFamily, color: Palette.ink, fontSize: 18, lineHeight: 27, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  description: { fontFamily: Typography.fontFamily, color: Palette.text, fontSize: 14.5, lineHeight: 23, textAlign: 'right', writingDirection: 'rtl' },
  small: { fontFamily: Typography.fontFamily, color: Palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  target: { fontFamily: 'Inter-ExtraBold', color: Palette.ink, fontSize: 22, lineHeight: 34, fontWeight: '800', textAlign: 'left', writingDirection: 'ltr' },
  pronunciation: { fontFamily: Typography.fontFamily, color: Palette.primary, fontSize: 14, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  button: { minHeight: 50, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, backgroundColor: Palette.primary, shadowColor: Palette.primary, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  buttonSecondary: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, shadowOpacity: 0 },
  buttonDisabled: { opacity: .45 },
  buttonPressed: { opacity: .85, transform: [{ scale: .99 }] },
  buttonText: { fontFamily: Typography.fontFamily, color: '#FFFFFF', fontSize: 14.5, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  buttonTextSecondary: { color: Palette.primaryDark },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  replayRow: { flexDirection: 'row-reverse', alignItems: 'stretch', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  pill: { alignSelf: 'flex-start', fontFamily: Typography.fontFamily, color: Palette.primaryDark, fontSize: 12, fontWeight: '700', backgroundColor: Palette.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, textAlign: 'right', writingDirection: 'rtl' },
  notice: { fontFamily: Typography.fontFamily, color: Palette.warning, backgroundColor: Palette.warningSoft, borderWidth: 1, borderColor: '#F1DFB6', padding: 14, borderRadius: 16, fontSize: 13, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  error: { fontFamily: Typography.fontFamily, color: Palette.danger, backgroundColor: Palette.dangerSoft, borderWidth: 1, borderColor: '#F2D1D8', padding: 13, borderRadius: 16, fontSize: 13, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  word: { fontFamily: 'Inter-ExtraBold', color: Palette.ink, fontSize: 20, fontWeight: '800', lineHeight: 30, textAlign: 'left', writingDirection: 'ltr' },
  divider: { height: 1, width: '100%', backgroundColor: Palette.border },
  answerBox: { padding: 16, borderRadius: 16, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border },
  reading: { padding: 16, gap: 12, borderRadius: 18, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border },
  choice: { borderWidth: 1, borderColor: Palette.border, borderRadius: 16, padding: 14, backgroundColor: Palette.surface },
  selected: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  input: { fontFamily: 'Inter-ExtraBold', minHeight: 96, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surfaceMuted, borderRadius: 16, padding: 15, fontSize: 19, fontWeight: '800', color: Palette.ink, textAlign: 'left', writingDirection: 'ltr', textAlignVertical: 'top' },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, ...LtrDirection },
  token: { borderRadius: 12, backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 14, paddingVertical: 11 },
  tokenText: { fontFamily: 'Inter-ExtraBold', color: Palette.ink, fontSize: 17, fontWeight: '800', writingDirection: 'ltr' },
  feedback: { backgroundColor: Palette.surfaceMuted, borderWidth: 1, borderColor: Palette.border, borderRadius: 18, padding: 16, gap: 13 },
});

export const germanCourseStyles = styles;
