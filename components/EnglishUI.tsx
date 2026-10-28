import { Pressable, StyleSheet, Text, View } from 'react-native';
import Check from 'lucide-react-native/dist/esm/icons/check';
import { COURSE_LEVELS, type CourseLevelId } from '@/lib/courseContent';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { toPersianDigits } from '@/lib/format';
import { Typography } from '@/lib/theme';

export const ENGLISH_LEVEL_GRADIENTS: Record<CourseLevelId, [string, string]> = {
  0: ['#2558E0', '#14348F'],
  1: ['#15996B', '#0B6646'],
  2: ['#2179C2', '#114D7D'],
  3: ['#6546D1', '#3D268A'],
  4: ['#C48123', '#7D4E10'],
};

export function displayEnglishModuleLabel(label: string) {
  return label.replace(/^(?:first\s+)?[0-9۰-۹٠-٩]+\+?\s+/i, '').trim();
}

export function EnglishProgressTrack({ value, color = Palette.primary, height = 8, trackColor = '#E7EAF2' }: { value: number; color?: string; height?: number; trackColor?: string }) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.progressTrack, { height, backgroundColor: trackColor }]}
    >
      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );
}

export function EnglishLevelRail({
  activeLevelId,
  counts,
  onSelect,
  levels = COURSE_LEVELS,
  startLabel = 'START',
  accessibilityLabelPrefix,
  direction = 'ltr',
  accentColor = Palette.primary,
  successColor = Palette.success,
  activeLabelColor = Palette.primaryDark,
  numberOffset = 0,
}: {
  activeLevelId: CourseLevelId;
  counts?: Partial<Record<CourseLevelId, { completed: number; total: number }>>;
  onSelect: (levelId: CourseLevelId) => void;
  levels?: ReadonlyArray<{ id: CourseLevelId; title: string; cefr: string }>;
  startLabel?: string;
  accessibilityLabelPrefix?: string;
  direction?: 'ltr' | 'rtl';
  accentColor?: string;
  successColor?: string;
  activeLabelColor?: string;
  numberOffset?: number;
}) {
  return (
    <View style={[styles.rail, direction === 'rtl' && styles.railRtl]}>
      {levels.map((level, index) => {
        const count = counts?.[level.id];
        const done = !!count && count.total > 0 && count.completed === count.total;
        const active = level.id === activeLevelId;
        const reached = index < activeLevelId;
        return (
          <View key={level.id} style={[styles.railItem, direction === 'rtl' && styles.railItemRtl]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabelPrefix ? `${accessibilityLabelPrefix} ${level.title}` : `${level.title}, ${count ? `${count.completed} از ${count.total} درس` : level.cefr}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(level.id)}
              style={styles.railPressable}
            >
              <View style={[styles.railNode, active && styles.railNodeActive, done && !active && styles.railNodeDone, (active || done) && { backgroundColor: active ? accentColor : successColor, borderColor: active ? accentColor : successColor, ...(active ? { shadowColor: accentColor } : {}) }]}>
                {done && !active
                  ? <Check size={15} color="#FFFFFF" strokeWidth={3} />
                  : <Text style={[styles.railNodeText, active && styles.railNodeTextActive]}>{toPersianDigits(level.id + numberOffset)}</Text>}
              </View>
              <Text
                style={[
                  styles.railLabel,
                  /[\u0600-\u06FF]/.test(level.id === 0 ? startLabel : level.cefr) && styles.railLabelRtl,
                  active && styles.railLabelActive,
                  active && { color: activeLabelColor },
                ]}
                numberOfLines={1}
              >
                {level.id === 0 ? startLabel : level.cefr}
              </Text>
            </Pressable>
            {index < levels.length - 1 ? <View style={[styles.railConnector, reached && styles.railConnectorActive, reached && { backgroundColor: successColor }]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function EnglishSectionHeading({
  eyebrow,
  title,
  detail,
  accentColor = Palette.primary,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  accentColor?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <Text style={[styles.sectionEyebrow, { color: accentColor }]}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { width: '100%', borderRadius: 999, overflow: 'hidden', backgroundColor: '#E7EAF2' },
  progressFill: { height: '100%', borderRadius: 999, alignSelf: 'flex-start' },
  rail: { width: '100%', direction: 'ltr', flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 2 },
  railRtl: { flexDirection: 'row-reverse' },
  railItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  railItemRtl: { flexDirection: 'row-reverse' },
  railPressable: { width: 46, alignItems: 'center', gap: 6 },
  railNode: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Palette.border, backgroundColor: Palette.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  railNodeActive: { backgroundColor: Palette.primary, borderColor: Palette.primary, shadowColor: Palette.primary, shadowOpacity: 0.26, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  railNodeDone: { backgroundColor: Palette.success, borderColor: Palette.success },
  railNodeText: { fontFamily: Typography.fontFamily, color: Palette.muted, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  railNodeTextActive: { color: '#FFFFFF', fontWeight: '900' },
  railLabel: { fontFamily: 'Inter-ExtraBold', maxWidth: 48, color: Palette.muted, fontSize: 10, fontWeight: '800', textAlign: 'center', writingDirection: 'ltr' },
  railLabelRtl: { fontFamily: Typography.fontFamily, maxWidth: 50, fontSize: 10, fontWeight: '700', writingDirection: 'rtl' },
  railLabelActive: { color: Palette.primaryDark, fontWeight: '900' },
  railConnector: { height: 3, flex: 1, borderRadius: 99, backgroundColor: Palette.border, marginTop: 16 },
  railConnectorActive: { backgroundColor: Palette.success },
  sectionHeading: { gap: 3, alignItems: 'flex-end' },
  sectionEyebrow: { fontFamily: 'Inter-ExtraBold', color: Palette.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'right', writingDirection: 'ltr' },
  sectionTitle: { fontFamily: 'Vazir', color: Palette.ink, fontSize: 19, lineHeight: 28, fontWeight: '400', textAlign: 'right', writingDirection: 'rtl' },
  sectionDetail: { fontFamily: 'Vazir', color: Palette.muted, fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
});
