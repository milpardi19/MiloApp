import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { adminClient } from './educationAdmin';
import { isSupabaseConfigured } from './pairing';
import { FEATURES } from './features';
import {
  SYSTEM_LANGUAGE_POLICY_BADGE,
  isMissingPopupSchema,
} from './adminPopups';

export const LANG_LIVE_CHANNEL = 'milo-admin-lang-access-live';
const FALLBACK_LANG_POLICIES_CLOUD_KEY = 'milo_language_policies_cloud_v2';

interface FallbackCloudPoliciesDoc {
  global?: LanguagePolicyPayload | null;
  users?: Record<string, LanguagePolicyPayload>;
}

async function assertVerifiedLanguageAdmin(): Promise<void> {
  const db = adminClient();
  const { data, error } = await db.rpc('is_education_admin');
  if (error || data !== true) {
    throw new Error('ADMIN_REQUIRED');
  }
}

async function readFallbackLanguagePolicies(
  client: ReturnType<typeof adminClient>,
): Promise<{ doc: FallbackCloudPoliciesDoc; available: boolean }> {
  const { data, error } = await client
    .from('device_settings')
    .select('value')
    .eq('key', FALLBACK_LANG_POLICIES_CLOUD_KEY)
    .maybeSingle();
  if (error) return { doc: {}, available: false };
  const raw = data && typeof (data as { value?: unknown }).value === 'string'
    ? (data as { value: string }).value
    : '';
  if (!raw) return { doc: {}, available: true };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { doc: {}, available: true };
    }
    return { doc: parsed as FallbackCloudPoliciesDoc, available: true };
  } catch {
    return { doc: {}, available: true };
  }
}

