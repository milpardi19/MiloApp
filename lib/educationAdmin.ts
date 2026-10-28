import { FEATURES } from './features';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isSupabaseConfigured } from './pairing';
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from './supabaseConfig';
import { SENTENCE_LESSONS } from './courseContent';
import canonical from '../assets/data/essential504.json';

// Separate auth storage: signing into the panel must not replace the learner session.
let client: SupabaseClient | null = null;
export function adminClient() {
  if (!FEATURES.adminPanel) throw new Error('پنل مدیریت فعلاً غیرفعال است.');
  if (!isSupabaseConfigured()) throw new Error('ابتدا اتصال Supabase پروژه را تنظیم کنید.');
  if (!client) client = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_ANON_KEY, {
    auth: {
      storageKey: 'education-admin-session-v1',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: Platform.OS === 'web' ? {
        getItem: (key) => typeof window === 'undefined' ? null : window.localStorage.getItem(key),
        setItem: (key, value) => { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
        removeItem: (key) => { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
      } : AsyncStorage,
    },
  });
  return client;
}

export interface StudentRow {
  student_id: string;
  display_name: string;
  status: 'active' | 'paused';
  consent_at: string;
  synced_at: string | null;
  summary: Record<string, unknown> | null;
}

export interface EducationInvite {
  id: string;
  label: string;
  code: string;
  expires_at: string;
  claimed_at: string | null;
  created_at?: string;
}

export interface RegisteredUser {
  user_id: string;
  full_name: string;
  email: string;
  platform: string | null;
  app_version: string | null;
  registered_at: string;
  last_seen_at: string;
}

const lessonIds = new Set(SENTENCE_LESSONS.map(l => l.id));
const words = new Set<string>(canonical);

function uniqueStringsCount(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return new Set(value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)).size;
}

export function progressMetrics(summary: Record<string, unknown> | null) {
  const count = (value: unknown, allowed: Set<string>) =>
    Array.isArray(value) ? new Set(value.filter((v): v is string => typeof v === 'string' && allowed.has(v))).size : 0;
  const finite = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

  const lessons = count(summary?.completedLessonIds, lessonIds);
  const germanLessons = uniqueStringsCount(summary?.germanCompletedLessonIds);
  const russianLessons = uniqueStringsCount(summary?.russianCompletedLessonIds);
  const turkishLessons = uniqueStringsCount(summary?.turkishCompletedLessonIds);
  const pronunciationCount = finite(summary?.pronunciationKeysCount);

  return {
    lessons,
    percent: Math.round((lessons / SENTENCE_LESSONS.length) * 100),
    words: count(summary?.learnedEssential504Words, words),
    minutes: finite(summary?.totalMinutes),
    streak: finite(summary?.currentStreak),
    germanLessons,
    russianLessons,
    turkishLessons,
    pronunciationCount,
    totalAllLessons: lessons + germanLessons + russianLessons + turkishLessons,
  };
}

