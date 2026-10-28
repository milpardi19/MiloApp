import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import BookOpen from 'lucide-react-native/dist/esm/icons/book-open';
import ClipboardList from 'lucide-react-native/dist/esm/icons/clipboard-list';
import Home from 'lucide-react-native/dist/esm/icons/house';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import Volume2 from 'lucide-react-native/dist/esm/icons/volume-2';
import { Radius, Typography } from '@/lib/theme';
import { EnglishPalette as Palette } from '@/components/EnglishSupplementTask';
import { setLastActiveLanguage } from '@/components/luxuryTheme';
import { getChatUnreadCount, subscribeToChatUnreadCount } from '@/lib/chatNotificationState';
import { useEffect, useState } from 'react';

export type LearningLanguage = 'en' | 'de' | 'ru' | 'tr';

const routes: Record<LearningLanguage, { home: string; pronunciation: string; library: string; review: string }> = {
  en: { home: '/lang', pronunciation: '/learn/en/pronunciation', library: '/lang/library', review: '/review' },
  de: { home: '/learn/de', pronunciation: '/learn/de/pronunciation', library: '/learn/de/library', review: '/learn/de/reviews' },
  ru: { home: '/learn/ru', pronunciation: '/learn/ru/pronunciation', library: '/learn/ru/library', review: '/learn/ru/review' },
  tr: { home: '/learn/tr', pronunciation: '/learn/tr/pronunciation', library: '/learn/tr/library', review: '/learn/tr/review' },
};

/** One shared floating navigation design for English, German, Russian and Turkish. */
export function LanguageBottomNav({ language }: { language: LearningLanguage }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chatUnreadCount, setChatUnreadCount] = useState(getChatUnreadCount());
  const route = routes[language];
  const items = [
    { path: '/languages', label: 'خانه', icon: Home },
    { path: route.home, label: 'یادگیری', icon: BookOpen },
    { path: route.pronunciation, label: 'تلفظ', icon: Volume2 },
    { path: '/conversations', label: 'مکالمه', icon: MessageCircle },
    { path: route.library, label: 'درس‌ها', icon: ClipboardList },
    { path: route.review, label: 'مرور', icon: RefreshCw },
  ];

  useEffect(() => {
    if (pathname !== '/conversations' && !pathname.startsWith('/conversations/')) {
      setLastActiveLanguage(language);
    }
  }, [language, pathname]);

  useEffect(() => subscribeToChatUnreadCount(setChatUnreadCount), []);

  return (
    <View style={styles.shell}>
      {items.map(item => {
        const active = item.path === route.home
          ? pathname === route.home || (pathname.startsWith(`${route.home}/`)
            && pathname !== route.library && !pathname.startsWith(`${route.library}/`)
            && pathname !== route.pronunciation && !pathname.startsWith(`${route.pronunciation}/`)
            && pathname !== route.review && !pathname.startsWith(`${route.review}/`)
            && pathname !== '/learn/de/review')
          : item.path === route.review && language === 'de'
            ? pathname === route.review || pathname.startsWith(`${route.review}/`) || pathname === '/learn/de/review'
            : pathname === item.path || pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;
        return (
          <Pressable key={item.path} accessibilityRole="button" accessibilityState={{ selected: active }} style={styles.item} onPress={() => router.replace(item.path as never)}>
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Icon size={18} color={active ? Palette.primary : Palette.muted} strokeWidth={active ? 2.5 : 2} />
              {item.path === '/conversations' && chatUnreadCount > 0 ? (
                <View accessibilityLabel={`${chatUnreadCount} پیام خوانده‌نشده`} style={styles.badge}>
                  <Text style={styles.badgeText}>{chatUnreadCount > 9 ? '۹+' : chatUnreadCount.toLocaleString('fa-IR')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    minHeight: 68,
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'web' ? 14 : 34,
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 24,
    shadowColor: '#0B1838',
    shadowOpacity: 0.085,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  item: { flex: 1, minWidth: 48, alignItems: 'center', gap: 3 },
  iconWrap: { width: 42, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconWrapActive: { backgroundColor: Palette.primarySoft },
  badge: { position: 'absolute', top: -4, right: 1, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D14343', borderWidth: 1, borderColor: Palette.surface },
  badgeText: { color: '#FFFFFF', fontFamily: Typography.boldFontFamily, fontSize: 8, lineHeight: 11, textAlign: 'center' },
  label: { fontFamily: Typography.fontFamily, fontSize: 11.5, fontWeight: '600', color: Palette.muted, writingDirection: 'rtl' },
  labelActive: { color: Palette.primaryDark, fontWeight: Typography.weights.bold },
});