async function writeFallbackLanguagePolicies(doc: FallbackCloudPoliciesDoc): Promise<void> {
  await assertVerifiedLanguageAdmin();
  const db = adminClient();
  const { error } = await db.from('device_settings').upsert(
    {
      key: FALLBACK_LANG_POLICIES_CLOUD_KEY,
      value: JSON.stringify(doc),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );
  if (error) throw error;
}

export type LoginAppLanguageId = 'en' | 'de' | 'tr';

export const LOGIN_APP_LANGUAGE_IDS: readonly LoginAppLanguageId[] = ['en', 'de', 'tr'];

export const LOGIN_APP_LANGUAGE_INFO: ReadonlyArray<{
  id: LoginAppLanguageId;
  fa: string;
  native: string;
  code: string;
  flag: string;
  lessons: number;
}> = [
  { id: 'en', fa: 'انگلیسی', native: 'English', code: 'EN', flag: '🇬🇧', lessons: 174 },
  { id: 'de', fa: 'آلمانی', native: 'Deutsch', code: 'DE', flag: '🇩🇪', lessons: 95 },
  { id: 'tr', fa: 'ترکی استانبولی', native: 'Türkçe', code: 'TR', flag: '🇹🇷', lessons: 66 },
];

export const DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE =
  'در حال حاضر دسترسی به دوره‌های آموزشی برای حساب شما توسط مدیریت غیرفعال شده است. به‌محض فعال‌سازی مجدد توسط مدیر، درس‌ها به‌صورت خودکار باز می‌شوند.';

const LANGUAGE_ACCESS_CACHE_PREFIX = 'milo_login_lang_access_v1:';
const GLOBAL_POLICY_TITLE = '__MILO_LANG_ACCESS_GLOBAL__';
const USER_POLICY_TITLE = '__MILO_LANG_ACCESS_USER__';

export interface LanguagePolicyPayload {
  v: 1;
  enabled: LoginAppLanguageId[];
  message?: string | null;
  updatedAt: string;
}

export interface AdminGlobalLanguagePolicy {
  rowId: string | null;
  enabled: LoginAppLanguageId[];
  message: string;
  updatedAt: string | null;
}

export interface AdminUserLanguagePolicy {
  rowId: string;
  userId: string;
  enabled: LoginAppLanguageId[];
  message: string | null;
  updatedAt: string;
}

export interface LearnerLanguageAccessSnapshot {
  ready: boolean;
  enabled: LoginAppLanguageId[];
  message: string;
  source: 'default' | 'global' | 'user';
}

function isInteractiveRuntime(): boolean {
  if (Platform.OS === 'web') return typeof window !== 'undefined';
  return true;
}

function sanitizeEnabledList(input: unknown): LoginAppLanguageId[] {
  if (!Array.isArray(input)) return [...LOGIN_APP_LANGUAGE_IDS];
  const valid = new Set<LoginAppLanguageId>();
  for (const item of input) {
    if (item === 'en' || item === 'de' || item === 'tr') {
      valid.add(item);
    }
  }
  return LOGIN_APP_LANGUAGE_IDS.filter(id => valid.has(id));
}

function parsePolicyBody(rawBody: unknown): LanguagePolicyPayload | null {
  if (typeof rawBody !== 'string' || !rawBody.trim()) return null;
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.enabled)) return null;
    return {
      v: 1,
      enabled: sanitizeEnabledList(parsed.enabled),
      message: typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message.trim().slice(0, 350)
        : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function encodePolicyBody(enabled: readonly LoginAppLanguageId[], message?: string | null): string {
  const payload: LanguagePolicyPayload = {
    v: 1,
    enabled: sanitizeEnabledList([...enabled]),
    message: typeof message === 'string' && message.trim() ? message.trim().slice(0, 350) : null,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

async function readCache(userId: string): Promise<Omit<LearnerLanguageAccessSnapshot, 'ready'> | null> {
  if (!isInteractiveRuntime() || !userId) return null;
  const key = `${LANGUAGE_ACCESS_CACHE_PREFIX}${userId}`;
  try {
    const raw = Platform.OS === 'web'
      ? window.localStorage.getItem(key)
      : await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || !Array.isArray(parsed.enabled)) return null;
    return {
      enabled: sanitizeEnabledList(parsed.enabled),
      message: typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message.trim()
        : DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
      source: parsed.source === 'user' || parsed.source === 'global' ? parsed.source : 'default',
    };
  } catch {
    return null;
  }
}

async function writeCache(
  userId: string,
  snapshot: Omit<LearnerLanguageAccessSnapshot, 'ready'>,
): Promise<void> {
  if (!isInteractiveRuntime() || !userId) return;
  const key = `${LANGUAGE_ACCESS_CACHE_PREFIX}${userId}`;
  try {
    const serialized = JSON.stringify(snapshot);
    if (Platform.OS === 'web') window.localStorage.setItem(key, serialized);
    else await AsyncStorage.setItem(key, serialized);
  } catch {
    // Storage failures never interrupt language rendering.
  }
}

/** Sends a live broadcast signal so open Login-app clients refresh language access immediately. */
export async function broadcastLanguageAccessSignal(): Promise<void> {
  if (!isInteractiveRuntime() || !isSupabaseConfigured()) return;
  const db = adminClient();
  const channel = db.channel(LANG_LIVE_CHANNEL, {
    config: { broadcast: { ack: false } },
  });
  try {
    await new Promise<void>(resolve => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const timer = setTimeout(done, 1800);
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          void channel
            .send({ type: 'broadcast', event: 'language_access_changed', payload: { ts: Date.now() } })
            .finally(() => {
              clearTimeout(timer);
              done();
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timer);
          done();
        }
      });
    });
  } finally {
    void db.removeChannel(channel).catch(() => undefined);
  }
}

