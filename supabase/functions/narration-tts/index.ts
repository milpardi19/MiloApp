// Professional lesson narrator — human-sounding female neural voice.
//
// The app asks this function for one sentence before reading it. When the
// function answers, the learner hears the approved cloud/CDN narrator in
// English, German, Russian and Turkish on every device and browser. The client never
// falls back to a device speech engine; a missing asset is reported clearly.
//
// Providers (first one that has a key wins, or set NARRATION_PROVIDER):
//   openai      OPENAI_API_KEY              gpt-4o-mini-tts, warm female voice
//   elevenlabs  ELEVENLABS_API_KEY          native-calibrated female neural TTS
//
// Deploy:  npx supabase functions deploy narration-tts --no-verify-jwt
// Secret:  npx supabase secrets set ELEVENLABS_API_KEY=...
// Optional: NARRATION_TTS_TOKEN (shared token), OPENAI_TTS_MODEL,
//           OPENAI_TTS_VOICE_EN / _DE / _RU / _TR,
//           ELEVENLABS_VOICE_EN / _DE / _RU / _TR,
//           ELEVENLABS_MODEL, ELEVENLABS_MODEL_RU.
//
// Privacy: only the lesson sentence is sent to the provider. No learner
// identity, no audio, no transcripts and no free-form chat reach this function.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

type LanguageCode = 'en' | 'de' | 'ru' | 'tr';

const VOICE_ENV: Record<LanguageCode, string> = {
  en: 'OPENAI_TTS_VOICE_EN',
  de: 'OPENAI_TTS_VOICE_DE',
  ru: 'OPENAI_TTS_VOICE_RU',
  tr: 'OPENAI_TTS_VOICE_TR',
};

const DEFAULT_OPENAI_VOICE: Record<LanguageCode, string> = {
  en: 'nova',
  de: 'coral',
  ru: 'coral',
  tr: 'coral',
};

const ELEVEN_VOICE_ENV: Record<LanguageCode, string> = {
  en: 'ELEVENLABS_VOICE_EN',
  de: 'ELEVENLABS_VOICE_DE',
  ru: 'ELEVENLABS_VOICE_RU',
  tr: 'ELEVENLABS_VOICE_TR',
};

// Premade voices available across ElevenLabs accounts:
// - English/German: Sarah (warm female voice)
// - Russian fallback (when no native Russian voice is added to the account yet):
//   Lily (pFZP5JQG7iQjIQuC4Bku) — soft European articulation without American
//   retroflex R, paired with eleven_turbo_v2_5 + language_code: "ru" and low
//   similarity_boost so Russian phonology dominates over English timbre.
const DEFAULT_ELEVEN_VOICE = 'EXAVITQu4vr4xnSDxMaL';
const DEFAULT_ELEVEN_EUROPEAN_FEMALE_VOICE = 'pFZP5JQG7iQjIQuC4Bku';

interface ElevenVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

