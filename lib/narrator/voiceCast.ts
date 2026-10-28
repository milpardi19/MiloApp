import { loadAvailableVoices, speechTagFor, type SpeechVoiceInfo } from '@/lib/speechLanguage';

/**
 * The cast of the lesson narrator.
 *
 * The three learning tracks share one professional narrator per language: a
 * warm, clear female voice. Devices expose wildly different voices, so this
 * module ranks every installed voice and picks the one that actually sounds
 * like a friendly female teacher instead of a robotic operator.
 *
 * When the optional cloud narrator (`supabase/functions/narration-tts`) is
 * deployed, the same profiles are used to pick the human-sounding neural voice,
 * so the learner hears a consistent narrator on every platform.
 */

export type NarratorLocale = 'en-US' | 'de-DE' | 'ru-RU' | 'tr-TR';
export type NarratorSpeed = 'slow' | 'normal' | 'fast';

export const NARRATOR_LOCALES: readonly NarratorLocale[] = ['en-US', 'de-DE', 'ru-RU', 'tr-TR'];


export const SELECTED_NARRATOR_CAST: Record<NarratorLocale, { voiceId: string; locale: string; label: string }> = {
  'en-US': { voiceId: 'en-au-storyteller-4', locale: 'en-AU', label: 'English · Sydney native' },
  'de-DE': { voiceId: 'de-de-storyteller-1', locale: 'de-DE', label: 'Deutsch · native warm' },
  'ru-RU': { voiceId: 'Erinome', locale: 'ru-RU', label: 'Русский · clear female' },
  'tr-TR': { voiceId: 'tr-tr-teacher', locale: 'tr-TR', label: 'Türkçe · İstanbul native' },
};

export function selectedNarratorLabel(locale: NarratorLocale): string {
  return SELECTED_NARRATOR_CAST[locale].label;
}

/**
 * Strips pedagogic combining stress marks (U+0301 acute / U+0300 grave) that are
 * shown to learners on Russian words (e.g. «Приве́т», «молоко́», «хорошо́») while
 * preserving real Cyrillic letters such as «ё / Ё» and «й / Й» via NFC first.
 *
 * Sending raw U+0301 inside Cyrillic words breaks TTS lexicon lookup in
 * ElevenLabs, OpenAI and Web Speech, causing Russian words to be read with
 * unreduced English-like vowels instead of native Russian phonology.
 */
export function prepareTextForTts(text: string, locale?: string): string {
  const nfc = (text || '').normalize('NFC');
  if (!locale || locale.toLowerCase().startsWith('ru') || /[А-Яа-яЁё]/.test(nfc)) {
    return nfc.replace(/[\u0300\u0301]/g, '').replace(/\s+/g, ' ').trim();
  }
  return nfc.replace(/\s+/g, ' ').trim();
}

/** Names of voices that are recognisably female on Windows, Android, iOS and Chrome. */
const FEMININE_NAMES: Record<NarratorLocale, RegExp> = {
  'en-US': /(?:^|[^a-z])(?:aria|jenny|ava|emma|michelle|sonia|libby|natasha|clara|samantha|karen|moira|tessa|victoria|allison|susan|zoe|zira|hazel|serena|kate|stephanie|olivia|amy|joanna|salli|kimberly|ivy|kendra|nicole|female|woman|google us english|google uk english female)(?:$|[^a-z])/i,
  'de-DE': /(?:^|[^a-z])(?:amala|seraphina|katja|hedda|anna|petra|helena|marlene|vicki|ingrid|maja|steffi|eva|claudia|klarissa|louisa|google deutsch|female|frau|de-de-x-deb)(?:$|[^a-z])/i,
  'tr-TR': /(?:^|[^a-zçğıöşü])(?:emel|yelda|filiz|seda|aylin|ayşe|ayse|zeynep|merve|elif|selin|melis|esra|dilara|cemre|ipek|gizem|meltem|sevgi|defne|ecem|buse|türkçe|turkce|turkish|female|kadın|kadin|tr-tr-x-(?:trf|tmc|tmg|efu)|wavenet-[acd]|standard-[acd])(?:$|[^a-zçğıöşü])/i,
  'ru-RU': /(?:^|[^a-zа-яё])(?:svetlana|dariya|daria|milena|irina|anna|anastasia|anastasiya|elena|alyona|alena|maria|mariya|natalia|natalya|olga|oksana|oxana|yulia|julia|tatiana|tatyana|nina|vera|valentina|ekaterina|katya|polina|ksenia|google русский|female|женский|ru-ru-x-ruf)(?:$|[^a-zа-яё])/i,
};

