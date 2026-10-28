import * as ExpoSpeech from 'expo-speech';

/**
 * Single narration switch for the English, German and Russian learning tracks.
 *
 * Narration is ON again: the professional lesson narrator (`lib/narrator/*`)
 * reads the current sentence automatically when a lesson opens, and every
 * speaker control in the three tracks plays a voice.
 *
 * Keeping the switch here means the voice can still be muted from one line
 * without touching any screen.
 */
export const NARRATION_ENABLED = true;

export type SpeechOptions = Parameters<typeof ExpoSpeech.speak>[1];
export type Voice = ExpoSpeech.Voice;

type StopHandler = () => void;
const stopHandlers = new Set<StopHandler>();

/**
 * Cloud narration plays through the audio player, not through `expo-speech`.
 * Screens call `Speech.stop()` before every new sentence, so the narrator
 * registers its own cleanup here to stay in sync with that single call.
 */
export function registerNarrationStopHandler(handler: StopHandler): () => void {
  stopHandlers.add(handler);
  return () => {
    stopHandlers.delete(handler);
  };
}

/** Speak the text only when narration is enabled; otherwise stay silent. */
export function speak(text: string, options?: SpeechOptions): void {
  if (!NARRATION_ENABLED) return;
  const nfc = (text || '').normalize('NFC');
  const cleanText = /[А-Яа-яЁё]/.test(nfc) ? nfc.replace(/[\u0300\u0301]/g, '') : nfc;
  void ExpoSpeech.speak(cleanText, options);
}

/** Stop any narration that may still be playing. Safe when nothing plays. */
export function stop(): Promise<void> {
  for (const handler of stopHandlers) {
    try {
      handler();
    } catch {
      // A narrator cleanup must never break a lesson screen.
    }
  }
  return ExpoSpeech.stop();
}

export const getAvailableVoicesAsync = ExpoSpeech.getAvailableVoicesAsync;
export const isSpeakingAsync = ExpoSpeech.isSpeakingAsync;
export const pause = ExpoSpeech.pause;
export const resume = ExpoSpeech.resume;