/** Loads both global and per-user language access rules for the Admin Console. */
export async function loadAdminLanguagePolicies(): Promise<{
  globalPolicy: AdminGlobalLanguagePolicy;
  userPolicies: Record<string, AdminUserLanguagePolicy>;
  schemaMissing: boolean;
}> {
  const defaultGlobal: AdminGlobalLanguagePolicy = {
    rowId: null,
    enabled: [...LOGIN_APP_LANGUAGE_IDS],
    message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
    updatedAt: null,
  };
  const db = adminClient();
  const { data, error } = await db
    .from('admin_popups')
    .select('id,target_scope,target_user_id,body,updated_at,is_active')
    .eq('badge_text', SYSTEM_LANGUAGE_POLICY_BADGE)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingPopupSchema(error)) {
      const fb = await readFallbackLanguagePolicies(db);
      if (fb.available) {
        const globalRaw = fb.doc.global ? parsePolicyBody(JSON.stringify(fb.doc.global)) : null;
        const globalPolicy: AdminGlobalLanguagePolicy = globalRaw
          ? {
              rowId: 'cloud_global',
              enabled: globalRaw.enabled,
              message: globalRaw.message || DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
              updatedAt: globalRaw.updatedAt,
            }
          : defaultGlobal;
        const userPolicies: Record<string, AdminUserLanguagePolicy> = {};
        for (const [uid, entry] of Object.entries(fb.doc.users || {})) {
          const parsed = parsePolicyBody(JSON.stringify(entry));
          if (!parsed || !uid) continue;
          userPolicies[uid] = {
            rowId: `cloud_user_${uid}`,
            userId: uid,
            enabled: parsed.enabled,
            message: parsed.message ?? null,
            updatedAt: parsed.updatedAt,
          };
        }
        return { globalPolicy, userPolicies, schemaMissing: false };
      }
      return { globalPolicy: defaultGlobal, userPolicies: {}, schemaMissing: true };
    }
    throw error;
  }

  let globalPolicy: AdminGlobalLanguagePolicy = defaultGlobal;
  let globalFound = false;
  const userPolicies: Record<string, AdminUserLanguagePolicy> = {};

  for (const raw of data || []) {
    const row = raw as Record<string, unknown>;
    const parsed = parsePolicyBody(row.body);
    if (!parsed) continue;
    const id = String(row.id || '');
    const updatedAt = String(row.updated_at || parsed.updatedAt || new Date().toISOString());
    if (row.target_scope === 'all' && !globalFound) {
      globalFound = true;
      globalPolicy = {
        rowId: id,
        enabled: parsed.enabled,
        message: parsed.message || DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
        updatedAt,
      };
    } else if (row.target_scope === 'user' && typeof row.target_user_id === 'string' && row.target_user_id) {
      const uid = row.target_user_id;
      if (!userPolicies[uid]) {
        userPolicies[uid] = {
          rowId: id,
          userId: uid,
          enabled: parsed.enabled,
          message: parsed.message ?? null,
          updatedAt,
        };
      }
    }
  }

  return { globalPolicy, userPolicies, schemaMissing: false };
}

/** Saves the global Login-app language policy (`enabled` may be `[]` to disable ALL languages!). */
export async function saveGlobalLanguagePolicy(
  enabled: readonly LoginAppLanguageId[],
  message?: string | null,
): Promise<void> {
  const db = adminClient();
  const body = encodePolicyBody(enabled, message);
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await db
    .from('admin_popups')
    .select('id')
    .eq('badge_text', SYSTEM_LANGUAGE_POLICY_BADGE)
    .eq('target_scope', 'all')
    .order('updated_at', { ascending: false });
  if (lookupError) {
    if (isMissingPopupSchema(lookupError)) {
      const fb = await readFallbackLanguagePolicies(db);
      if (!fb.available) throw lookupError;
      const parsed = parsePolicyBody(body)!;
      await writeFallbackLanguagePolicies({ ...fb.doc, global: parsed });
      void broadcastLanguageAccessSignal();
      return;
    }
    throw lookupError;
  }

  const rows = existing || [];
  if (rows.length > 0) {
    const primaryId = String((rows[0] as Record<string, unknown>).id);
    const { error: updateError } = await db
      .from('admin_popups')
      .update({
        title: GLOBAL_POLICY_TITLE,
        body,
        is_active: true,
        updated_at: now,
      })
      .eq('id', primaryId);
    if (updateError) throw updateError;
    if (rows.length > 1) {
      const staleIds = rows.slice(1).map(r => String((r as Record<string, unknown>).id));
      await db.from('admin_popups').delete().in('id', staleIds);
    }
  } else {
    const { error: insertError } = await db.from('admin_popups').insert({
      title: GLOBAL_POLICY_TITLE,
      body,
      variant: 'info',
      badge_text: SYSTEM_LANGUAGE_POLICY_BADGE,
      dismiss_label: 'سیستمی',
      display_mode: 'once',
      target_scope: 'all',
      target_edition: 'all',
      target_user_id: null,
      priority: 0,
      is_active: true,
    });
    if (insertError) throw insertError;
  }

  void broadcastLanguageAccessSignal();
}

