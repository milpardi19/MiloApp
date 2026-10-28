import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import ArrowUpLeft from 'lucide-react-native/dist/esm/icons/arrow-up-left';
import BellRing from 'lucide-react-native/dist/esm/icons/bell-ring';
import ExternalLink from 'lucide-react-native/dist/esm/icons/external-link';
import Lock from 'lucide-react-native/dist/esm/icons/lock';
import Rocket from 'lucide-react-native/dist/esm/icons/rocket';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import TriangleAlert from 'lucide-react-native/dist/esm/icons/triangle-alert';
import X from 'lucide-react-native/dist/esm/icons/x';
import { MANAGEMENT_BUILD } from '@/lib/features';
import { toPersianDigits as fa } from '@/lib/format';
import {
  markPopupHandledLocally,
  popupSeenToken,
  recordLearnerPopupEvent,
  subscribeLearnerPopups,
  type AdminPopup,
  type PopupVariant,
} from '@/lib/adminPopups';

const VARIANT_CONFIG: Record<
  PopupVariant,
  {
    colors: readonly [string, string];
    accent: string;
    softBg: string;
    defaultBadge: string;
    Icon: typeof BellRing;
  }
> = {
  info: {
    colors: ['#155EEF', '#2878DE'],
    accent: '#1769D2',
    softBg: '#EAF3FF',
    defaultBadge: 'اطلاعیه مدیریت',
    Icon: BellRing,
  },
  celebration: {
    colors: ['#4F46E5', '#0D9488'],
    accent: '#4F46E5',
    softBg: '#EEF2FF',
    defaultBadge: 'رویداد ویژه',
    Icon: Sparkles,
  },
  warning: {
    colors: ['#DC2626', '#EA580C'],
    accent: '#DC2626',
    softBg: '#FEF2F2',
    defaultBadge: 'پیام مهم و فوری',
    Icon: TriangleAlert,
  },
  update: {
    colors: ['#3730A3', '#0284C7'],
    accent: '#2563EB',
    softBg: '#EFF6FF',
    defaultBadge: 'نسخه و قابلیت جدید',
    Icon: Rocket,
  },
};

export interface PopupCardPreviewProps {
  title: string;
  body: string;
  variant: PopupVariant;
  badgeText?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  dismissLabel?: string | null;
  blocking?: boolean;
  directTarget?: boolean;
  queueIndex?: number;
  queueTotal?: number;
  onPressCta?: () => void;
  onDismiss?: () => void;
  previewMode?: boolean;
}

