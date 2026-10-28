import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useNavigationContainerRef, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, FontDisplay } from 'expo-font';
import { SplashScreen } from 'expo-router';
import Constants from 'expo-constants';
import { AppState, I18nManager, InteractionManager, Platform, Text, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider } from '@/components/KeyboardRuntime';
import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { registerNativeVoiceFetcher } from '@/lib/speechLanguage';

registerNativeVoiceFetcher(() => Speech.getAvailableVoicesAsync());
import { Inter_400Regular, Inter_600SemiBold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_700Bold, Vazirmatn_900Black } from '@expo-google-fonts/vazirmatn';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLockGate } from '@/components/AppLockGate';
import { ChatNotificationBridge } from '@/components/ChatNotificationBridge';
import { LearnerLanguageAccessProvider } from '@/components/LearnerLanguageAccess';
import { LearnerPopupBridge } from '@/components/LearnerPopupBridge';
import { RegistrationGate } from '@/components/RegistrationGate';
import { getPairingState, isOnboardingComplete } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/pairing';
import { RtlDirection } from '@/lib/theme';
import { useRealAgent } from '@/lib/useRealAgent';
import { warmSpeech } from '@/lib/responsiveSpeech';
import { FEATURES, RUSSIAN_ONLY_BUILD } from '@/lib/features';

// Android native mirroring is disabled in withStableLayoutDirection. Persian
// and course-language direction are applied explicitly, independent of device locale.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Keep typography metrics deterministic across OEM Android builds and user font
// scale settings. Accessibility labels remain available to screen readers.
type StableFontDefaults = { defaultProps?: Record<string, unknown> };
const stableText = Text as typeof Text & StableFontDefaults;
const stableInput = TextInput as typeof TextInput & StableFontDefaults;
stableText.defaultProps = {
  ...stableText.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
  includeFontPadding: false,
  textBreakStrategy: 'simple',
  android_hyphenationFrequency: 'none',
  style: [{ fontFamily: 'Vazir' }, (stableText.defaultProps as { style?: unknown } | undefined)?.style],
};
stableInput.defaultProps = {
  ...stableInput.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
  includeFontPadding: false,
};

SplashScreen.preventAutoHideAsync();

let startupChimePlayed = false;
const IS_ADMIN_APP = Constants.expoConfig?.extra?.appRole === 'admin'
  || process.env.EXPO_PUBLIC_MILO_ADMIN_APP === 'true';

function RuntimeGate() {
  const pathname = usePathname();
  // The multi-language learning app never mounts the legacy device runtime.
  if (!pathname.startsWith('/agent') && !pathname.startsWith('/permissions')) return null;
  return <CompanionRuntime />;
}

function CompanionRuntime() {
  const pathname = usePathname();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    Promise.all([getPairingState(), isOnboardingComplete()])
      .then(([pairing, complete]) => {
        setDeviceId(pairing?.deviceId ?? null);
        setEnabled(!!pairing && complete && isSupabaseConfigured());
      })
      .catch(() => {
        setDeviceId(null);
        setEnabled(false);
      });
  }, [pathname]);

  // Runs invisibly while the user studies: heartbeat, device status and
  // supported commands continue without exposing a complicated control UI.
  useRealAgent(deviceId, enabled);
  return null;
}

/**
 * Renders nothing, but its effect runs only once the sibling <Stack> has
 * actually mounted. RootLayout returns null until fonts load and AppLockGate
 * shows its own spinner until its config read resolves, so this is the
 * reliable signal that a navigator exists in the tree (useRootNavigationState
 * could already expose a `.key` before the container reported ready, which
 * made router.replace throw "Attempted to navigate before mounting the Root
 * Layout component").
 */
function NavigatorMountProbe({ onMounted }: { onMounted: () => void }) {
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    onMounted();
  }, [onMounted]);
  return null;
}

/**
 * Phone-2 companion only. There is no role chooser and no controller route in
 * this APK; it always boots into the companion connection screen.
 */