const ELEVEN_VOICE_SETTINGS: Record<'en' | 'de', ElevenVoiceSettings> = {
  en: { stability: 0.50, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  de: { stability: 0.50, similarity_boost: 0.85, style: 0.16, use_speaker_boost: true },
};

const ELEVEN_RUSSIAN_NATIVE_SETTINGS: ElevenVoiceSettings = {
  stability: 0.55,
  similarity_boost: 0.80,
  style: 0.10,
  use_speaker_boost: true,
};

const ELEVEN_RUSSIAN_CROSSLINGUAL_SETTINGS: ElevenVoiceSettings = {
  stability: 0.62,
  similarity_boost: 0.42,
  style: 0.0,
  use_speaker_boost: false,
};

const ELEVEN_TURKISH_NATIVE_SETTINGS: ElevenVoiceSettings = {
  stability: 0.52,
  similarity_boost: 0.82,
  style: 0.14,
  use_speaker_boost: true,
};

const ELEVEN_TURKISH_CROSSLINGUAL_SETTINGS: ElevenVoiceSettings = {
  stability: 0.58,
  similarity_boost: 0.44,
  style: 0.0,
  use_speaker_boost: false,
};

const LANGUAGE_NAME: Record<LanguageCode, string> = {
  en: 'American English',
  de: 'Standard German (Hochdeutsch)',
  ru: 'Standard Russian',
  tr: 'Istanbul Turkish (İstanbul Türkçesi)',
};

const PERSONA = (lang: LanguageCode) =>
  `You are a warm, friendly native female ${LANGUAGE_NAME[lang]} teacher speaking one-to-one with an adult learner. ` +
  'Say the sentence exactly once, like a real human in a relaxed lesson: natural connected speech, ' +
  'authentic native phonology and vowel reduction, gentle intonation, and tiny natural pauses at punctuation. ' +
  (lang === 'tr'
    ? 'Use authentic native Istanbul Turkish pronunciation: crisp vowel harmony, exact distinction between ı and i, ö and o, ü and u, soft ğ vowel lengthening (never a hard g), natural ç and ş, and a light tapped Turkish r (never an American retroflex r). '
    : '') +
  'Never sound robotic, never use an English accent on non-English words, never read word by word. ' +
  'Read only the sentence you are given, exactly as written. Do not add, greet, explain, translate, emphasise or repeat.';

const MAX_TEXT = 320;
const CACHE_LIMIT = 160;
const cache = new Map<string, Uint8Array>();

type Provider = 'openai' | 'elevenlabs';

interface ResolvedElevenVoice {
  voiceId: string;
  isNativeVoice: boolean;
}

let cachedRussianVoice: { resolvedAt: number; value: ResolvedElevenVoice } | null = null;
let cachedTurkishVoice: { resolvedAt: number; value: ResolvedElevenVoice } | null = null;
const VOICE_DISCOVERY_TTL_MS = 30 * 60 * 1000;

function resolveProvider(): Provider | null {
  const configured = (Deno.env.get('NARRATION_PROVIDER') || '').toLowerCase();
  const hasOpenAI = Boolean(Deno.env.get('OPENAI_API_KEY'));
  const hasEleven = Boolean(Deno.env.get('ELEVENLABS_API_KEY'));
  if (configured === 'elevenlabs') return hasEleven ? 'elevenlabs' : null;
  if (configured === 'openai') return hasOpenAI ? 'openai' : null;
  if (hasEleven) return 'elevenlabs';
  if (hasOpenAI) return 'openai';
  return null;
}

function cacheGet(key: string): Uint8Array | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: Uint8Array): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
}

/**
 * Normalizes lesson text for TTS. Preserves precomposed Cyrillic letters such
 * as «ё / Ё» and «й / Й» via NFC first, then strips pedagogic combining stress
 * marks (U+0300 / U+0301) so Russian lexicon lookup and vowel reduction work.
 */
function normalizeText(raw: string | null, lang: LanguageCode): string {
  const nfc = (raw ?? '').normalize('NFC');
  const deStressed = lang === 'ru' || /[А-Яа-яЁё]/.test(nfc)
    ? nfc.replace(/[\u0300\u0301]/g, '')
    : nfc;
  return deStressed
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT + 1);
}

interface ElevenAccountVoice {
  voice_id?: string;
  name?: string;
  category?: string;
  labels?: Record<string, string | undefined>;
  verified_languages?: Array<{ language?: string; accent?: string; model_id?: string }>;
}

