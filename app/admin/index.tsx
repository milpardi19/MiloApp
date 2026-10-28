import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import ArrowUpLeft from 'lucide-react-native/dist/esm/icons/arrow-up-left';
import BellRing from 'lucide-react-native/dist/esm/icons/bell-ring';
import BookOpen from 'lucide-react-native/dist/esm/icons/book-open';
import ChartBar from 'lucide-react-native/dist/esm/icons/chart-bar';
import CircleCheck from 'lucide-react-native/dist/esm/icons/circle-check';
import Clock from 'lucide-react-native/dist/esm/icons/clock';
import Copy from 'lucide-react-native/dist/esm/icons/copy';
import Download from 'lucide-react-native/dist/esm/icons/download';
import Eye from 'lucide-react-native/dist/esm/icons/eye';
import Globe from 'lucide-react-native/dist/esm/icons/globe';
import GraduationCap from 'lucide-react-native/dist/esm/icons/graduation-cap';
import Layers from 'lucide-react-native/dist/esm/icons/layers';
import LayoutDashboard from 'lucide-react-native/dist/esm/icons/layout-dashboard';
import LogOut from 'lucide-react-native/dist/esm/icons/log-out';
import Megaphone from 'lucide-react-native/dist/esm/icons/megaphone';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import MousePointerClick from 'lucide-react-native/dist/esm/icons/mouse-pointer-click';
import Pause from 'lucide-react-native/dist/esm/icons/pause';
import Play from 'lucide-react-native/dist/esm/icons/play';
import Radio from 'lucide-react-native/dist/esm/icons/radio';
import RefreshCw from 'lucide-react-native/dist/esm/icons/refresh-cw';
import Search from 'lucide-react-native/dist/esm/icons/search';
import Send from 'lucide-react-native/dist/esm/icons/send';
import ShieldAlert from 'lucide-react-native/dist/esm/icons/shield-alert';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import SquarePen from 'lucide-react-native/dist/esm/icons/square-pen';
import Ticket from 'lucide-react-native/dist/esm/icons/ticket';
import Trash2 from 'lucide-react-native/dist/esm/icons/trash-2';
import UserCheck from 'lucide-react-native/dist/esm/icons/user-check';
import Users from 'lucide-react-native/dist/esm/icons/users';
import X from 'lucide-react-native/dist/esm/icons/x';
import Zap from 'lucide-react-native/dist/esm/icons/zap';
import { PopupCardPreview } from '@/components/LearnerPopupBridge';
import { registerAdminPushToken } from '@/lib/adminPush';
import {
  INTERNAL_POPUP_ROUTES,
  broadcastAdminPopupSignal,
  createAdminPopup,
  deleteAdminPopup,
  loadAdminPopupsWithStats,
  republishAdminPopup,
  subscribeAdminPopupTelemetry,
  toggleAdminPopupActive,
  updateAdminPopup,
  type AdminPopupDraft,
  type AdminPopupWithStats,
  type PopupDisplayMode,
  type PopupTargetEdition,
  type PopupTargetScope,
  type PopupVariant,
} from '@/lib/adminPopups';
import { ADMIN_POPUPS_SETUP_SQL } from '@/lib/adminPopupsSetupSql';
import {
  listRealContacts,
  listSupportRequestStatuses,
  loadAdminChatModeration,
  setChatConversationDeleted,
  setChatUserBlocked,
  updateSupportRequestStatus,
  type RealContact,
  type SupportRequestStatus,
} from '@/lib/conversations';
import {
  adminClient,
  deleteRegisteredUser,
  educationError,
  loadAdminData,
  progressMetrics,
  type EducationInvite,
  type RegisteredUser,
  type StudentRow,
} from '@/lib/educationAdmin';
import { FEATURES } from '@/lib/features';
import { toPersianDigits as fa } from '@/lib/format';
import { ALL_LANGUAGE_META } from '@/lib/languages/catalogMeta';

const ENGLISH_LESSON_TOTAL = ALL_LANGUAGE_META.find(item => item.id === 'en')?.lessonsCount ?? 174;
import {
  DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
  LOGIN_APP_LANGUAGE_IDS,
  LOGIN_APP_LANGUAGE_INFO,
  clearUserLanguagePolicy,
  loadAdminLanguagePolicies,
  resolveEffectiveUserLanguages,
  saveGlobalLanguagePolicy,
  saveUserLanguagePolicy,
  type AdminGlobalLanguagePolicy,
  type AdminUserLanguagePolicy,
  type LoginAppLanguageId,
} from '@/lib/languageAccess';
import { downloadRegisteredUsers } from '@/lib/userExport';

type Tab = 'overview' | 'languages' | 'popups' | 'registered' | 'support' | 'students' | 'invites' | 'content';

const ALL_COURSES_CATALOG = [
  { id: 'en', title: 'انگلیسی (English)', lessons: 174, sentences: 3862, color: '#6356D9', route: '/lang', edition: 'اپ زبان‌آموز با لاگین' },
  { id: 'de', title: 'آلمانی (Deutsch)', lessons: 95, sentences: 4715, color: '#087E75', route: '/learn/de', edition: 'اپ زبان‌آموز با لاگین' },
  { id: 'tr', title: 'ترکی استانبولی (Türkçe)', lessons: 66, sentences: 528, color: '#C2410C', route: '/learn/tr', edition: 'اپ زبان‌آموز با لاگین' },
] as const;

const POPUP_TEMPLATES: ReadonlyArray<{
  label: string;
  title: string;
  badge: string;
  body: string;
  variant: PopupVariant;
  ctaLabel: string;
  ctaUrl: string;
  edition: PopupTargetEdition;
  mode: PopupDisplayMode;
}> = [
  {
    label: '🎉 معرفی دوره ترکی',
    title: 'دورهٔ کامل ترکی استانبولی فعال شد!',
    badge: 'ویژه زبان‌آموزان',
    body: '۶۶ درس جمله‌محور از سطح پایه تا مکالمهٔ روزمره به همراه تمرین تلفظ و مرور هوشمند آمادهٔ یادگیری است.',
    variant: 'celebration',
    ctaLabel: 'شروع دورهٔ ترکی',
    ctaUrl: '/learn/tr',
    edition: 'all',
    mode: 'once',
  },
  {
    label: '🎯 دعوت تعیین سطح',
    title: 'از سطح مناسب خودتان شروع کنید',
    badge: 'پیشنهاد آموزشی',
    body: 'با آزمون کوتاه تعیین سطح، نقطهٔ شروع دقیق شما مشخص می‌شود تا وقتتان روی جمله‌های خیلی ساده یا خیلی دشوار هدر نرود.',
    variant: 'info',
    ctaLabel: 'شروع تعیین سطح',
    ctaUrl: '/placement',
    edition: 'all',
    mode: 'once',
  },
  {
    label: '🚀 نسخهٔ جدید اپ',
    title: 'نسخهٔ جدید Milo منتشر شد',
    badge: 'به‌روزرسانی مهم',
    body: 'سرعت باز شدن درس‌ها، کیفیت پخش صدا و همگام‌سازی پیشرفت ارتقا یافت. برای بهترین تجربه از آخرین نسخه استفاده کنید.',
    variant: 'update',
    ctaLabel: 'مشاهده فهرست زبان‌ها',
    ctaUrl: '/languages',
    edition: 'all',
    mode: 'once',
  },
  {
    label: '⚠️ اطلاعیه فوری',
    title: 'اطلاعیه مهم مدیریت آموزش',
    badge: 'پیام فوری',
    body: 'لطفاً پیشرفت آموزشی خود را از بخش همگام‌سازی ابری ذخیره کنید تا در تمام دستگاه‌ها حفظ شود.',
    variant: 'warning',
    ctaLabel: 'همگام‌سازی ابری',
    ctaUrl: '/personal-sync',
    edition: 'all',
    mode: 'every_launch',
  },
];

const EXPIRY_PRESETS: ReadonlyArray<{ label: string; hours: number | null }> = [
  { label: 'بدون انقضا', hours: null },
  { label: '۱ ساعت', hours: 1 },
  { label: '۶ ساعت', hours: 6 },
  { label: '۲۴ ساعت', hours: 24 },
  { label: '۳ روز', hours: 72 },
  { label: '۷ روز', hours: 168 },
  { label: '۳۰ روز', hours: 720 },
];

const formatDateFa = (value: string | null | undefined) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleDateString('fa-IR')
    : 'ثبت نشده';

const formatDateTimeFa = (value: string | null | undefined) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

const isActiveWithinHours = (iso: string | null | undefined, hours: number) => {
  if (!iso) return false;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) && Date.now() - ts <= hours * 3_600_000;
};

async function copyTextSafe(text: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      if (typeof document !== 'undefined') {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        return true;
      }
    } catch {
      return false;
    }
  }
  try {
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}

export default function AdminRoute() {
  if (!FEATURES.adminPanel) return <Redirect href={'/languages' as never} />;
  return <EducationAdmin />;
}