/** Saves a per-user language override (`enabled` may be `[]` to disable ALL languages for this user!). */
export async function saveUserLanguagePolicy(
  userId: string,
  enabled: readonly LoginAppLanguageId[],
  message?: string | null,
): Promise<void> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) throw new Error('USER_ID_REQUIRED');
  const db = adminClient();
  const body = encodePolicyBody(enabled, message);
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await db
    .from('admin_popups')
    .select('id')
    .eq('badge_text', SYSTEM_LANGUAGE_POLICY_BADGE)
    .eq('target_scope', 'user')
    .eq('target_user_id', cleanUserId)
    .order('updated_at', { ascending: false });
  if (lookupError) {
    if (isMissingPopupSchema(lookupError)) {
      const fb = await readFallbackLanguagePolicies(db);
      if (!fb.available) throw lookupError;
      const parsed = parsePolicyBody(body)!;
      const nextUsers = { ...(fb.doc.users || {}), [cleanUserId]: parsed };
      await writeFallbackLanguagePolicies({ ...fb.doc, users: nextUsers });
      void broadcastLanguageAccessSignal();
      return;
    }
    throw lookupError;
  }

  const rows = existing || [];
  if (rows.length > 0) {
    const primaryId = String((rows[0] as Record<string, unknown>).id);
    const { error: updateError } = await db
      .from('admin_popups')
      .update({
        title: USER_POLICY_TITLE,
        body,
        is_active: true,
        updated_at: now,
      })
      .eq('id', primaryId);
    if (updateError) throw updateError;
    if (rows.length > 1) {
      const staleIds = rows.slice(1).map(r => String((r as Record<string, unknown>).id));
      await db.from('admin_popups').delete().in('id', staleIds);
    }
  } else {
    const { error: insertError } = await db.from('admin_popups').insert({
      title: USER_POLICY_TITLE,
      body,
      variant: 'info',
      badge_text: SYSTEM_LANGUAGE_POLICY_BADGE,
      dismiss_label: 'سیستمی',
      display_mode: 'once',
      target_scope: 'user',
      target_edition: 'all',
      target_user_id: cleanUserId,
      priority: 0,
      is_active: true,
    });
    if (insertError) throw insertError;
  }

  void broadcastLanguageAccessSignal();
}

/** Removes a per-user override so the user returns to the global Login-app language policy. */
export async function clearUserLanguagePolicy(userId: string): Promise<void> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) return;
  const db = adminClient();
  const { error } = await db
    .from('admin_popups')
    .delete()
    .eq('badge_text', SYSTEM_LANGUAGE_POLICY_BADGE)
    .eq('target_scope', 'user')
    .eq('target_user_id', cleanUserId);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const fb = await readFallbackLanguagePolicies(db);
      if (!fb.available) throw error;
      const nextUsers = { ...(fb.doc.users || {}) };
      delete nextUsers[cleanUserId];
      await writeFallbackLanguagePolicies({ ...fb.doc, users: nextUsers });
      void broadcastLanguageAccessSignal();
      return;
    }
    throw error;
  }
  void broadcastLanguageAccessSignal();
}

/** Resolves effective language access for a user in Admin UI given global + per-user policies. */
export function resolveEffectiveUserLanguages(
  userId: string,
  globalPolicy: AdminGlobalLanguagePolicy,
  userPolicies: Record<string, AdminUserLanguagePolicy>,
): { enabled: LoginAppLanguageId[]; customized: boolean } {
  const override = userPolicies[userId];
  if (override) {
    return { enabled: override.enabled, customized: true };
  }
  return { enabled: globalPolicy.enabled, customized: false };
}