function scoreRussianAccountVoice(voice: ElevenAccountVoice): { score: number; native: boolean } {
  if (!voice.voice_id) return { score: -999, native: false };
  const labels = voice.labels ?? {};
  const gender = (labels.gender || '').toLowerCase();
  if (gender === 'male') return { score: -500, native: false };

  const langLabel = (labels.language || '').toLowerCase();
  const accentLabel = (labels.accent || '').toLowerCase();
  const descLabel = (labels.description || '').toLowerCase();
  const name = voice.name || '';
  const hasVerifiedRu = Boolean(
    voice.verified_languages?.some(item => (item.language || '').toLowerCase().startsWith('ru')),
  );
  const isRussianLabel =
    hasVerifiedRu ||
    langLabel === 'ru' ||
    langLabel === 'russian' ||
    accentLabel.includes('russian') ||
    /[А-Яа-яЁё]/.test(name);
  const isEnglishPremadeAccent = /\b(american|us|australian)\b/.test(accentLabel);
  const hasRussianFemaleName =
    !isEnglishPremadeAccent &&
    /\b(victoria|viktoria|anna|anastasia|elena|svetlana|irina|maria|natalia|natasha|ksenia|kseniya|polina|daria|nadia|olga|tatiana|tatyana|yulia|ekaterina|katya|sofia|alina|arina)\b/i.test(name);

  if (isRussianLabel || (hasRussianFemaleName && voice.category !== 'premade')) {
    let score = 200;
    if (hasVerifiedRu) score += 60;
    if (langLabel === 'ru' || accentLabel.includes('russian')) score += 50;
    if (gender === 'female') score += 30;
    if (voice.category !== 'premade') score += 20;
    if (/warm|calm|clear|soft|narration|conversational|teacher/.test(descLabel)) score += 10;
    return { score, native: true };
  }

  // Among premade voices, prefer neutral/European female voices over American voices.
  let fallbackScore = 0;
  if (voice.voice_id === DEFAULT_ELEVEN_EUROPEAN_FEMALE_VOICE) fallbackScore += 60; // Lily
  if (voice.voice_id === 'XB0fDUnXU5powFXDhCwa') fallbackScore += 55; // Charlotte (Swedish/European)
  if (voice.voice_id === 'Xb7hH8MSUJpSbSDYk0k2') fallbackScore += 45; // Alice
  if (gender === 'female') fallbackScore += 20;
  if (isEnglishPremadeAccent) fallbackScore -= 40;
  return { score: fallbackScore, native: false };
}

function scoreTurkishAccountVoice(voice: ElevenAccountVoice): { score: number; native: boolean } {
  if (!voice.voice_id) return { score: -999, native: false };
  const labels = voice.labels ?? {};
  const gender = (labels.gender || '').toLowerCase();
  if (gender === 'male') return { score: -500, native: false };

  const langLabel = (labels.language || '').toLowerCase();
  const accentLabel = (labels.accent || '').toLowerCase();
  const descLabel = (labels.description || '').toLowerCase();
  const name = voice.name || '';
  const hasVerifiedTr = Boolean(
    voice.verified_languages?.some(item => (item.language || '').toLowerCase().startsWith('tr')),
  );
  const isTurkishLabel =
    hasVerifiedTr ||
    langLabel === 'tr' ||
    langLabel === 'turkish' ||
    accentLabel.includes('turkish') ||
    accentLabel.includes('istanbul') ||
    /[çğıöşüÇĞİÖŞÜ]/.test(name);
  const isEnglishPremadeAccent = /\b(american|us|australian)\b/.test(accentLabel);
  const hasTurkishFemaleName =
    !isEnglishPremadeAccent &&
    /\b(aylin|yelda|filiz|seda|zeynep|elif|selin|merve|ayşe|ayse|dilara|ipek|melis|esra|cemre|gizem|meltem|sevgi|defne|ecem|buse|emel)\b/i.test(name);

  if (isTurkishLabel || (hasTurkishFemaleName && voice.category !== 'premade')) {
    let score = 200;
    if (hasVerifiedTr) score += 60;
    if (langLabel === 'tr' || accentLabel.includes('turkish') || accentLabel.includes('istanbul')) score += 50;
    if (gender === 'female') score += 30;
    if (voice.category !== 'premade') score += 20;
    if (/warm|calm|clear|soft|narration|conversational|teacher/.test(descLabel)) score += 10;
    return { score, native: true };
  }

  // Among premade voices, prefer neutral/European female voices without American retroflex R.
  let fallbackScore = 0;
  if (voice.voice_id === DEFAULT_ELEVEN_EUROPEAN_FEMALE_VOICE) fallbackScore += 60; // Lily
  if (voice.voice_id === 'XB0fDUnXU5powFXDhCwa') fallbackScore += 55; // Charlotte
  if (voice.voice_id === 'Xb7hH8MSUJpSbSDYk0k2') fallbackScore += 45; // Alice
  if (gender === 'female') fallbackScore += 20;
  if (isEnglishPremadeAccent) fallbackScore -= 40;
  return { score: fallbackScore, native: false };
}

