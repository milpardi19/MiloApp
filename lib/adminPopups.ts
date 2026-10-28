import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { AppState, Platform } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { adminClient } from './educationAdmin';
import { isSupabaseConfigured } from './pairing';
import { FEATURES, TURKISH_EDITION } from './features';

export type PopupVariant = 'info' | 'celebration' | 'warning' | 'update';
export type PopupDisplayMode = 'once' | 'every_launch' | 'persistent_blocking';
export type PopupTargetScope = 'all' | 'user';
export type PopupTargetEdition = 'all' | 'main' | 'turkish';
export type PopupEventType = 'impression' | 'cta_click' | 'dismiss';

export interface AdminPopup {
  id: string;
  title: string;
  body: string;
  variant: PopupVariant;
  badge_text: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  dismiss_label: string;
  display_mode: PopupDisplayMode;
  target_scope: PopupTargetScope;
  target_edition: PopupTargetEdition;
  target_user_id: string | null;
  priority: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPopupWithStats extends AdminPopup {
  unique_impressions: number;
  total_impressions: number;
  unique_clicks: number;
  total_clicks: number;
  unique_dismissals: number;
  last_event_at: string | null;
}

export interface AdminPopupDraft {
  title: string;
  body: string;
  variant: PopupVariant;
  badge_text?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  dismiss_label?: string | null;
  display_mode: PopupDisplayMode;
  target_scope: PopupTargetScope;
  target_edition: PopupTargetEdition;
  target_user_id?: string | null;
  priority?: number;
  is_active?: boolean;
  expires_in_hours?: number | null;
  expires_at?: string | null;
}

export const POPUP_LIVE_CHANNEL = 'milo-admin-popups-live';
export const SYSTEM_LANGUAGE_POLICY_BADGE = '__MILO_LANG_ACCESS_V1__';
const POPUP_CLIENT_ID_KEY = 'milo_popup_client_id_v1';
const SEEN_POPUPS_STORAGE_KEY = 'milo_seen_popups_v1';
const FALLBACK_POPUPS_CLOUD_KEY = 'milo_admin_popups_cloud_v2';
const FALLBACK_POPUP_STATS_CLOUD_KEY = 'milo_admin_popup_stats_cloud_v2';

interface FallbackPopupStatRecord {
  total_impressions: number;
  unique_impression_clients: string[];
  total_clicks: number;
  unique_click_clients: string[];
  unique_dismiss_clients: string[];
  last_event_at: string | null;
}

function generatePopupId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
  }
}

async function assertVerifiedEducationAdmin(): Promise<void> {
  const db = adminClient();
  const { data, error } = await db.rpc('is_education_admin');
  if (error || data !== true) {
    throw new Error('ADMIN_REQUIRED');
  }
}

async function readCloudPopupFallback(
  client: ReturnType<typeof adminClient>,
): Promise<{ popups: AdminPopup[]; available: boolean }> {
  const { data, error } = await client
    .from('device_settings')
    .select('value')
    .eq('key', FALLBACK_POPUPS_CLOUD_KEY)
    .maybeSingle();
  if (error) return { popups: [], available: false };
  const rawValue = data && typeof (data as { value?: unknown }).value === 'string'
    ? (data as { value: string }).value
    : '';
  if (!rawValue) return { popups: [], available: true };
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return { popups: [], available: true };
    return {
      popups: parsed
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map(row => normalizePopupRow(row)),
      available: true,
    };
  } catch {
    return { popups: [], available: true };
  }
}

