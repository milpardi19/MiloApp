import { useEffect, useRef, useState } from 'react';
import { AppState, InteractionManager, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { isSupabaseConfigured } from '@/lib/pairing';
import {
  setActiveChatNotificationConversation,
  startChatNotifications,
  type ChatNotificationEvent,
} from '@/lib/chatNotifications';
import { FEATURES, MANAGEMENT_BUILD } from '@/lib/features';
import {
  clearChatUnreadCount,
  getChatUnreadCount,
  incrementChatUnreadCount,
  loadChatUnreadCount,
  subscribeToChatUnreadCount,
} from '@/lib/chatNotificationState';

const asText = (value: unknown): string => typeof value === 'string' ? value : '';

/** Keeps the server-push registration active and shows quiet in-app banners. */
export function ChatNotificationBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ conversationId?: string | string[] }>();
  const conversationParam = params.conversationId;
  const conversationId = typeof conversationParam === 'string' ? conversationParam : null;
  const isHumanConversation = pathname.startsWith('/conversations/human/');
  const currentConversationRef = useRef<string | null>(null);
  const [banner, setBanner] = useState<ChatNotificationEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(getChatUnreadCount());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenEventIds = useRef(new Set<string>());
  const handledResponseIds = useRef(new Set<string>());
  const foregroundEventRef = useRef<(event: ChatNotificationEvent) => void>(() => undefined);

  currentConversationRef.current = isHumanConversation ? conversationId : null;
  foregroundEventRef.current = event => {
    const stableId = event.eventId.trim();
    if (!stableId || seenEventIds.current.has(stableId)) return;
    seenEventIds.current.add(stableId);
    if (seenEventIds.current.size > 400) {
      const first = seenEventIds.current.values().next().value;
      if (first) seenEventIds.current.delete(first);
    }
    if (AppState.currentState !== 'active') return;
    if (event.conversationId && event.conversationId === currentConversationRef.current) return;

    setBanner(event);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBanner(null), 6500);
    void incrementChatUnreadCount().then(count => {
      void Notifications.setBadgeCountAsync(count).catch(() => undefined);
    });
  };

  useEffect(() => {
    setActiveChatNotificationConversation(isHumanConversation ? conversationId : null);
    return () => setActiveChatNotificationConversation(null);
  }, [conversationId, isHumanConversation]);

  useEffect(() => subscribeToChatUnreadCount(setUnreadCount), []);

  useEffect(() => {
    if (!isSupabaseConfigured() || Platform.OS === 'web') return;
    let mounted = true;
    let stop: (() => Promise<void>) | null = null;

    void loadChatUnreadCount().then(count => {
      if (mounted) void Notifications.setBadgeCountAsync(count).catch(() => undefined);
    });

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      if (
        response.actionIdentifier
        && response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        return;
      }
      const responseId = response.notification?.request?.identifier;
      if (!responseId || handledResponseIds.current.has(responseId)) return;
      const rawData = response.notification?.request?.content?.data;
      const data = rawData && typeof rawData === 'object'
        ? (rawData as Record<string, unknown>)
        : null;
      const targetConversationId = data && typeof data.conversationId === 'string' && data.conversationId.trim()
        ? data.conversationId.trim()
        : null;
      const explicitRoute = data && typeof data.route === 'string'
        ? data.route.trim()
        : '';

      // Android synthesizes a NotificationResponse from ordinary launcher Intents
      // when getLastNotificationResponseAsync() runs right after login. Never fall
      // back to /conversations unless the tapped notification explicitly carried a
      // real Milo chat conversationId or explicit target route.
      if (
        !targetConversationId
        && explicitRoute !== '/admin'
        && (MANAGEMENT_BUILD || explicitRoute !== '/conversations')
      ) {
        return;
      }

      handledResponseIds.current.add(responseId);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      setBanner(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      void clearChatUnreadCount().then(() => Notifications.setBadgeCountAsync(0).catch(() => undefined));
      if (targetConversationId) {
        router.push({
          pathname: '/conversations/human/[conversationId]',
          params: { conversationId: targetConversationId },
        } as never);
      } else if (explicitRoute === '/admin' || MANAGEMENT_BUILD) {
        router.push('/admin' as never);
      } else if (explicitRoute === '/conversations') {
        router.push('/conversations' as never);
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      const content = notification.request.content;
      const data = content.data;
      foregroundEventRef.current({
        eventId: asText(data.eventId) || `expo:${notification.request.identifier}`,
        title: asText(content.title) || 'اعلان تازه',
        body: asText(content.body) || 'برای مشاهده، برنامه را باز کنید.',
        conversationId: asText(data.conversationId) || undefined,
        route: asText(data.route) || undefined,
      });
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleResponse(response);
    });

    void Notifications.getLastNotificationResponseAsync()
      .then(response => { if (mounted) handleResponse(response); })
      .catch(() => undefined);

    let bootTimer: ReturnType<typeof setTimeout> | null = null;
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      bootTimer = setTimeout(() => {
        if (!mounted) return;
        void startChatNotifications({
          // The login APK must wait for a real learner session. Falling back to
          // an anonymous identity here registers the device under the wrong user.
          requireSession: MANAGEMENT_BUILD || FEATURES.learnerLogin,
          onForegroundEvent: event => foregroundEventRef.current(event),
        }).then(cleanup => {
          if (mounted) stop = cleanup;
          else void cleanup();
        }).catch(() => {
          // A denied permission or missing EAS project id must never block startup.
        });
      }, 500);
    });

    return () => {
      mounted = false;
      interactionTask.cancel();
      if (bootTimer) clearTimeout(bootTimer);
      receivedSubscription.remove();
      responseSubscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stop) void stop();
    };
  }, [router]);

  useEffect(() => {
    if (!isHumanConversation && pathname !== '/conversations') return;
    setBanner(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    void clearChatUnreadCount().then(() => {
      void Notifications.setBadgeCountAsync(0).catch(() => undefined);
    });
  }, [isHumanConversation, pathname]);

  const openBanner = () => {
    if (!banner) return;
    const targetConversationId = banner.conversationId;
    setBanner(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    void clearChatUnreadCount().then(() => Notifications.setBadgeCountAsync(0).catch(() => undefined));
    if (targetConversationId) {
      router.push({
        pathname: '/conversations/human/[conversationId]',
        params: { conversationId: targetConversationId },
      } as never);
    } else if (banner.route === '/admin' || MANAGEMENT_BUILD) {
      router.push('/admin' as never);
    } else {
      router.push('/conversations' as never);
    }
  };

  return banner ? (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${banner.title}. ${banner.body}`} onPress={openBanner} style={styles.banner}>
        <View style={styles.copy}>
          <Text style={styles.title}>{banner.title}</Text>
          <Text style={styles.body}>{banner.body}</Text>
        </View>
        {unreadCount > 0 && <View style={styles.count}><Text style={styles.countText}>{unreadCount > 9 ? '۹+' : unreadCount.toLocaleString('fa-IR')}</Text></View>}
      </Pressable>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000, alignItems: 'center', paddingTop: 8, paddingHorizontal: 14 },
  banner: { width: '100%', maxWidth: 560, minHeight: 64, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#C9DCF3', backgroundColor: '#FFFFFF', shadowColor: '#102A56', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  copy: { flex: 1, gap: 3 },
  title: { fontFamily: 'Vazir-Bold', fontSize: 13, color: '#102A56', textAlign: 'right', writingDirection: 'rtl' },
  body: { fontFamily: 'Vazir', fontSize: 11, lineHeight: 17, color: '#52667C', textAlign: 'right', writingDirection: 'rtl' },
  count: { minWidth: 24, height: 24, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3FF' },
  countText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#1769D2' },
});