async function resolveElevenLabsVoice(apiKey: string, lang: LanguageCode): Promise<ResolvedElevenVoice> {
  const explicit = (Deno.env.get(ELEVEN_VOICE_ENV[lang]) || '').trim();
  if (explicit) {
    return { voiceId: explicit, isNativeVoice: lang === 'ru' || lang === 'tr' };
  }
  if (lang !== 'ru' && lang !== 'tr') {
    return { voiceId: DEFAULT_ELEVEN_VOICE, isNativeVoice: false };
  }

  const now = Date.now();
  const cachedEntry = lang === 'ru' ? cachedRussianVoice : cachedTurkishVoice;
  if (cachedEntry && now - cachedEntry.resolvedAt < VOICE_DISCOVERY_TTL_MS) {
    return cachedEntry.value;
  }

  let resolved: ResolvedElevenVoice = {
    voiceId: DEFAULT_ELEVEN_EUROPEAN_FEMALE_VOICE,
    isNativeVoice: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3800);
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (response.ok) {
      const payload = (await response.json()) as { voices?: ElevenAccountVoice[] };
      const voices = Array.isArray(payload.voices) ? payload.voices : [];
      let bestScore = -999;
      for (const candidate of voices) {
        const { score, native } = lang === 'tr'
          ? scoreTurkishAccountVoice(candidate)
          : scoreRussianAccountVoice(candidate);
        if (score > bestScore && candidate.voice_id) {
          bestScore = score;
          resolved = { voiceId: candidate.voice_id, isNativeVoice: native };
        }
      }
    }
  } catch {
    // Scoped API keys without `voices_read` or transient timeouts safely use the premade fallback.
  } finally {
    clearTimeout(timer);
  }

  if (lang === 'ru') cachedRussianVoice = { resolvedAt: now, value: resolved };
  else cachedTurkishVoice = { resolvedAt: now, value: resolved };
  return resolved;
}

function modelSupportsLanguageCode(modelId: string): boolean {
  return /turbo_v2_5|flash_v2_5|eleven_v3/i.test(modelId);
}

function defaultElevenModelFor(lang: LanguageCode): string {
  if (lang === 'ru') {
    return Deno.env.get('ELEVENLABS_MODEL_RU') || Deno.env.get('ELEVENLABS_MODEL') || 'eleven_turbo_v2_5';
  }
  if (lang === 'tr') {
    return Deno.env.get('ELEVENLABS_MODEL_TR') || Deno.env.get('ELEVENLABS_MODEL') || 'eleven_turbo_v2_5';
  }
  return Deno.env.get('ELEVENLABS_MODEL') || 'eleven_multilingual_v2';
}

async function synthesizeOpenAI(apiKey: string, lang: LanguageCode, text: string, voice: string): Promise<Uint8Array> {
  const model = Deno.env.get('OPENAI_TTS_MODEL') || 'gpt-4o-mini-tts';
  const payload: Record<string, unknown> = {
    model,
    voice,
    input: text,
    response_format: 'mp3',
    speed: 1,
  };
  if (/gpt-4o/i.test(model)) payload.instructions = PERSONA(lang);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error('OpenAI narrator failed', response.status, (await response.text()).slice(0, 400));
    throw new Error('TTS_FAILED');
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function callElevenLabsTts(
  apiKey: string,
  voiceId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    },
  );
}