async function writeCloudPopupFallback(popups: AdminPopup[]): Promise<void> {
  await assertVerifiedEducationAdmin();
  const db = adminClient();
  const { error } = await db.from('device_settings').upsert(
    {
      key: FALLBACK_POPUPS_CLOUD_KEY,
      value: JSON.stringify(popups.slice(0, 120)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );
  if (error) throw error;
}

async function readCloudPopupStatsFallback(
  client: ReturnType<typeof adminClient>,
): Promise<Record<string, FallbackPopupStatRecord>> {
  const { data, error } = await client
    .from('device_settings')
    .select('value')
    .eq('key', FALLBACK_POPUP_STATS_CLOUD_KEY)
    .maybeSingle();
  if (error || !data || typeof (data as { value?: unknown }).value !== 'string') return {};
  try {
    const parsed = JSON.parse((data as { value: string }).value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, FallbackPopupStatRecord>)
      : {};
  } catch {
    return {};
  }
}

export const INTERNAL_POPUP_ROUTES: ReadonlyArray<{ label: string; route: string; edition?: PopupTargetEdition }> = [
  { label: 'فهرست زبان‌ها', route: '/languages' },
  { label: 'دوره انگلیسی', route: '/lang' },
  { label: 'دوره آلمانی', route: '/learn/de' },
  { label: 'دوره ترکی استانبولی', route: '/learn/tr' },
  { label: 'تعیین سطح هوشمند', route: '/placement' },
  { label: 'مرور فاصله‌دار', route: '/review' },
  { label: 'گفتگوها و پشتیبانی', route: '/conversations' },
  { label: 'مکالمه با Emma', route: '/conversations/emma' },
  { label: 'اشتراک پیشرفت آموزشی', route: '/learning-access' },
  { label: 'همگام‌سازی ابری حساب', route: '/personal-sync' },
];

/** Session-only dismissed keys for `every_launch` popups. */
const sessionDismissedKeys = new Set<string>();
/** Session-only impression dedupe so re-renders never double-count one open modal. */
const sessionImpressionKeys = new Set<string>();

function isInteractiveRuntime(): boolean {
  if (Platform.OS === 'web') return typeof window !== 'undefined';
  return true;
}

export function currentLearnerEdition(): 'main' | 'turkish' {
  return TURKISH_EDITION ? 'turkish' : 'main';
}

function runtimePlatform(): 'android' | 'ios' | 'web' {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

export function isMissingPopupSchema(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const msg = 'message' in error ? String((error as { message?: unknown }).message || '') : '';
  if (code === '42P01' || code === '42883' || code === 'PGRST205' || code === 'PGRST202') return true;
  return /admin_popups|admin_list_popups_with_stats|record_admin_popup_event/i.test(msg)
    && /does not exist|not found|schema cache/i.test(msg);
}

async function readStorageItem(key: string): Promise<string | null> {
  if (!isInteractiveRuntime()) return null;
  try {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeStorageItem(key: string, value: string): Promise<void> {
  if (!isInteractiveRuntime()) return;
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch {
    // Storage quota errors never block UI rendering.
  }
}

export async function getOrCreatePopupClientId(): Promise<string> {
  const existing = await readStorageItem(POPUP_CLIENT_ID_KEY);
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  let generated = '';
  try {
    generated = `milo_${Crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, '')}`;
  } catch {
    generated = `milo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
  await writeStorageItem(POPUP_CLIENT_ID_KEY, generated);
  return generated;
}

export function popupSeenToken(popup: Pick<AdminPopup, 'id' | 'starts_at'>): string {
  return `${popup.id}:${popup.starts_at}`;
}

async function readSeenPopupTokens(): Promise<Set<string>> {
  const raw = await readStorageItem(SEEN_POPUPS_STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

export async function markPopupHandledLocally(popup: AdminPopup): Promise<void> {
  const token = popupSeenToken(popup);
  if (popup.display_mode === 'persistent_blocking') return;
  sessionDismissedKeys.add(token);
  if (popup.display_mode === 'once') {
    const seen = await readSeenPopupTokens();
    seen.add(token);
    const trimmed = Array.from(seen).slice(-300);
    await writeStorageItem(SEEN_POPUPS_STORAGE_KEY, JSON.stringify(trimmed));
  }
}

function normalizePopupRow(row: Record<string, unknown>): AdminPopup {
  const variant = row.variant;
  const displayMode = row.display_mode;
  const targetScope = row.target_scope;
  const targetEdition = row.target_edition;
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    body: String(row.body || ''),
    variant: variant === 'celebration' || variant === 'warning' || variant === 'update' ? variant : 'info',
    badge_text: typeof row.badge_text === 'string' && row.badge_text.trim() ? row.badge_text.trim() : null,
    image_url: typeof row.image_url === 'string' && row.image_url.trim() ? row.image_url.trim() : null,
    cta_label: typeof row.cta_label === 'string' && row.cta_label.trim() ? row.cta_label.trim() : null,
    cta_url: typeof row.cta_url === 'string' && row.cta_url.trim() ? row.cta_url.trim() : null,
    dismiss_label: typeof row.dismiss_label === 'string' && row.dismiss_label.trim() ? row.dismiss_label.trim() : 'متوجه شدم',
    display_mode: displayMode === 'every_launch' || displayMode === 'persistent_blocking' ? displayMode : 'once',
    target_scope: targetScope === 'user' ? 'user' : 'all',
    target_edition: targetEdition === 'main' || targetEdition === 'turkish' ? targetEdition : 'all',
    target_user_id: typeof row.target_user_id === 'string' && row.target_user_id ? row.target_user_id : null,
    priority: typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 0,
    is_active: Boolean(row.is_active),
    starts_at: String(row.starts_at || new Date().toISOString()),
    expires_at: typeof row.expires_at === 'string' && row.expires_at ? row.expires_at : null,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

function normalizePopupStatsRow(row: Record<string, unknown>): AdminPopupWithStats {
  const base = normalizePopupRow(row);
  const toCount = (value: unknown) => {
    const n = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };
  return {
    ...base,
    unique_impressions: toCount(row.unique_impressions),
    total_impressions: toCount(row.total_impressions),
    unique_clicks: toCount(row.unique_clicks),
    total_clicks: toCount(row.total_clicks),
    unique_dismissals: toCount(row.unique_dismissals),
    last_event_at: typeof row.last_event_at === 'string' && row.last_event_at ? row.last_event_at : null,
  };
}

function isPopupCurrentlyInWindow(popup: AdminPopup, nowMs = Date.now()): boolean {
  if (!popup.is_active) return false;
  const startMs = Date.parse(popup.starts_at);
  if (Number.isFinite(startMs) && startMs > nowMs + 5000) return false;
  if (popup.expires_at) {
    const expMs = Date.parse(popup.expires_at);
    if (Number.isFinite(expMs) && expMs <= nowMs) return false;
  }
  return true;
}

function sortPopupsForLearner(popups: AdminPopup[]): AdminPopup[] {
  return [...popups].sort((a, b) => {
    const aBlocking = a.display_mode === 'persistent_blocking' ? 1 : 0;
    const bBlocking = b.display_mode === 'persistent_blocking' ? 1 : 0;
    if (aBlocking !== bBlocking) return bBlocking - aBlocking;
    const aDirect = a.target_scope === 'user' ? 1 : 0;
    const bDirect = b.target_scope === 'user' ? 1 : 0;
    if (aDirect !== bDirect) return bDirect - aDirect;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

/** Fetches active, eligible popups strictly for the With-Login learner app. */
export async function fetchEligibleLearnerPopups(): Promise<AdminPopup[]> {
  if (!FEATURES.learnerLogin || !isInteractiveRuntime() || !isSupabaseConfigured()) return [];
  const edition = currentLearnerEdition();
  let currentUserId: string | null = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    currentUserId = sessionData.session?.user?.id ?? null;
  } catch {
    currentUserId = null;
  }
  // Admin features apply strictly to authenticated users of the With-Login app.
  if (!currentUserId) return [];

  let rawRows: Record<string, unknown>[] = [];
  const { data, error } = await supabase
    .from('admin_popups')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingPopupSchema(error)) {
      const fallback = await readCloudPopupFallback(supabase);
      if (!fallback.available) return [];
      rawRows = fallback.popups as unknown as Record<string, unknown>[];
    } else {
      return [];
    }
  } else {
    rawRows = (data || []) as Record<string, unknown>[];
  }

  const seenOnce = await readSeenPopupTokens();
  const nowMs = Date.now();
  const eligible = rawRows
    .map(row => normalizePopupRow(row))
    .filter(popup => {
      if (popup.badge_text === SYSTEM_LANGUAGE_POLICY_BADGE) return false;
      if (!popup.id || !isPopupCurrentlyInWindow(popup, nowMs)) return false;
      if (popup.target_edition !== 'all' && popup.target_edition !== edition) return false;
      if (popup.target_scope === 'user' && popup.target_user_id !== currentUserId) return false;
      const token = popupSeenToken(popup);
      if (popup.display_mode === 'once' && (seenOnce.has(token) || sessionDismissedKeys.has(token))) return false;
      if (popup.display_mode === 'every_launch' && sessionDismissedKeys.has(token)) return false;
      return true;
    });

  return sortPopupsForLearner(eligible);
}

/** Records a real impression, CTA click, or dismissal in Supabase. */
export async function recordLearnerPopupEvent(popup: AdminPopup, eventType: PopupEventType): Promise<void> {
  if (!isInteractiveRuntime() || !isSupabaseConfigured() || !popup.id) return;
  const token = `${popupSeenToken(popup)}:${eventType}`;
  if (eventType === 'impression') {
    if (sessionImpressionKeys.has(token)) return;
    sessionImpressionKeys.add(token);
  }
  try {
    const clientId = await getOrCreatePopupClientId();
    const { error } = await supabase.rpc('record_admin_popup_event', {
      p_popup_id: popup.id,
      p_event_type: eventType,
      p_client_id: clientId,
      p_edition: currentLearnerEdition(),
      p_platform: runtimePlatform(),
    });
    if (error && isMissingPopupSchema(error)) {
      const statsMap = await readCloudPopupStatsFallback(supabase);
      const current: FallbackPopupStatRecord = statsMap[popup.id] || {
        total_impressions: 0,
        unique_impression_clients: [],
        total_clicks: 0,
        unique_click_clients: [],
        unique_dismiss_clients: [],
        last_event_at: null,
      };
      const addUnique = (arr: string[], id: string) =>
        arr.includes(id) ? arr : [...arr.slice(-499), id];
      if (eventType === 'impression') {
        current.total_impressions = (current.total_impressions || 0) + 1;
        current.unique_impression_clients = addUnique(current.unique_impression_clients || [], clientId);
      } else if (eventType === 'cta_click') {
        current.total_clicks = (current.total_clicks || 0) + 1;
        current.unique_click_clients = addUnique(current.unique_click_clients || [], clientId);
      } else if (eventType === 'dismiss') {
        current.unique_dismiss_clients = addUnique(current.unique_dismiss_clients || [], clientId);
      }
      current.last_event_at = new Date().toISOString();
      statsMap[popup.id] = current;
      await supabase.from('device_settings').upsert(
        {
          key: FALLBACK_POPUP_STATS_CLOUD_KEY,
          value: JSON.stringify(statsMap),
          updated_at: current.last_event_at,
        },
        { onConflict: 'key' },
      );
    }
  } catch {
    // Analytics failure never interrupts the learner.
  }
}

/**
 * Subscribes the learner app to real-time popup updates (both Postgres changes
 * and manager broadcast signals) plus auth/foreground refreshes.
 */
export function subscribeLearnerPopups(onUpdate: (popups: AdminPopup[]) => void): () => void {
  if (!isInteractiveRuntime() || !isSupabaseConfigured()) return () => undefined;

  let active = true;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const refreshNow = async () => {
    if (!active) return;
    const list = await fetchEligibleLearnerPopups();
    if (active) onUpdate(list);
  };

  const scheduleRefresh = (delayMs = 80) => {
    if (!active) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void refreshNow(); }, delayMs);
  };

  void refreshNow();

  const channel: RealtimeChannel = supabase
    .channel(POPUP_LIVE_CHANNEL)
    .on('broadcast', { event: 'popups_changed' }, () => scheduleRefresh(25))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_popups' }, () => scheduleRefresh(60))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'device_settings' }, () => scheduleRefresh(80))
    .subscribe();

  const { data: authSub } = supabase.auth.onAuthStateChange(event => {
    if (event === 'INITIAL_SESSION') return;
    scheduleRefresh(60);
  });

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') scheduleRefresh(50);
  });

  const onVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      scheduleRefresh(50);
    }
  };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible);
  }

  return () => {
    active = false;
    if (debounceTimer) clearTimeout(debounceTimer);
    authSub.subscription.unsubscribe();
    appStateSub.remove();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisible);
    }
    void supabase.removeChannel(channel).catch(() => undefined);
  };
}

/** Sends a live broadcast ping so open learner apps re-query `admin_popups` immediately. */
export async function broadcastAdminPopupSignal(): Promise<void> {
  if (!isInteractiveRuntime() || !isSupabaseConfigured()) return;
  const db = adminClient();
  const channel = db.channel(POPUP_LIVE_CHANNEL, {
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
      const timeout = setTimeout(done, 1800);
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          void channel
            .send({ type: 'broadcast', event: 'popups_changed', payload: { ts: Date.now() } })
            .finally(() => {
              clearTimeout(timeout);
              done();
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timeout);
          done();
        }
      });
    });
  } finally {
    void db.removeChannel(channel).catch(() => undefined);
  }
}

export function validateAdminPopupDraft(draft: AdminPopupDraft): {
  title: string;
  body: string;
  variant: PopupVariant;
  badge_text: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  dismiss_label: string;
  display_mode: PopupDisplayMode;
  target_scope: PopupTargetScope;
  target_edition: PopupTargetEdition;
  target_user_id: string | null;
  priority: number;
  is_active: boolean;
  expires_at: string | null;
} {
  const title = draft.title.trim();
  const body = draft.body.trim();
  if (!title || title.length > 120) {
    throw new Error('POPUP_TITLE_INVALID');
  }
  if (!body || body.length > 1200) {
    throw new Error('POPUP_BODY_INVALID');
  }

  const badgeText = draft.badge_text?.trim() || null;
  if (badgeText && (badgeText.length > 40 || badgeText === SYSTEM_LANGUAGE_POLICY_BADGE)) {
    throw new Error('POPUP_BADGE_INVALID');
  }

  const imageUrl = draft.image_url?.trim() || null;
  if (imageUrl && (!/^https:\/\/.+/i.test(imageUrl) || imageUrl.length > 600)) {
    throw new Error('POPUP_IMAGE_INVALID');
  }

  const ctaLabel = draft.cta_label?.trim() || null;
  const ctaUrl = draft.cta_url?.trim() || null;
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    throw new Error('POPUP_CTA_INCOMPLETE');
  }
  if (ctaLabel && ctaLabel.length > 60) {
    throw new Error('POPUP_CTA_INVALID');
  }
  if (ctaUrl) {
    const validInternal = ctaUrl.startsWith('/') && !ctaUrl.startsWith('//') && ctaUrl.length <= 500;
    const validExternal = /^https:\/\/.+/i.test(ctaUrl) && ctaUrl.length <= 500;
    if (!validInternal && !validExternal) {
      throw new Error('POPUP_CTA_URL_INVALID');
    }
  }

  const dismissLabel = (draft.dismiss_label?.trim() || 'متوجه شدم').slice(0, 40);
  const targetScope: PopupTargetScope = draft.target_scope === 'user' ? 'user' : 'all';
  const targetUserId = targetScope === 'user' ? (draft.target_user_id?.trim() || null) : null;
  if (targetScope === 'user' && !targetUserId) {
    throw new Error('POPUP_TARGET_USER_REQUIRED');
  }

  const rawPriority = typeof draft.priority === 'number' && Number.isFinite(draft.priority)
    ? Math.round(draft.priority)
    : 0;
  const priority = Math.max(0, Math.min(100, rawPriority));

  let expiresAt: string | null = null;
  if (draft.expires_at) {
    const parsed = Date.parse(draft.expires_at);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      throw new Error('POPUP_EXPIRY_INVALID');
    }
    expiresAt = new Date(parsed).toISOString();
  } else if (typeof draft.expires_in_hours === 'number' && draft.expires_in_hours > 0) {
    expiresAt = new Date(Date.now() + draft.expires_in_hours * 3_600_000).toISOString();
  }

  return {
    title,
    body,
    variant: draft.variant,
    badge_text: badgeText,
    image_url: imageUrl,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    dismiss_label: dismissLabel,
    display_mode: draft.display_mode,
    target_scope: targetScope,
    target_edition: draft.target_edition,
    target_user_id: targetUserId,
    priority,
    is_active: draft.is_active ?? true,
    expires_at: expiresAt,
  };
}

export async function loadAdminPopupsWithStats(): Promise<{
  popups: AdminPopupWithStats[];
  schemaMissing: boolean;
}> {
  const db = adminClient();
  const { data, error } = await db.rpc('admin_list_popups_with_stats');
  if (error) {
    if (isMissingPopupSchema(error)) {
      const [fallback, statsMap] = await Promise.all([
        readCloudPopupFallback(db),
        readCloudPopupStatsFallback(db),
      ]);
      if (fallback.available) {
        const merged: AdminPopupWithStats[] = fallback.popups
          .filter(row => row.badge_text !== SYSTEM_LANGUAGE_POLICY_BADGE)
          .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
          .map(row => {
            const st = statsMap[row.id];
            return {
              ...row,
              unique_impressions: st?.unique_impression_clients?.length ?? 0,
              total_impressions: st?.total_impressions ?? 0,
              unique_clicks: st?.unique_click_clients?.length ?? 0,
              total_clicks: st?.total_clicks ?? 0,
              unique_dismissals: st?.unique_dismiss_clients?.length ?? 0,
              last_event_at: st?.last_event_at ?? null,
            };
          });
        return { popups: merged, schemaMissing: false };
      }
      return { popups: [], schemaMissing: true };
    }
    throw error;
  }
  const popups = Array.isArray(data)
    ? data
        .map(row => normalizePopupStatsRow(row as Record<string, unknown>))
        .filter(row => row.badge_text !== SYSTEM_LANGUAGE_POLICY_BADGE)
    : [];
  return { popups, schemaMissing: false };
}

export async function createAdminPopup(draft: AdminPopupDraft): Promise<void> {
  const payload = validateAdminPopupDraft(draft);
  const db = adminClient();
  const { error } = await db.from('admin_popups').insert(payload);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const now = new Date().toISOString();
      const existing = await readCloudPopupFallback(db);
      if (!existing.available) throw error;
      const newPopup: AdminPopup = {
        id: generatePopupId(),
        ...payload,
        starts_at: now,
        created_at: now,
        updated_at: now,
      };
      await writeCloudPopupFallback([newPopup, ...existing.popups]);
      void broadcastAdminPopupSignal();
      return;
    }
    throw error;
  }
  void broadcastAdminPopupSignal();
}

export async function updateAdminPopup(id: string, draft: AdminPopupDraft): Promise<void> {
  const payload = validateAdminPopupDraft(draft);
  const db = adminClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from('admin_popups')
    .update({
      ...payload,
      updated_at: now,
    })
    .eq('id', id);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const existing = await readCloudPopupFallback(db);
      if (!existing.available) throw error;
      const next = existing.popups.map(item =>
        item.id === id ? { ...item, ...payload, updated_at: now } : item,
      );
      await writeCloudPopupFallback(next);
      void broadcastAdminPopupSignal();
      return;
    }
    throw error;
  }
  void broadcastAdminPopupSignal();
}

export async function toggleAdminPopupActive(id: string, isActive: boolean): Promise<void> {
  const db = adminClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from('admin_popups')
    .update({
      is_active: isActive,
      updated_at: now,
    })
    .eq('id', id);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const existing = await readCloudPopupFallback(db);
      if (!existing.available) throw error;
      const next = existing.popups.map(item =>
        item.id === id ? { ...item, is_active: isActive, updated_at: now } : item,
      );
      await writeCloudPopupFallback(next);
      void broadcastAdminPopupSignal();
      return;
    }
    throw error;
  }
  void broadcastAdminPopupSignal();
}

/** Resets `starts_at` to now so even learners who dismissed a `once` popup see it fresh. */
export async function republishAdminPopup(id: string): Promise<void> {
  const db = adminClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from('admin_popups')
    .update({
      is_active: true,
      starts_at: now,
      updated_at: now,
    })
    .eq('id', id);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const existing = await readCloudPopupFallback(db);
      if (!existing.available) throw error;
      const next = existing.popups.map(item =>
        item.id === id ? { ...item, is_active: true, starts_at: now, updated_at: now } : item,
      );
      await writeCloudPopupFallback(next);
      void broadcastAdminPopupSignal();
      return;
    }
    throw error;
  }
  void broadcastAdminPopupSignal();
}

export async function deleteAdminPopup(id: string): Promise<void> {
  const db = adminClient();
  const { error } = await db.from('admin_popups').delete().eq('id', id);
  if (error) {
    if (isMissingPopupSchema(error)) {
      const existing = await readCloudPopupFallback(db);
      if (!existing.available) throw error;
      await writeCloudPopupFallback(existing.popups.filter(item => item.id !== id));
      void broadcastAdminPopupSignal();
      return;
    }
    throw error;
  }
  void broadcastAdminPopupSignal();
}

/** Subscribes the Admin Panel to live impression/click/dismiss changes. */
export function subscribeAdminPopupTelemetry(onChange: () => void): () => void {
  if (!isInteractiveRuntime() || !isSupabaseConfigured()) return () => undefined;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onChange, 250);
  };
  const db = adminClient();
  const channel = db
    .channel(`admin-popup-telemetry:${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_popups' }, trigger)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_popup_events' }, trigger)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'device_settings' }, trigger)
    .subscribe();

  return () => {
    if (timer) clearTimeout(timer);
    void db.removeChannel(channel).catch(() => undefined);
  };
}
