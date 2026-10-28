import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import AudioLines from 'lucide-react-native/dist/esm/icons/audio-lines';
import Pause from 'lucide-react-native/dist/esm/icons/pause';
import Play from 'lucide-react-native/dist/esm/icons/play';
import RotateCcw from 'lucide-react-native/dist/esm/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { useLessonNarrator } from '@/lib/narrator/useLessonNarrator';
import type { NarratorLocale } from '@/lib/narrator/voiceCast';
import { Radius, Typography } from '@/lib/theme';

/**
 * The lesson narrator bar.
 *
 * Sits at the top of a lesson in all three tracks. It starts speaking on its
 * own, shows which warm voice is reading, and gives the learner three controls
 * only: play/pause, replay, and the automatic-narration switch. Nothing in the
 * lesson flow changes — the bar is purely additive.
 */

export interface LessonNarratorProps {
  locale: NarratorLocale;
  text: string;
  enabled?: boolean;
  accent?: string;
  accentDeep?: string;
  accentSoft?: string;
}

export function LessonNarrator({
  locale,
  text,
  enabled = true,
  accent = '#1E4ED8',
  accentDeep = '#143599',
  accentSoft = '#EBF1FF',
}: LessonNarratorProps) {
  const narrator = useLessonNarrator({ text, locale, enabled });
  const { status, engine, auto, speed, voiceLabel, cloudAvailable, cloudChecked } = narrator;
  const speaking = status === 'speaking' || status === 'loading';
  const paused = status === 'paused';

  const halo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!speaking) {
      halo.stopAnimation();
      halo.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(halo, { toValue: 0, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [halo, speaking]);

  const statusText =
    status === 'loading'
      ? 'در حال آماده‌سازی تلفظ صوتی…'
      : status === 'speaking'
        ? 'در حال خواندن جمله با صدای طبیعی…'
        : paused
          ? 'پخش متوقف شد؛ برای ادامه ضربه بزنید.'
          : status === 'blocked'
            ? 'برای فعال‌سازی پخش صوتی، دکمهٔ پخش را بزنید.'
            : !enabled
              ? 'پخش دستی فعال است.'
              : auto
                ? 'پخش خودکار روشن است.'
                : 'پخش خودکار خاموش است.';

  const voiceTag = engine === 'cloud' || (cloudAvailable && cloudChecked)
    ? 'صدای تأییدشدهٔ CDN/ابری'
    : voiceLabel;

  const engineTag = engine === 'cloud'
    ? 'CDN/ابری · تأییدشده'
    : cloudChecked && !cloudAvailable
      ? 'صوت تأییدشده در دسترس نیست'
      : 'در حال بررسی CDN';

  const mainLabel = speaking ? 'توقف موقت خواندن' : paused ? 'ادامهٔ خواندن جمله' : 'خواندن جمله';

  return (
    <View
      accessibilityLabel={`نریتور درس. ${statusText}`}
      style={[styles.card, { borderColor: `${accent}2E` }]}
    >
      <View style={styles.top}>
        <View style={styles.avatarBox}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                backgroundColor: accent,
                opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.2] }),
                transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
              },
            ]}
          />
          <View style={[styles.avatar, { backgroundColor: accent, shadowColor: accent }]}>
            <AudioLines size={21} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.titleBox}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>نریتور درس</Text>
            <View style={[styles.liveDot, { backgroundColor: speaking ? accent : '#CBD5E1' }]} />
          </View>
          <Text style={styles.status} numberOfLines={2}>{statusText}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mainLabel}
          accessibilityState={{ busy: speaking }}
          onPress={narrator.togglePause}
          style={({ pressed }) => [
            styles.mainButton,
            { backgroundColor: accent, shadowColor: accent },
            pressed && styles.pressed,
          ]}
        >
          {speaking
            ? <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
            : <Play size={20} color="#FFFFFF" fill="#FFFFFF" />}
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="نریتور خودکار"
          accessibilityState={{ checked: auto }}
          onPress={() => narrator.setAuto(!auto)}
          style={({ pressed }) => [
            styles.chip,
            auto && { backgroundColor: accentSoft, borderColor: `${accent}55` },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.switchTrack, auto && { backgroundColor: accent }]}>
            <View style={[styles.switchKnob, auto && styles.switchKnobOn]} />
          </View>
          <Text style={[styles.chipText, auto && { color: accentDeep }]}>خودکار</Text>
        </Pressable>

        <View style={styles.speedGroup} accessibilityRole="radiogroup" accessibilityLabel="سرعت نریتور">
          {(['slow', 'normal', 'fast'] as const).map(option => {
            const label = option === 'slow' ? 'آهسته' : option === 'normal' ? 'معمولی' : 'سریع';
            const selected = speed === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={`سرعت نریتور: ${label}`}
                accessibilityState={{ selected }}
                onPress={() => narrator.setSpeed(option)}
                style={({ pressed }) => [styles.speedButton, selected && { backgroundColor: accentSoft, borderColor: `${accent}55` }, pressed && styles.pressed]}
              >
                {option === 'normal' ? <Volume2 size={13} color={selected ? accent : '#64748B'} /> : null}
                <Text style={[styles.speedText, selected && { color: accentDeep }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="پخش دوبارهٔ جمله"
          onPress={narrator.replay}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <RotateCcw size={14} color="#64748B" />
          <Text style={styles.chipText}>تکرار</Text>
        </Pressable>

        <View style={[styles.chip, styles.engineChip]}>
          <Sparkles size={13} color={engine === 'cloud' ? accent : '#94A3B8'} />
          <Text numberOfLines={1} style={[styles.chipText, styles.engineText]}>
            {engine === 'cloud' ? engineTag : `${voiceTag}`}
          </Text>
        </View>
      </View>

      {status === 'blocked' ? (
        <Pressable
          accessibilityRole="button"
          onPress={narrator.replay}
          style={({ pressed }) => [styles.blockedBanner, { backgroundColor: accentSoft }, pressed && styles.pressed]}
        >
          <Volume2 size={15} color={accentDeep} />
          <Text style={[styles.blockedText, { color: accentDeep }]}>
            برای شروع پخش صوت یک‌بار همین‌جا بزنید
          </Text>
        </Pressable>
      ) : null}

      {status === 'error' && narrator.message ? (
        <Text accessibilityRole="alert" style={styles.errorText}>{narrator.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatarBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  titleBox: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: Typography.boldFontFamily,
    fontSize: 14,
    color: '#0F172A',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#64748B',
  },
  mainButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  controls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  speedGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speedButton: {
    minHeight: 30,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  speedText: {
    fontFamily: Typography.fontFamily,
    color: '#64748B',
    fontSize: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipText: {
    fontFamily: Typography.mediumFontFamily,
    fontSize: 11,
    color: '#475569',
  },
  engineChip: {
    display: 'none',
    backgroundColor: '#FFFFFF',
    borderStyle: 'dashed',
    maxWidth: 168,
  },
  engineText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  switchTrack: {
    width: 26,
    height: 15,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  blockedText: {
    fontFamily: Typography.mediumFontFamily,
    fontSize: 12,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: '#B91C1C',
  },
});
