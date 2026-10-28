import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { LuxuryPalette, LuxuryShadows } from '@/components/luxuryTheme';
import { PageNavigation } from '@/components/PageNavigation';
import { LtrDirection, Typography } from '@/lib/theme';
import { GermanBottomNav } from './GermanBottomNav';
import { RussianBottomNav } from './RussianBottomNav';

/** Shared luxury presentation shell for German and Russian secondary routes. */
export function CoursePage({
  title,
  subtitle,
  children,
  back = '/languages',
  progress,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: string;
  progress?: number;
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const { language } = useLocalSearchParams<{ language?: string }>();
  const activeLanguage =
    language ??
    (pathname.startsWith('/learn/ru') ? 'ru' : pathname.startsWith('/learn/de') ? 'de' : undefined);

  return (
    <View style={courseStyles.root}>
      <LinearGradient
        colors={LuxuryPalette.heroGradient}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={courseStyles.header}
      >
        <View style={courseStyles.headerInner}>
          <PageNavigation tone="dark" backFallback={back} />
          <View style={courseStyles.headerCopy}>
            <Text style={courseStyles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={courseStyles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          {progress !== undefined ? (
            <View style={courseStyles.headerPill}>
              <Text style={courseStyles.headerPillText}>{Math.round(progress * 100)}٪</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      {progress !== undefined ? (
        <View style={courseStyles.track}>
          <View style={[courseStyles.fill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%` }]} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={courseStyles.page} showsVerticalScrollIndicator={false}>
        <View style={courseStyles.content}>{children}</View>
      </ScrollView>

      {footer ? (
        <View style={courseStyles.footer}>
          <View style={courseStyles.footerInner}>{footer}</View>
        </View>
      ) : null}

      {activeLanguage === 'de' && progress === undefined ? <GermanBottomNav /> : null}
      {activeLanguage === 'ru' && progress === undefined ? <RussianBottomNav /> : null}
    </View>
  );
}

export function CourseButton({
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
        courseStyles.button,
        secondary && courseStyles.secondaryButton,
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text style={[courseStyles.buttonText, secondary && courseStyles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

export const courseStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LuxuryPalette.canvas },
  header: {
    width: '100%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    ...LuxuryShadows.soft,
  },
  headerInner: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    alignItems: 'center',
  },
  headerCopy: { flex: 1, alignItems: 'flex-end', gap: 3 },
  title: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'right',
  },
  headerPill: {
    minWidth: 50,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillText: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footer: {
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: LuxuryPalette.border,
  },
  footerInner: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  content: {
    ...LtrDirection,
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    gap: 14,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: LuxuryPalette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: LuxuryPalette.inkSoft,
    textAlign: 'right',
    lineHeight: 25,
  },
  small: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    color: LuxuryPalette.inkMuted,
    textAlign: 'right',
    lineHeight: 22,
  },
  card: {
    padding: 20,
    backgroundColor: LuxuryPalette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    gap: 14,
    ...LuxuryShadows.card,
  },
  heading: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: LuxuryPalette.ink,
    textAlign: 'right',
  },
  target: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    fontWeight: '800',
    color: LuxuryPalette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
    lineHeight: 33,
  },
  pronunciation: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '600',
    color: LuxuryPalette.primaryDeep,
    textAlign: 'right',
    lineHeight: 23,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
    backgroundColor: LuxuryPalette.primary,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: LuxuryPalette.surfaceMuted,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
  },
  buttonText: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: LuxuryPalette.primaryDeep,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  pill: {
    alignSelf: 'flex-end',
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: LuxuryPalette.primaryDeep,
    backgroundColor: LuxuryPalette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  notice: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    color: LuxuryPalette.gold,
    backgroundColor: LuxuryPalette.goldSoft,
    borderWidth: 1,
    borderColor: '#EFE0BA',
    padding: 14,
    borderRadius: 16,
    textAlign: 'right',
    lineHeight: 23,
  },
  error: {
    writingDirection: 'rtl',
    fontFamily: Typography.fontFamily,
    color: LuxuryPalette.rose,
    backgroundColor: LuxuryPalette.roseSoft,
    padding: 12,
    borderRadius: 14,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 22,
  },
  track: {
    height: 4,
    backgroundColor: LuxuryPalette.surfaceMuted,
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: LuxuryPalette.primary,
  },
  word: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 18,
    fontWeight: '800',
    color: LuxuryPalette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  divider: {
    height: 1,
    backgroundColor: LuxuryPalette.border,
  },
});
