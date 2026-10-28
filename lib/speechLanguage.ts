import { Platform } from 'react-native';

export type SpeechVoiceInfo = {
  identifier: string;
  name: string;
  language: string;
  quality?: string;
};

type NativeVoiceFetcher = () => Promise<SpeechVoiceInfo[]>;

let nativeVoiceFetcher: NativeVoiceFetcher | null = null;

export function registerNativeVoiceFetcher(fetcher: NativeVoiceFetcher): void {
  nativeVoiceFetcher = fetcher;
  cachedVoices = null;
}

/**
 * Normalizes a BCP-47 speech locale for the current platform's TTS engine.
 *
 * On Android, `expo-speech` constructs `java.util.Locale(language)` with a single
 * string argument instead of `Locale.forLanguageTag(language)`, causing hyphenated
 * tags like `"de-DE"` to become an invalid `Locale("de-de", "")` and silently fall
 * back to `Locale.getDefault()` (an English US operator reading German words!).
 * Passing primary ISO-639 code `"de"` on Android yields a valid `Locale("de")`
 * while pairing with an explicit native `de-DE` `voice` identifier selected below.
 */
export function speechTagFor(locale: string, os: string = Platform.OS): string {
  const normalized = locale.replace(/_/g, '-').trim();
  if (os === 'android') return normalized.split('-')[0].toLowerCase();
  return normalized;
}

function getWebSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
    return null;
  }
  return window.speechSynthesis;
}

let cachedVoices: SpeechVoiceInfo[] | null = null;
let pendingVoicesPromise: Promise<SpeechVoiceInfo[]> | null = null;
let webListenerAttached = false;

function readWebVoicesSync(): SpeechVoiceInfo[] {
  const synth = getWebSynthesis();
  if (!synth || typeof synth.getVoices !== 'function') return [];
  if (!webListenerAttached && typeof synth.addEventListener === 'function') {
    webListenerAttached = true;
    synth.addEventListener('voiceschanged', () => {
      cachedVoices = null;
    });
  }
  const raw = synth.getVoices() || [];
  return raw.map(v => ({
    identifier: v.voiceURI || '',
    name: v.name,
    language: v.lang,
    quality: v.localService ? 'Enhanced' : 'Default',
  }));
}

/**
 * Browsers publish their voice list asynchronously. Reading it too early used
 * to return nothing, so the first (and sometimes only) sentence was spoken by
 * the browser's default voice — often a robotic system voice in the wrong
 * language. Wait briefly for the real list before choosing a voice.
 */
function waitForWebVoices(timeoutMs = 700): Promise<SpeechVoiceInfo[]> {
  const engine = getWebSynthesis();
  if (!engine || typeof engine.getVoices !== 'function') return Promise.resolve([]);
  const synth = engine;
  const immediate = readWebVoicesSync();
  if (immediate.length > 0) return Promise.resolve(immediate);
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(finish, timeoutMs);
    function finish() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', onChange);
      }
      resolve(readWebVoicesSync());
    }
    function onChange() {
      if (readWebVoicesSync().length > 0) finish();
    }
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onChange);
    }
    // A few engines fill the list on the next tick without firing an event.
    setTimeout(onChange, 140);
  });
}

export async function loadAvailableVoices(): Promise<SpeechVoiceInfo[]> {
  if (Platform.OS === 'web') {
    let voices = readWebVoicesSync();
    if (voices.length === 0) voices = await waitForWebVoices();
    if (voices.length > 0) cachedVoices = voices;
    return voices;
  }
  if (cachedVoices && cachedVoices.length > 0) {
    return cachedVoices;
  }
  if (!nativeVoiceFetcher) {
    return [];
  }
  if (!pendingVoicesPromise) {
    const fetcher = nativeVoiceFetcher;
    pendingVoicesPromise = Promise.race([
      fetcher().catch(() => [] as SpeechVoiceInfo[]),
      new Promise<SpeechVoiceInfo[]>(resolve => setTimeout(() => resolve([]), 800)),
    ]).then(voices => {
      if (voices.length > 0) cachedVoices = voices;
      pendingVoicesPromise = null;
      return voices;
    });
  }
  return pendingVoicesPromise;
}