export function educationError(error: unknown): string {
  const text = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : typeof error === 'string'
      ? error
      : '';
  if (/POPUP_TITLE_INVALID/.test(text)) return 'عنوان پاپ‌آپ باید بین ۱ تا ۱۲۰ نویسه باشد.';
  if (/POPUP_BODY_INVALID/.test(text)) return 'متن پیام پاپ‌آپ باید بین ۱ تا ۱٬۲۰۰ نویسه باشد.';
  if (/POPUP_BADGE_INVALID/.test(text)) return 'برچسب بالای پاپ‌آپ حداکثر ۴۰ نویسه است.';
  if (/POPUP_IMAGE_INVALID/.test(text)) return 'آدرس تصویر بنر باید با https:// شروع شود.';
  if (/POPUP_CTA_INCOMPLETE/.test(text)) return 'برای دکمهٔ اقدام، هم متن دکمه و هم مسیر/لینک مقصد را وارد کنید.';
  if (/POPUP_CTA_INVALID/.test(text)) return 'عنوان دکمهٔ اقدام حداکثر ۶۰ نویسه است.';
  if (/POPUP_CTA_URL_INVALID/.test(text)) return 'مقصد دکمه باید یک مسیر داخلی اپ (شروع با /) یا لینک امن https:// باشد.';
  if (/POPUP_TARGET_USER_REQUIRED/.test(text)) return 'برای ارسال اختصاصی، ابتدا کاربر موردنظر را از فهرست انتخاب کنید.';
  if (/POPUP_EXPIRY_INVALID/.test(text)) return 'زمان انقضای انتخاب‌شده باید در آینده باشد.';
  if (/EDUCATION_DISABLED/.test(text)) return 'مدیریت آموزشی فعلاً توسط مدیر سامانه غیرفعال شده است (management_enabled=false).';
  if (/INVITE_INVALID|invalid input syntax for type uuid/.test(text)) return 'دعوت معتبر نیست؛ ممکن است منقضی، لغو یا مصرف شده باشد.';
  if (/SELF_INVITE/.test(text)) return 'مدیر نمی‌تواند دعوت خودش را بپذیرد.';
  if (/duplicate key/.test(text)) return 'قبلاً عضو این گروه آموزشی شده‌اید.';
  if (/NAME_INVALID/.test(text)) return 'نامی بین ۱ تا ۸۰ نویسه بنویسید.';
  if (/Invalid login credentials/.test(text)) return 'ایمیل یا رمز ورود مدیر نادرست است.';
  if (/admin_popups|admin_list_popups_with_stats/.test(text) && /schema cache|does not exist|not found/i.test(text)) {
    return 'جدول پاپ‌آپ‌ها هنوز روی Supabase نصب نشده است؛ از دکمهٔ کپی SQL در تب پاپ‌آپ‌ها استفاده کنید.';
  }
  if (/schema cache|does not exist/.test(text)) return 'راه‌اندازی پایگاه‌داده پنل هنوز کامل نیست؛ راهنمای SQL پنل مدیریت را در Supabase اجرا کنید.';
  if (/SELF_DELETE/.test(text)) return 'مدیر نمی‌تواند حساب خودش را حذف کند.';
  if (/ADMIN_ACCOUNT/.test(text)) return 'حساب مدیر از این بخش قابل حذف نیست.';
  if (/ADMIN_REQUIRED|permission denied|row-level security/.test(text)) return 'این حساب مجوز مدیریت ندارد (باید در جدول education_admins ثبت و فعال شده باشد).';
  if (/CONSENT_REQUIRED/.test(text)) return 'اشتراک پیشرفت فقط با رضایت زبان‌آموز انجام می‌شود.';
  if (/AUTH_REQUIRED|JWT|session/i.test(text)) return 'نشست ورود مدیر منقضی شده است؛ دوباره وارد شوید.';
  return 'عملیات انجام نشد. اتصال شبکه و تنظیمات Supabase را بررسی کنید و دوباره تلاش کنید.';
}

function isMissingMultilangRosterRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42883' || error.code === 'PGRST202'
    || (/education_roster_multilang/i.test(error.message || '') && /not found|does not exist|schema cache/i.test(error.message || ''));
}

export async function loadAdminData() {
  const db = adminClient();
  const { data: allowed, error: authError } = await db.rpc('is_education_admin');
  if (authError) throw authError;
  if (!allowed) throw new Error('ADMIN_REQUIRED');

  const rosterPromise = (async () => {
    const ml = await db.rpc('education_roster_multilang');
    if (!ml.error) return ml;
    if (isMissingMultilangRosterRpc(ml.error)) {
      return await db.rpc('education_roster');
    }
    return ml;
  })();

  const [roster, invites, registered, adminRow] = await Promise.all([
    rosterPromise,
    db.from('education_invites').select('id,label,code,expires_at,claimed_at,created_at').order('created_at', { ascending: false }),
    db.rpc('admin_registered_users'),
    db.from('education_admins').select('display_name').maybeSingle(),
  ]);
  if (roster.error) throw roster.error;
  if (invites.error) throw invites.error;
  if (registered.error) throw registered.error;

  return {
    managerName: typeof adminRow.data?.display_name === 'string' && adminRow.data.display_name.trim()
      ? adminRow.data.display_name.trim()
      : 'مدیر اصلی',
    students: (roster.data || []) as StudentRow[],
    invites: (invites.data || []) as EducationInvite[],
    registeredUsers: (registered.data || []) as RegisteredUser[],
  };
}

/** Permanently deletes a learner account through the manager-only Edge Function. */
export async function deleteRegisteredUser(userId: string): Promise<void> {
  const { data, error } = await adminClient().functions.invoke('admin-delete-user', { body: { userId } });
  if (error) {
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    const payload = (await context?.json?.().catch(() => null)) as { code?: string } | null;
    throw new Error(payload?.code || error.message);
  }
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { code?: string }).code || 'DELETE_FAILED'));
  }
}