/** Names that are clearly male; they are never chosen for the narrator. */
const MASCULINE_NAMES: Record<NarratorLocale, RegExp> = {
  'en-US': /(?:^|[^a-z])(?:alex|daniel|fred|arthur|aaron|guy|tom|ryan|brian|eric|matthew|joey|justin|david|mark|george|james|oliver|thomas|male|man|rocko|grandpa|ralph)(?:$|[^a-z])/i,
  'de-DE': /(?:^|[^a-z])(?:conrad|killian|bernd|markus|martin|hans|stefan|klaus|male|mann|de-de-x-deg)(?:$|[^a-z])/i,
  'tr-TR': /(?:^|[^a-zçğıöşü])(?:ahmet|tolga|mehmet|emre|burak|kerem|mustafa|ali|male|erkek|tr-tr-x-(?:trm|ama|cfs)|wavenet-[be]|standard-[be])(?:$|[^a-zçğıöşü])/i,
  'ru-RU': /(?:^|[^a-zа-яё])(?:yuri|yuriy|dmitri|dmitry|pavel|ivan|sergei|sergey|nikolai|igor|alexey|alexei|andrei|andrey|mikhail|oleg|vladimir|konstantin|male|мужской|ru-ru-x-rud)(?:$|[^a-zа-яё])/i,
};

/** Neural / cloud voices sound human; they outrank compact robotic engines. */
const NATURAL_QUALITY = /natural|neural|online|premium|enhanced|wavenet|studio|siri|google|multilingual|expressive|hd voice/i;
const LOW_QUALITY = /compact|espeak|eloquence|novelty|robotic|pico|festival/i;
/** Old SAPI/desktop engines: usable on a bare device, but never the first pick. */
const LEGACY_QUALITY = /microsoft (?:david|zira|mark|hazel|george|linda|richard|sean)/i;

/** Delivery is unhurried but never sluggish: a teacher reading to a learner. */
export const NARRATOR_PROSODY: Record<NarratorLocale, { rate: number; pitch: number; gapMs: number }> = {
  'en-US': { rate: 0.86, pitch: 1, gapMs: 85 },
  'de-DE': { rate: 0.84, pitch: 1, gapMs: 85 },
  'ru-RU': { rate: 0.84, pitch: 1, gapMs: 85 },
  'tr-TR': { rate: 0.86, pitch: 1, gapMs: 85 },
};

/** The cloud narrator uses the same persona in every language. */
export const NARRATOR_PERSONA_TAG = 'warm-female-teacher-v2';

function voiceText(voice: SpeechVoiceInfo): string {
  return `${voice.identifier} ${voice.name}`.toLowerCase();
}

export function isFeminineVoice(voice: SpeechVoiceInfo, locale: NarratorLocale): boolean {
  return FEMININE_NAMES[locale].test(voiceText(voice));
}

export function isMasculineVoice(voice: SpeechVoiceInfo, locale: NarratorLocale): boolean {
  return MASCULINE_NAMES[locale].test(voiceText(voice));
}

export function isNaturalVoice(voice: SpeechVoiceInfo): boolean {
  return NATURAL_QUALITY.test(voiceText(voice)) || String(voice.quality || '').toLowerCase() === 'enhanced';
}

function primaryLanguage(locale: string): string {
  return locale.replace(/_/g, '-').trim().toLowerCase().split('-')[0] || '';
}

/** Every candidate that speaks the requested language, regardless of accent. */
export function voicesForLocale(
  voices: readonly SpeechVoiceInfo[],
  locale: NarratorLocale,
): SpeechVoiceInfo[] {
  const target = primaryLanguage(locale);
  return voices.filter(voice => primaryLanguage(voice.language || '') === target);
}

export function scoreNarratorVoice(voice: SpeechVoiceInfo, locale: NarratorLocale): number {
  const hay = voiceText(voice);
  let score = 100;

  if (isFeminineVoice(voice, locale)) score += 120;
  if (isMasculineVoice(voice, locale)) score -= 200;
  if (NATURAL_QUALITY.test(hay)) score += 55;
  if (LOW_QUALITY.test(hay)) score -= 120;
  if (LEGACY_QUALITY.test(hay)) score -= 35;

  const normalized = locale.replace(/_/g, '-').toLowerCase();
  const voiceLanguage = (voice.language || '').replace(/_/g, '-').toLowerCase();
  if (voiceLanguage === normalized) score += 30;
  else if (!voiceLanguage.includes('-')) score += 8;

  return score;
}