export function PopupCardPreview({
  title,
  body,
  variant,
  badgeText,
  imageUrl,
  ctaLabel,
  ctaUrl,
  dismissLabel,
  blocking = false,
  directTarget = false,
  queueIndex = 1,
  queueTotal = 1,
  onPressCta,
  onDismiss,
  previewMode = false,
}: PopupCardPreviewProps) {
  const theme = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const Icon = theme.Icon;
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  const effectiveBadge = badgeText?.trim()
    || (directTarget ? 'پیام اختصاصی برای شما' : theme.defaultBadge);
  const hasCta = Boolean(ctaLabel?.trim() && ctaUrl?.trim());
  const isExternalCta = Boolean(ctaUrl && /^https:\/\//i.test(ctaUrl.trim()));

  return (
    <View style={[styles.card, previewMode && styles.cardPreview]}>
      <LinearGradient
        colors={[theme.colors[0], theme.colors[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.badgePill}>
            <Icon size={14} color="#FFFFFF" />
            <Text numberOfLines={1} style={styles.badgeText}>{effectiveBadge}</Text>
          </View>
          <View style={styles.heroActions}>
            {queueTotal > 1 ? (
              <View style={styles.queuePill}>
                <Text style={styles.queueText}>{fa(queueIndex)} از {fa(queueTotal)}</Text>
              </View>
            ) : null}
            {!blocking && onDismiss ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بستن پیام"
                onPress={onDismiss}
                style={styles.closeIconBtn}
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.heroTitleRow}>
          <View style={styles.heroIconCircle}>
            <Icon size={24} color={theme.accent} />
          </View>
          <Text style={styles.title}>{title.trim() || 'عنوان پاپ‌آپ'}</Text>
        </View>
      </LinearGradient>

      {imageUrl?.trim() && !imageBroken ? (
        <Image
          source={{ uri: imageUrl.trim() }}
          style={styles.bannerImage}
          resizeMode="cover"
          onError={() => setImageBroken(true)}
        />
      ) : null}

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.bodyText}>
          {body.trim() || 'متن اطلاعیه یا پیام مدیریت در این بخش برای زبان‌آموز نمایش داده می‌شود.'}
        </Text>

        {blocking ? (
          <View style={styles.blockingNotice}>
            <Lock size={13} color="#B45309" />
            <Text style={styles.blockingNoticeText}>
              این اطلاعیه الزامی است و تا زمان تکمیل اقدام یا برداشتن توسط مدیریت فعال می‌ماند.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {hasCta ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ctaLabel || 'مشاهده'}
            onPress={onPressCta}
            style={[styles.ctaButton, { backgroundColor: theme.accent }]}
          >
            {isExternalCta ? (
              <ExternalLink size={16} color="#FFFFFF" />
            ) : (
              <ArrowUpLeft size={17} color="#FFFFFF" />
            )}
            <Text style={styles.ctaButtonText}>{ctaLabel?.trim()}</Text>
          </Pressable>
        ) : null}

        {!blocking ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel?.trim() || 'متوجه شدم'}
            onPress={onDismiss}
            style={[styles.dismissButton, !hasCta && { backgroundColor: theme.softBg }]}
          >
            <Text style={[styles.dismissButtonText, !hasCta && { color: theme.accent }]}>
              {dismissLabel?.trim() || 'متوجه شدم'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Live overlay mounted in the learner apps (`Milo MultiLanguage` & `Milo Turkish`).
 * Listens to Supabase Realtime + PostgreSQL `admin_popups` and renders manager
 * popups immediately without requiring an app restart.
 */
export function LearnerPopupBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const [queue, setQueue] = useState<AdminPopup[]>([]);

  const suppressedOnRoute = MANAGEMENT_BUILD || pathname.startsWith('/admin');

  useEffect(() => {
    if (MANAGEMENT_BUILD) return;
    return subscribeLearnerPopups(nextPopups => {
      setQueue(nextPopups);
    });
  }, []);

  const current = !suppressedOnRoute && queue.length > 0 ? queue[0] : null;
  const currentToken = current ? popupSeenToken(current) : null;
  const isBlocking = current?.display_mode === 'persistent_blocking';

  const handleDismiss = useCallback(() => {
    if (!current || isBlocking) return;
    const target = current;
    setQueue(prev => prev.filter(item => popupSeenToken(item) !== popupSeenToken(target)));
    void markPopupHandledLocally(target);
    void recordLearnerPopupEvent(target, 'dismiss');
  }, [current, isBlocking]);

  useEffect(() => {
    if (!current) return;
    void recordLearnerPopupEvent(current, 'impression');
  }, [current, currentToken]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !current) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isBlocking) return true;
      handleDismiss();
      return true;
    });
    return () => sub.remove();
  }, [current, isBlocking, handleDismiss]);

  if (!current) return null;

  const handleCta = () => {
    const target = current;
    const destination = target.cta_url?.trim() || '';
    void recordLearnerPopupEvent(target, 'cta_click');
    if (!isBlocking) {
      setQueue(prev => prev.filter(item => popupSeenToken(item) !== popupSeenToken(target)));
      void markPopupHandledLocally(target);
    }
    if (!destination) return;
    if (destination.startsWith('/') && !destination.startsWith('//')) {
      router.push(destination as never);
    } else if (/^https:\/\//i.test(destination)) {
      void Linking.openURL(destination).catch(() => undefined);
    }
  };

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <Pressable
        accessibilityRole="none"
        disabled={isBlocking}
        onPress={handleDismiss}
        style={styles.backdrop}
      />
      <View pointerEvents="box-none" style={styles.centerWrap}>
        <PopupCardPreview
          title={current.title}
          body={current.body}
          variant={current.variant}
          badgeText={current.badge_text}
          imageUrl={current.image_url}
          ctaLabel={current.cta_label}
          ctaUrl={current.cta_url}
          dismissLabel={current.dismiss_label}
          blocking={isBlocking}
          directTarget={current.target_scope === 'user'}
          queueIndex={1}
          queueTotal={queue.length}
          onPressCta={handleCta}
          onDismiss={isBlocking ? undefined : handleDismiss}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2200,
    elevation: 2200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  centerWrap: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE8F8',
    shadowColor: '#0F172A',
    shadowOpacity: 0.26,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  cardPreview: {
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  heroHeader: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 18,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '75%',
  },
  badgeText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queuePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  queueText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    flex: 1,
    fontFamily: 'Vazir-Bold',
    fontSize: 16,
    lineHeight: 25,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bannerImage: {
    width: '100%',
    height: 148,
    backgroundColor: '#EEF2F7',
  },
  bodyScroll: {
    maxHeight: 230,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  bodyText: {
    fontFamily: 'Vazir',
    fontSize: 13,
    lineHeight: 23,
    color: '#1E293B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  blockingNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  blockingNoticeText: {
    flex: 1,
    fontFamily: 'Vazir',
    fontSize: 10,
    lineHeight: 17,
    color: '#92400E',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 8,
  },
  ctaButton: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaButtonText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  dismissButton: {
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dismissButtonText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 12,
    color: '#475569',
    writingDirection: 'rtl',
  },
});
