import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import BookOpenCheck from 'lucide-react-native/dist/esm/icons/book-open-check';
import MailCheck from 'lucide-react-native/dist/esm/icons/mail-check';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import UserPlus from 'lucide-react-native/dist/esm/icons/user-plus';
import LogIn from 'lucide-react-native/dist/esm/icons/log-in';
import { supabase } from '@/lib/supabase';
import { KeyboardAwareScrollView, KeyboardAvoidingView } from '@/components/KeyboardRuntime';
import { getRegisteredSession, registrationError, requestEmailCode, touchLearnerActivity, verifyEmailCode, readCachedRegistration } from '@/lib/userRegistration';
import { Colors, Radius, Typography } from '@/lib/theme';
import { FEATURES } from '@/lib/features';

const IS_ADMIN_APP = Constants.expoConfig?.extra?.appRole === 'admin' || process.env.EXPO_PUBLIC_MILO_ADMIN_APP === 'true';
const BYPASS_GATE: boolean = IS_ADMIN_APP || !FEATURES.learnerLogin;
type Mode = 'register' | 'login';
type Stage = 'email' | 'code';

export function RegistrationGate({ children, onAuthenticated }: PropsWithChildren<{ onAuthenticated?: () => void }>) {
  const [checking, setChecking] = useState(!BYPASS_GATE);
  const [ready, setReady] = useState(BYPASS_GATE);
  const [mode, setMode] = useState<Mode>('register');
  const [stage, setStage] = useState<Stage>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const openedFromCache = useRef(false);

  const inspect = useCallback(async () => {
    if (BYPASS_GATE) return;
    try {
      const state = await getRegisteredSession();
      const complete = !!state.session && !!state.profile;
      setReady(complete);
      if (complete) void touchLearnerActivity();
    } catch {
      if (!openedFromCache.current) setReady(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (BYPASS_GATE) return;
    let alive = true;
    void readCachedRegistration().then(cached => {
      if (!alive || !cached) return;
      openedFromCache.current = true;
      setReady(true);
      setChecking(false);
    });
    void inspect();
    const { data } = supabase.auth.onAuthStateChange(() => { void inspect(); });
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void inspect(); });
    return () => { alive = false; data.subscription.unsubscribe(); appState.remove(); };
  }, [inspect]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'register' && (fullName.trim().length < 2 || fullName.trim().length > 80)) throw new Error('NAME_INVALID');
      await requestEmailCode(email, mode === 'register' ? fullName : undefined);
      setStage('code'); setCooldown(45);
      setNotice(`کد ۶ رقمی به ${email.trim().toLowerCase()} فرستاده شد.`);
    } catch (reason) {
      setError(registrationError(reason));
    } finally { setBusy(false); }
  };

  const verifyCode = async () => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await verifyEmailCode(email, code, fullName);
      setReady(true); setStage('email'); setCode(''); setNotice('ورود موفق بود.'); onAuthenticated?.();
      void inspect();
    } catch (reason) {
      setError(registrationError(reason));
    } finally { setBusy(false); }
  };

  if (BYPASS_GATE || ready) return <>{children}</>;
  if (checking) return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary[600]} /><Text style={styles.loadingText}>در حال بررسی حساب…</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.page} behavior="height" enabled>
      <KeyboardAwareScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" bottomOffset={24} extraKeyboardSpace={12}>
        <LinearGradient colors={['#EAF4FF', '#FFFFFF']} style={styles.card}>
          <View style={styles.logo}>{stage === 'email' ? <BookOpenCheck size={31} color="#FFFFFF" /> : <MailCheck size={31} color="#FFFFFF" />}</View>
          <Text style={styles.eyebrow}>MILO LANGUAGE LEARNING</Text>
          <Text style={styles.title}>{stage === 'email' ? (mode === 'register' ? 'ساخت حساب زبان‌آموز' : 'ورود به حساب') : 'کد ایمیل را وارد کن'}</Text>
          <Text style={styles.subtitle}>
            {stage === 'email'
              ? 'ایمیل خودت را وارد کن؛ یک کد واقعی و یک‌بارمصرف به صندوق ایمیلت فرستاده می‌شود.'
              : `کد ارسال‌شده به ${email.trim().toLowerCase()} را وارد کن. کد فقط چند دقیقه اعتبار دارد.`}
          </Text>

          {stage === 'email' ? <>
            <View style={styles.switcher}>
              <Pressable accessibilityRole="button" onPress={() => { setMode('register'); setError(''); setNotice(''); }} style={[styles.switchButton, mode === 'register' && styles.switchActive]}><UserPlus size={17} color={mode === 'register' ? '#FFFFFF' : Colors.primary[700]} /><Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>ثبت‌نام</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setMode('login'); setError(''); setNotice(''); }} style={[styles.switchButton, mode === 'login' && styles.switchActive]}><LogIn size={17} color={mode === 'login' ? '#FFFFFF' : Colors.primary[700]} /><Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>ورود</Text></Pressable>
            </View>
            {mode === 'register' ? <><Text style={styles.label}>نام و نام خانوادگی</Text><TextInput accessibilityLabel="نام و نام خانوادگی" value={fullName} onChangeText={setFullName} style={styles.input} placeholder="مثلاً سارا احمدی" placeholderTextColor="#8799B2" textAlign="right" /></> : null}
            <Text style={styles.label}>ایمیل</Text>
            <TextInput accessibilityLabel="ایمیل حساب" value={email} onChangeText={setEmail} style={[styles.input, styles.ltr]} placeholder="name@example.com" placeholderTextColor="#8799B2" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onSubmitEditing={() => void sendCode()} />
          </> : <>
            <Text style={styles.label}>کد تأیید ایمیل</Text>
            <TextInput accessibilityLabel="کد تأیید ایمیل" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} style={[styles.input, styles.codeInput]} placeholder="۱۲۳۴۵۶" placeholderTextColor="#8799B2" keyboardType="number-pad" autoFocus onSubmitEditing={() => void verifyCode()} />
            <Pressable accessibilityRole="button" disabled={busy || cooldown > 0} onPress={() => void sendCode()}><Text style={[styles.resend, (busy || cooldown > 0) && styles.resendDisabled]}>{cooldown ? `ارسال دوباره تا ${cooldown} ثانیه` : 'ارسال دوبارهٔ کد'}</Text></Pressable>
          </>}

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} style={[styles.submit, busy && styles.disabled]} onPress={() => void (stage === 'email' ? sendCode() : verifyCode())}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{stage === 'email' ? 'دریافت کد ورود' : 'تأیید و ورود'}</Text>}
          </Pressable>
          {stage === 'code' && <Pressable accessibilityRole="button" onPress={() => { setStage('email'); setCode(''); setError(''); setNotice(''); }}><Text style={styles.changeEmail}>تغییر ایمیل</Text></Pressable>}
          <View style={styles.privacy}><ShieldCheck size={18} color="#16835D" /><Text style={styles.privacyText}>پیشرفت هر زبان جداگانه نگهداری می‌شود؛ با تغییر زبان، درس‌های قبلی پاک نمی‌شوند. پیام‌های خصوصی نمایش داده نمی‌شوند.</Text></View>
        </LinearGradient>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6FAFF' }, scroll: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 140 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F6FAFF' }, loadingText: { fontFamily: Typography.fontFamily, color: '#334155', fontSize: 13 },
  card: { width: '100%', maxWidth: 500, alignSelf: 'center', borderRadius: 28, borderWidth: 1, borderColor: '#D7E7FA', padding: 22, shadowColor: '#2D6FB7', shadowOpacity: .12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  logo: { width: 58, height: 58, borderRadius: 19, backgroundColor: Colors.primary[600], alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 13 }, eyebrow: { fontFamily: Typography.latinFontFamily, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, color: Colors.primary[600], textAlign: 'center', writingDirection: 'ltr' }, title: { fontFamily: Typography.boldFontFamily, fontSize: 23, lineHeight: 35, color: '#102A56', textAlign: 'center', marginTop: 5 }, subtitle: { fontFamily: Typography.fontFamily, fontSize: 13, lineHeight: 23, color: '#344761', textAlign: 'center', marginTop: 5, marginBottom: 17 },
  switcher: { flexDirection: 'row-reverse', borderRadius: Radius.full, backgroundColor: '#E9F2FD', padding: 4, marginBottom: 17 }, switchButton: { flex: 1, minHeight: 42, borderRadius: Radius.full, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }, switchActive: { backgroundColor: Colors.primary[600] }, switchText: { fontFamily: Typography.boldFontFamily, fontSize: 12, color: Colors.primary[700] }, switchTextActive: { color: '#FFFFFF' },
  label: { fontFamily: Typography.boldFontFamily, fontSize: 12, color: '#111827', textAlign: 'right', marginBottom: 6, marginTop: 9 }, input: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#AFC4DE', backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: '700', color: '#111111', writingDirection: 'rtl' }, ltr: { fontFamily: Typography.latinFontFamily, textAlign: 'left', writingDirection: 'ltr', fontWeight: '800' }, codeInput: { fontFamily: Typography.numberFontFamily, textAlign: 'center', writingDirection: 'ltr', fontSize: 24, letterSpacing: 7 }, resend: { fontFamily: Typography.boldFontFamily, color: Colors.primary[700], textAlign: 'center', marginTop: 12 }, resendDisabled: { color: '#8799B2' }, changeEmail: { fontFamily: Typography.boldFontFamily, color: Colors.primary[700], textAlign: 'center', marginTop: 12 },
  error: { fontFamily: Typography.fontFamily, color: '#B42318', backgroundColor: '#FEECEB', padding: 10, borderRadius: 12, textAlign: 'right', marginTop: 12 }, notice: { fontFamily: Typography.fontFamily, color: '#16603F', backgroundColor: '#E9F8F0', padding: 10, borderRadius: 12, textAlign: 'right', marginTop: 12 }, submit: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[600], marginTop: 17 }, submitText: { fontFamily: Typography.boldFontFamily, color: '#FFFFFF', fontSize: 14 }, disabled: { opacity: .55 }, privacy: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, backgroundColor: '#EBF8F3', borderRadius: 14, padding: 11, marginTop: 14 }, privacyText: { flex: 1, fontFamily: Typography.fontFamily, fontSize: 10, lineHeight: 18, color: '#32604F', textAlign: 'right' },
});