function EducationAdmin() {
  const router = useRouter();
  const wide = useWindowDimensions().width > 940;

  const [authState, setAuthState] = useState<'login' | 'live'>('login');
  const [restoringSession, setRestoringSession] = useState(false);
  const [managerName, setManagerName] = useState('مدیر اصلی');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  // Core live data from Supabase
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [invites, setInvites] = useState<EducationInvite[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [popups, setPopups] = useState<AdminPopupWithStats[]>([]);
  const [popupSchemaMissing, setPopupSchemaMissing] = useState(false);

  // Live language access policies for Login App (global + per-user)
  const [globalLangPolicy, setGlobalLangPolicy] = useState<AdminGlobalLanguagePolicy>({
    rowId: null,
    enabled: [...LOGIN_APP_LANGUAGE_IDS],
    message: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
    updatedAt: null,
  });
  const [userLangPolicies, setUserLangPolicies] = useState<Record<string, AdminUserLanguagePolicy>>({});
  const [globalLockMessage, setGlobalLockMessage] = useState(DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE);
  const [langUserSearch, setLangUserSearch] = useState('');
  const [langUserFilter, setLangUserFilter] = useState<'all' | 'custom' | 'all_disabled'>('all');

  // Support & Moderation live state
  const [supportContacts, setSupportContacts] = useState<RealContact[]>([]);
  const [supportStatuses, setSupportStatuses] = useState<Record<string, SupportRequestStatus>>({});
  const [chatBlockedUsers, setChatBlockedUsers] = useState<Record<string, boolean>>({});
  const [deletedChats, setDeletedChats] = useState<Record<string, boolean>>({});

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Filters & selections
  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'recent' | 'android' | 'web' | 'blocked'>('all');
  const [supportFilter, setSupportFilter] = useState<'all' | 'open' | 'resolved' | 'moderated'>('all');
  const [popupFilter, setPopupFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [label, setLabel] = useState('');

  // Pop-up Studio form state
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupBadge, setPopupBadge] = useState('');
  const [popupBody, setPopupBody] = useState('');
  const [popupVariant, setPopupVariant] = useState<PopupVariant>('info');
  const [popupDisplayMode, setPopupDisplayMode] = useState<PopupDisplayMode>('once');
  const [popupTargetScope, setPopupTargetScope] = useState<PopupTargetScope>('all');
  const [popupTargetEdition, setPopupTargetEdition] = useState<PopupTargetEdition>('all');
  const [popupTargetUserId, setPopupTargetUserId] = useState<string | null>(null);
  const [popupUserSearch, setPopupUserSearch] = useState('');
  const [popupCtaLabel, setPopupCtaLabel] = useState('');
  const [popupCtaUrl, setPopupCtaUrl] = useState('');
  const [popupImageUrl, setPopupImageUrl] = useState('');
  const [popupDismissLabel, setPopupDismissLabel] = useState('متوجه شدم');
  const [popupPriority, setPopupPriority] = useState('10');
  const [popupExpiryHours, setPopupExpiryHours] = useState<number | null>(null);
  const [popupKeepExistingExpiry, setPopupKeepExistingExpiry] = useState<string | null>(null);
  const [popupStartActive, setPopupStartActive] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const resetPopupForm = useCallback(() => {
    setEditingPopupId(null);
    setPopupTitle('');
    setPopupBadge('');
    setPopupBody('');
    setPopupVariant('info');
    setPopupDisplayMode('once');
    setPopupTargetScope('all');
    setPopupTargetEdition('all');
    setPopupTargetUserId(null);
    setPopupUserSearch('');
    setPopupCtaLabel('');
    setPopupCtaUrl('');
    setPopupImageUrl('');
    setPopupDismissLabel('متوجه شدم');
    setPopupPriority('10');
    setPopupExpiryHours(null);
    setPopupKeepExistingExpiry(null);
    setPopupStartActive(true);
  }, []);

  const loadSupportAndModeration = useCallback(async (knownUserIds: string[]) => {
    try {
      const [contacts, statuses] = await Promise.all([
        listRealContacts(true),
        listSupportRequestStatuses(),
      ]);
      setSupportContacts(contacts);
      setSupportStatuses(statuses);
      const allUserIds = Array.from(new Set([...knownUserIds, ...contacts.map(c => c.id)]));
      const moderation = await loadAdminChatModeration(
        allUserIds,
        contacts.map(c => c.conversationId),
      );
      setChatBlockedUsers(moderation.blockedUsers);
      setDeletedChats(moderation.deletedConversations);
    } catch {
      // Optional support tables do not block core admin panel if not yet migrated.
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const [core, popupResult, langResult] = await Promise.all([
      loadAdminData(),
      loadAdminPopupsWithStats(),
      loadAdminLanguagePolicies(),
    ]);
    setManagerName(core.managerName);
    setStudents(core.students);
    setInvites(core.invites);
    setRegisteredUsers(core.registeredUsers);
    setPopups(popupResult.popups);
    setPopupSchemaMissing(popupResult.schemaMissing);
    setGlobalLangPolicy(langResult.globalPolicy);
    setGlobalLockMessage(langResult.globalPolicy.message);
    setUserLangPolicies(langResult.userPolicies);
    setLastSyncedAt(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    await loadSupportAndModeration(core.registeredUsers.map(u => u.user_id));
  }, [loadSupportAndModeration]);

  const refreshPopupsOnly = useCallback(async () => {
    try {
      const [popupResult, langResult] = await Promise.all([
        loadAdminPopupsWithStats(),
        loadAdminLanguagePolicies(),
      ]);
      setPopups(popupResult.popups);
      setPopupSchemaMissing(popupResult.schemaMissing);
      setGlobalLangPolicy(langResult.globalPolicy);
      setUserLangPolicies(langResult.userPolicies);
    } catch {
      // Silent background telemetry refresh
    }
  }, []);

  // Cold-start real session verification with mobile network timeout safeguard
  useEffect(() => {
    let mounted = true;
    let settled = false;
    const guardTimer = setTimeout(() => {
      if (!settled && mounted) {
        settled = true;
        setRestoringSession(false);
        setAuthState('login');
      }
    }, 10_000);
    (async () => {
      try {
        const { data } = await adminClient().auth.getSession();
        if (!data.session) {
          settled = true;
          clearTimeout(guardTimer);
          if (mounted) {
            setRestoringSession(false);
            setAuthState('login');
          }
          return;
        }
        if (mounted) setRestoringSession(true);
        await refreshAll();
        void registerAdminPushToken();
        settled = true;
        clearTimeout(guardTimer);
        if (mounted) {
          setRestoringSession(false);
          setAuthState('live');
        }
      } catch (cause) {
        settled = true;
        clearTimeout(guardTimer);
        try { await adminClient().auth.signOut(); } catch { /* ignore */ }
        if (mounted) {
          setRestoringSession(false);
          setError(educationError(cause));
          setAuthState('login');
        }
      }
    })();
    return () => {
      mounted = false;
      clearTimeout(guardTimer);
    };
  }, [refreshAll]);

  // Live Realtime subscriptions for Popups, Users, Enrollments & Support
  useEffect(() => {
    if (authState !== 'live') return;
    const stopPopups = subscribeAdminPopupTelemetry(() => {
      void refreshPopupsOnly();
    });

    const db = adminClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleLiveSync = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refreshAll().catch(() => undefined);
      }, 450);
    };

    const liveChannel = db
      .channel(`admin-console-live:${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_user_profiles' }, scheduleLiveSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'education_enrollments' }, scheduleLiveSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, scheduleLiveSync)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, scheduleLiveSync)
      .subscribe();

    return () => {
      stopPopups();
      if (timer) clearTimeout(timer);
      void db.removeChannel(liveChannel).catch(() => undefined);
    };
  }, [authState, refreshAll, refreshPopupsOnly]);

  async function task(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e) {
      setError(educationError(e));
    } finally {
      setBusy(false);
    }
  }

  const login = () => void task(async () => {
    const { error: signInError } = await adminClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) throw signInError;
    try {
      await refreshAll();
    } catch (verifyErr) {
      await adminClient().auth.signOut().catch(() => undefined);
      throw verifyErr;
    }
    void registerAdminPushToken();
    setPassword('');
    setAuthState('live');
  });

  function startDirectPopupForUser(userId: string, fullName: string) {
    resetPopupForm();
    setPopupTargetScope('user');
    setPopupTargetUserId(userId);
    setPopupBadge(`پیام اختصاصی برای ${fullName}`);
    setTab('popups');
    setNotice(`گیرندهٔ پاپ‌آپ روی «${fullName}» تنظیم شد؛ عنوان و متن پیام را بنویسید.`);
  }

  function startEditPopup(item: AdminPopupWithStats) {
    setEditingPopupId(item.id);
    setPopupTitle(item.title);
    setPopupBadge(item.badge_text || '');
    setPopupBody(item.body);
    setPopupVariant(item.variant);
    setPopupDisplayMode(item.display_mode);
    setPopupTargetScope(item.target_scope);
    setPopupTargetEdition(item.target_edition);
    setPopupTargetUserId(item.target_user_id);
    setPopupCtaLabel(item.cta_label || '');
    setPopupCtaUrl(item.cta_url || '');
    setPopupImageUrl(item.image_url || '');
    setPopupDismissLabel(item.dismiss_label || 'متوجه شدم');
    setPopupPriority(String(item.priority ?? 10));
    setPopupExpiryHours(null);
    setPopupKeepExistingExpiry(item.expires_at);
    setPopupStartActive(item.is_active);
    setTab('popups');
    setNotice(`در حال ویرایش پاپ‌آپ «${item.title}»`);
  }

  function showValidationPrompt(titleText: string, messageText: string) {
    setError(messageText);
    if (Platform.OS !== 'web') {
      Alert.alert(titleText, messageText, [{ text: 'متوجه شدم' }]);
    }
  }

  function submitPopupForm(forceActive = true) {
    if (busy) return;
    if (!popupTitle.trim()) {
      showValidationPrompt(
        'عنوان پاپ‌آپ خالی است',
        'لطفاً عنوان پاپ‌آپ را در بخش ۳ وارد کنید (یا یکی از قالب‌های آماده بالا را بزنید).',
      );
      return;
    }
    if (!popupBody.trim()) {
      showValidationPrompt(
        'متن پاپ‌آپ خالی است',
        'لطفاً متن کامل پیام پاپ‌آپ را در بخش ۴ بنویسید.',
      );
      return;
    }
    if (popupTargetScope === 'user' && !popupTargetUserId) {
      showValidationPrompt(
        'گیرنده انتخاب نشده است',
        'یک زبان‌آموز مشخص از لیست انتخاب کنید یا مخاطب هدف را روی «همهٔ کاربران اپ با لاگین» بگذارید.',
      );
      return;
    }
    if ((popupCtaLabel.trim() && !popupCtaUrl.trim()) || (!popupCtaLabel.trim() && popupCtaUrl.trim())) {
      showValidationPrompt(
        'دکمهٔ اقدام ناقص است',
        'اگر دکمهٔ اقدام (CTA) تعریف می‌کنید، هم عنوان دکمه و هم مسیر/لینک آن را وارد کنید (یا هر دو را خالی بگذارید).',
      );
      return;
    }

    void task(async () => {
      const parsedPriority = Number.parseInt(popupPriority, 10);
      const publishLive = forceActive ? true : popupStartActive;
      const draft: AdminPopupDraft = {
        title: popupTitle,
        body: popupBody,
        variant: popupVariant,
        badge_text: popupBadge || null,
        image_url: popupImageUrl || null,
        cta_label: popupCtaLabel || null,
        cta_url: popupCtaUrl || null,
        dismiss_label: popupDismissLabel || 'متوجه شدم',
        display_mode: popupDisplayMode,
        target_scope: popupTargetScope,
        target_edition: 'all',
        target_user_id: popupTargetScope === 'user' ? popupTargetUserId : null,
        priority: Number.isFinite(parsedPriority) ? parsedPriority : 10,
        is_active: publishLive,
        expires_in_hours: popupExpiryHours,
        expires_at: popupExpiryHours === null ? popupKeepExistingExpiry : null,
      };
      const publishedTitle = popupTitle.trim();
      if (editingPopupId) {
        await updateAdminPopup(editingPopupId, draft);
        const msg = `تغییرات پاپ‌آپ «${publishedTitle}» ذخیره شد و به‌صورت آنی در اپ زبان‌آموز با لاگین منتشر گردید.`;
        setNotice(msg);
        if (Platform.OS !== 'web') {
          Alert.alert('به‌روزرسانی و منتشر شد', msg, [{ text: 'عالی' }]);
        }
      } else {
        await createAdminPopup(draft);
        const msg = publishLive
          ? `پاپ‌آپ «${publishedTitle}» با موفقیت منتشر شد و هم‌اکنون در اپ زبان‌آموز با لاگین فعال است.`
          : `پاپ‌آپ «${publishedTitle}» به‌صورت پیش‌نویس ذخیره شد.`;
        setNotice(msg);
        if (Platform.OS !== 'web' && publishLive) {
          Alert.alert('پاپ‌آپ منتشر شد', msg, [{ text: 'عالی' }]);
        }
      }
      resetPopupForm();
      await refreshPopupsOnly();
    });
  }

  function applyGlobalLanguages(nextEnabled: LoginAppLanguageId[], customNotice: string) {
    void task(async () => {
      await saveGlobalLanguagePolicy(nextEnabled, globalLockMessage);
      await refreshPopupsOnly();
      setNotice(customNotice);
    });
  }

  function toggleGlobalLanguageItem(langId: LoginAppLanguageId) {
    const currentlyOn = globalLangPolicy.enabled.includes(langId);
    const next = currentlyOn
      ? globalLangPolicy.enabled.filter(id => id !== langId)
      : LOGIN_APP_LANGUAGE_IDS.filter(id => id === langId || globalLangPolicy.enabled.includes(id));
    const langFa = LOGIN_APP_LANGUAGE_INFO.find(l => l.id === langId)?.fa || langId;
    applyGlobalLanguages(
      next,
      currentlyOn
        ? `زبان «${langFa}» به‌صورت سراسری در اپ با لاگین غیرفعال شد.`
        : `زبان «${langFa}» به‌صورت سراسری در اپ با لاگین فعال شد.`,
    );
  }

  function toggleUserLanguageItem(user: RegisteredUser, langId: LoginAppLanguageId) {
    const current = resolveEffectiveUserLanguages(user.user_id, globalLangPolicy, userLangPolicies);
    const currentlyOn = current.enabled.includes(langId);
    const next = currentlyOn
      ? current.enabled.filter(id => id !== langId)
      : LOGIN_APP_LANGUAGE_IDS.filter(id => id === langId || current.enabled.includes(id));
    const langFa = LOGIN_APP_LANGUAGE_INFO.find(l => l.id === langId)?.fa || langId;
    void task(async () => {
      await saveUserLanguagePolicy(user.user_id, next, globalLockMessage);
      await refreshPopupsOnly();
      setNotice(
        currentlyOn
          ? `زبان «${langFa}» برای «${user.full_name}» غیرفعال شد.`
          : `زبان «${langFa}» برای «${user.full_name}» فعال شد.`,
      );
    });
  }

  function setAllUserLanguages(user: RegisteredUser, enableAll: boolean) {
    void task(async () => {
      await saveUserLanguagePolicy(
        user.user_id,
        enableAll ? [...LOGIN_APP_LANGUAGE_IDS] : [],
        globalLockMessage,
      );
      await refreshPopupsOnly();
      setNotice(
        enableAll
          ? `تمام ۳ زبان برای «${user.full_name}» فعال شدند.`
          : `تمام زبان‌ها برای «${user.full_name}» به‌صورت آنی غیرفعال شدند.`,
      );
    });
  }

  function resetUserLanguageToGlobal(user: RegisteredUser) {
    void task(async () => {
      await clearUserLanguagePolicy(user.user_id);
      await refreshPopupsOnly();
      setNotice(`دسترسی زبان‌های «${user.full_name}» به حالت سراسری بازگردانده شد.`);
    });
  }

  function confirmDeletePopup(popup: AdminPopupWithStats) {
    const msg = `پاپ‌آپ «${popup.title}» و آمار بازدید آن برای همیشه حذف شود؟`;
    const run = () => void task(async () => {
      await deleteAdminPopup(popup.id);
      if (editingPopupId === popup.id) resetPopupForm();
      await refreshPopupsOnly();
      setNotice('پاپ‌آپ حذف شد و از صفحهٔ کاربران برداشته شد.');
    });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) run();
      return;
    }
    Alert.alert('حذف پاپ‌آپ', msg, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف دائمی', style: 'destructive', onPress: run },
    ]);
  }

  function confirmDeleteUser(user: RegisteredUser) {
    const message = `حساب «${user.full_name}» (${user.email}) برای همیشه حذف شود؟ پیشرفت و گفتگوهای این کاربر پاک می‌شود و قابل بازگشت نیست.`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) void removeUser(user);
      return;
    }
    Alert.alert('حذف دائمی حساب', message, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف دائمی', style: 'destructive', onPress: () => { void removeUser(user); } },
    ]);
  }

  async function removeUser(user: RegisteredUser) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await deleteRegisteredUser(user.user_id);
      setRegisteredUsers(current => current.filter(item => item.user_id !== user.user_id));
      setNotice('حساب کاربر حذف شد.');
    } catch (cause) {
      setError(educationError(cause));
    } finally {
      setBusy(false);
    }
  }

  function confirmConversationDeletion(contact: RealContact) {
    const alreadyDeleted = Boolean(deletedChats[contact.conversationId]);
    if (alreadyDeleted) {
      void task(async () => {
        await setChatConversationDeleted(contact.conversationId, false);
        setDeletedChats(current => ({ ...current, [contact.conversationId]: false }));
        setNotice('گفتگو بازیابی شد.');
      });
      return;
    }
    const message = `گفتگوی «${contact.displayName}» برای هر دو طرف پنهان شود؟ این حذف نرم است و مدیر می‌تواند گفتگو را بازیابی کند.`;
    const remove = () => void task(async () => {
      await setChatConversationDeleted(contact.conversationId, true);
      setDeletedChats(current => ({ ...current, [contact.conversationId]: true }));
      setNotice('گفتگو برای طرفین پنهان شد و قابل‌بازیابی است.');
    });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) remove();
      return;
    }
    Alert.alert('حذف نرم گفتگو', message, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'پنهان‌کردن گفتگو', style: 'destructive', onPress: remove },
    ]);
  }

  // Computed metrics (100% real data)
  const userById = useMemo(
    () => new Map(registeredUsers.map(u => [u.user_id, u])),
    [registeredUsers],
  );
  const active24hCount = useMemo(
    () => registeredUsers.filter(u => isActiveWithinHours(u.last_seen_at, 24)).length,
    [registeredUsers],
  );
  const activeStudents = useMemo(
    () => students.filter(r => r.status === 'active'),
    [students],
  );
  const syncedStudents = useMemo(
    () => activeStudents.filter(r => r.summary),
    [activeStudents],
  );
  const avgProgress = useMemo(
    () => syncedStudents.length
      ? Math.round(syncedStudents.reduce((n, r) => n + progressMetrics(r.summary).percent, 0) / syncedStudents.length)
      : 0,
    [syncedStudents],
  );
  const totalMinutesAll = useMemo(
    () => syncedStudents.reduce((n, r) => n + progressMetrics(r.summary).minutes, 0),
    [syncedStudents],
  );
  const livePopups = useMemo(
    () => popups.filter(p => p.is_active && (!p.expires_at || Date.parse(p.expires_at) > Date.now())),
    [popups],
  );
  const popupTotals = useMemo(() => {
    const impressions = popups.reduce((acc, p) => acc + p.unique_impressions, 0);
    const clicks = popups.reduce((acc, p) => acc + p.unique_clicks, 0);
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 100) : 0;
    return { impressions, clicks, ctr };
  }, [popups]);
  const openSupportCount = useMemo(
    () => supportContacts.filter(c => !deletedChats[c.conversationId] && (supportStatuses[c.conversationId] || 'open') === 'open').length,
    [supportContacts, deletedChats, supportStatuses],
  );
  const restrictedUserCount = useMemo(
    () => Object.values(userLangPolicies).filter(p => p.enabled.length < LOGIN_APP_LANGUAGE_IDS.length).length,
    [userLangPolicies],
  );

  const tabs: ReadonlyArray<{ id: Tab; title: string; icon: typeof LayoutDashboard; badge?: number }> = [
    { id: 'overview', title: 'نمای کلی', icon: LayoutDashboard },
    {
      id: 'languages',
      title: 'دسترسی زبان‌ها',
      icon: Globe,
      badge: (globalLangPolicy.enabled.length < 3 ? 1 : 0) + restrictedUserCount || undefined,
    },
    { id: 'popups', title: 'پاپ‌آپ اپ با لاگین', icon: Megaphone, badge: livePopups.length || undefined },
    { id: 'registered', title: 'کاربران ثبت‌شده', icon: Users, badge: registeredUsers.length || undefined },
    { id: 'support', title: 'پشتیبانی', icon: MessageCircle, badge: openSupportCount || undefined },
    { id: 'students', title: 'زبان‌آموزان', icon: GraduationCap },
    { id: 'invites', title: 'دعوت‌نامه‌ها', icon: Ticket },
    { id: 'content', title: 'محتوای آموزشی', icon: BookOpen },
  ];

  const visibleLangUsers = registeredUsers.filter(u => {
    const matchesQuery = `${u.full_name} ${u.email}`
      .toLowerCase()
      .includes(langUserSearch.trim().toLowerCase());
    if (!matchesQuery) return false;
    const resolved = resolveEffectiveUserLanguages(u.user_id, globalLangPolicy, userLangPolicies);
    if (langUserFilter === 'custom') return resolved.customized;
    if (langUserFilter === 'all_disabled') return resolved.enabled.length === 0;
    return true;
  });

  const visibleStudents = students.filter(
    r => r.display_name.toLowerCase().includes(search.trim().toLowerCase())
      && (studentFilter === 'all' || r.status === studentFilter),
  );

  const visibleUsers = registeredUsers.filter(u => {
    const matchesQuery = `${u.full_name} ${u.email} ${u.platform || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (userFilter === 'recent') return isActiveWithinHours(u.last_seen_at, 24);
    if (userFilter === 'android') return u.platform === 'android';
    if (userFilter === 'web') return u.platform === 'web';
    if (userFilter === 'blocked') return Boolean(chatBlockedUsers[u.user_id]);
    return true;
  });

  const visibleSupport = supportContacts.filter(c => {
    const matchesQuery = c.displayName.toLowerCase().includes(search.trim().toLowerCase());
    if (!matchesQuery) return false;
    const status = supportStatuses[c.conversationId] || 'open';
    const moderated = Boolean(chatBlockedUsers[c.id] || deletedChats[c.conversationId]);
    if (supportFilter === 'open') return status === 'open' && !deletedChats[c.conversationId];
    if (supportFilter === 'resolved') return status === 'resolved' && !deletedChats[c.conversationId];
    if (supportFilter === 'moderated') return moderated;
    return true;
  });

  const visiblePopups = popups.filter(p => {
    const expired = Boolean(p.expires_at && Date.parse(p.expires_at) <= Date.now());
    const currentlyLive = p.is_active && !expired;
    if (popupFilter === 'active') return currentlyLive;
    if (popupFilter === 'inactive') return !currentlyLive;
    return true;
  });

  const button = (title: string, onPress: () => void, secondary = false, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, (disabled || busy) && { opacity: 0.45 }]}
    >
      <Text style={[s.buttonText, secondary && { color: '#344761' }]}>{title}</Text>
    </Pressable>
  );

  const feedback = (
    <>
      {(busy || restoringSession) && <ActivityIndicator color="#1769D2" />}
      {restoringSession && <Text style={s.notice}>در حال بازیابی نشست امن مدیر از سرور Milo…</Text>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!notice && <Text style={s.notice}>{notice}</Text>}
    </>
  );

  if (authState === 'login') {
    return (
      <ScrollView contentContainerStyle={s.loginPage} keyboardShouldPersistTaps="handled">
        <View style={s.loginCard}>
          <View style={s.loginTopRow}>
            <View style={s.logo}><GraduationCap color="#FFFFFF" size={30} /></View>
            <View style={s.liveServerBadge}>
              <View style={s.liveGreenDot} />
              <Text style={s.liveServerText}>متصل به Supabase واقعی</Text>
            </View>
          </View>
          <Text style={s.eyebrow}>MILO MULTILANGUAGE · ADMIN CONSOLE</Text>
          <Text style={s.loginTitle}>کنسول مدیریت اپ زبان‌آموز با لاگین</Text>
          <Text style={s.subtitle}>
            مدیریت اختصاصی اپ زبان‌آموز با لاگین (انگلیسی، آلمانی و ترکی استانبولی): فعال یا غیرفعال کردن تک‌تک یا همهٔ زبان‌ها برای کاربران، ارسال آنی پاپ‌آپ و پشتیبانی زنده.
          </Text>

          <Text style={s.label}>ایمیل حساب مدیر</Text>
          <TextInput
            accessibilityLabel="ایمیل مدیر"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[s.input, s.ltr]}
            placeholder="admin@yourdomain.com"
            placeholderTextColor="#8B9AB0"
          />

          <View style={s.sectionHead}>
            <Text style={s.label}>رمز عبور مدیر</Text>
            {Platform.OS === 'web' && (
              <Pressable accessibilityRole="button" onPress={() => setShowPassword(v => !v)}>
                <Text style={s.inlineLink}>{showPassword ? 'پنهان‌کردن رمز' : 'نمایش رمز'}</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            accessibilityLabel="رمز عبور مدیر"
            secureTextEntry={Platform.OS === 'web' ? !showPassword : true}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            style={[s.input, s.ltr]}
            onSubmitEditing={login}
          />

          {feedback}
          {button('ورود امن به پنل مدیریت', login, false, restoringSession || !email.trim() || !password)}

          <View style={s.securityInfoBox}>
            <ShieldCheck size={18} color="#1769D2" />
            <Text style={s.small}>
              حالت نمایشی غیرفعال است و تمام عملیات مستقیماً با احراز هویت سرور (`is_education_admin`) و سیاست‌های RLS انجام می‌شود. پیام‌های خصوصی کاربران هرگز فاش نمی‌شوند.
            </Text>
          </View>

          {Constants.expoConfig?.extra?.appRole !== 'admin' && (
            button('بازگشت به اپ زبان‌آموز', () => router.replace('/languages' as never), true)
          )}
        </View>
      </ScrollView>
    );
  }

  const selectedTargetUser = popupTargetUserId ? userById.get(popupTargetUserId) : null;

  return (
    <View style={s.root}>
      <View style={s.shell}>
        {/* Responsive RTL Sidebar (works cleanly on 360x800 mobile AND wide desktop) */}
        <View style={[s.sidebar, !wide && s.sidebarMobile]}>
          <View style={[s.brand, !wide && s.brandMobile]}>
            <View style={[s.logo, !wide && s.logoMobile]}>
              <GraduationCap color="#FFFFFF" size={wide ? 25 : 20} />
            </View>
            {wide ? (
              <View style={{ flex: 1 }}>
                <Text style={s.brandTitle}>Milo Admin</Text>
                <Text style={s.small}>{managerName}</Text>
              </View>
            ) : (
              <Text style={s.mobileBrandTitle}>کنسول مدیر</Text>
            )}
          </View>

          <Text style={[s.navLabel, !wide && s.navLabelMobile]}>
            {wide ? 'بخش‌های مدیریتی زنده' : 'منو'}
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.navList, !wide && s.navListMobile]}
            showsVerticalScrollIndicator={false}
          >
            {tabs.map(t => (
              <Pressable
                accessibilityRole="button"
                key={t.id}
                onPress={() => {
                  setTab(t.id);
                  setSelected(null);
                  setError('');
                  setNotice('');
                }}
                style={[s.navItem, !wide && s.mobileNavItem, tab === t.id && s.navActive]}
              >
                <View style={s.navIconWrap}>
                  <t.icon size={wide ? 18 : 19} color={tab === t.id ? '#1769D2' : '#64748B'} />
                  {!!t.badge && (
                    <View style={s.navBadge}>
                      <Text style={s.navBadgeText}>{t.badge > 99 ? '۹۹+' : fa(t.badge)}</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={2} style={[s.navText, !wide && s.mobileNavText, tab === t.id && s.navTextActive]}>
                  {t.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {wide && (
            <View style={s.privacy}>
              <ShieldCheck size={22} color="#1769D2" />
              <Text style={s.cardTitle}>حریم خصوصی و امنیت RLS</Text>
              <Text style={s.small}>
                ارسال پاپ‌آپ و گزارش‌ها ۱۰۰٪ واقعی و تحت مجوز سرور است؛ پیام‌های خصوصی بین کاربران محرمانه می‌ماند.
              </Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            style={[s.navItem, !wide && s.mobileLogout]}
            onPress={() => void task(async () => {
              const { error: outErr } = await adminClient().auth.signOut();
              if (outErr) throw outErr;
              setAuthState('login');
              setStudents([]);
              setInvites([]);
              setRegisteredUsers([]);
              setPopups([]);
              setSelected(null);
            })}
          >
            <LogOut size={18} color="#B42318" />
            <Text numberOfLines={2} style={[s.navText, !wide && s.mobileNavText, { color: '#B42318' }]}>
              {wide ? 'خروج از حساب مدیر' : 'خروج'}
            </Text>
          </Pressable>
        </View>

        {/* Main Scrollable Workspace */}
        <ScrollView style={s.content} contentContainerStyle={[s.main, !wide && s.mainMobile]} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={['#E6F1FF', '#F5FAFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.header, !wide && s.headerMobile]}
          >
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={s.eyebrow}>کنسول مدیریت زنده / {tabs.find(t => t.id === tab)?.title}</Text>
              <Text style={[s.title, !wide && s.titleMobile]}>
                {tab === 'overview'
                  ? 'فرماندهی زندهٔ اپ زبان‌آموز با لاگین'
                  : tab === 'languages'
                    ? 'کنترل زندهٔ فعال و غیرفعال‌سازی زبان‌ها (حتی بستن همه)'
                    : tab === 'popups'
                      ? 'استودیوی پاپ‌آپ آنی ویژهٔ اپ با لاگین'
                      : tabs.find(t => t.id === tab)?.title}
              </Text>
              <Text style={s.subtitle}>
                متصل به پایگاه‌دادهٔ واقعی و Realtime • {lastSyncedAt ? `آخرین همگام‌سازی: ${lastSyncedAt}` : 'همگام‌سازی خودکار فعال'}
              </Text>
            </View>

            <View style={s.headerRightGroup}>
              <View style={[s.pill, !wide && s.pillMobile]}>
                <View style={s.liveGreenDot} />
                <Text style={s.pillText}>زنده · {managerName}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تازه‌سازی گزارش‌ها"
                disabled={busy}
                onPress={() => void task(async () => {
                  await refreshAll();
                  setNotice('تمام داده‌ها و آمارها از سرور زنده به‌روزرسانی شد.');
                })}
                style={[s.refreshBtn, busy && { opacity: 0.5 }]}
              >
                <RefreshCw size={15} color="#1769D2" />
                <Text style={s.refreshBtnText}>تازه‌سازی</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {feedback}

          {/* SQL Setup Banner if admin_popups migration has not been run on Supabase yet */}
          {popupSchemaMissing && (
            <View style={s.schemaAlertCard}>
              <View style={s.sectionHead}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                  <ShieldAlert size={20} color="#B45309" />
                  <Text style={[s.cardTitle, { color: '#92400E', flex: 1 }]}>
                    نصب یک‌بار جدول پاپ‌آپ‌ها در Supabase لازم است
                  </Text>
                </View>
              </View>
              <Text style={[s.small, { color: '#78350F' }]}>
                سایر بخش‌های پنل به سرور واقعی متصل‌اند، اما برای ذخیره و ارسال آنی پاپ‌آپ به اپ اصلی، یک‌بار کد SQL زیر را کپی کرده و در Supabase → SQL Editor اجرا کنید و سپس دکمهٔ «بررسی مجدد» را بزنید.
              </Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void copyTextSafe(ADMIN_POPUPS_SETUP_SQL).then(ok => {
                      setNotice(ok
                        ? 'اسکریپت کامل SQL در کلیپ‌بورد کپی شد؛ در Supabase SQL Editor جای‌گذاری (Paste) و Run کنید.'
                        : 'امکان کپی خودکار نبود؛ فایل supabase/SETUP-ADMIN-POPUPS-ONCE.sql را اجرا کنید.');
                    });
                  }}
                  style={s.primaryActionChip}
                >
                  <Copy size={14} color="#FFFFFF" />
                  <Text style={s.primaryActionChipText}>کپی کامل کد SQL نصب پاپ‌آپ</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void task(async () => {
                    await refreshPopupsOnly();
                    setNotice('بررسی انجام شد.');
                  })}
                  style={s.ghostBtn}
                >
                  <RefreshCw size={14} color="#1769D2" />
                  <Text style={s.actionText}>بررسی مجدد پس از اجرا</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ==================== TAB 1: OVERVIEW ==================== */}
          {tab === 'overview' && (
            <>
              <View style={s.stats}>
                {[
                  ['کاربران اپ با لاگین', fa(registeredUsers.length), `${fa(active24hCount)} فعال در ۲۴ ساعت اخیر`],
                  [
                    'زبان‌های فعال سراسری',
                    globalLangPolicy.enabled.length === 0 ? 'همه بسته' : `${fa(globalLangPolicy.enabled.length)} از ۳ زبان`,
                    `${fa(restrictedUserCount)} کاربر دارای محدودیت اختصاصی`,
                  ],
                  ['پاپ‌آپ‌های در حال پخش', fa(livePopups.length), `${fa(popupTotals.impressions)} بازدید · نرخ کلیک ${fa(popupTotals.ctr)}٪`],
                  ['پشتیبانی منتظر پاسخ', fa(openSupportCount), `از مجموع ${fa(supportContacts.length)} گفتگوی پشتیبانی`],
                  ['میانگین پیشرفت انگلیسی', `${fa(avgProgress)}٪`, `${fa(totalMinutesAll)} دقیقه مطالعه ثبت‌شده`],
                  ['ظرفیت ۳ دوره اپ با لاگین', `${fa(335)} درس`, 'انگلیسی · آلمانی · ترکی استانبولی'],
                ].map(([name, value, hint]) => (
                  <View key={name} style={s.stat}>
                    <Text style={s.statLabel}>{name}</Text>
                    <Text style={s.statNumber}>{value}</Text>
                    <Text style={s.small}>{hint}</Text>
                  </View>
                ))}
              </View>

              <LinearGradient
                colors={['#0F2E5C', '#1769D2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.hero}
              >
                <View style={{ flex: 1, minWidth: 190 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Radio size={16} color="#93C5FD" />
                    <Text style={[s.eyebrow, { color: '#BFDBFE', marginBottom: 0 }]}>LOGIN APP LIVE CONTROL</Text>
                  </View>
                  <Text style={s.heroTitle}>کنترل آنی زبان‌ها و ارسال پاپ‌آپ ویژهٔ اپ زبان‌آموز با لاگین</Text>
                  <Text style={s.heroText}>
                    این پنل منحصراً به اپ زبان‌آموز با لاگین (انگلیسی، آلمانی و ترکی استانبولی) متصل است. هر زبان یا همهٔ زبان‌ها را سراسری یا برای یک کاربر خاص بلافاصله فعال/غیرفعال کنید.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable accessibilityRole="button" onPress={() => setTab('languages')} style={s.heroWhiteBtn}>
                    <Globe size={15} color="#102A56" />
                    <Text style={s.heroWhiteBtnText}>مدیریت دسترسی زبان‌ها</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setTab('popups')} style={s.heroOutlineBtn}>
                    <Megaphone size={15} color="#FFFFFF" />
                    <Text style={s.heroOutlineBtnText}>ساخت پاپ‌آپ جدید</Text>
                  </Pressable>
                </View>
              </LinearGradient>

              {/* Active Popups Live Snapshot */}
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <Text style={s.cardTitle}>پاپ‌آپ‌های فعال در اپ زبان‌آموز با لاگین ({fa(livePopups.length)})</Text>
                  <Pressable accessibilityRole="button" onPress={() => setTab('popups')}>
                    <Text style={s.inlineLink}>مدیریت همهٔ پاپ‌آپ‌ها ←</Text>
                  </Pressable>
                </View>
                {!livePopups.length ? (
                  <View style={s.empty}>
                    <BellRing size={30} color="#1769D2" />
                    <Text style={s.cardTitle}>در حال حاضر هیچ پاپ‌آپ فعالی روی اپ با لاگین نمایش داده نمی‌شود</Text>
                    <Text style={s.small}>از تب «پاپ‌آپ اپ با لاگین» می‌توانید اعلان همگانی یا اختصاصی منتشر کنید.</Text>
                  </View>
                ) : (
                  livePopups.slice(0, 4).map(p => (
                    <View key={p.id} style={s.studentRow}>
                      <View style={[s.avatar, { backgroundColor: '#EAF3FF' }]}>
                        <Megaphone size={16} color="#1769D2" />
                      </View>
                      <View style={{ flex: 1, minWidth: 130 }}>
                        <Text style={s.studentName}>{p.title}</Text>
                        <Text style={s.small}>
                          {p.target_scope === 'user'
                            ? `اختصاصی: ${userById.get(p.target_user_id || '')?.full_name || 'کاربر مشخص'}`
                            : 'همهٔ کاربران اپ با لاگین'}
                          {' · '}
                          {fa(p.unique_impressions)} بازدید · {fa(p.unique_clicks)} کلیک
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void task(async () => {
                          await toggleAdminPopupActive(p.id, false);
                          await refreshPopupsOnly();
                          setNotice(`پاپ‌آپ «${p.title}» متوقف شد.`);
                        })}
                        style={s.warnChip}
                      >
                        <Pause size={13} color="#B45309" />
                        <Text style={s.warnChipText}>توقف</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              {/* Recent Active Registered Users */}
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <Text style={s.cardTitle}>آخرین کاربران فعال در اپ با لاگین</Text>
                  <Pressable accessibilityRole="button" onPress={() => setTab('registered')}>
                    <Text style={s.inlineLink}>مشاهدهٔ همه ({fa(registeredUsers.length)}) ←</Text>
                  </Pressable>
                </View>
                {!registeredUsers.length ? (
                  <View style={s.empty}>
                    <Users size={30} color="#1769D2" />
                    <Text style={s.small}>هنوز کاربری در اپ زبان‌آموز با لاگین ثبت‌نام نکرده است.</Text>
                  </View>
                ) : (
                  [...registeredUsers]
                    .sort((a, b) => Date.parse(b.last_seen_at) - Date.parse(a.last_seen_at))
                    .slice(0, 5)
                    .map((u, idx) => {
                      const onlineToday = isActiveWithinHours(u.last_seen_at, 24);
                      const resolvedLangs = resolveEffectiveUserLanguages(u.user_id, globalLangPolicy, userLangPolicies);
                      return (
                        <View key={u.user_id} style={s.studentRow}>
                          <View style={[s.avatar, { backgroundColor: ['#E5F3F0', '#EEF0FF', '#FFF1DC'][idx % 3] }]}>
                            <Text style={s.avatarText}>{u.full_name.slice(0, 1)}</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 120 }}>
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                              {onlineToday && <View style={s.liveGreenDot} />}
                              <Text style={s.studentName}>{u.full_name}</Text>
                            </View>
                            <Text style={s.emailText}>{u.email}</Text>
                          </View>
                          <Text
                            style={[
                              s.badge,
                              resolvedLangs.enabled.length === 0 && { backgroundColor: '#FEE2E2', color: '#B42318' },
                            ]}
                          >
                            {resolvedLangs.enabled.length === 0
                              ? 'همهٔ زبان‌ها غیرفعال'
                              : `${fa(resolvedLangs.enabled.length)} زبان فعال`}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setLangUserSearch(u.email);
                              setTab('languages');
                            }}
                            style={s.ghostBtn}
                          >
                            <Globe size={13} color="#1769D2" />
                            <Text style={s.actionText}>زبان‌ها</Text>
                          </Pressable>
                        </View>
                      );
                    })
                )}
              </View>
            </>
          )}

          {/* ==================== TAB 2: LIVE LANGUAGE ACCESS CONTROL ==================== */}
          {tab === 'languages' && (
            <>
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Globe size={19} color="#1769D2" />
                    <Text style={s.cardTitle}>۱. دسترسی سراسری زبان‌ها در اپ با لاگین</Text>
                  </View>
                  <View
                    style={[
                      s.statusPill,
                      globalLangPolicy.enabled.length === 0
                        ? { backgroundColor: '#FEE2E2' }
                        : globalLangPolicy.enabled.length < 3
                          ? s.statusPaused
                          : s.statusLive,
                    ]}
                  >
                    <Text
                      style={[
                        s.statusPillText,
                        {
                          color:
                            globalLangPolicy.enabled.length === 0
                              ? '#B42318'
                              : globalLangPolicy.enabled.length < 3
                                ? '#9A3412'
                                : '#15803D',
                        },
                      ]}
                    >
                      {globalLangPolicy.enabled.length === 0
                        ? '● همهٔ زبان‌ها سراسری غیرفعال'
                        : `${fa(globalLangPolicy.enabled.length)} از ۳ زبان فعال`}
                    </Text>
                  </View>
                </View>

                <Text style={s.subtitle}>
                  اپ زبان‌آموز با لاگین دارای ۳ زبان «انگلیسی، آلمانی و ترکی استانبولی» است (زبان روسی در نسخهٔ با لاگین وجود ندارد). با خاموش کردن هر زبان یا همهٔ زبان‌ها، تغییر در کمتر از یک ثانیه روی گوشی تمام کاربران لاگین‌کرده اعمال می‌شود.
                </Text>

                <View style={s.chipsWrap}>
                  {LOGIN_APP_LANGUAGE_INFO.map(lang => {
                    const isOn = globalLangPolicy.enabled.includes(lang.id);
                    return (
                      <Pressable
                        key={lang.id}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => toggleGlobalLanguageItem(lang.id)}
                        style={[
                          s.langToggleCard,
                          isOn ? s.langToggleCardOn : s.langToggleCardOff,
                          busy && { opacity: 0.5 },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[s.studentName, { color: isOn ? '#065F46' : '#991B1B' }]}>
                            {lang.fa}
                          </Text>
                          <Text style={[s.small, { color: isOn ? '#047857' : '#B91C1C' }]}>
                            {isOn ? '● فعال برای کاربران' : '✕ غیرفعال شده'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={s.label}>پیام نمایشی در صفحهٔ قفل (وقتی همهٔ ۳ زبان غیرفعال می‌شوند)</Text>
                <TextInput
                  accessibilityLabel="پیام قفل دسترسی زبان‌ها"
                  value={globalLockMessage}
                  onChangeText={setGlobalLockMessage}
                  maxLength={320}
                  multiline
                  numberOfLines={2}
                  placeholder="متن پیام برای زمانی که همهٔ زبان‌ها غیرفعال هستند…"
                  placeholderTextColor="#8B9AB0"
                  style={[s.input, { minHeight: 58, textAlignVertical: 'top' }]}
                />

                <View style={s.popupActionRow}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() =>
                      applyGlobalLanguages(
                        [],
                        'هر ۳ زبان به‌صورت سراسری برای تمام کاربران اپ با لاگین غیرفعال شدند.',
                      )
                    }
                    style={[s.deleteBtn, busy && { opacity: 0.45 }]}
                  >
                    <ShieldAlert size={15} color="#B42318" />
                    <Text style={s.deleteText}>غیرفعال کردن همهٔ زبان‌ها (سراسری)</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() =>
                      applyGlobalLanguages(
                        [...LOGIN_APP_LANGUAGE_IDS],
                        'هر ۳ زبان (انگلیسی، آلمانی و ترکی) به‌صورت سراسری فعال شدند.',
                      )
                    }
                    style={[s.ghostBtn, { backgroundColor: '#ECFDF5' }, busy && { opacity: 0.45 }]}
                  >
                    <CircleCheck size={15} color="#047857" />
                    <Text style={[s.actionText, { color: '#047857' }]}>فعال کردن همهٔ زبان‌ها (سراسری)</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() =>
                      applyGlobalLanguages(
                        globalLangPolicy.enabled,
                        'پیام و تنظیمات سراسری دسترسی زبان‌ها ذخیره و اعمال شد.',
                      )
                    }
                    style={[s.ghostBtn, busy && { opacity: 0.45 }]}
                  >
                    <Send size={14} color="#1769D2" />
                    <Text style={s.actionText}>ذخیرهٔ پیام توقف</Text>
                  </Pressable>
                </View>
              </View>

              <View style={s.card}>
                <View style={s.sectionHead}>
                  <Text style={s.cardTitle}>
                    ۲. کنترل اختصاصی زبان‌ها برای هر کاربر ({fa(registeredUsers.length)} کاربر)
                  </Text>
                  {langUserSearch ? (
                    <Pressable accessibilityRole="button" onPress={() => setLangUserSearch('')}>
                      <Text style={s.inlineLink}>نمایش همهٔ کاربران</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={s.subtitle}>
                  می‌توانید برای هر کاربر لاگین‌کرده به‌طور مستقل یک زبان، دو زبان یا هر ۳ زبان را یک‌جا غیرفعال کنید تا درس‌ها فوراً روی گوشی همان کاربر بسته شوند.
                </Text>

                <View style={s.toolbar}>
                  <View style={s.search}>
                    <Search size={17} color="#8390A1" />
                    <TextInput
                      accessibilityLabel="جستجوی کاربر برای کنترل زبان"
                      placeholder="جستجوی نام یا ایمیل کاربر…"
                      placeholderTextColor="#8B9AB0"
                      value={langUserSearch}
                      onChangeText={setLangUserSearch}
                      style={s.searchInput}
                    />
                  </View>
                  <View style={s.filters}>
                    {([
                      ['all', 'همه'],
                      ['custom', 'دارای تنظیم اختصاصی'],
                      ['all_disabled', 'همهٔ زبان‌ها بسته'],
                    ] as const).map(([fId, fLabel]) => (
                      <Pressable
                        key={fId}
                        accessibilityRole="button"
                        onPress={() => setLangUserFilter(fId)}
                        style={[s.filter, langUserFilter === fId && { backgroundColor: '#E2EFFF' }]}
                      >
                        <Text style={s.small}>{fLabel}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {!visibleLangUsers.length ? (
                  <View style={s.empty}>
                    <Users size={32} color="#1769D2" />
                    <Text style={s.cardTitle}>
                      {registeredUsers.length ? 'کاربری با این فیلتر پیدا نشد' : 'هنوز کاربری در اپ با لاگین ثبت‌نام نکرده است'}
                    </Text>
                  </View>
                ) : (
                  visibleLangUsers.map((user, idx) => {
                    const resolved = resolveEffectiveUserLanguages(user.user_id, globalLangPolicy, userLangPolicies);
                    const allOff = resolved.enabled.length === 0;
                    return (
                      <View key={user.user_id} style={s.popupRecordCard}>
                        <View style={s.sectionHead}>
                          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={[s.avatar, { backgroundColor: ['#E5F3F0', '#EEF0FF', '#FFF1DC'][idx % 3] }]}>
                              <Text style={s.avatarText}>{user.full_name.slice(0, 1)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.studentName}>{user.full_name}</Text>
                              <Text style={s.emailText}>{user.email}</Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              s.badge,
                              allOff
                                ? { backgroundColor: '#FEE2E2', color: '#B42318' }
                                : resolved.customized
                                  ? { backgroundColor: '#FEF3C7', color: '#92400E' }
                                  : { backgroundColor: '#ECFDF5', color: '#047857' },
                            ]}
                          >
                            {allOff
                              ? 'همهٔ زبان‌ها بسته'
                              : resolved.customized
                                ? `اختصاصی (${fa(resolved.enabled.length)} زبان)`
                                : 'پیرو تنظیم سراسری'}
                          </Text>
                        </View>

                        <View style={s.popupActionRow}>
                          {LOGIN_APP_LANGUAGE_INFO.map(lang => {
                            const on = resolved.enabled.includes(lang.id);
                            return (
                              <Pressable
                                key={lang.id}
                                accessibilityRole="button"
                                disabled={busy}
                                onPress={() => toggleUserLanguageItem(user, lang.id)}
                                style={[
                                  s.choiceChip,
                                  on
                                    ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                                    : { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                                ]}
                              >
                                <Text
                                  style={[
                                    s.choiceChipText,
                                    { color: on ? '#166534' : '#991B1B' },
                                  ]}
                                >
                                  {lang.flag} {lang.fa}: {on ? 'فعال' : 'غیرفعال'}
                                </Text>
                              </Pressable>
                            );
                          })}

                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => setAllUserLanguages(user, false)}
                            style={[s.deleteBtn, busy && { opacity: 0.45 }]}
                          >
                            <X size={14} color="#B42318" />
                            <Text style={s.deleteText}>بستن همهٔ زبان‌ها</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => setAllUserLanguages(user, true)}
                            style={[s.ghostBtn, { backgroundColor: '#ECFDF5' }]}
                          >
                            <CircleCheck size={14} color="#047857" />
                            <Text style={[s.actionText, { color: '#047857' }]}>باز کردن همه</Text>
                          </Pressable>

                          {resolved.customized ? (
                            <Pressable
                              accessibilityRole="button"
                              disabled={busy}
                              onPress={() => resetUserLanguageToGlobal(user)}
                              style={s.ghostBtn}
                            >
                              <RefreshCw size={13} color="#1769D2" />
                              <Text style={s.actionText}>بازگشت به سراسری</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* ==================== TAB 2: POPUPS STUDIO & TELEMETRY ==================== */}
          {tab === 'popups' && (
            <>
              {/* Quick Ready Templates */}
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Zap size={16} color="#1769D2" />
                    <Text style={s.cardTitle}>قالب‌های آمادهٔ سریع (یک کلیک برای بارگذاری در فرم)</Text>
                  </View>
                  {editingPopupId && (
                    <Pressable accessibilityRole="button" onPress={resetPopupForm} style={s.ghostBtn}>
                      <X size={14} color="#1769D2" />
                      <Text style={s.actionText}>لغو ویرایش / فرم جدید</Text>
                    </Pressable>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                  {POPUP_TEMPLATES.map(tpl => (
                    <Pressable
                      key={tpl.label}
                      accessibilityRole="button"
                      onPress={() => {
                        setPopupTitle(tpl.title);
                        setPopupBadge(tpl.badge);
                        setPopupBody(tpl.body);
                        setPopupVariant(tpl.variant);
                        setPopupCtaLabel(tpl.ctaLabel);
                        setPopupCtaUrl(tpl.ctaUrl);
                        setPopupTargetScope('all');
                        setPopupTargetEdition(tpl.edition);
                        setPopupDisplayMode(tpl.mode);
                      }}
                      style={s.templateChip}
                    >
                      <Text style={s.templateChipText}>{tpl.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Form + Live Preview Split */}
              <View style={[s.studioGrid, wide && s.studioGridWide]}>
                {/* Builder Form */}
                <View style={[s.card, wide && { flex: 1.35 }]}>
                  <Text style={s.cardTitle}>
                    {editingPopupId ? 'ویرایش پاپ‌آپ انتخاب‌شده' : 'طراحی و ارسال آنی پاپ‌آپ به اپ اصلی'}
                  </Text>
                  <Text style={s.subtitle}>
                    به‌محض انتشار، پاپ‌آپ از طریق Supabase Realtime روی اپ‌های باز نمایش داده می‌شود و برای مراجعان بعدی نیز در دیتابیس ذخیره می‌ماند.
                  </Text>

                  <Text style={s.label}>۱. استایل و حال‌وهوای پاپ‌آپ</Text>
                  <View style={s.chipsWrap}>
                    {([
                      ['info', 'اطلاعیه رسمی'],
                      ['celebration', 'تبریک / ویژه'],
                      ['update', 'نسخه جدید'],
                      ['warning', 'هشدار مهم'],
                    ] as const).map(([id, text]) => (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        onPress={() => setPopupVariant(id)}
                        style={[s.choiceChip, popupVariant === id && s.choiceChipActive]}
                      >
                        <Text style={[s.choiceChipText, popupVariant === id && s.choiceChipTextActive]}>{text}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={s.label}>۲. مخاطب هدف پاپ‌آپ (ویژهٔ اپ زبان‌آموز با لاگین)</Text>
                  <View style={s.chipsWrap}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => { setPopupTargetScope('all'); setPopupTargetUserId(null); }}
                      style={[s.choiceChip, popupTargetScope === 'all' && s.choiceChipActive]}
                    >
                      <Globe size={13} color={popupTargetScope === 'all' ? '#FFFFFF' : '#334E68'} />
                      <Text style={[s.choiceChipText, popupTargetScope === 'all' && s.choiceChipTextActive]}>
                        همهٔ کاربران اپ با لاگین
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPopupTargetScope('user')}
                      style={[s.choiceChip, popupTargetScope === 'user' && s.choiceChipActive]}
                    >
                      <UserCheck size={13} color={popupTargetScope === 'user' ? '#FFFFFF' : '#334E68'} />
                      <Text style={[s.choiceChipText, popupTargetScope === 'user' && s.choiceChipTextActive]}>
                        کاربر لاگین‌کردهٔ مشخص
                      </Text>
                    </Pressable>
                  </View>

                  {popupTargetScope === 'user' && (
                    <View style={s.userPickerBox}>
                      <Text style={s.label}>
                        انتخاب کاربر گیرنده {selectedTargetUser ? `(انتخاب‌شده: ${selectedTargetUser.full_name})` : ''}
                      </Text>
                      <TextInput
                        accessibilityLabel="جستجوی کاربر برای پاپ‌آپ"
                        value={popupUserSearch}
                        onChangeText={setPopupUserSearch}
                        placeholder="جستجوی نام یا ایمیل کاربر ثبت‌شده…"
                        placeholderTextColor="#8B9AB0"
                        style={s.input}
                      />
                      <ScrollView style={{ maxHeight: 135 }} nestedScrollEnabled>
                        {registeredUsers
                          .filter(u => `${u.full_name} ${u.email}`.toLowerCase().includes(popupUserSearch.trim().toLowerCase()))
                          .slice(0, 20)
                          .map(u => {
                            const activePick = popupTargetUserId === u.user_id;
                            return (
                              <Pressable
                                key={u.user_id}
                                accessibilityRole="button"
                                onPress={() => setPopupTargetUserId(u.user_id)}
                                style={[s.userPickRow, activePick && s.userPickRowActive]}
                              >
                                <Text style={[s.studentName, activePick && { color: '#1769D2' }]}>{u.full_name}</Text>
                                <Text style={s.emailText}>{u.email}</Text>
                              </Pressable>
                            );
                          })}
                        {!registeredUsers.length && (
                          <Text style={s.small}>هنوز هیچ کاربر ثبت‌شده‌ای وجود ندارد؛ برای تست فوری از «همهٔ کاربران اپ با لاگین» استفاده کنید.</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={s.label}>۳. عنوان پاپ‌آپ (الزامی)</Text>
                  <TextInput
                    accessibilityLabel="عنوان پاپ‌آپ"
                    value={popupTitle}
                    onChangeText={setPopupTitle}
                    maxLength={120}
                    placeholder="مثلاً: درس‌های جدید مکالمه اضافه شد!"
                    placeholderTextColor="#8B9AB0"
                    style={s.input}
                  />

                  <Text style={s.label}>برچسب بالای هدر (اختیاری)</Text>
                  <TextInput
                    accessibilityLabel="برچسب بالای پاپ‌آپ"
                    value={popupBadge}
                    onChangeText={setPopupBadge}
                    maxLength={40}
                    placeholder="مثلاً: اطلاعیه مهم · ویژه امروز"
                    placeholderTextColor="#8B9AB0"
                    style={s.input}
                  />

                  <Text style={s.label}>۴. متن کامل پیام (الزامی)</Text>
                  <TextInput
                    accessibilityLabel="متن پاپ‌آپ"
                    value={popupBody}
                    onChangeText={setPopupBody}
                    maxLength={1200}
                    multiline
                    numberOfLines={4}
                    placeholder="توضیحات روشن و کوتاه برای زبان‌آموز بنویسید…"
                    placeholderTextColor="#8B9AB0"
                    style={[s.input, { minHeight: 88, textAlignVertical: 'top' }]}
                  />

                  <Text style={s.label}>۵. دکمهٔ اقدام هوشمند (CTA — اختیاری)</Text>
                  <TextInput
                    accessibilityLabel="متن دکمه اقدام"
                    value={popupCtaLabel}
                    onChangeText={setPopupCtaLabel}
                    maxLength={60}
                    placeholder="عنوان دکمه (مثلاً: ورود به دوره ترکی)"
                    placeholderTextColor="#8B9AB0"
                    style={s.input}
                  />
                  <TextInput
                    accessibilityLabel="مسیر یا لینک دکمه اقدام"
                    value={popupCtaUrl}
                    onChangeText={setPopupCtaUrl}
                    maxLength={500}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="/learn/tr یا https://example.com"
                    placeholderTextColor="#8B9AB0"
                    style={[s.input, s.ltr]}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                    {INTERNAL_POPUP_ROUTES.map(r => (
                      <Pressable
                        key={r.route}
                        accessibilityRole="button"
                        onPress={() => {
                          setPopupCtaUrl(r.route);
                          if (!popupCtaLabel.trim()) setPopupCtaLabel(`مشاهده ${r.label}`);
                        }}
                        style={[s.routeChip, popupCtaUrl === r.route && s.routeChipActive]}
                      >
                        <Text style={[s.routeChipText, popupCtaUrl === r.route && { color: '#1769D2' }]}>
                          {r.label} ({r.route})
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={s.label}>۶. تصویر بنر HTTPS (اختیاری)</Text>
                  <TextInput
                    accessibilityLabel="لینک تصویر پاپ‌آپ"
                    value={popupImageUrl}
                    onChangeText={setPopupImageUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="https://..."
                    placeholderTextColor="#8B9AB0"
                    style={[s.input, s.ltr]}
                  />

                  <Text style={s.label}>۷. حالت نمایش روی گوشی زبان‌آموز</Text>
                  <View style={s.chipsWrap}>
                    {([
                      ['once', 'یک‌بار برای هر کاربر'],
                      ['every_launch', 'هر بار باز شدن اپ'],
                      ['persistent_blocking', 'اجباری (بدون دکمه بستن)'],
                    ] as const).map(([m, text]) => (
                      <Pressable
                        key={m}
                        accessibilityRole="button"
                        onPress={() => setPopupDisplayMode(m)}
                        style={[s.choiceChip, popupDisplayMode === m && s.choiceChipActive]}
                      >
                        <Text style={[s.choiceChipText, popupDisplayMode === m && s.choiceChipTextActive]}>{text}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' }}>
                    <View style={{ flex: 1, minWidth: 130 }}>
                      <Text style={s.label}>متن دکمهٔ بستن</Text>
                      <TextInput
                        accessibilityLabel="متن دکمه بستن"
                        value={popupDismissLabel}
                        onChangeText={setPopupDismissLabel}
                        maxLength={40}
                        style={s.input}
                      />
                    </View>
                    <View style={{ width: 110 }}>
                      <Text style={s.label}>اولویت (۰–۱۰۰)</Text>
                      <TextInput
                        accessibilityLabel="اولویت نمایش"
                        value={popupPriority}
                        onChangeText={setPopupPriority}
                        keyboardType="numeric"
                        maxLength={3}
                        style={[s.input, s.ltr]}
                      />
                    </View>
                  </View>

                  <Text style={s.label}>مدت اعتبار پاپ‌آپ</Text>
                  <View style={s.chipsWrap}>
                    {EXPIRY_PRESETS.map(preset => (
                      <Pressable
                        key={preset.label}
                        accessibilityRole="button"
                        onPress={() => {
                          setPopupExpiryHours(preset.hours);
                          if (preset.hours !== null) setPopupKeepExistingExpiry(null);
                        }}
                        style={[s.choiceChip, popupExpiryHours === preset.hours && s.choiceChipActive]}
                      >
                        <Text style={[s.choiceChipText, popupExpiryHours === preset.hours && s.choiceChipTextActive]}>
                          {preset.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="انتشار کامل پاپ‌آپ در اپ اصلی"
                      disabled={busy}
                      onPress={() => submitPopupForm(true)}
                      style={[s.publishPrimaryBtn, { flex: 1, minWidth: 210 }, busy && { opacity: 0.6 }]}
                    >
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Send size={16} color="#FFFFFF" />
                          <Text style={s.publishPrimaryBtnText}>
                            {editingPopupId
                              ? 'ذخیره تغییرات و انتشار آنی'
                              : 'انتشار و ارسال آنی پاپ‌آپ در اپ اصلی'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                    {editingPopupId && button('انصراف از ویرایش', resetPopupForm, true)}
                  </View>
                </View>

                {/* Pixel-Accurate Live Mobile Preview */}
                <View style={[s.card, wide && { flex: 1, alignSelf: 'flex-start' }]}>
                  <View style={s.sectionHead}>
                    <Text style={s.cardTitle}>پیش‌نمایش زنده در اپ زبان‌آموز</Text>
                    <Text style={s.badge}>دقیقاً مشابه نمایش واقعی</Text>
                  </View>
                  <View style={s.previewPhoneStage}>
                    <PopupCardPreview
                      previewMode
                      title={popupTitle}
                      body={popupBody}
                      variant={popupVariant}
                      badgeText={popupBadge}
                      imageUrl={popupImageUrl}
                      ctaLabel={popupCtaLabel}
                      ctaUrl={popupCtaUrl}
                      dismissLabel={popupDismissLabel}
                      blocking={popupDisplayMode === 'persistent_blocking'}
                      directTarget={popupTargetScope === 'user'}
                      onPressCta={() => setNotice('این پیش‌نمایش است؛ پس از انتشار، این دکمه زبان‌آموز را به مقصد هدایت می‌کند.')}
                      onDismiss={popupDisplayMode === 'persistent_blocking' ? undefined : () => undefined}
                    />
                  </View>
                  <Text style={s.small}>
                    نکته: به‌محض فشردن دکمهٔ انتشار، هر زبان‌آموزی که اپ زبان‌آموز با لاگین روی گوشی یا مرورگرش باز باشد در لحظه این پاپ‌آپ را می‌بیند.
                  </Text>
                </View>
              </View>

              {/* Published Popups & Live Telemetry */}
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }}>
                    <ChartBar size={17} color="#1769D2" />
                    <Text style={s.cardTitle}>پاپ‌آپ‌های ثبت‌شده و آمار زنده ({fa(popups.length)})</Text>
                  </View>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {([
                      ['all', 'همه'],
                      ['active', 'در حال پخش'],
                      ['inactive', 'متوقف / منقضی'],
                    ] as const).map(([fId, fTitle]) => (
                      <Pressable
                        key={fId}
                        accessibilityRole="button"
                        onPress={() => setPopupFilter(fId)}
                        style={[s.filter, popupFilter === fId && { backgroundColor: '#E2EFFF' }]}
                      >
                        <Text style={s.small}>{fTitle}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void task(async () => {
                        await broadcastAdminPopupSignal();
                        await refreshPopupsOnly();
                        setNotice('سیگنال همگام‌سازی آنی به تمام اپ‌های باز ارسال شد.');
                      })}
                      style={s.ghostBtn}
                    >
                      <Radio size={14} color="#1769D2" />
                      <Text style={s.actionText}>ارسال سیگنال Realtime</Text>
                    </Pressable>
                  </View>
                </View>

                {!visiblePopups.length ? (
                  <View style={s.empty}>
                    <Megaphone size={32} color="#1769D2" />
                    <Text style={s.cardTitle}>هنوز پاپ‌آپی در این دسته وجود ندارد</Text>
                    <Text style={s.small}>از فرم بالا یک پاپ‌آپ همگانی یا اختصاصی بسازید تا آمار زندهٔ بازدید و کلیک آن اینجا ثبت شود.</Text>
                  </View>
                ) : (
                  visiblePopups.map(item => {
                    const isExpired = Boolean(item.expires_at && Date.parse(item.expires_at) <= Date.now());
                    const isLive = item.is_active && !isExpired;
                    const ctr = item.unique_impressions > 0
                      ? Math.round((item.unique_clicks / item.unique_impressions) * 100)
                      : 0;
                    const targetUser = item.target_user_id ? userById.get(item.target_user_id) : null;
                    return (
                      <View key={item.id} style={s.popupRecordCard}>
                        <View style={s.sectionHead}>
                          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={[s.statusPill, isLive ? s.statusLive : s.statusPaused]}>
                              <Text style={[s.statusPillText, { color: isLive ? '#15803D' : '#9A3412' }]}>
                                {isLive ? '● در حال نمایش زنده' : isExpired ? 'منقضی‌شده' : 'متوقف‌شده'}
                              </Text>
                            </View>
                            <Text style={[s.cardTitle, { flex: 1 }]}>{item.title}</Text>
                          </View>
                          <Text style={s.small}>ایجاد: {formatDateTimeFa(item.created_at)}</Text>
                        </View>

                        <Text numberOfLines={2} style={s.small}>{item.body}</Text>

                        <View style={s.popupMetaChips}>
                          <Text style={s.badge}>
                            {item.target_scope === 'user'
                              ? `گیرنده: ${targetUser ? `${targetUser.full_name} (${targetUser.email})` : item.target_user_id}`
                              : 'مخاطب: همهٔ کاربران اپ با لاگین'}
                          </Text>
                          <Text style={s.badge}>
                            {item.display_mode === 'persistent_blocking'
                              ? 'حالت: اجباری (بدون بستن)'
                              : item.display_mode === 'every_launch'
                                ? 'حالت: هر بار ورود'
                                : 'حالت: یک‌بار نمایش'}
                          </Text>
                          {item.cta_url && (
                            <Text style={s.badge}>مقصد دکمه: {item.cta_url}</Text>
                          )}
                          {item.expires_at && (
                            <Text style={s.badge}>انقضا: {formatDateTimeFa(item.expires_at)}</Text>
                          )}
                        </View>

                        {/* Real Telemetry Strip */}
                        <View style={s.telemetryRow}>
                          <View style={s.telemetryBox}>
                            <Eye size={14} color="#1769D2" />
                            <Text style={s.telemetryValue}>{fa(item.unique_impressions)}</Text>
                            <Text style={s.small}>بازدیدکننده یکتا ({fa(item.total_impressions)} کل نمایش)</Text>
                          </View>
                          <View style={s.telemetryBox}>
                            <MousePointerClick size={14} color="#0D9488" />
                            <Text style={s.telemetryValue}>{fa(item.unique_clicks)} ({fa(ctr)}٪)</Text>
                            <Text style={s.small}>کلیک روی دکمهٔ اقدام</Text>
                          </View>
                          <View style={s.telemetryBox}>
                            <CircleCheck size={14} color="#64748B" />
                            <Text style={s.telemetryValue}>{fa(item.unique_dismissals)}</Text>
                            <Text style={s.small}>بسته‌شده توسط کاربر</Text>
                          </View>
                          {item.last_event_at && (
                            <View style={s.telemetryBox}>
                              <Clock size={14} color="#6366F1" />
                              <Text style={s.small}>آخرین تعامل: {formatDateTimeFa(item.last_event_at)}</Text>
                            </View>
                          )}
                        </View>

                        {/* Manager Controls */}
                        <View style={s.popupActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => void task(async () => {
                              await toggleAdminPopupActive(item.id, !item.is_active);
                              await refreshPopupsOnly();
                              setNotice(!item.is_active
                                ? `پاپ‌آپ «${item.title}» فعال شد و روی اپ‌ها به نمایش درآمد.`
                                : `پاپ‌آپ «${item.title}» بلافاصله متوقف شد.`);
                            })}
                            style={[s.ghostBtn, item.is_active && { backgroundColor: '#FFF7ED' }]}
                          >
                            {item.is_active ? <Pause size={14} color="#C2410C" /> : <Play size={14} color="#15803D" />}
                            <Text style={[s.actionText, { color: item.is_active ? '#C2410C' : '#15803D' }]}>
                              {item.is_active ? 'توقف آنی نمایش' : 'فعال‌سازی نمایش'}
                            </Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => startEditPopup(item)}
                            style={s.ghostBtn}
                          >
                            <SquarePen size={14} color="#1769D2" />
                            <Text style={s.actionText}>ویرایش</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => void task(async () => {
                              await republishAdminPopup(item.id);
                              await refreshPopupsOnly();
                              setNotice(`پاپ‌آپ «${item.title}» مجدداً برای همهٔ کاربران (حتی کسانی که قبلاً بسته بودند) ارسال شد.`);
                            })}
                            style={s.ghostBtn}
                          >
                            <Send size={14} color="#1769D2" />
                            <Text style={s.actionText}>ارسال مجدد به همه</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => confirmDeletePopup(item)}
                            style={s.deleteBtn}
                          >
                            <Trash2 size={14} color="#B42318" />
                            <Text style={s.deleteText}>حذف</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* ==================== TAB 3: REGISTERED USERS ==================== */}
          {tab === 'registered' && (
            <View style={s.card}>
              <View style={s.sectionHead}>
                <Text style={s.cardTitle}>کاربران ثبت‌شده اپ زبان</Text>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                  <Text style={s.small}>{fa(registeredUsers.length)} حساب واقعی</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!registeredUsers.length}
                    onPress={() => {
                      downloadRegisteredUsers(registeredUsers).catch(cause => setError(educationError(cause)));
                    }}
                    style={[s.ghostBtn, !registeredUsers.length && { opacity: 0.45 }]}
                  >
                    <Download size={16} color="#1769D2" />
                    <Text style={s.actionText}>دانلود فهرست CSV</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={s.subtitle}>
                این فهرست شامل اطلاعات حساب، پلتفرم، نسخهٔ اپ و وضعیت فعالیت است؛ پیام‌های خصوصی و فایل‌های شخصی نمایش داده نمی‌شوند.
              </Text>

              <View style={s.toolbar}>
                <View style={s.search}>
                  <Search size={17} color="#8390A1" />
                  <TextInput
                    accessibilityLabel="جستجوی کاربر ثبت‌شده"
                    placeholder="جستجو بر اساس نام یا ایمیل…"
                    placeholderTextColor="#8B9AB0"
                    value={search}
                    onChangeText={setSearch}
                    style={s.searchInput}
                  />
                </View>
                <View style={s.filters}>
                  {([
                    ['all', 'همه'],
                    ['recent', 'فعال ۲۴ساعت'],
                    ['android', 'اندروید'],
                    ['web', 'وب'],
                    ['blocked', 'مسدود چت'],
                  ] as const).map(([fId, fLabel]) => (
                    <Pressable
                      key={fId}
                      accessibilityRole="button"
                      onPress={() => setUserFilter(fId)}
                      style={[s.filter, userFilter === fId && { backgroundColor: '#E2EFFF' }]}
                    >
                      <Text style={s.small}>{fLabel}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {!visibleUsers.length && (
                <View style={s.empty}>
                  <Users size={34} color="#1769D2" />
                  <Text style={s.cardTitle}>
                    {registeredUsers.length ? 'کاربری با این فیلتر پیدا نشد' : 'هنوز کاربری ثبت‌نام نکرده است'}
                  </Text>
                </View>
              )}

              {visibleUsers.map((user, index) => {
                const isBlocked = Boolean(chatBlockedUsers[user.user_id]);
                const activeRecent = isActiveWithinHours(user.last_seen_at, 24);
                const resolvedLangs = resolveEffectiveUserLanguages(user.user_id, globalLangPolicy, userLangPolicies);
                const allLangsDisabled = resolvedLangs.enabled.length === 0;
                return (
                  <View key={user.user_id} style={s.studentRow}>
                    <View style={[s.avatar, { backgroundColor: ['#E5F3F0', '#EEF0FF', '#FFF1DC'][index % 3] }]}>
                      <Text style={s.avatarText}>{user.full_name.slice(0, 1)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 125 }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                        {activeRecent && <View style={s.liveGreenDot} />}
                        <Text style={s.studentName}>{user.full_name}</Text>
                      </View>
                      <Text style={s.emailText}>{user.email}</Text>
                    </View>
                    <View>
                      <Text style={s.small}>ثبت‌نام: {formatDateFa(user.registered_at)}</Text>
                      <Text style={s.small}>آخرین فعالیت: {formatDateTimeFa(user.last_seen_at)}</Text>
                    </View>
                    <Text
                      style={[
                        s.badge,
                        allLangsDisabled && { backgroundColor: '#FEE2E2', color: '#B42318' },
                      ]}
                    >
                      {allLangsDisabled
                        ? 'همهٔ زبان‌ها مسدود'
                        : `زبان‌ها: ${resolvedLangs.enabled.map(id => id.toUpperCase()).join(' · ')}`}
                    </Text>

                    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => {
                          setLangUserSearch(user.email);
                          setTab('languages');
                        }}
                        style={s.ghostBtn}
                      >
                        <Globe size={14} color="#1769D2" />
                        <Text style={s.actionText}>زبان‌ها</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => setAllUserLanguages(user, allLangsDisabled)}
                        style={[
                          s.ghostBtn,
                          { backgroundColor: allLangsDisabled ? '#ECFDF5' : '#FEE2E2' },
                        ]}
                      >
                        <Text
                          style={[
                            s.small,
                            {
                              color: allLangsDisabled ? '#047857' : '#B42318',
                              fontFamily: 'Vazir-Bold',
                            },
                          ]}
                        >
                          {allLangsDisabled ? 'باز کردن زبان‌ها' : 'بستن همهٔ زبان‌ها'}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => startDirectPopupForUser(user.user_id, user.full_name)}
                        style={s.ghostBtn}
                      >
                        <Megaphone size={14} color="#1769D2" />
                        <Text style={s.actionText}>پاپ‌آپ مستقیم</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void task(async () => {
                          await setChatUserBlocked(user.user_id, !isBlocked);
                          setChatBlockedUsers(current => ({ ...current, [user.user_id]: !isBlocked }));
                          setNotice(isBlocked ? 'دسترسی گفتگو برای کاربر آزاد شد.' : 'دسترسی گفتگو برای کاربر مسدود شد.');
                        })}
                        style={[s.ghostBtn, { backgroundColor: isBlocked ? '#E8F6EF' : '#FFF1E8' }]}
                      >
                        <Text style={[s.small, { color: isBlocked ? '#178055' : '#B34B22', fontFamily: 'Vazir-Bold' }]}>
                          {isBlocked ? 'آزادسازی چت' : 'مسدود چت'}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => confirmDeleteUser(user)}
                        style={[s.deleteBtn, busy && { opacity: 0.45 }]}
                      >
                        <Trash2 size={15} color="#B42318" />
                        <Text style={s.deleteText}>حذف</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ==================== TAB 4: SUPPORT ==================== */}
          {tab === 'support' && (
            <View style={s.card}>
              <View style={s.sectionHead}>
                <Text style={s.cardTitle}>گفتگوی زندهٔ پشتیبانی</Text>
                <Text style={s.small}>
                  {fa(openSupportCount)} باز از مجموع {fa(supportContacts.length)} گفتگو
                </Text>
              </View>
              <Text style={s.subtitle}>
                زبان‌آموزان از دکمهٔ پشتیبانی اپ به شما پیام می‌دهند. هر گفتگو خصوصی و دوطرفه بین شما و همان زبان‌آموز است.
              </Text>

              <View style={s.toolbar}>
                <View style={s.search}>
                  <Search size={17} color="#8390A1" />
                  <TextInput
                    accessibilityLabel="جستجوی گفتگوی پشتیبانی"
                    placeholder="جستجوی نام زبان‌آموز…"
                    placeholderTextColor="#8B9AB0"
                    value={search}
                    onChangeText={setSearch}
                    style={s.searchInput}
                  />
                </View>
                <View style={s.filters}>
                  {([
                    ['all', 'همه'],
                    ['open', 'باز'],
                    ['resolved', 'پاسخ‌داده‌شده'],
                    ['moderated', 'مسدود / پنهان'],
                  ] as const).map(([fId, fTitle]) => (
                    <Pressable
                      key={fId}
                      accessibilityRole="button"
                      onPress={() => setSupportFilter(fId)}
                      style={[s.filter, supportFilter === fId && { backgroundColor: '#E2EFFF' }]}
                    >
                      <Text style={s.small}>{fTitle}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {!visibleSupport.length && (
                <View style={s.empty}>
                  <MessageCircle size={34} color="#1769D2" />
                  <Text style={s.cardTitle}>
                    {supportContacts.length ? 'گفتگویی با این فیلتر پیدا نشد' : 'هنوز پیامی از زبان‌آموزان ثبت نشده است'}
                  </Text>
                </View>
              )}

              {visibleSupport.map(contact => {
                const status = supportStatuses[contact.conversationId] || 'open';
                const nextStatus: SupportRequestStatus = status === 'open' ? 'resolved' : 'open';
                const isBlocked = Boolean(chatBlockedUsers[contact.id]);
                const isDeleted = Boolean(deletedChats[contact.conversationId]);
                return (
                  <View key={contact.conversationId} style={[s.studentRow, isDeleted && { opacity: 0.65 }]}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isDeleted}
                      style={{ flex: 1, minWidth: 140, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}
                      onPress={() => router.push({
                        pathname: '/conversations/human/[conversationId]',
                        params: { conversationId: contact.conversationId, name: contact.displayName },
                      } as never)}
                    >
                      <View style={[s.avatar, { backgroundColor: '#EEF0FF' }]}>
                        <Text style={s.avatarText}>{contact.displayName.slice(0, 1)}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 80 }}>
                        <Text style={s.studentName}>{contact.displayName}</Text>
                        <Text style={s.small}>
                          {isBlocked
                            ? 'دسترسی چت مسدود است'
                            : isDeleted
                              ? 'گفتگو پنهان شده'
                              : `آخرین فعالیت: ${formatDateTimeFa(contact.lastSeen)}`}
                        </Text>
                      </View>
                      {!isDeleted && <ArrowUpLeft size={18} color="#1769D2" />}
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={status === 'open' ? `بستن درخواست پشتیبانی ${contact.displayName}` : `بازکردن دوباره درخواست پشتیبانی ${contact.displayName}`}
                      disabled={busy}
                      onPress={() => void task(async () => {
                        await updateSupportRequestStatus(contact.conversationId, nextStatus);
                        setSupportStatuses(current => ({ ...current, [contact.conversationId]: nextStatus }));
                        setNotice(nextStatus === 'resolved'
                          ? 'درخواست پاسخ‌داده‌شده ثبت شد؛ زبان‌آموز اعلان می‌گیرد.'
                          : 'درخواست دوباره باز شد؛ زبان‌آموز اعلان می‌گیرد.');
                      })}
                      style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: status === 'resolved' ? '#E8F6EF' : '#EAF3FF' }}
                    >
                      <Text style={[s.small, { color: status === 'resolved' ? '#178055' : '#1769D2', fontFamily: 'Vazir-Bold' }]}>
                        {status === 'resolved' ? 'پاسخ‌داده‌شده' : 'باز'}
                      </Text>
                    </Pressable>

                    <View style={{ width: '100%', flexDirection: 'row-reverse', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => startDirectPopupForUser(contact.id, contact.displayName)}
                        style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: '#EAF4FF' }}
                      >
                        <Text style={[s.small, { color: '#1769D2', fontFamily: 'Vazir-Bold' }]}>پاپ‌آپ به این کاربر</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void task(async () => {
                          await setChatUserBlocked(contact.id, !isBlocked);
                          setChatBlockedUsers(current => ({ ...current, [contact.id]: !isBlocked }));
                          setNotice(isBlocked ? 'دسترسی گفتگو برای این کاربر مجاز شد.' : 'دسترسی گفتگو برای این کاربر مسدود شد.');
                        })}
                        style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: isBlocked ? '#E8F6EF' : '#FFF1E8' }}
                      >
                        <Text style={[s.small, { color: isBlocked ? '#178055' : '#B34B22' }]}>
                          {isBlocked ? 'اجازهٔ دسترسی' : 'مسدودکردن چت'}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => confirmConversationDeletion(contact)}
                        style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: isDeleted ? '#E8F6EF' : '#FFF0F0' }}
                      >
                        <Text style={[s.small, { color: isDeleted ? '#178055' : '#B42336' }]}>
                          {isDeleted ? 'بازیابی گفتگو' : 'حذف گفتگو'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ==================== TAB 5: ENROLLED STUDENTS ==================== */}
          {tab === 'students' && (
            <>
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <Text style={s.cardTitle}>پیشرفت زبان‌آموزان دارای رضایت اشتراک ({fa(students.length)})</Text>
                  <Text style={s.small}>گزارش واقعی همگام‌شده از دستگاه</Text>
                </View>

                <View style={s.toolbar}>
                  <View style={s.search}>
                    <Search size={18} color="#8390A1" />
                    <TextInput
                      accessibilityLabel="جستجوی نام زبان‌آموز"
                      placeholder="جستجوی نام زبان‌آموز…"
                      placeholderTextColor="#8B9AB0"
                      value={search}
                      onChangeText={setSearch}
                      style={s.searchInput}
                    />
                  </View>
                  <View style={s.filters}>
                    {([
                      ['all', 'همه'],
                      ['active', 'فعال'],
                      ['paused', 'متوقف'],
                    ] as const).map(([id, title]) => (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        onPress={() => setStudentFilter(id)}
                        style={[s.filter, studentFilter === id && { backgroundColor: '#E2EFFF' }]}
                      >
                        <Text style={s.small}>{title}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {!visibleStudents.length && (
                  <View style={s.empty}>
                    <Users size={34} color="#1769D2" />
                    <Text style={s.cardTitle}>
                      {students.length ? 'نتیجه‌ای پیدا نشد' : 'هنوز عضوی دعوت آموزشی را نپذیرفته است'}
                    </Text>
                    <Text style={s.small}>از تب «دعوت‌نامه‌ها» کد اختصاصی بسازید تا پیشرفت چندزبانهٔ عضو اینجا نمایش داده شود.</Text>
                  </View>
                )}

                {visibleStudents.map((r, i) => {
                  const m = progressMetrics(r.summary);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={r.student_id}
                      onPress={() => setSelected(r)}
                      style={s.studentRow}
                    >
                      <View style={[s.avatar, { backgroundColor: ['#E5F3F0', '#EEF0FF', '#FFF1DC'][i % 3] }]}>
                        <Text style={s.avatarText}>{r.display_name.slice(0, 1)}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 120 }}>
                        <Text style={s.studentName}>{r.display_name}</Text>
                        <Text style={s.small}>
                          {r.status === 'paused' ? 'گزارش متوقف است' : `آخرین همگام‌سازی: ${formatDateTimeFa(r.synced_at)}`}
                        </Text>
                      </View>
                      <View style={{ width: wide ? 200 : 115 }}>
                        <Text style={s.small}>
                          {r.summary ? `انگلیسی: ${fa(m.lessons)} از ${fa(ENGLISH_LESSON_TOTAL)} درس` : 'بدون گزارش'}
                        </Text>
                        <View style={s.track}>
                          <View style={[s.fill, { width: `${m.percent}%` }]} />
                        </View>
                      </View>
                      <Text style={[s.badge, r.status === 'paused' && { backgroundColor: '#FFF3DF', color: '#A36512' }]}>
                        {r.status === 'active' ? 'فعال' : 'متوقف'}
                      </Text>
                      <ArrowUpLeft size={17} color="#8190A5" />
                    </Pressable>
                  );
                })}
              </View>

              {selected && (() => {
                const m = progressMetrics(selected.summary);
                return (
                  <View style={s.card}>
                    <View style={s.sectionHead}>
                      <Text style={s.cardTitle}>جزئیات پیشرفت {selected.display_name}</Text>
                      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => startDirectPopupForUser(selected.student_id, selected.display_name)}
                          style={s.ghostBtn}
                        >
                          <Megaphone size={14} color="#1769D2" />
                          <Text style={s.actionText}>ارسال پاپ‌آپ تشویقی</Text>
                        </Pressable>
                        {button('بستن', () => setSelected(null), true)}
                      </View>
                    </View>
                    <Text style={s.subtitle}>
                      عضویت با رضایت: {formatDateFa(selected.consent_at)} • آخرین همگام‌سازی: {formatDateTimeFa(selected.synced_at)}
                    </Text>
                    {selected.summary ? (
                      <>
                        <Text style={s.detail}>
                          انگلیسی: {fa(m.lessons)} درس ({fa(m.percent)}٪) · {fa(m.words)} واژه از ۵۰۴ · {fa(m.minutes)} دقیقه · زنجیره {fa(m.streak)} روز
                        </Text>
                        {(m.germanLessons > 0 || m.turkishLessons > 0 || m.pronunciationCount > 0) && (
                          <Text style={s.detail}>
                            سایر زبان‌های اپ با لاگین — آلمانی: {fa(m.germanLessons)} درس · ترکی استانبولی: {fa(m.turkishLessons)} درس · تمرین تلفظ: {fa(m.pronunciationCount)} مورد
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={s.small}>هنوز پیشرفتی از دستگاه این زبان‌آموز به سرور همگام نشده است.</Text>
                    )}
                    {button(
                      selected.status === 'active' ? 'توقف دریافت گزارش این عضو' : 'فعال‌کردن دوباره گزارش',
                      () => void task(async () => {
                        const { error: updErr } = await adminClient()
                          .from('education_enrollments')
                          .update({ status: selected.status === 'active' ? 'paused' : 'active' })
                          .eq('student_id', selected.student_id)
                          .select('student_id');
                        if (updErr) throw updErr;
                        await refreshAll();
                        setSelected(null);
                        setNotice('وضعیت گزارش عضو به‌روزرسانی شد.');
                      }),
                      true,
                    )}
                  </View>
                );
              })()}
            </>
          )}

          {/* ==================== TAB 6: INVITES ==================== */}
          {tab === 'invites' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>ساخت دعوت‌نامهٔ اختصاصی آموزشی</Text>
              <Text style={s.subtitle}>
                کد یک‌بارمصرف با اعتبار ۷ روز. زبان‌آموز پیش از عضویت، نام شما را می‌بیند و با رضایت صریح پیشرفت خود را همگام می‌کند.
              </Text>
              <TextInput
                accessibilityLabel="عنوان دعوت"
                placeholder="مثلاً: گروه مکالمه پاییز — سارا احمدی"
                placeholderTextColor="#8B9AB0"
                maxLength={80}
                value={label}
                onChangeText={setLabel}
                style={s.input}
              />
              {button(
                'ساخت کد دعوت اختصاصی',
                () => void task(async () => {
                  const { error: insErr } = await adminClient().from('education_invites').insert({ label: label.trim() });
                  if (insErr) throw insErr;
                  setLabel('');
                  await refreshAll();
                  setNotice('دعوت‌نامه ساخته شد؛ کد را کپی کرده و به زبان‌آموز بدهید.');
                }),
                false,
                !label.trim(),
              )}

              {!invites.length && (
                <Text style={s.emptyText}>هنوز دعوت‌نامه‌ای ثبت نشده است.</Text>
              )}

              {invites.map(inv => {
                const expired = Date.parse(inv.expires_at) < Date.now();
                return (
                  <View key={inv.id} style={s.inviteRow}>
                    <View style={s.sectionHead}>
                      <Text style={s.cardTitle}>{inv.label}</Text>
                      <Text style={[s.badge, inv.claimed_at ? { backgroundColor: '#E8F6EF', color: '#15803D' } : expired ? { backgroundColor: '#FEF2F2', color: '#B42318' } : undefined]}>
                        {inv.claimed_at ? 'مصرف‌شده' : expired ? 'منقضی‌شده' : 'آماده استفاده'}
                      </Text>
                    </View>
                    <Text selectable style={s.code}>{inv.code}</Text>
                    <View style={s.sectionHead}>
                      <Text style={s.small}>پایان اعتبار: {formatDateFa(inv.expires_at)}</Text>
                      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            void copyTextSafe(inv.code).then(ok => {
                              if (ok) setNotice(`کد دعوت «${inv.label}» کپی شد.`);
                            });
                          }}
                          style={s.ghostBtn}
                        >
                          <Copy size={14} color="#1769D2" />
                          <Text style={s.actionText}>کپی کد</Text>
                        </Pressable>
                        {!inv.claimed_at && button(
                          'لغو دعوت',
                          () => void task(async () => {
                            const { error: delErr } = await adminClient().from('education_invites').delete().eq('id', inv.id);
                            if (delErr) throw delErr;
                            await refreshAll();
                            setNotice('دعوت‌نامه لغو شد.');
                          }),
                          true,
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ==================== TAB 8: LOGIN APP 3-LANGUAGE CONTENT CATALOG ==================== */}
          {tab === 'content' && (
            <>
              <View style={s.card}>
                <View style={s.sectionHead}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }}>
                    <Layers size={18} color="#1769D2" />
                    <Text style={s.cardTitle}>کاتالوگ ۳ زبان اپ زبان‌آموز با لاگین</Text>
                  </View>
                  <Text style={s.badge}>۳۳۵ درس · ۹٬۱۰۵ جمله</Text>
                </View>
                <Text style={s.subtitle}>
                  اپ زبان‌آموز با لاگین منحصراً شامل ۳ زبان انگلیسی، آلمانی و ترکی استانبولی است (بدون روسی) و از تب «دسترسی زبان‌ها» قابل فعال/غیرفعال‌سازی زنده است.
                </Text>

                {ALL_COURSES_CATALOG.map(course => (
                  <View key={course.id} style={s.contentRow}>
                    <View style={[s.levelDot, { backgroundColor: course.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentName}>{course.title}</Text>
                      <Text style={s.small}>{course.edition} · مسیر ورود: {course.route}</Text>
                    </View>
                    <Text style={s.badge}>{fa(course.lessons)} درس · {fa(course.sentences)} جمله</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        resetPopupForm();
                        setPopupTitle(`شروع دورهٔ ${course.title}`);
                        setPopupBadge('پیشنهاد آموزشی');
                        setPopupBody(`بیش از ${fa(course.sentences)} جملهٔ کاربردی در ${fa(course.lessons)} درس گام‌به‌گام آمادهٔ تمرین شماست.`);
                        setPopupCtaLabel('ورود به دوره');
                        setPopupCtaUrl(course.route);
                        setPopupTargetEdition('all');
                        setTab('popups');
                        setNotice(`قالب پاپ‌آپ معرفی «${course.title}» در استودیو بارگذاری شد.`);
                      }}
                      style={s.ghostBtn}
                    >
                      <Megaphone size={13} color="#1769D2" />
                      <Text style={s.actionText}>معرفی با پاپ‌آپ</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              {(() => {
                const { COURSE_LEVELS, SENTENCE_LESSONS } = require('@/lib/courseContent') as typeof import('@/lib/courseContent');
                return (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>سرفصل سطوح دورهٔ انگلیسی ({fa(SENTENCE_LESSONS.length)} درس · ۵۰۴ واژه مرجع)</Text>
                    {COURSE_LEVELS.map(l => (
                      <View key={l.id} style={s.contentRow}>
                        <View style={[s.levelDot, { backgroundColor: l.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.studentName}>{l.title}</Text>
                          <Text style={s.small}>{l.description}</Text>
                        </View>
                        <Text style={s.badge}>{fa(SENTENCE_LESSONS.filter(x => x.levelId === l.id).length)} درس</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </>
          )}

          <View style={s.footer}>
            <ShieldCheck size={16} color="#7A899B" />
            <Text style={s.small}>
              کنسول مدیریت واقعی Milo • بدون دسترسی به پیام‌های خصوصی کاربران • همگام‌سازی زنده با Supabase
            </Text>
          </View>
          {Constants.expoConfig?.extra?.appRole !== 'admin' && (
            button('بازگشت به اپ آموزشی', () => router.replace('/languages' as never), true)
          )}
        </ScrollView>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F8FD' },
  checkingScreen: { flex: 1, backgroundColor: '#F4F8FD', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  checkingText: { fontFamily: 'Vazir-Medium', fontSize: 13, color: '#334E68', textAlign: 'center' },
  ghostBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, backgroundColor: '#EAF4FF' },
  actionText: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#1769D2' },
  deleteBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FDECEC' },
  deleteText: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#B42318' },
  shell: { flex: 1, flexDirection: 'row-reverse' },
  content: { flex: 1 },
  sidebar: { width: 268, backgroundColor: '#FFFFFF', padding: 20, gap: 16, borderLeftWidth: 1, borderColor: '#DDE9F7', shadowColor: '#1D4E89', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: -4, height: 0 }, elevation: 3 },
  sidebarMobile: { width: 90, paddingHorizontal: 6, paddingVertical: 10, gap: 7, borderLeftWidth: 1 },
  brand: { flexDirection: 'row-reverse', gap: 11, alignItems: 'center' },
  brandMobile: { flexDirection: 'column', gap: 6, justifyContent: 'center' },
  brandTitle: { fontFamily: 'Vazir-Bold', fontSize: 15, color: '#102A56', textAlign: 'right' },
  mobileBrandTitle: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#102A56', textAlign: 'center' },
  logo: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#1769D2', alignItems: 'center', justifyContent: 'center', shadowColor: '#1769D2', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  logoMobile: { width: 36, height: 36, borderRadius: 11 },
  navLabel: { fontFamily: 'Vazir', fontSize: 11, color: '#98A3B2', textAlign: 'right' },
  navLabelMobile: { textAlign: 'center', fontSize: 8, marginTop: 1 },
  navList: { gap: 6 },
  navListMobile: { gap: 5 },
  navItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, minHeight: 46, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14 },
  navActive: { backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#C9DFFF' },
  navIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  navBadge: { position: 'absolute', top: -6, left: -10, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#1769D2', paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  navBadgeText: { fontFamily: 'Vazir-Bold', fontSize: 8, color: '#FFFFFF' },
  navText: { fontFamily: 'Vazir-Medium', fontSize: 12, color: '#64748B', textAlign: 'right' },
  navTextActive: { fontFamily: 'Vazir-Bold', color: '#1769D2' },
  mobileNavItem: { minHeight: 54, paddingHorizontal: 3, paddingVertical: 5, flexDirection: 'column', justifyContent: 'center', gap: 3 },
  mobileNavText: { fontFamily: 'Vazir', fontSize: 8, lineHeight: 12, textAlign: 'center' },
  mobileLogout: { minHeight: 48, paddingHorizontal: 3, paddingVertical: 5, flexDirection: 'column', justifyContent: 'center', gap: 3, borderTopWidth: 1, borderColor: '#E3ECF7', borderRadius: 12 },
  privacy: { backgroundColor: '#F2F7FD', padding: 14, gap: 8, borderRadius: 16, alignItems: 'flex-end' },
  main: { padding: 28, gap: 18, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  mainMobile: { paddingHorizontal: 8, paddingVertical: 9, gap: 9 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderRadius: 22, borderWidth: 1, borderColor: '#D7E7FA', padding: 20, shadowColor: '#2D6FB7', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  headerMobile: { padding: 11, borderRadius: 15, gap: 8 },
  headerRightGroup: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  eyebrow: { fontFamily: 'Vazir', fontSize: 9, color: '#64748B', textAlign: 'right', marginBottom: 4 },
  title: { fontFamily: 'Vazir-Bold', fontSize: 18, color: '#102A56', textAlign: 'right' },
  titleMobile: { fontSize: 14, lineHeight: 22 },
  subtitle: { fontFamily: 'Vazir', fontSize: 10, color: '#52667C', textAlign: 'right', lineHeight: 19 },
  pill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#D7E7FA' },
  pillMobile: { paddingHorizontal: 8, paddingVertical: 5 },
  liveGreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  pillText: { fontFamily: 'Vazir-Bold', fontSize: 9, color: '#1E293B' },
  refreshBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9DFFF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 },
  refreshBtnText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#1769D2' },
  stats: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  stat: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE9F7', padding: 11, borderRadius: 14, flex: 1, minWidth: 115, gap: 4, shadowColor: '#2D6FB7', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  statLabel: { fontFamily: 'Vazir', fontSize: 10, color: '#64748B', textAlign: 'right' },
  statNumber: { fontFamily: 'Vazir-Bold', fontSize: 16, color: '#102A56', textAlign: 'right' },
  small: { fontFamily: 'Vazir', fontSize: 9, color: '#64748B', textAlign: 'right', lineHeight: 16 },
  inlineLink: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#1769D2' },
  hero: { padding: 16, borderRadius: 18, flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  heroTitle: { fontFamily: 'Vazir-Bold', fontSize: 14, color: '#FFFFFF', textAlign: 'right', marginBottom: 4 },
  heroText: { fontFamily: 'Vazir', fontSize: 10, color: '#DBEAFE', textAlign: 'right', lineHeight: 18 },
  heroWhiteBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  heroWhiteBtnText: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#102A56' },
  heroOutlineBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  heroOutlineBtnText: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE9F7', borderRadius: 15, padding: 12, gap: 10, shadowColor: '#2D6FB7', shadowOpacity: 0.055, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardTitle: { fontFamily: 'Vazir-Bold', fontSize: 12, color: '#1E293B', textAlign: 'right' },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  toolbar: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  search: { flex: 1, minWidth: 135, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#F5F7FA', borderRadius: 9, paddingHorizontal: 9 },
  searchInput: { flex: 1, fontFamily: 'Vazir', fontSize: 10, textAlign: 'right', padding: 8, color: '#1E293B' },
  filters: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 },
  filter: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  studentRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 11, borderTopWidth: 1, borderColor: '#EDF1F5', flexWrap: 'wrap' },
  avatar: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Vazir-Bold', fontSize: 14, color: '#2878DE' },
  studentName: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#123E76', textAlign: 'right' },
  badge: { fontFamily: 'Vazir', fontSize: 9, color: '#1769D2', backgroundColor: '#EAF3FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, overflow: 'hidden' },
  track: { height: 5, backgroundColor: '#EDF2F6', borderRadius: 5, marginTop: 6, overflow: 'hidden', alignItems: 'flex-end' },
  fill: { height: 5, backgroundColor: '#2878DE', borderRadius: 5 },
  button: { backgroundColor: '#1769D2', minHeight: 40, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: '#F0F4F8' },
  buttonText: { fontFamily: 'Vazir-Bold', color: '#FFFFFF', fontSize: 11 },
  input: { fontFamily: 'Vazir', fontSize: 11, color: '#1E293B', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DCE5ED', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, textAlign: 'right' },
  ltr: { textAlign: 'left' },
  emailText: { fontFamily: 'Vazir', fontSize: 9, fontWeight: '700', color: '#64748B', textAlign: 'left', writingDirection: 'ltr' },
  label: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#334E68', textAlign: 'right', marginTop: 2 },
  loginPage: { flexGrow: 1, backgroundColor: '#EEF5FC', alignItems: 'center', justifyContent: 'center', padding: 18 },
  loginCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 26, width: '100%', maxWidth: 480, gap: 13, borderWidth: 1, borderColor: '#D7E7FA', shadowColor: '#2D6FB7', shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  loginTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  liveServerBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  liveServerText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#047857' },
  loginTitle: { fontFamily: 'Vazir-Bold', fontSize: 20, color: '#102A56', textAlign: 'right' },
  securityInfoBox: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, backgroundColor: '#F1F7FE', borderRadius: 12, padding: 11, borderWidth: 1, borderColor: '#D8E8FA' },
  error: { fontFamily: 'Vazir', color: '#B42318', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: 11, textAlign: 'right', lineHeight: 21, fontSize: 11 },
  notice: { fontFamily: 'Vazir', color: '#0F4C81', backgroundColor: '#EAF4FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 12, textAlign: 'right', borderRadius: 11, lineHeight: 20, fontSize: 11 },
  empty: { alignItems: 'center', padding: 18, gap: 8 },
  emptyText: { fontFamily: 'Vazir', fontSize: 10, color: '#8090A1', padding: 14, textAlign: 'center' },
  detail: { fontFamily: 'Vazir-Medium', color: '#1259B5', fontSize: 10, textAlign: 'right', lineHeight: 20 },
  inviteRow: { borderTopWidth: 1, borderColor: '#E7EDF4', paddingTop: 11, gap: 8 },
  code: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#1E3A8A', textAlign: 'left', padding: 9, backgroundColor: '#F3F7FB', borderRadius: 8, writingDirection: 'ltr' },
  contentRow: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderColor: '#EEF2F5' },
  levelDot: { width: 8, height: 28, borderRadius: 4 },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  schemaAlertCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 15, padding: 13, gap: 9 },
  primaryActionChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  primaryActionChipText: { fontFamily: 'Vazir-Bold', fontSize: 11, color: '#FFFFFF' },
  warnChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  warnChipText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#C2410C' },
  studioGrid: { gap: 12 },
  studioGridWide: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  chipsRow: { flexDirection: 'row-reverse', gap: 7, paddingVertical: 2 },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  templateChip: { backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#C9DFFF', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  templateChipText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#1769D2' },
  choiceChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  choiceChipActive: { backgroundColor: '#1769D2', borderColor: '#1769D2' },
  choiceChipText: { fontFamily: 'Vazir-Bold', fontSize: 10, color: '#334E68' },
  choiceChipTextActive: { color: '#FFFFFF' },
  routeChip: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  routeChipActive: { backgroundColor: '#EAF3FF', borderColor: '#93C5FD' },
  routeChipText: { fontFamily: 'Vazir', fontSize: 9, color: '#475569' },
  userPickerBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DCE5ED', borderRadius: 12, padding: 10, gap: 7 },
  userPickRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 8, borderRadius: 8, borderBottomWidth: 1, borderColor: '#EDF2F7' },
  userPickRowActive: { backgroundColor: '#EAF3FF' },
  previewPhoneStage: { backgroundColor: '#E2E8F0', borderRadius: 20, padding: 12, alignItems: 'center', justifyContent: 'center' },
  popupRecordCard: { borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 12, marginTop: 4, gap: 9 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusLive: { backgroundColor: '#DCFCE7' },
  statusPaused: { backgroundColor: '#FFEDD5' },
  statusPillText: { fontFamily: 'Vazir-Bold', fontSize: 9 },
  popupMetaChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  telemetryRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 9, borderWidth: 1, borderColor: '#E2E8F0' },
  telemetryBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 6 },
  telemetryValue: { fontFamily: 'Vazir-Bold', fontSize: 12, color: '#0F172A' },
  popupActionRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  langToggleCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    minWidth: 150,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  langToggleCardOn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  langToggleCardOff: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  publishPrimaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  publishPrimaryBtnText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