/**
 * Ranks available TTS voices for a target BCP-47 locale (e.g., `'de-DE'`, `'ru-RU'`, `'en-US'`),
 * strictly rejecting wrong-language operators and strongly preferring native local voices
 * (high-quality on-device neural voices in Germany German `de-DE`, Russian `ru-RU`, US English `en-US`).
 */
export function scoreVoiceForLocale(voice: SpeechVoiceInfo, targetLocale: string): number {
  const voiceLang = (voice.language || '').replace(/_/g, '-').trim().toLowerCase();
  const target = targetLocale.replace(/_/g, '-').trim().toLowerCase();
  const [targetPrimary, targetRegion] = target.split('-');
  if (!voiceLang || !targetPrimary) return -1;

  const [voicePrimary, voiceRegion] = voiceLang.split('-');
  if (voicePrimary !== targetPrimary) return -1;

  let score = 100;
  if (targetRegion && voiceRegion === targetRegion) {
    score += 50;
  } else if (!voiceRegion) {
    score += 20;
  }

  const hay = `${voice.identifier} ${voice.name}`.toLowerCase();

  // Strongly prefer local / on-device neural voices over remote network voices.
  if (hay.includes('-local') || hay.includes('_local') || hay.includes('local')) score += 30;
  if (hay.includes('-network') || hay.includes('online')) score -= 10;

  if (String(voice.quality || '').toLowerCase() === 'enhanced') score += 25;

  if (
    hay.includes('anna') ||
    hay.includes('petra') ||
    hay.includes('markus') ||
    hay.includes('helena') ||
    hay.includes('martin') ||
    hay.includes('katja') ||
    hay.includes('conrad') ||
    hay.includes('de-de-x-') ||
    hay.includes('german') ||
    hay.includes('deutsch') ||
    hay.includes('milena') ||
    hay.includes('yuri') ||
    hay.includes('irina') ||
    hay.includes('pavel') ||
    hay.includes('russian') ||
    hay.includes('samantha')
  ) {
    score += 18;
  }

  if (hay.includes('compact') || hay.includes('espeak') || hay.includes('novelty')) {
    score -= 25;
  }

  return score;
}

function russianVoiceLabel(voice: SpeechVoiceInfo): string {
  return `${voice.identifier} ${voice.name}`.toLowerCase();
}

function isRecognizablyFeminineRussianVoice(voice: SpeechVoiceInfo): boolean {
  return /(?:^|[^a-zа-яё])(?:female|feminine|ru-ru-x-ruf|irina|anna|anastasia|anastasiya|elena|alyona|alena|maria|mariya|milena|natalia|natalya|svetlana|olga|oksana|oxana|daria|darya|yulia|julia|tatiana|tatyana|nina|vera|valentina|ekaterina|katya|ирина|анна|анастасия|елена|алёна|алена|мария|милена|наталья|светлана|ольга|оксана|дарья|юлия|татьяна|нина|вера|валентина|екатерина|катя)(?:$|[^a-zа-яё])/i.test(russianVoiceLabel(voice));
}

function isRecognizablyMasculineRussianVoice(voice: SpeechVoiceInfo): boolean {
  return /(?:^|[^a-zа-яё])(?:male|masculine|ru-ru-x-rud|yuri|yuriy|pavel|ivan|dmitri|dmitry|sergei|sergey|nikolai|igor|alexey|alexei|andrei|andrey|mikhail|oleg|vladimir|konstantin|юрий|павел|иван|дмитрий|сергей|николай|игорь|алексей|андрей|михаил|олег|владимир|константин)(?:$|[^a-zа-яё])/i.test(russianVoiceLabel(voice));
}

