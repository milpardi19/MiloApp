import { Alert, AppState, Platform, type AppStateStatus } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import type { RealtimeChannel, SupabaseClient, Subscription } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ensureChatIdentity } from './conversations';
import { adminClient } from './educationAdmin';
import { MANAGEMENT_BUILD } from './features';

export const CHAT_NOTIFICATION_CHANNEL = 'milo-chat';
export const QUIET_CHAT_NOTIFICATION_CHANNEL = 'milo-chat-quiet';
const FOREGROUND_PRESENCE_INTERVAL_MS = 45_000;

export type ChatNotificationEvent = {
  eventId: string;
  title: string;
  body: string;
  conversationId?: string;
  route?: string;
};

type ChatNotificationOptions = {
  requireSession?: boolean;
  onForegroundEvent?: (event: ChatNotificationEvent) => void;
};

type MessageRow = {
  id?: string;
  sender_id?: string;
  conversation_id?: string;
  message_type?: string;
};

let activeConversationId: string | null = null;
let permissionPromptPromise: Promise<boolean> | null = null;

export function setActiveChatNotificationConversation(conversationId: string | null): void {
  activeConversationId = conversationId;
}

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foreground = AppState.currentState === 'active';
    // Foreground delivery is shown by the quiet in-app banner below, not as an
    // OS notification. Background delivery uses Expo's normal OS presentation.
    return {
      shouldShowBanner: !foreground,
      shouldShowList: !foreground,
      shouldPlaySound: !foreground,
      shouldSetBadge: !foreground,
    };
  },
});

async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHAT_NOTIFICATION_CHANNEL, {
    name: 'پیام‌ها و درخواست‌های چت',
    description: 'پیام‌های خصوصی و درخواست‌های پشتیبانی',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 100, 180],
    lightColor: '#2878DE',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync(QUIET_CHAT_NOTIFICATION_CHANNEL, {
    name: 'بنر آرام پیام‌ها',
    description: 'نمایش بی‌صدا هنگام استفاده از برنامه',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [],
    lightColor: '#2878DE',
    sound: null,
    enableVibrate: false,
    showBadge: true,
  });
}

async function askNotificationPermissionOnce(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false;
  if (permissionPromptPromise) return permissionPromptPromise;
  let promptPromise: Promise<boolean> | null = null;
  try {
    // Recheck system settings on resume so a user who enables notifications
    // manually can register without reinstalling.
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    if (permissionPromptPromise) return permissionPromptPromise;

    promptPromise = (async () => {
      return await new Promise<boolean>(resolve => {
        let settled = false;
        const finish = (granted: boolean) => {
          if (settled) return;
          settled = true;
          resolve(granted);
        };
        Alert.alert(
          'اجازهٔ اعلان‌ها',
          'برای باخبرشدن از پیام و درخواست پشتیبانی، اجازهٔ اعلان‌ها را فعال کنید.',
          [
            { text: 'بعداً', style: 'cancel', onPress: () => finish(false) },
            {
              text: 'فعال‌کردن اعلان‌ها',
              onPress: () => {
                void Notifications.requestPermissionsAsync()
                  .then(permission => finish(permission.granted))
                  .catch(() => finish(false));
              },
            },
          ],
          { cancelable: true, onDismiss: () => finish(false) },
        );
      });
    })();
    permissionPromptPromise = promptPromise;
    return await promptPromise;
  } catch {
    return false;
  } finally {
    if (promptPromise && permissionPromptPromise === promptPromise) permissionPromptPromise = null;
  }
}

function expoProjectId(): string | null {
  const extraProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const legacyProjectId = (Constants as typeof Constants & {
    manifest?: { extra?: { eas?: { projectId?: unknown } } };
    manifest2?: { extra?: { eas?: { projectId?: unknown } } };
  }).manifest2?.extra?.eas?.projectId
    ?? (Constants as typeof Constants & {
      manifest?: { extra?: { eas?: { projectId?: unknown } } };
    }).manifest?.extra?.eas?.projectId;
  const projectId = Constants.easConfig?.projectId
    ?? (typeof extraProjectId === 'string' ? extraProjectId : null)
    ?? (typeof legacyProjectId === 'string' ? legacyProjectId : null);
  return typeof projectId === 'string' && projectId.trim() ? projectId.trim() : null;
}