async function synthesizeElevenLabs(
  apiKey: string,
  lang: LanguageCode,
  text: string,
  resolvedVoice: ResolvedElevenVoice,
): Promise<Uint8Array> {
  const model = defaultElevenModelFor(lang);
  const voiceSettings: ElevenVoiceSettings = lang === 'ru'
    ? (resolvedVoice.isNativeVoice ? ELEVEN_RUSSIAN_NATIVE_SETTINGS : ELEVEN_RUSSIAN_CROSSLINGUAL_SETTINGS)
    : lang === 'tr'
      ? (resolvedVoice.isNativeVoice ? ELEVEN_TURKISH_NATIVE_SETTINGS : ELEVEN_TURKISH_CROSSLINGUAL_SETTINGS)
      : ELEVEN_VOICE_SETTINGS[lang];

  const primaryBody: Record<string, unknown> = {
    text,
    model_id: model,
    voice_settings: voiceSettings,
  };
  if (modelSupportsLanguageCode(model)) {
    primaryBody.language_code = lang;
    primaryBody.apply_text_normalization = 'on';
  }

  let response = await callElevenLabsTts(apiKey, resolvedVoice.voiceId, primaryBody);

  // Resilient fallback if a custom model rejects `language_code` or a voice id is unavailable.
  if (!response.ok && (response.status === 400 || response.status === 404 || response.status === 422)) {
    const fallbackVoiceId = response.status === 404 ? DEFAULT_ELEVEN_VOICE : resolvedVoice.voiceId;
    response = await callElevenLabsTts(apiKey, fallbackVoiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: voiceSettings,
    });
  }

  if (!response.ok) {
    console.error('ElevenLabs narrator failed', response.status, (await response.text()).slice(0, 400));
    throw new Error('TTS_FAILED');
  }
  return new Uint8Array(await response.arrayBuffer());
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  const url = new URL(request.url);
  const provider = resolveProvider();

  if (url.searchParams.get('health') === '1') {
    if (!provider) return json({ ok: false, code: 'NARRATION_NOT_CONFIGURED' }, 503);
    return json({
      ok: true,
      provider,
      model: provider === 'elevenlabs'
        ? Deno.env.get('ELEVENLABS_MODEL') || 'eleven_turbo_v2_5 (ru,tr) / eleven_multilingual_v2'
        : Deno.env.get('OPENAI_TTS_MODEL') || 'gpt-4o-mini-tts',
      persona: 'warm-female-teacher-v4-tr-ru-native',
      languages: ['en', 'de', 'ru', 'tr'],
    });
  }

  const expectedToken = Deno.env.get('NARRATION_TTS_TOKEN');
  if (expectedToken && url.searchParams.get('token') !== expectedToken) {
    return json({ error: 'Narrator token is invalid', code: 'NARRATION_TOKEN_INVALID' }, 401);
  }
  if (!provider) return json({ error: 'Narrator is not configured', code: 'NARRATION_NOT_CONFIGURED' }, 503);

  const langRaw = (url.searchParams.get('lang') || 'en').toLowerCase();
  if (!['en', 'de', 'ru', 'tr'].includes(langRaw)) {
    return json({ error: 'Unsupported narration language', code: 'UNSUPPORTED_LANGUAGE' }, 400);
  }
  const lang = langRaw as LanguageCode;
  const text = normalizeText(url.searchParams.get('text'), lang);
  if (!text) return json({ error: 'text is required', code: 'TEXT_REQUIRED' }, 400);
  if (text.length > MAX_TEXT) return json({ error: 'Sentence is too long', code: 'TEXT_TOO_LONG' }, 413);

  const elevenKey = Deno.env.get('ELEVENLABS_API_KEY') || '';
  const openAiKey = Deno.env.get('OPENAI_API_KEY') || '';
  const resolvedEleven = provider === 'elevenlabs'
    ? await resolveElevenLabsVoice(elevenKey, lang)
    : null;
  const voice = provider === 'elevenlabs'
    ? resolvedEleven!.voiceId
    : (Deno.env.get(VOICE_ENV[lang]) || DEFAULT_OPENAI_VOICE[lang]);
  const modelKey = provider === 'elevenlabs' ? defaultElevenModelFor(lang) : 'openai';
  const key = `v3|${provider}|${modelKey}|${voice}|${lang}|${text}`;

  const cached = cacheGet(key);
  if (cached) {
    return new Response(cached, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Narrator-Cache': 'hit',
        'X-Narrator-Voice': voice,
        'X-Narrator-Provider': provider,
      },
    });
  }

  try {
    const audio = provider === 'elevenlabs'
      ? await synthesizeElevenLabs(elevenKey, lang, text, resolvedEleven!)
      : await synthesizeOpenAI(openAiKey, lang, text, voice);

    if (!audio.byteLength) return json({ error: 'Empty narrator audio', code: 'TTS_EMPTY' }, 502);
    cacheSet(key, audio);

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Narrator-Cache': 'miss',
        'X-Narrator-Voice': voice,
        'X-Narrator-Provider': provider,
      },
    });
  } catch (error) {
    console.error('Narrator request failed', error);
    return json({ error: 'Narrator could not synthesize this sentence', code: 'TTS_FAILED' }, 502);
  }
});