/**
 * Ranks a device's voices for the narrator. Recognisably female natural voices
 * win; a male voice is only chosen when the device offers nothing else.
 */
export function pickNarratorVoice(
  voices: readonly SpeechVoiceInfo[],
  locale: NarratorLocale,
): SpeechVoiceInfo | undefined {
  const candidates = voicesForLocale(voices, locale);
  if (!candidates.length) return undefined;

  const scored = candidates
    .map(voice => ({ voice, score: scoreNarratorVoice(voice, locale) }))
    .sort((a, b) => b.score - a.score);

  const feminine = scored.filter(item => isFeminineVoice(item.voice, locale) && !isMasculineVoice(item.voice, locale));
  const nonMasculine = scored.filter(item => !isMasculineVoice(item.voice, locale));
  const pool = feminine.length ? feminine : nonMasculine.length ? nonMasculine : scored;
  return pool[0]?.voice;
}

/** `'Microsoft Aria Online (Natural) - English (United States)'` → `'Aria'`. */
export function narratorVoiceLabel(voice: SpeechVoiceInfo | undefined): string {
  if (!voice) return 'صدای پیش‌فرض دستگاه';
  let name = (voice.name || voice.identifier || '').replace(/^Microsoft\s+/i, '').trim();
  name = name.replace(/\s*-\s*[^-]*$/, '').trim();
  name = name.replace(/\s*\((?:Natural|Premium|Enhanced|Online|Neural)\)/gi, '').replace(/\s*\((?:[A-Za-z ]+)\)$/, '').trim();
  name = name.replace(/\s+(?:Online|Natural|Neural)$/i, '').trim();
  return name || 'صدای پیش‌فرض دستگاه';
}

export function narratorQualityLabel(voice: SpeechVoiceInfo | undefined): string {
  if (!voice) return 'دستگاه';
  if (isNaturalVoice(voice)) return 'طبیعی';
  return 'دستگاه';
}

const voiceCache = new Map<NarratorLocale, { voice?: SpeechVoiceInfo; label: string; quality: string }>();
let voicesLoaded = false;

/** Resolves (and caches) the narrator voice of the current device. */
export async function resolveNarratorVoice(
  locale: NarratorLocale,
): Promise<{ language: string; voice?: string; label: string; quality: string; voiceInfo?: SpeechVoiceInfo }> {
  const cached = voiceCache.get(locale);
  if (cached) {
    return {
      language: speechTagFor(locale),
      voice: cached.voice?.identifier,
      label: cached.label,
      quality: cached.quality,
      voiceInfo: cached.voice,
    };
  }

  const voices = await loadAvailableVoices();
  voicesLoaded = voices.length > 0;
  const picked = pickNarratorVoice(voices, locale);
  const entry = {
    voice: picked,
    label: narratorVoiceLabel(picked),
    quality: narratorQualityLabel(picked),
  };
  // Browsers publish their voice list asynchronously; never cache "no voice".
  if (picked) voiceCache.set(locale, entry);
  return {
    language: speechTagFor(locale),
    voice: picked?.identifier,
    label: entry.label,
    quality: entry.quality,
    voiceInfo: picked,
  };
}

export function narratorVoicesResolved(): boolean {
  return voicesLoaded;
}

/**
 * Splits a sentence into breath-sized pieces so device engines keep a natural
 * rhythm instead of rushing through a whole paragraph in one robotic burst.
 */
export function splitForNarration(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  // A lesson sentence is almost always short. Reading it as ONE utterance is
  // what makes the voice sound connected instead of stitched-together; only
  // genuinely long paragraphs are split, and then only at sentence ends.
  if (clean.length <= 320) return [clean];

  const parts = clean
    .split(/(?<=[.!?…؟])\s+/)
    .flatMap(part => (part.length > 220 ? part.split(/(?<=[,;:،—–])\s+/) : [part]))
    .map(part => part.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last && (last + ' ' + part).length <= 240) merged[merged.length - 1] = `${last} ${part}`;
    else merged.push(part);
  }
  return merged.length ? merged : [clean];
}

export const narratorRateFor = (locale: NarratorLocale, speed: NarratorSpeed): number => {
  const base = NARRATOR_PROSODY[locale].rate;
  if (speed === 'slow') return Math.max(0.6, Number((base * 0.84).toFixed(2)));
  if (speed === 'fast') return Math.min(1.1, Number((base * 1.16).toFixed(2)));
  return base;
};
