import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'expo-router';
import { FEATURES, MANAGEMENT_BUILD } from '@/lib/features';
import {
  LANGUAGE_META,
  isBuildLanguageEnabled,
  type LanguageId,
  type LanguageMeta,
} from '@/lib/languages/catalogMeta';
import {
  DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
  LOGIN_APP_LANGUAGE_IDS,
  fetchLearnerLanguageAccess,
  subscribeLearnerLanguageAccess,
  type LoginAppLanguageId,
} from '@/lib/languageAccess';

interface LearnerLanguageAccessContextValue {
  allowedLanguages: readonly LanguageMeta[];
  isLanguageAllowed: (id: string | undefined) => boolean;
  allDisabledByAdmin: boolean;
  disabledMessage: string;
  loadingAccess: boolean;
  refreshAccess: () => Promise<void>;
}

const defaultValue: LearnerLanguageAccessContextValue = {
  allowedLanguages: LANGUAGE_META,
  isLanguageAllowed: (id: string | undefined) => (id ? isBuildLanguageEnabled(id) : false),
  allDisabledByAdmin: false,
  disabledMessage: DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE,
  loadingAccess: false,
  refreshAccess: async () => undefined,
};

const LearnerLanguageAccessContext = createContext<LearnerLanguageAccessContextValue>(defaultValue);

function detectCourseLanguageFromPathname(pathname: string): LanguageId | null {
  if (!pathname) return null;
  if (
    pathname === '/lang'
    || pathname.startsWith('/lang/')
    || pathname === '/course'
    || pathname.startsWith('/course/')
    || pathname === '/review'
    || pathname.startsWith('/review/')
    || pathname === '/placement'
    || pathname.startsWith('/learn/en')
  ) {
    return 'en';
  }
  if (pathname === '/learn/de' || pathname.startsWith('/learn/de/')) return 'de';
  if (pathname === '/learn/ru' || pathname.startsWith('/learn/ru/')) return 'ru';
  if (pathname === '/learn/tr' || pathname.startsWith('/learn/tr/')) return 'tr';
  return null;
}

export function LearnerLanguageAccessProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const enforced = !MANAGEMENT_BUILD && FEATURES.learnerLogin;

  const [enabledIds, setEnabledIds] = useState<readonly LoginAppLanguageId[]>(LOGIN_APP_LANGUAGE_IDS);
  const [disabledMessage, setDisabledMessage] = useState(DEFAULT_ALL_LANGUAGES_DISABLED_MESSAGE);
  const [loadingAccess, setLoadingAccess] = useState(enforced);
  const [syncedOnce, setSyncedOnce] = useState(!enforced);

  const refreshAccess = useCallback(async () => {
    if (!enforced) return;
    setLoadingAccess(true);
    try {
      const snap = await fetchLearnerLanguageAccess();
      setEnabledIds(snap.enabled);
      setDisabledMessage(snap.message);
      if (snap.ready) setSyncedOnce(true);
    } finally {
      setLoadingAccess(false);
    }
  }, [enforced]);

  useEffect(() => {
    if (!enforced) return;
    return subscribeLearnerLanguageAccess(snap => {
      setEnabledIds(snap.enabled);
      setDisabledMessage(snap.message);
      if (snap.ready) setSyncedOnce(true);
      setLoadingAccess(false);
    });
  }, [enforced]);

  const isLanguageAllowed = useCallback(
    (id: string | undefined): boolean => {
      if (!id || !isBuildLanguageEnabled(id)) return false;
      if (!enforced) return true;
      if (id === 'ru') return false;
      return enabledIds.includes(id as LoginAppLanguageId);
    },
    [enforced, enabledIds],
  );

  const allowedLanguages = useMemo(
    () => LANGUAGE_META.filter(lang => isLanguageAllowed(lang.id)),
    [isLanguageAllowed],
  );

  const allDisabledByAdmin = enforced && syncedOnce && allowedLanguages.length === 0;

  // Real-time active route guard: kick learner back to /languages immediately if
  // they are inside a build-disabled or Admin-disabled course.
  useEffect(() => {
    if (MANAGEMENT_BUILD) return;
    const activeLang = detectCourseLanguageFromPathname(pathname);
    if (!activeLang) return;
    if (!isLanguageAllowed(activeLang)) {
      router.replace('/languages' as never);
    }
  }, [pathname, isLanguageAllowed, router]);

  const value = useMemo<LearnerLanguageAccessContextValue>(
    () => ({
      allowedLanguages,
      isLanguageAllowed,
      allDisabledByAdmin,
      disabledMessage,
      loadingAccess,
      refreshAccess,
    }),
    [allowedLanguages, isLanguageAllowed, allDisabledByAdmin, disabledMessage, loadingAccess, refreshAccess],
  );

  return (
    <LearnerLanguageAccessContext.Provider value={value}>
      {children}
    </LearnerLanguageAccessContext.Provider>
  );
}

export function useLearnerLanguageAccess(): LearnerLanguageAccessContextValue {
  return useContext(LearnerLanguageAccessContext);
}