export function selectBestVoiceForLocale(
  voices: readonly SpeechVoiceInfo[],
  targetLocale: string,
): SpeechVoiceInfo | undefined {
  let candidates = voices;
  if (targetLocale.replace(/_/g, '-').toLowerCase().split('-')[0] === 'ru') {
    const matchingVoices = voices.filter(voice => scoreVoiceForLocale(voice, targetLocale) >= 0);
    const feminineVoices = matchingVoices.filter(isRecognizablyFeminineRussianVoice);
    if (feminineVoices.length > 0) {
      // A named female Russian voice takes priority over device quality scores.
      candidates = feminineVoices;
    } else {
      const voicesWithoutKnownMasculineNames = matchingVoices.filter(voice => !isRecognizablyMasculineRussianVoice(voice));
      // If gender is not clearly exposed, avoid a voice explicitly named as male
      // whenever the device offers another Russian voice.
      if (voicesWithoutKnownMasculineNames.length > 0) candidates = voicesWithoutKnownMasculineNames;
    }
  }

  let best: SpeechVoiceInfo | undefined;
  let bestScore = -1;
  for (const voice of candidates) {
    const s = scoreVoiceForLocale(voice, targetLocale);
    if (s > bestScore) {
      bestScore = s;
      best = voice;
    }
  }
  return best;
}

export function preloadSpeechVoices(): void {
  void loadAvailableVoices();
}

/**
 * Returns optimal options (`{ language, voice }`) for `Speech.speak(...)`.
 * Never passes an empty or unmatched `voice` string (which on Web causes `expo-speech`
 * to fall back to `voices[0]`, typically English!).
 */
export async function resolveSpeechOptions(
  targetLocale: string,
): Promise<{ language: string; voice?: string }> {
  const language = speechTagFor(targetLocale);
  const voices = await loadAvailableVoices();
  const chosen = selectBestVoiceForLocale(voices, targetLocale);
  if (chosen?.identifier) {
    return { language, voice: chosen.identifier };
  }
  return { language };
}

/** Resolve only a voice verified to match the requested language; never let the
 * device silently substitute its default (often English) voice for German. */
export async function resolveRequiredSpeechOptions(
  targetLocale: string,
): Promise<{ language: string; voice: string } | null> {
  const voices = await loadAvailableVoices();
  const normalizedTarget = targetLocale.replace(/_/g, '-').toLowerCase();
  const matchingLocale = voices.filter(voice =>
    (voice.language || '').replace(/_/g, '-').toLowerCase() === normalizedTarget
    && !/network|online/i.test(`${voice.identifier} ${voice.name}`),
  );

  // On Android the platform exposes explicit local/network voice identifiers.
  // Refuse a network voice (or the device-default English voice) instead of
  // silently letting the TTS engine substitute it for German.
  const onDeviceVoices = Platform.OS === 'android'
    ? matchingLocale.filter(voice => /local/i.test(`${voice.identifier} ${voice.name}`))
    : Platform.OS === 'web'
      ? matchingLocale.filter(voice => String(voice.quality || '').toLowerCase() === 'enhanced')
      : matchingLocale;

  // The user selected the feminine German sample. Prefer a local de-DE voice
  // identifiable as feminine; avoid a clearly masculine voice when the device
  // exposes gendered German voice names. Unknown naming schemes remain eligible.
  const germanVoiceNames = (voice: SpeechVoiceInfo) => `${voice.identifier} ${voice.name}`.toLowerCase();
  const feminineGermanVoice = /anna|petra|katja|helena|marlene|vicki|female|de-de-x-deb/;
  const masculineGermanVoice = /markus|martin|conrad|hans|male|de-de-x-deg/;
  const feminineVoices = targetLocale.toLowerCase() === 'de-de'
    ? onDeviceVoices.filter(voice => feminineGermanVoice.test(germanVoiceNames(voice)))
    : [];
  const safeGermanVoices = targetLocale.toLowerCase() === 'de-de'
    ? onDeviceVoices.filter(voice => !masculineGermanVoice.test(germanVoiceNames(voice)))
    : onDeviceVoices;
  const preferredVoices = feminineVoices.length ? feminineVoices : safeGermanVoices;
  const chosen = selectBestVoiceForLocale(preferredVoices, targetLocale);
  if (!chosen?.identifier) return null;
  return { language: speechTagFor(targetLocale), voice: chosen.identifier };
}
