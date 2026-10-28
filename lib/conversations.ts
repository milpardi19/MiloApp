import type { RealtimeChannel, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { adminClient } from './educationAdmin';
import { MANAGEMENT_BUILD } from './features';
import { readableSupabaseError } from './errors';
import { requireOnlineAudioEnabled } from './onlineAudioPolicy';

export interface RealContact {
  id: string;
  conversationId: string;
  displayName: string;
  avatarEmoji: string;
  englishLevel: string;
  lastSeen: string | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'voice' | 'system';
  body: string | null;
  mediaPath: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Learners use the anonymous/learner session; the manager APK uses the manager session. */
function chatDb() {
  return MANAGEMENT_BUILD ? adminClient() : supabase;
}

function isMissingChatModerationSchema(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205'
    || (/user_chat_access|chat_conversation_moderation/.test(error.message || '')
      && /not found|does not exist|schema cache/i.test(error.message || ''));
}

export { SUPABASE_NOT_CONFIGURED_MESSAGE, readableSupabaseError } from './errors';

const HIDDEN_CONVERSATIONS_KEY = 'milo_hidden_conversations_v1';

async function getHiddenConversationIds(): Promise<Set<string>> {
  try {
    const raw = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? null : window.localStorage.getItem(HIDDEN_CONVERSATIONS_KEY))
      : await AsyncStorage.getItem(HIDDEN_CONVERSATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(value => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

async function writeHiddenConversationIds(hidden: Set<string>): Promise<void> {
  const value = JSON.stringify(Array.from(hidden).slice(-200));
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(HIDDEN_CONVERSATIONS_KEY, value);
  } else {
    await AsyncStorage.setItem(HIDDEN_CONVERSATIONS_KEY, value);
  }
}

async function hideConversationLocally(conversationId: string): Promise<void> {
  try {
    const hidden = await getHiddenConversationIds();
    hidden.add(conversationId);
    await writeHiddenConversationIds(hidden);
  } catch {
    // Continue with the RLS-protected remote delete when local storage is full.
  }
}

async function unhideConversationLocally(conversationId: string): Promise<void> {
  try {
    const hidden = await getHiddenConversationIds();
    if (hidden.delete(conversationId)) await writeHiddenConversationIds(hidden);
  } catch {
    // A remote contact remains authoritative if local storage is unavailable.
  }
}

export async function ensureChatIdentity(displayName = 'زبان‌آموز'): Promise<User> {
  const { data: sessionData } = await chatDb().auth.getSession();
  if (MANAGEMENT_BUILD) {
    // The manager never gets an anonymous identity and keeps the profile name set by the backend.
    const managerUser = sessionData.session?.user ?? null;
    if (!managerUser) throw new Error('ADMIN_REQUIRED');
    return managerUser;
  }
  let user = sessionData.session?.user ?? null;
  if (!user) {
    const { data, error } = await chatDb().auth.signInAnonymously();
    if (error || !data.user) throw new Error(readableSupabaseError(error));
    user = data.user;
  }

  const { error: profileError } = await chatDb().from('profiles').upsert(
    { id: user.id, display_name: displayName, last_seen: new Date().toISOString() },
    { onConflict: 'id' },
  );
  if (profileError) throw new Error(readableSupabaseError(profileError));
  return user;
}

/** One private conversation per learner with the manager. Returns the conversation id. */
export async function ensureSupportConversation(displayName = 'زبان‌آموز'): Promise<string> {
  await ensureChatIdentity(displayName);
  const { data, error } = await chatDb().rpc('ensure_support_conversation', { p_display_name: displayName });
  if (error && /SUPPORT_UNAVAILABLE/.test(String(error.message))) {
    throw new Error('حساب پشتیبانی هنوز در پایگاه‌داده ثبت نشده است. ایمیل مدیر را در جدول education_admins ثبت کنید.');
  }
  if (error || typeof data !== 'string') throw new Error(readableSupabaseError(error));
  await unhideConversationLocally(data);
  return data;
}

export async function createRealContactInvite(displayName = 'زبان‌آموز'): Promise<string> {
  await ensureChatIdentity(displayName);
  const { data, error } = await chatDb().rpc('create_contact_invite', { p_display_name: displayName });
  if (error || typeof data !== 'string') throw new Error(readableSupabaseError(error));
  return data;
}

export async function claimRealContactInvite(code: string, displayName = 'زبان‌آموز'): Promise<string> {
  await ensureChatIdentity(displayName);
  const { data, error } = await chatDb().rpc('claim_contact_invite', {
    p_code: code.trim(),
    p_display_name: displayName,
  });
  if (error || typeof data !== 'string') throw new Error(readableSupabaseError(error));
  await unhideConversationLocally(data);
  return data;
}

export async function listRealContacts(includeDeleted = false): Promise<RealContact[]> {
  const currentUser = await ensureChatIdentity();
  const { data: accessControl, error: accessError } = await chatDb()
    .from('user_chat_access')
    .select('is_blocked')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  if (accessError && !isMissingChatModerationSchema(accessError)) throw new Error(readableSupabaseError(accessError));
  if (accessControl?.is_blocked) return [];

  const { data, error } = await chatDb()
    .from('learning_contacts')
    .select('conversation_id,created_at,contact_id')
    .order('created_at', { ascending: false });
  if (error) throw new Error(readableSupabaseError(error));

  if (!data?.length) return [];
  const hiddenConversationIds = await getHiddenConversationIds();
  let visibleRows = data.filter(row => !hiddenConversationIds.has(row.conversation_id));
  if (!visibleRows.length) return [];
  const { data: moderationRows, error: moderationError } = await chatDb()
    .from('chat_conversation_moderation')
    .select('conversation_id,deleted_at')
    .in('conversation_id', visibleRows.map(row => row.conversation_id));
  if (moderationError && !isMissingChatModerationSchema(moderationError)) throw new Error(readableSupabaseError(moderationError));
  const deletedIds = new Set((moderationRows || [])
    .filter(row => Boolean(row.deleted_at))
    .map(row => row.conversation_id));
  if (!includeDeleted) visibleRows = visibleRows.filter(row => !deletedIds.has(row.conversation_id));
  if (!visibleRows.length) return [];
  // contact_id references auth.users, not profiles. Fetch profiles separately;
  // both queries remain subject to the current user's RLS policies.
  const { data: profiles, error: profilesError } = await chatDb()
    .from('profiles')
    .select('id,display_name,avatar_emoji,english_level,last_seen')
    .in('id', Array.from(new Set(visibleRows.map((row) => row.contact_id))));
  if (profilesError) throw new Error(readableSupabaseError(profilesError));
  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return visibleRows.flatMap((row) => {
    const contact = profilesById.get(row.contact_id);
    if (!contact) return [];
    return [{
      id: contact.id,
      conversationId: row.conversation_id,
      displayName: contact.display_name,
      avatarEmoji: contact.avatar_emoji || '🙂',
      englishLevel: contact.english_level || 'Foundation',
      lastSeen: contact.last_seen ?? null,
    } satisfies RealContact];
  });
}

export async function deleteConversationForMe(conversationId: string): Promise<'deleted' | 'hidden'> {
  if (!conversationId) throw new Error('گفتگو مشخص نیست.');
  // Hide first so deletion remains responsive and private on this device even
  // while offline or before the production database receives the new grant.
  await hideConversationLocally(conversationId);
  try {
    const user = await ensureChatIdentity();
    const { error } = await chatDb()
      .from('learning_contacts')
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId);
    if (error) return 'hidden';
    return 'deleted';
  } catch {
    return 'hidden';
  }
}

function mapMessage(row: any): DirectMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    type: row.message_type,
    body: row.body,
    mediaPath: row.media_path,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listMessages(conversationId: string): Promise<DirectMessage[]> {
  await ensureChatIdentity();
  const { data, error } = await chatDb()
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error(readableSupabaseError(error));
  return (data || []).map(mapMessage);
}

export async function sendTextMessage(conversationId: string, body: string): Promise<DirectMessage> {
  const user = await ensureChatIdentity();
  const clean = body.trim();
  if (!clean) throw new Error('پیام خالی است.');
  const { data, error } = await chatDb()
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, message_type: 'text', body: clean })
    .select('*')
    .single();
  if (error || !data) throw new Error(readableSupabaseError(error));
  return mapMessage(data);
}

export async function sendVoiceMessage(
  conversationId: string,
  audioUri: string,
  durationSeconds: number,
): Promise<DirectMessage> {
  requireOnlineAudioEnabled();
  const user = await ensureChatIdentity();
  const response = await fetch(audioUri);
  if (!response.ok) throw new Error('فایل صوتی خوانده نشد.');
  const audio = await response.arrayBuffer();
  if (!audio.byteLength) throw new Error('فایل صوتی خالی است.');
  if (audio.byteLength > 12 * 1024 * 1024) throw new Error('پیام صوتی باید کمتر از ۱۲ مگابایت باشد.');

  const extension = audioUri.toLowerCase().includes('.webm') ? 'webm' : 'm4a';
  const mediaPath = `${conversationId}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error: uploadError } = await chatDb().storage
    .from('chat-voice')
    .upload(mediaPath, audio, { contentType: extension === 'webm' ? 'audio/webm' : 'audio/mp4', upsert: false });
  if (uploadError) throw new Error(readableSupabaseError(uploadError));

  const { data, error } = await chatDb()
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: 'voice',
      body: String(Math.max(1, Math.round(durationSeconds))),
      media_path: mediaPath,
    })
    .select('*')
    .single();
  if (error || !data) {
    await chatDb().storage.from('chat-voice').remove([mediaPath]);
    throw new Error(readableSupabaseError(error));
  }
  return mapMessage(data);
}

export async function getVoiceMessageUrl(mediaPath: string): Promise<string> {
  await ensureChatIdentity();
  const { data, error } = await chatDb().storage.from('chat-voice').createSignedUrl(mediaPath, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(readableSupabaseError(error));
  return data.signedUrl;
}

export async function currentChatUserId(): Promise<string | null> {
  const { data } = await chatDb().auth.getSession();
  return data.session?.user.id ?? null;
}

export type SupportRequestStatus = 'open' | 'resolved';

export interface AdminChatModeration {
  blockedUsers: Record<string, boolean>;
  deletedConversations: Record<string, boolean>;
}

export async function loadAdminChatModeration(
  userIds: string[],
  conversationIds: string[],
): Promise<AdminChatModeration> {
  if (!MANAGEMENT_BUILD) throw new Error('ADMIN_REQUIRED');
  await ensureChatIdentity();
  const [accessResult, moderationResult] = await Promise.all([
    userIds.length
      ? chatDb().from('user_chat_access').select('user_id,is_blocked').in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length
      ? chatDb().from('chat_conversation_moderation').select('conversation_id,deleted_at').in('conversation_id', conversationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (isMissingChatModerationSchema(accessResult.error) || isMissingChatModerationSchema(moderationResult.error)) {
    throw new Error('برای کنترل دسترسی و حذف گفتگو، فایل supabase/SETUP-MULTI-CONTACT-ADMIN-ONCE.sql را ابتدا در SQL Editor داشبورد Supabase اجرا کنید.');
  }
  if (accessResult.error) throw new Error(readableSupabaseError(accessResult.error));
  if (moderationResult.error) throw new Error(readableSupabaseError(moderationResult.error));
  return {
    blockedUsers: Object.fromEntries((accessResult.data || []).map(row => [row.user_id, Boolean(row.is_blocked)])),
    deletedConversations: Object.fromEntries((moderationResult.data || []).map(row => [row.conversation_id, Boolean(row.deleted_at)])),
  };
}

export async function setChatUserBlocked(userId: string, blocked: boolean): Promise<void> {
  if (!MANAGEMENT_BUILD) throw new Error('ADMIN_REQUIRED');
  const { error } = await chatDb().rpc('admin_set_chat_access', {
    p_user_id: userId,
    p_blocked: blocked,
    p_reason: blocked ? 'مدیریت دسترسی گفتگو' : null,
  });
  if (error) throw new Error(readableSupabaseError(error));
}

export async function setChatConversationDeleted(conversationId: string, deleted: boolean): Promise<void> {
  if (!MANAGEMENT_BUILD) throw new Error('ADMIN_REQUIRED');
  const { error } = await chatDb().rpc('admin_set_conversation_deleted', {
    p_conversation_id: conversationId,
    p_deleted: deleted,
  });
  if (error) throw new Error(readableSupabaseError(error));
}

export async function listSupportRequestStatuses(): Promise<Record<string, SupportRequestStatus>> {
  await ensureChatIdentity();
  const { data, error } = await chatDb()
    .from('support_requests')
    .select('conversation_id,status');
  if (error) throw new Error(readableSupabaseError(error));
  return Object.fromEntries((data || []).map(row => [
    row.conversation_id,
    row.status === 'resolved' ? 'resolved' : 'open',
  ]));
}

export async function updateSupportRequestStatus(
  conversationId: string,
  status: SupportRequestStatus,
): Promise<void> {
  const user = await ensureChatIdentity();
  if (!MANAGEMENT_BUILD) throw new Error('ADMIN_REQUIRED');
  const { data, error } = await chatDb()
    .from('support_requests')
    .update({ status })
    .eq('conversation_id', conversationId)
    .eq('manager_id', user.id)
    .select('conversation_id');
  if (error) throw new Error(readableSupabaseError(error));
  if (!data?.length) throw new Error('درخواست پشتیبانی پیدا نشد یا دسترسی کافی نیست.');
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: DirectMessage) => void,
): RealtimeChannel {
  return chatDb()
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage(mapMessage(payload.new)),
    )
    .subscribe();
}

export async function unsubscribeFromMessages(channel: RealtimeChannel | null): Promise<void> {
  if (channel) await chatDb().removeChannel(channel);
}