function nativeAppState(state: AppStateStatus): 'active' | 'background' {
  return state === 'active' ? 'active' : 'background';
}

/** Registers one Expo token using only the current authenticated user's client. */
export async function registerChatPushTokenForUser(
  userId: string,
  client: SupabaseClient,
): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice || !userId) return null;
  try {
    await configureAndroidChannels();
    if (!await askNotificationPermissionOnce()) return null;
    const projectId = expoProjectId();
    if (!projectId) return null;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return null;
    const { error } = await client.from('chat_push_tokens').upsert({
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      device_name: Device.deviceName ?? null,
      app_state: nativeAppState(AppState.currentState),
      state_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,expo_push_token' });
    if (error) {
      console.warn('[chat-push] token registration failed:', error.message);
      return null;
    }
    return token;
  } catch (error) {
    // Foreground banners still work if the project has not configured EAS yet.
    console.warn('[chat-push] token registration unavailable:', error);
    return null;
  }
}

function currentClient(): SupabaseClient {
  return MANAGEMENT_BUILD ? adminClient() : supabase;
}

async function resolveUserId(requireSession: boolean): Promise<string | null> {
  const client = currentClient();
  try {
    const { data } = await client.auth.getSession();
    if (data.session?.user.id) return data.session.user.id;
  } catch {
    return null;
  }
  if (MANAGEMENT_BUILD || requireSession) return null;
  try {
    return (await ensureChatIdentity()).id;
  } catch {
    return null;
  }
}

async function removeChannels(client: SupabaseClient, channels: RealtimeChannel[]): Promise<void> {
  await Promise.all(channels.map(async channel => {
    try { await client.removeChannel(channel); } catch { /* cleanup is best effort */ }
  }));
}

async function messageNotificationEvent(
  client: SupabaseClient,
  row: MessageRow,
  recipientId: string,
): Promise<ChatNotificationEvent | null> {
  if (!row.id || !row.sender_id || !row.conversation_id) return null;
  const [requestResult, profileResult] = await Promise.all([
    client.from('support_requests')
      .select('learner_id,manager_id')
      .eq('conversation_id', row.conversation_id)
      .maybeSingle(),
    client.from('profiles')
      .select('display_name')
      .eq('id', row.sender_id)
      .maybeSingle(),
  ]);
  const senderName = String(profileResult.data?.display_name || 'زبان‌آموز').trim().slice(0, 70);
  const supportRequest = requestResult.data;
  const isSupportMessage = !!supportRequest;
  let title: string;
  if (isSupportMessage && row.sender_id === supportRequest.manager_id) {
    title = 'پاسخ تازه از پشتیبانی';
  } else if (isSupportMessage) {
    title = 'پیام تازه از زبان‌آموز';
  } else if (row.message_type === 'voice') {
    title = `پیام صوتی تازه از ${senderName}`;
  } else {
    title = `پیام تازه از ${senderName}`;
  }
  return {
    eventId: `message:${row.id}:${recipientId}`,
    title,
    body: isSupportMessage && row.sender_id === supportRequest?.manager_id
      ? 'فرستنده: پشتیبانی Milo'
      : `فرستنده: ${senderName}`,
    conversationId: row.conversation_id,
  };
}

export async function startChatNotifications(
  options: ChatNotificationOptions = {},
): Promise<() => Promise<void>> {
  if (Platform.OS === 'web' || !Device.isDevice) return async () => undefined;
  await configureAndroidChannels();
  // Resolve the authenticated user before asking for notification permission.
  // Asking on cold launch used to show the prompt before login and could leave
  // the later token-registration path without a reliable second opportunity.

  let stopped = false;
  let activeUserId: string | null = null;
  let activeToken: string | null = null;
  let realtimeChannels: RealtimeChannel[] = [];
  const client = currentClient();

  const teardownUserScope = async () => {
    const current = realtimeChannels;
    realtimeChannels = [];
    await removeChannels(client, current);
    activeToken = null;
  };

  const emitForegroundEvent = (event: ChatNotificationEvent) => {
    if (!stopped && AppState.currentState === 'active') options.onForegroundEvent?.(event);
  };

  const setupUserScope = async (userId: string) => {
    await teardownUserScope();
    if (stopped) return;
    activeUserId = userId;
    activeToken = await registerChatPushTokenForUser(userId, client);

    const messages = client
      .channel(`chat-notifications:messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const row = payload.new as MessageRow;
        if (!row.conversation_id || row.sender_id === userId) return;
        void messageNotificationEvent(client, row, userId)
          .then(event => { if (event && activeUserId === userId) emitForegroundEvent(event); })
          .catch(() => undefined);
      })
      .subscribe();

    const contacts = client
      .channel(`chat-notifications:contacts:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_contacts', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as { user_id?: string; contact_id?: string; conversation_id?: string };
          if (!row.conversation_id || !row.user_id) return;
          // Support requests have their own single manager-side event and must
          // not look like an accepted contact to the learner who requested it.
          void client.from('support_requests')
            .select('conversation_id')
            .eq('conversation_id', row.conversation_id)
            .maybeSingle()
            .then(({ data }) => {
              if (data || activeUserId !== userId) return;
              emitForegroundEvent({
                eventId: `contact:${row.conversation_id}:${userId}`,
                title: 'مخاطب تازه در میلو',
                body: 'یک گفتگوی خصوصی جدید برای شما فعال شد.',
                conversationId: row.conversation_id,
              });
            }, () => undefined);
        },
      )
      .subscribe();

    const requests = client
      .channel(`chat-notifications:support:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_requests',
          filter: `${MANAGEMENT_BUILD ? 'manager_id' : 'learner_id'}=eq.${userId}`,
        },
        payload => {
          const row = payload.new as { conversation_id?: string; learner_id?: string; manager_id?: string };
          if (!row.conversation_id || row.manager_id !== userId) return;
          emitForegroundEvent({
            eventId: `support-request:${row.conversation_id}:${userId}`,
            title: 'درخواست چت تازه',
            body: 'یک زبان‌آموز درخواست گفت‌وگو دارد.',
            conversationId: row.conversation_id,
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_requests',
          filter: `learner_id=eq.${userId}`,
        },
        payload => {
          const row = payload.new as { conversation_id?: string; status?: string; status_event_id?: string };
          const previous = payload.old as { status?: string };
          if (MANAGEMENT_BUILD || !row.conversation_id || !row.status_event_id || row.status === previous.status) return;
          emitForegroundEvent({
            eventId: `support-status:${row.conversation_id}:${row.status_event_id}`,
            title: 'وضعیت درخواست پشتیبانی تغییر کرد',
            body: row.status === 'resolved' ? 'درخواست پشتیبانی شما پاسخ داده شد.' : 'درخواست شما دوباره باز شد.',
            conversationId: row.conversation_id,
          });
        },
      )
      .subscribe();

    realtimeChannels = [messages, contacts, requests];
  };

  const activate = async () => {
    if (stopped) return;
    const userId = await resolveUserId(options.requireSession === true);
    if (stopped) return;
    if (!userId) {
      activeUserId = null;
      activeToken = null;
      await teardownUserScope();
      return;
    }
    if (userId === activeUserId) return;
    await setupUserScope(userId);
  };

  await activate();
  const authSubscription: Subscription = client.auth.onAuthStateChange(() => {
    void activate();
  }).data.subscription;

  const updateDeviceState = async (state: AppStateStatus, allowRegistration = false) => {
    const userId = activeUserId;
    if (!userId) return;
    try {
      let token = activeToken;
      if (!token && state === 'active' && allowRegistration) {
        token = await registerChatPushTokenForUser(userId, client);
        if (!token || activeUserId !== userId) return;
        activeToken = token;
      }
      if (!token) return;
      const now = new Date().toISOString();
      await client.from('chat_push_tokens').update({
        app_state: nativeAppState(state),
        state_updated_at: now,
        updated_at: now,
      }).eq('user_id', userId).eq('expo_push_token', token);
    } catch {
      // The next foreground heartbeat or app launch refreshes this hint.
    }
  };

  const appStateSubscription = AppState.addEventListener('change', state => {
    void updateDeviceState(state, true);
  });
  const heartbeat = setInterval(() => {
    if (AppState.currentState === 'active') void updateDeviceState('active');
  }, FOREGROUND_PRESENCE_INTERVAL_MS);

  return async () => {
    stopped = true;
    authSubscription.unsubscribe();
    appStateSubscription.remove();
    clearInterval(heartbeat);
    await teardownUserScope();
  };
}
