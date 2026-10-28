import * as Speech from '@/lib/narration';
import { NARRATION_ENABLED } from '@/lib/narration';
import { preloadSpeechVoices, registerNativeVoiceFetcher, resolveRequiredSpeechOptions, resolveSpeechOptions } from './speechLanguage';

registerNativeVoiceFetcher(() => Speech.getAvailableVoicesAsync());

export type SpeechLocale = 'en-US' | 'de-DE' | 'ru-RU';

const warmedLocales = new Set<SpeechLocale>();
const playCounts = new Map<string, number>();
let active = false;
let requestId = 0;

/**
 * Warms native/web voice metadata silently while the screen is loading so the
 * very first spoken German, Russian, or English phrase uses the native voice.
 */
export function warmSpeech(locale: SpeechLocale) {
  // Intentionally silent. The previous warm-up spoke "ready" and "bereit" aloud at startup.
  if (warmedLocales.has(locale)) return;
  warmedLocales.add(locale);
  void preloadSpeechVoices();
}

/** First press uses natural 1× speed; the second press of the same phrase uses 0.5×. */
function alternatingRate(locale: SpeechLocale, text: string) {
  const key = `${locale}:${text}`;
  const count = playCounts.get(key) ?? 0;
  playCounts.set(key, count + 1);
  return count % 2 === 0 ? 1 : 0.5;
}

export function playResponsiveSpeech({
  text,
  locale,
  rate,
  onDone,
  onError,
}: {
  text: string;
  locale: SpeechLocale;
  rate?: number;
  onDone?: () => void;
  onError?: () => void;
}) {
  // Narration is off across the three language tracks: nothing is spoken and
  // no error is reported for a voice that is intentionally not used.
  if (!NARRATION_ENABLED) return;
  const currentRequest = ++requestId;
  const selectedRate = rate ?? alternatingRate(locale, text);
  const start = async () => {
    if (currentRequest !== requestId) return;
    const targetVoice = locale === 'de-DE'
      ? await resolveRequiredSpeechOptions(locale)
      : await resolveSpeechOptions(locale);
    if (currentRequest !== requestId) return;
    if (!targetVoice) {
      onError?.();
      return;
    }
    active = true;
    Speech.speak(text, {
      ...targetVoice,
      rate: selectedRate,
      onDone: () => {
        if (currentRequest === requestId) active = false;
        onDone?.();
      },
      onStopped: () => {
        if (currentRequest === requestId) active = false;
      },
      onError: () => {
        if (currentRequest === requestId) active = false;
        onError?.();
      },
    });
  };

  if (active) {
    void Speech.stop().catch(() => undefined).finally(() => { void start(); });
  } else {
    void start();
  }

  return selectedRate;
}

export function stopResponsiveSpeech() {
  requestId += 1;
  active = false;
  return Speech.stop();
}
