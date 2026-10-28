/**
 * Real-time calls and voice messages are enabled by product request. Recording
 * still starts only after an explicit tap and Android/iOS microphone permission;
 * voice-message objects remain private to conversation participants through the
 * existing Supabase Storage RLS policies.
 */
export const ONLINE_AUDIO_ENABLED = true;
export const ONLINE_AUDIO_DISABLED_MESSAGE = 'ارسال صوت در این نسخه در دسترس نیست.';

export function requireOnlineAudioEnabled(): void {
  if (!ONLINE_AUDIO_ENABLED) throw new Error(ONLINE_AUDIO_DISABLED_MESSAGE);
}