export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const pathname = usePathname();
  const navigationRef = useNavigationContainerRef();
  const [navigatorMounted, setNavigatorMounted] = useState(false);
  const handleNavigatorMounted = useCallback(() => setNavigatorMounted(true), []);
  const homeRoute = IS_ADMIN_APP
    ? '/admin'
    : RUSSIAN_ONLY_BUILD
      ? '/learn/ru'
      : '/languages';
  const pathnameRef = useRef(pathname);
  const wasBackgrounded = useRef(false);
  const startupRouteLocked = useRef(false);
  const [introComplete, setIntroComplete] = useState(Platform.OS === 'web');
  // `swap` is web-only: text paints immediately with a fallback face and the
  // custom font takes over when it finishes downloading, instead of staying
  // invisible (the default font-display:auto block period). Native ignores it.
  const swap = (font: number) => ({ uri: font, display: FontDisplay.SWAP }) as const;
  const [fontsLoaded, fontError] = useFonts({
    // Bundle Vazir locally so Persian typography and numerals stay identical
    // offline and independent of each Android manufacturer's system fonts.
    Vazir: swap(Vazirmatn_400Regular),
    'Vazir-Medium': swap(Vazirmatn_500Medium),
    'Vazir-Bold': swap(Vazirmatn_700Bold),
    'Vazir-Black': swap(Vazirmatn_900Black),
    // Latin teaching content uses bundled faces too, eliminating Android OEM
    // font and fallback-metric differences between phones.
    Inter: swap(Inter_400Regular),
    'Inter-SemiBold': swap(Inter_600SemiBold),
    'Inter-ExtraBold': swap(Inter_800ExtraBold),
    // Legacy aliases now resolve to Vazir too, preventing an old screen from
    // silently falling back to an OEM font.
    Lalezar: swap(Vazirmatn_400Regular),
    Vazirmatn: swap(Vazirmatn_400Regular),
    'Vazirmatn-Medium': swap(Vazirmatn_500Medium),
    'Vazirmatn-Bold': swap(Vazirmatn_700Bold),
  });

  useEffect(() => {
    // Keep the native splash visible until custom fonts are registered. Text
    // components apply Vazir globally, so rendering them earlier can crash Android.
    if (!fontsLoaded && !fontError) return;
    void SplashScreen.hideAsync();
    if (Platform.OS === 'web') {
      setIntroComplete(true);
      return;
    }
    if (startupChimePlayed) {
      setIntroComplete(true);
      return;
    }

    startupChimePlayed = true;
    setIntroComplete(true);
    if (IS_ADMIN_APP) return;

    InteractionManager.runAfterInteractions(() => {
      try {
        const player = createAudioPlayer(require('../assets/audio/welcome-chime.wav'));
        player.volume = 0.28;
        player.play();
        setTimeout(() => {
          try { player.remove(); } catch { /* ignore native audio cleanup races */ }
        }, 2500);
      } catch {
        // A device without playback support still opens the learner home.
      }
      if (FEATURES.englishCourse) setTimeout(() => warmSpeech('en-US'), 1200);
      if (FEATURES.germanCourse) setTimeout(() => warmSpeech('de-DE'), 2000);
    });
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const forceNavigateHome = useCallback(() => {
    setTimeout(() => {
      if (!navigationRef.isReady()) return;
      if (pathnameRef.current !== homeRoute) {
        router.replace(homeRoute as never);
      }
    }, 80);
  }, [homeRoute, navigationRef, router]);

  // Returning to the app after leaving it should always start from the same
  // language chooser/home, not the last nested lesson, library, or conversation.
  // Only a real background -> active transition triggers this; temporary native
  // dialogs and permission prompts do not reset navigation.
  useEffect(() => {
    if (Platform.OS === 'web' || !introComplete) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        wasBackgrounded.current = true;
        return;
      }
      if (state === 'active' && wasBackgrounded.current) {
        wasBackgrounded.current = false;
        if (navigationRef.isReady() && pathnameRef.current !== homeRoute) {
          router.replace(homeRoute as never);
        }
      }
    });
    return () => subscription.remove();
  }, [homeRoute, introComplete, navigationRef, router]);

  // Wait for our own Stack to be mounted before normalizing an Android-restored
  // route. AppLockGate/RegistrationGate can temporarily defer mounting the
  // Stack, and fonts keep RootLayout at `return null`; isReady() is the exact
  // readiness check expo-router performs before accepting a navigation call.
  useEffect(() => {
    if (!introComplete || !navigatorMounted || !navigationRef.isReady() || startupRouteLocked.current) return;
    startupRouteLocked.current = true;
    if (pathname !== homeRoute) router.replace(homeRoute as never);
  }, [homeRoute, introComplete, pathname, navigatorMounted, navigationRef, router]);

  // On web, AppState is unavailable — use page visibility instead so that
  // returning to the tab also starts from the home screen, not the last
  // lesson/library/conversation that was open before.
  useEffect(() => {
    if (Platform.OS !== 'web' || !introComplete) return;
    const onVisible = () => {
      if (
        document.visibilityState === 'visible'
        && navigationRef.isReady()
        && pathnameRef.current !== homeRoute
      ) {
        router.replace(homeRoute as never);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [homeRoute, introComplete, navigationRef, router]);

  // Native must wait for the registered faces: the global Vazir Text defaults
  // applied above can measure/crash before the font module is ready. On web
  // the @font-face rules are injected at startup with font-display:swap, so
  // gating the whole tree here would only delay first paint behind ~1.5MB of
  // font downloads; render immediately and let the faces swap in when ready.
  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
      <ErrorBoundary>
        <SafeAreaView style={{ flex: 1, ...RtlDirection }} edges={['top', 'bottom']}>
          <AppLockGate>
            <RegistrationGate onAuthenticated={forceNavigateHome}>
              <LearnerLanguageAccessProvider>
                {!IS_ADMIN_APP && <RuntimeGate />}
                <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                  <Stack.Screen name="index" />
                  <Stack.Screen name="admin/index" />
                  <Stack.Screen name="agent" />
                  <Stack.Screen name="permissions" />
                  <Stack.Screen name="app-lock" />
                  <Stack.Screen name="lang" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <NavigatorMountProbe onMounted={handleNavigatorMounted} />
                {(IS_ADMIN_APP || FEATURES.learnerLogin) && <ChatNotificationBridge />}
                {!IS_ADMIN_APP && FEATURES.learnerLogin && <LearnerPopupBridge />}
              </LearnerLanguageAccessProvider>
            </RegistrationGate>
          </AppLockGate>
          <StatusBar style="dark" />
        </SafeAreaView>
      </ErrorBoundary>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
