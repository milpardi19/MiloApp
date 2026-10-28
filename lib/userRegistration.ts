import { Platform } from 'react-native';
import * as Application from 'expo-application';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { clearCachedRegistration, writeCachedRegistration } from './registrationCache';

export { readCachedRegistration } from './registrationCache';
export type { CachedRegistration } from './registrationCache';

export type RegistrationProfile = {
  user_id: string;
  full_name: string;
  email: string;
  registered_at: string;
  last_seen_at: string;
};

export function isPermanentLearner(user: User | null | undefined): boolean {
  return !!user?.email && !user.is_anonymous;
}

async function saveProfile(user: User, fullName: string): Promise<void> {
  if (!user.email) throw new Error('EMAIL_REQUIRED');
  const now = new Date().toISOString();
  const { error } = await supabase.from('app_user_profiles').upsert({
    user_id: user.id,
    full_name: fullName.trim(),
    email: user.email.trim().toLowerCase(),
    platform: Platform.OS,
    app_version: Application.nativeApplicationVersion || '1.0.0',
    last_seen_at: now,
    updated_at: now,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getRegisteredSession(): Promise<{ session: Session | null; profile: RegistrationProfile | null }> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data.session;
  if (!session || !isPermanentLearner(session.user)) return { session: null, profile: null };
  const { data: profile, error: profileError } = await supabase
    .from('app_user_profiles')
    .select('user_id,full_name,email,registered_at,last_seen_at')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) {
    const fallbackName = String(session.user.user_metadata?.full_name || '').trim();
    if (fallbackName) {
      await saveProfile(session.user, fallbackName);
      return getRegisteredSession();
    }
  }
  if (profile) {
    await writeCachedRegistration({
      userId: session.user.id,
      email: session.user.email ?? profile.email,
      createdAt: Date.now(),
      profile: profile as RegistrationProfile,
    });
  }
  return { session, profile: (profile || null) as RegistrationProfile | null };
}

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertEmail(email: string) {
  const value = cleanEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(value)) throw new Error('EMAIL_INVALID');
  return value;
}

/** Sends the one-time verification code through the configured Supabase email provider. */
export async function requestEmailCode(email: string, fullName?: string): Promise<void> {
  const value = assertEmail(email);
  const { error } = await supabase.auth.signInWithOtp({
    email: value,
    options: {
      shouldCreateUser: Boolean(fullName?.trim()),
      data: fullName?.trim() ? { full_name: fullName.trim() } : undefined,
    },
  });
  if (error) throw error;
}

/** Verifies the code that arrived in the learner's email and creates/repairs the profile. */
export async function verifyEmailCode(email: string, token: string, fullName?: string): Promise<void> {
  const value = assertEmail(email);
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) throw new Error('CODE_INVALID');
  const { data, error } = await supabase.auth.verifyOtp({ email: value, token: cleanToken, type: 'email' });
  if (error) throw error;
  if (!data.user || !data.session || !isPermanentLearner(data.user)) throw new Error('EMAIL_NOT_VERIFIED');
  const existingName = String(data.user.user_metadata?.full_name || '').trim();
  await saveProfile(data.user, fullName?.trim() || existingName || 'زبان‌آموز');
  await writeCachedRegistration({
    userId: data.user.id,
    email: value,
    createdAt: Date.now(),
    profile: (await getRegisteredSession()).profile as RegistrationProfile,
  });
}

/** Kept as a compatibility wrapper for older callers; new flow always sends an email OTP. */
export async function registerLearner(fullName: string, email: string): Promise<'pending'> {
  const cleanName = fullName.trim();
  if (cleanName.length < 2 || cleanName.length > 80) throw new Error('NAME_INVALID');
  await clearCachedRegistration();
  await requestEmailCode(email, cleanName);
  return 'pending';
}

/** Compatibility entry point: password login remains available for existing accounts. */
export async function loginLearner(email: string, password: string): Promise<void> {
  const clean = assertEmail(email);
  const result = await supabase.auth.signInWithPassword({ email: clean, password });
  if (result.error) throw result.error;
  const name = String(result.data.user.user_metadata?.full_name || '').trim();
  if (name) void saveProfile(result.data.user, name).catch(error => console.warn('[registration] profile repair deferred:', error));
}

export async function touchLearnerActivity(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!isPermanentLearner(user)) return;
  await supabase.from('app_user_profiles').update({
    last_seen_at: new Date().toISOString(),
    platform: Platform.OS,
    app_version: Application.nativeApplicationVersion || '1.0.0',
    updated_at: new Date().toISOString(),
  }).eq('user_id', user!.id);
}

export function registrationError(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  if (/NAME_INVALID/.test(message)) return 'نام و نام خانوادگی را کامل وارد کنید.';
  if (/EMAIL_INVALID|invalid.*email/i.test(message)) return 'ایمیل معتبر وارد کنید.';
  if (/CODE_INVALID|token.*(invalid|expired)|otp/i.test(message)) return 'کد واردشده نادرست یا منقضی شده است.';
  if (/EMAIL_NOT_VERIFIED|not verified/i.test(message)) return 'تأیید ایمیل کامل نشد؛ دوباره کد بگیرید.';
  if (/rate limit|too many requests/i.test(message)) return 'تعداد درخواست‌ها زیاد شده است؛ چند دقیقه صبر کنید و دوباره امتحان کنید.';
  if (/email provider|smtp|sending/i.test(message)) return 'ارسال ایمیل روی Supabase تنظیم نشده است؛ تنظیمات Email را بررسی کنید.';
  if (/Invalid login credentials/i.test(message)) return 'ایمیل یا رمز عبور صحیح نیست.';
  if (/row-level security|permission denied/i.test(message)) return 'مجوز ثبت پروفایل روی سرور کامل نیست؛ migration ثبت‌نام را بررسی کنید.';
  if (/app_user_profiles|schema cache|does not exist/i.test(message)) return 'زیرساخت ثبت‌نام هنوز روی سرور فعال نشده است.';
  if (/fetch|network|internet|timeout/i.test(message)) return 'ارتباط با سرور برقرار نشد؛ اینترنت یا VPN را بررسی کنید.';
  return message ? `ورود انجام نشد: ${message.slice(0, 140)}` : 'ورود انجام نشد؛ دوباره تلاش کنید.';
}