/** Fetches the live effective language policy for the authenticated learner in the Login app. */
export async function fetchLearnerLanguageAccess(): Promise<LearnerLanguageAccessSnapshot> {
  if (!FEATURES.learnerLogin || !isInteractiveRuntime() || !isSupabaseConfigured()) {
    return {
      ready: true,
      enabled: [...LOGIN_APP_LANGUAGE_IDS],
      message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
      source: 'default',
    };
  }

  let currentUserId: string | null = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    currentUserId = sessionData.session?.user?.id ?? null;
  } catch {
    currentUserId = null;
  }

  if (!currentUserId) {
    return {
      ready: false,
      enabled: [...LOGIN_APP_LANGUAGE_IDS],
      message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
      source: 'default',
    };
  }

  const cached = await readCache(currentUserId);

  const { data, error } = await supabase
    .from('admin_popups')
    .select('id,target_scope,target_user_id,body,updated_at')
    .eq('is_active', true)
    .eq('badge_text', SYSTEM_LANGUAGE_POLICY_BADGE)
    .order('updated_at', { ascending: false })
    .limit(10);

  let userMatch: LanguagePolicyPayload | null = null;
  let globalMatch: LanguagePolicyPayload | null = null;

  if (error) {
    if (isMissingPopupSchema(error)) {
      const fb = await readFallbackLanguagePolicies(supabase);
      if (fb.available) {
        if (fb.doc.users?.[currentUserId]) {
          userMatch = parsePolicyBody(JSON.stringify(fb.doc.users[currentUserId]));
        }
        if (fb.doc.global) {
          globalMatch = parsePolicyBody(JSON.stringify(fb.doc.global));
        }
      } else if (cached) {
        return { ready: true, ...cached };
      } else {
        return {
          ready: true,
          enabled: [...LOGIN_APP_LANGUAGE_IDS],
          message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
          source: 'default',
        };
      }
    } else if (cached) {
      return { ready: true, ...cached };
    } else {
      return {
        ready: true,
        enabled: [...LOGIN_APP_LANGUAGE_IDS],
        message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
        source: 'default',
      };
    }
  } else {
    for (const raw of data || []) {
      const row = raw as Record<string, unknown>;
      const parsed = parsePolicyBody(row.body);
      if (!parsed) continue;
      if (row.target_scope === 'user' && row.target_user_id === currentUserId && !userMatch) {
        userMatch = parsed;
      } else if (row.target_scope === 'all' && !globalMatch) {
        globalMatch = parsed;
      }
    }
  }

  const resolved: Omit<LearnerLanguageAccessSnapshot, 'ready'> = userMatch
    ? {
        enabled: userMatch.enabled,
        message: userMatch.message || globalMatch?.message || DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
        source: 'user',
      }
    : globalMatch
      ? {
          enabled: globalMatch.enabled,
          message: globalMatch.message || DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
          source: 'global',
        }
      : {
          enabled: [...LOGIN_APP_LANGUAGE_IDS],
          message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
          source: 'default',
        };

  await writeCache(currentUserId, resolved);
  return { ready: true, ...resolved };
}

/** Subscribes the Login learner app to Realtime global & per-user language access changes. */
export function subscribeLearnerLanguageAccess(
  onUpdate: (snapshot: LearnerLanguageAccessSnapshot) => void,
): () => void {
  if (!FEATURES.learnerLogin || !isInteractiveRuntime() || !isSupabaseConfigured()) {
    return () => undefined;
  }

  let active = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const refreshNow = async () => {
    if (!active) return;
    const snap = await fetchLearnerLanguageAccess();
    if (active) onUpdate(snap);
  };

  const scheduleRefresh = (delayMs = 50) => {
    if (!active) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void refreshNow(); }, delayMs);
  };

  void refreshNow();

  const channel: RealtimeChannel = supabase
    .channel(LANG_LIVE_CHANNEL)
    .on('broadcast', { event: 'language_access_changed' }, () => scheduleRefresh(25))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_popups' }, () => scheduleRefresh(50))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'device_settings' }, () => scheduleRefresh(70))
    .subscribe();

  const { data: authSub } = supabase.auth.onAuthStateChange(event => {
    if (event === 'INITIAL_SESSION') return;
    scheduleRefresh(50);
  });

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') scheduleRefresh(40);
  });

  const onVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      scheduleRefresh(40);
    }
  };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible);
  }

  return () => {
    active = false;
    if (timer) clearTimeout(timer);
    authSub.subscription.unsubscribe();
    appStateSub.remove();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisible);
    }
    void supabase.removeChannel(channel).catch(() => undefined);
  };
}
