import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PageNavigation } from './PageNavigation';
import {
  LUXURY_LANGUAGE_META,
  LuxuryPalette,
  LuxuryShadows,
  setLastActiveLanguage,
  type SupportedLuxuryLanguage,
} from './luxuryTheme';

interface LuxuryTopBarProps {
  language?: SupportedLuxuryLanguage;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backFallbackHref?: string;
  onBack?: () => void;
  showNav?: boolean;
  rightBadgeText?: string;
  icon?: React.ReactNode;
  leftAccessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function LuxuryTopBar({
  language,
  eyebrow,
  title,
  subtitle,
  backFallbackHref,
  onBack,
  showNav = true,
  rightBadgeText,
  icon,
  leftAccessory,
  style,
}: LuxuryTopBarProps) {
  const meta = language ? LUXURY_LANGUAGE_META[language] : undefined;

  useEffect(() => {
    if (language) {
      setLastActiveLanguage(language);
    }
  }, [language]);

  const resolvedEyebrow = eyebrow ?? meta?.eyebrow ?? 'LANGUAGE STUDIO';
  const badgeCode = rightBadgeText ?? meta?.code ?? 'LJ';
  const fallback = backFallbackHref ?? meta?.homeHref ?? '/languages';

  return (
    <View style={[styles.topBar, style]}>
      <View style={styles.brandCluster}>
        <LinearGradient
          colors={[LuxuryPalette.primary, LuxuryPalette.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.monogramBadge}
        >
          {icon ?? <Text style={styles.monogramText}>{badgeCode}</Text>}
        </LinearGradient>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {resolvedEyebrow}
          </Text>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.leftCluster}>
        {leftAccessory}
        {showNav ? (
          <PageNavigation
            backFallback={fallback}
            onBack={onBack}
            accentColor={LuxuryPalette.primaryDeep}
            borderColor={LuxuryPalette.border}
          />
        ) : null}
      </View>
    </View>
  );
}

interface LuxuryHeroCardProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

export function LuxuryHeroCard({
  children,
  colors = LuxuryPalette.heroGradient,
  style,
}: LuxuryHeroCardProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, style]}
    >
      <View pointerEvents="none" style={styles.heroOrbSapphire} />
      <View pointerEvents="none" style={styles.heroOrbGold} />
      {children}
    </LinearGradient>
  );
}

interface LuxurySectionHeadingProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionIcon?: React.ReactNode;
}

export function LuxurySectionHeading({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  actionIcon,
}: LuxurySectionHeadingProps) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.sectionActionPill, pressed && styles.pressed]}
        >
          {actionIcon}
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface LuxuryLessonHeaderProps {
  language: SupportedLuxuryLanguage;
  levelLabel: string;
  stageLabel: string;
  title: string;
  progressPercent: number;
  stepIndex: number;
  totalSteps: number;
  backFallbackHref: string;
  onBack?: () => void;
}

export function LuxuryLessonHeader({
  language,
  levelLabel,
  stageLabel,
  title,
  progressPercent,
  stepIndex,
  totalSteps,
  backFallbackHref,
  onBack,
}: LuxuryLessonHeaderProps) {
  useEffect(() => {
    setLastActiveLanguage(language);
  }, [language]);

  const meta = LUXURY_LANGUAGE_META[language];
  const clampedPercent = Math.max(0, Math.min(100, Math.round(progressPercent)));

  return (
    <View style={styles.lessonChromeWrap}>
      <LinearGradient
        colors={LuxuryPalette.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.lessonHeaderGradient}
      >
        <View pointerEvents="none" style={styles.lessonHeaderOrb} />
        <View style={styles.lessonTopRow}>
          <View style={styles.lessonTitleWrap}>
            <View style={styles.lessonMetaRow}>
              <View style={styles.lessonLangChip}>
                <Text style={styles.lessonLangChipText}>{meta.code}</Text>
              </View>
              <Text style={styles.lessonSubtitleText} numberOfLines={1}>
                {levelLabel} · {stageLabel}
              </Text>
            </View>
            <Text style={styles.lessonTitleText} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={styles.lessonRightControls}>
            <View style={styles.lessonPercentBadge}>
              <Text style={styles.lessonPercentText}>{clampedPercent}٪</Text>
            </View>
            <PageNavigation backFallback={backFallbackHref} onBack={onBack} tone="dark" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.stepperOuter}>
        <View style={styles.stepperCard}>
          <View style={styles.stepperRow}>
            {Array.from({ length: Math.max(1, totalSteps) }).map((_, index) => {
              const done = index < stepIndex;
              const current = index === stepIndex;
              return (
                <View
                  key={`step-${index}`}
                  style={[
                    styles.stepSegment,
                    done && styles.stepSegmentDone,
                    current && styles.stepSegmentCurrent,
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.stepperMetaRow}>
            <Text style={styles.stepperStageName} numberOfLines={1}>
              {stageLabel}
            </Text>
            <Text style={styles.stepperCount}>
              گام {stepIndex + 1} از {totalSteps}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 54,
  },
  brandCluster: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  monogramBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...LuxuryShadows.soft,
  },
  monogramText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 1,
  },
  eyebrow: {
    color: LuxuryPalette.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textAlign: 'right',
  },
  title: {
    color: LuxuryPalette.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: LuxuryPalette.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCard: {
    borderRadius: 26,
    padding: 22,
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...LuxuryShadows.hero,
  },
  heroOrbSapphire: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(96, 152, 255, 0.16)',
    top: -85,
    left: -55,
  },
  heroOrbGold: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(246, 217, 146, 0.10)',
    bottom: -65,
    right: -35,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  sectionTitle: {
    color: LuxuryPalette.ink,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    color: LuxuryPalette.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionActionPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: LuxuryPalette.primarySoft,
    borderWidth: 1,
    borderColor: LuxuryPalette.primaryBorder,
  },
  sectionActionText: {
    color: LuxuryPalette.primaryDeep,
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  lessonChromeWrap: {
    gap: 10,
  },
  lessonHeaderGradient: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...LuxuryShadows.soft,
  },
  lessonHeaderOrb: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    left: -40,
  },
  lessonTopRow: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  lessonTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  lessonMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  lessonLangChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(246, 217, 146, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(246, 217, 146, 0.38)',
  },
  lessonLangChipText: {
    color: LuxuryPalette.goldLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  lessonSubtitleText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lessonTitleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lessonRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonPercentBadge: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonPercentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  stepperOuter: {
    paddingHorizontal: 16,
    width: '100%',
  },
  stepperCard: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: LuxuryPalette.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 7,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    ...LuxuryShadows.soft,
  },
  stepperRow: {
    flexDirection: 'row-reverse',
    gap: 5,
  },
  stepSegment: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: LuxuryPalette.surfaceMuted,
  },
  stepSegmentDone: {
    backgroundColor: LuxuryPalette.emerald,
  },
  stepSegmentCurrent: {
    backgroundColor: LuxuryPalette.primary,
  },
  stepperMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperStageName: {
    color: LuxuryPalette.primaryDeep,
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  stepperCount: {
    color: LuxuryPalette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
