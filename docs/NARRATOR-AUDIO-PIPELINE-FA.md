# راهنمای ساده و حرفه‌ای تولید صوت درس‌ها

این سند توضیح می‌دهد چطور برای تمام جمله‌های انگلیسی، آلمانی و روسی فایل صوتی بسازیم، آن‌ها را بررسی کنیم، روی CDN بگذاریم و در اپ با سرعت بالا و حتی بدون اینترنت پخش کنیم.

## اول یک نکتهٔ خیلی مهم

شناسه‌هایی که برای نمونه‌های صدا انتخاب کردیم، مثل `en-au-storyteller-4` و `de-de-storyteller-1`، شناسه‌های کاتالوگ نمونه‌سازی هستند. این شناسه‌ها الزاماً شناسهٔ قابل استفاده در OpenAI یا ElevenLabs نیستند.

پس دو حالت داریم:

1. اگر دقیقاً همان فایل‌های نمونه و همان صدا را می‌خواهیم، باید فایل‌های صوتی را تولید کنیم و به‌صورت فایل ثابت روی CDN بگذاریم.
2. اگر می‌خواهیم صدا در لحظه با API ساخته شود، باید برای همان سرویس یک Voice ID واقعی انتخاب کنیم و آن را در Secretهای سرویس قرار دهیم.

برای کیفیت ثابت درس‌ها، حالت اول بهتر است: **هر جمله یک‌بار تولید، بررسی و منتشر شود.** Edge Function فقط برای فایل‌هایی باشد که هنوز در CDN نیستند.

مستندات OpenAI می‌گوید endpoint تولید صوت می‌تواند MP3، Opus، AAC، WAV و چند فرمت دیگر بدهد و زبان متن ورودی را پشتیبانی می‌کند؛ صداهای داخلی آن بیشتر برای انگلیسی بهینه شده‌اند. [OpenAI Text to Speech](https://developers.openai.com/api/docs/guides/text-to-speech)

ElevenLabs برای تولید چندزبانه، مدل Multilingual v2 و همچنین دیکشنری تلفظ دارد؛ برای کلمات تخصصی این قابلیت ارزشمند است. [ElevenLabs Create Speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

## تصویر سادهٔ سیستم

```text
محتوای درس‌ها
    ↓
فهرست جمله‌ها با id و language
    ↓
اسکریپت تولید دسته‌ای
    ↓
OpenAI یا ElevenLabs
    ↓
کنترل فایل و بازبینی native
    ↓
Supabase Storage یا S3
    ↓
CDN
    ↓
اپلیکیشن
```

اپلیکیشن نباید هر بار از API صوتی بخواهد جمله را بسازد. این کار هم کند است، هم هزینه دارد، هم ممکن است یک جمله در دو روز مختلف با لحن کمی متفاوت تولید شود.

## مرحلهٔ ۱: ساخت فهرست جمله‌ها

هر جمله باید یک شناسهٔ ثابت داشته باشد. متن را با شناسهٔ تصادفی عوض نکنید؛ چون اگر متن اصلاح شد، باید فایل جدید ساخته شود.

نمونهٔ `audio-manifest.json`:

```json
{
  "version": 3,
  "sentences": [
    {
      "id": "de-pre-a1-lesson-001-s001",
      "language": "de",
      "locale": "de-DE",
      "text": "Guten Morgen! Wie geht es dir?",
      "voiceProfile": "de-de-storyteller-1",
      "audioVersion": 1,
      "status": "approved",
      "audio": {
        "mp3": "https://cdn.example.com/lesson-audio/v3/de/de-pre-a1-lesson-001-s001.1.mp3",
        "opus": "https://cdn.example.com/lesson-audio/v3/de/de-pre-a1-lesson-001-s001.1.opus",
        "durationMs": 2140,
        "sha256": "..."
      },
      "pronunciation": {
        "status": "native_reviewed",
        "ipa": "/ˈɡuːtn̩ ˈmɔʁɡn̩ viː ɡeːt ɛs diːɐ̯/"
      }
    }
  ]
}
```

وضعیت جمله باید این مسیر را طی کند:

```text
draft → generated → machine_checked → native_review → approved → published
```

اپلیکیشن فقط `approved` و `published` را پخش کند.

## مرحلهٔ ۲: اسکریپت تولید دسته‌ای

این اسکریپت نمونه یک فهرست JSON می‌خواند، برای جمله‌های منتشرنشده صدا می‌سازد، فایل را در پوشهٔ خروجی می‌نویسد و در صورت خطا دوباره تلاش می‌کند.

فایل پیشنهادی: `scripts/generate-narration.mjs`

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const INPUT = process.env.NARRATION_INPUT || 'audio-manifest.json';
const OUT_DIR = process.env.NARRATION_OUT || 'generated-audio';
const PROVIDER = (process.env.NARRATION_PROVIDER || 'elevenlabs').toLowerCase();
const MAX_RETRIES = 4;
const CONCURRENCY = Number(process.env.NARRATION_CONCURRENCY || 3);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;

if (PROVIDER === 'openai' && !OPENAI_KEY) throw new Error('OPENAI_API_KEY is missing');
if (PROVIDER === 'elevenlabs' && !ELEVEN_KEY) throw new Error('ELEVENLABS_API_KEY is missing');

const languageToLocale = { en: 'en-US', de: 'de-DE', ru: 'ru-RU' };

// این‌ها باید Voice ID واقعی همان سرویس باشند، نه شناسهٔ کاتالوگ نمونه‌ها.
const voices = {
  en: process.env.ELEVENLABS_VOICE_EN,
  de: process.env.ELEVENLABS_VOICE_DE,
  ru: process.env.ELEVENLABS_VOICE_RU,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(task, label) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const delay = Math.min(30_000, 800 * 2 ** attempt);
      console.warn(`${label}: attempt ${attempt + 1} failed; retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function createOpenAiAudio(sentence) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env[`OPENAI_TTS_VOICE_${sentence.language.toUpperCase()}`] || 'coral',
      input: sentence.text,
      response_format: 'mp3',
      speed: 1,
      instructions:
        `Read only this ${languageToLocale[sentence.language]} lesson sentence. ` +
        'Use natural connected speech, clear pronunciation, gentle warmth, and natural pauses. ' +
        'Do not translate, explain, repeat, or add words.',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function createElevenLabsAudio(sentence) {
  const voiceId = voices[sentence.language];
  if (!voiceId) throw new Error(`Missing ElevenLabs voice for ${sentence.language}`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: sentence.text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.8,
          style: 0.28,
          use_speaker_boost: true,
        },
        // اگر دیکشنری تلفظ دارید، اینجا locatorهای واقعی سرویس را قرار دهید.
        pronunciation_dictionary_locators: sentence.pronunciationDictionaryLocators || [],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateOne(sentence) {
  const folder = path.join(OUT_DIR, sentence.language);
  await mkdir(folder, { recursive: true });
  const target = path.join(folder, `${sentence.id}.mp3`);

  try {
    await readFile(target);
    console.log(`SKIP ${sentence.id} — file already exists`);
    return { ...sentence, status: 'generated', localFile: target };
  } catch {
    // File does not exist; generate it below.
  }

  const audio = await withRetry(
    () => PROVIDER === 'elevenlabs'
      ? createElevenLabsAudio(sentence)
      : createOpenAiAudio(sentence),
    sentence.id,
  );

  if (!audio.length) throw new Error(`${sentence.id}: empty audio response`);
  await writeFile(target, audio);
  console.log(`OK   ${sentence.id}`);
  return { ...sentence, status: 'generated', localFile: target };
}

async function mapWithConcurrency(items, worker, limit) {
  const results = [];
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

const manifest = JSON.parse(await readFile(INPUT, 'utf8'));
const pending = manifest.sentences.filter(item => item.status !== 'published');
const generated = await mapWithConcurrency(pending, generateOne, CONCURRENCY);

await writeFile(
  `${INPUT}.generated.json`,
  JSON.stringify({ ...manifest, sentences: generated }, null, 2) + '\n',
);
console.log(`Generated ${generated.length} files. Review them before publishing.`);
```

### اجرای اسکریپت

کلیدها را در ترمینال بگذارید، نه در GitHub و نه در اپلیکیشن:

```bash
export NARRATION_PROVIDER=elevenlabs
export ELEVENLABS_API_KEY='کلید واقعی سرویس'
export ELEVENLABS_VOICE_EN='Voice ID واقعی انگلیسی'
export ELEVENLABS_VOICE_DE='Voice ID واقعی آلمانی'
export ELEVENLABS_VOICE_RU='Voice ID واقعی روسی'
export NARRATION_CONCURRENCY=3
node scripts/generate-narration.mjs
```

هم‌زمان فقط ۲ تا ۴ درخواست بفرستید. تعداد خیلی زیاد ممکن است باعث محدودیت نرخ یا خطای موقت شود. ابتدا با ۳ جملهٔ هر زبان آزمایش کنید، سپس کل دوره را اجرا کنید.

## مرحلهٔ ۳: کنترل تلفظ تخصصی

قبل از ساخت فایل صوتی، برای کلمه‌های حساس یک واژه‌نامه داشته باشید:

```json
{
  "language": "de",
  "term": "Photosynthese",
  "spokenForm": "Photosynthese",
  "ipa": "/fotozʏnˈteːzə/",
  "notes": "تکیه روی بخش te"
}
```

برای هر کلمهٔ تخصصی این چهار کار را انجام دهید:

1. متن را متخصص موضوع بررسی کند.
2. یک native speaker همان زبان متن و تلفظ را بررسی کند.
3. فایل تولیدشده با صدای بلند گوش داده شود.
4. فقط بعد از تأیید هر دو نفر، وضعیت `approved` شود.

تکیه بر صدای مدل به‌تنهایی کافی نیست. هیچ سرویس TTS تضمین صددرصدی برای همهٔ نام‌ها، اختصارها و واژه‌های تخصصی نمی‌دهد.

## مرحلهٔ ۴: بررسی فنی فایل‌ها

بعد از تولید، فایل‌ها را با `ffprobe` بررسی کنید:

```bash
for file in generated-audio/*/*.mp3; do
  ffprobe -v error \
    -show_entries format=duration,size \
    -of default=noprint_wrappers=1 "$file" || exit 1
done
```

فایل خالی، خیلی کوتاه، خیلی طولانی یا خراب نباید منتشر شود. برای پخش وب، MP3 با کیفیت ۹۶ یا ۱۲۸ کیلوبیت انتخاب ساده و سازگار است. اگر CDN شما Opus را خوب پشتیبانی می‌کند، Opus برای اینترنت کم‌سرعت کوچک‌تر است؛ MP3 را به‌عنوان fallback نگه دارید.

## مرحلهٔ ۵: تنظیم Edge Function

Edge Function فعلی پروژه در این مسیر است:

```text
supabase/functions/narration-tts/index.ts
```

نقش آن این است:

- متن را محدود و تمیز کند.
- زبان را فقط به `en`، `de` یا `ru` محدود کند.
- Secret را از محیط Supabase بخواند.
- به OpenAI یا ElevenLabs درخواست بدهد.
- فایل صوتی را با `Content-Type: audio/mpeg` برگرداند.
- برای پاسخ قابل کش، هدر immutable بفرستد.

نمونهٔ سادهٔ هستهٔ تابع:

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const MAX_TEXT = 320;

function cleanText(value: string | null): string {
  return (value || '')
    .replace(/[\\u0000-\\u001F\\u007F]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return json({ error: 'GET only' }, 405);

  const url = new URL(request.url);
  const lang = (url.searchParams.get('lang') || 'en').toLowerCase();
  const text = cleanText(url.searchParams.get('text'));

  if (!['en', 'de', 'ru'].includes(lang)) return json({ error: 'Unsupported language' }, 400);
  if (!text) return json({ error: 'Text is required' }, 400);
  if (text.length > MAX_TEXT) return json({ error: 'Text is too long' }, 413);

  const provider = Deno.env.get('NARRATION_PROVIDER') || 'elevenlabs';
  const apiKey = provider === 'elevenlabs'
    ? Deno.env.get('ELEVENLABS_API_KEY')
    : Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error: 'Narration provider is not configured' }, 503);

  // در پروژهٔ واقعی این قسمت باید همان synthesizeElevenLabs یا synthesizeOpenAI
  // موجود در index.ts فعلی باشد.
  const audio = provider === 'elevenlabs'
    ? await synthesizeElevenLabs(apiKey, lang, text)
    : await synthesizeOpenAI(apiKey, lang, text);

  return new Response(audio, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
```

در App2 نسخهٔ کامل‌تر همین الگو از قبل در `index.ts` وجود دارد؛ لازم نیست آن را با نمونهٔ کوتاه بالا جایگزین کنید. نمونهٔ کوتاه فقط برای فهم نقش تابع است.

### ثبت Secretها

Supabase می‌گوید Secretها را باید در پروژهٔ Supabase ثبت کرد و با `Deno.env.get` خواند؛ فایل `.env` نباید commit شود. [Supabase Secrets](https://supabase.com/docs/guides/functions/secrets)

```bash
npx supabase link --project-ref YOUR_PROJECT_REF

npx supabase secrets set \
  NARRATION_PROVIDER=elevenlabs \
  ELEVENLABS_API_KEY='کلید واقعی' \
  ELEVENLABS_MODEL=eleven_multilingual_v2 \
  ELEVENLABS_VOICE_EN='Voice ID انگلیسی' \
  ELEVENLABS_VOICE_DE='Voice ID آلمانی' \
  ELEVENLABS_VOICE_RU='Voice ID روسی' \
  NARRATION_TTS_TOKEN='یک توکن طولانی و تصادفی'

npx supabase functions deploy narration-tts --no-verify-jwt
```

Edge Functions در Supabase با TypeScript/Deno اجرا می‌شوند و برای اتصال به سرویس‌های بیرونی مناسب‌اند. برای کار طولانی و تولید هزاران فایل، بهتر است از اسکریپت batch یا worker استفاده شود، نه یک درخواست طولانی Edge Function. [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### تست سلامت

```bash
curl -i \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/narration-tts?health=1'
```

باید پاسخ شبیه این باشد:

```json
{
  "ok": true,
  "provider": "elevenlabs",
  "languages": ["en", "de", "ru"]
}
```

## مرحلهٔ ۶: کش CDN

نام فایل را تغییرناپذیر بسازید:

```text
lesson-audio/v3/en/en-foundation-001-s001.1.mp3
lesson-audio/v3/de/de-pre-a1-001-s001.1.mp3
lesson-audio/v3/ru/ru-foundation-001-s001.1.mp3
```

وقتی تلفظ اصلاح شد، فایل قبلی را overwrite نکنید. نسخهٔ جدید بسازید:

```text
...s001.1.mp3
...s001.2.mp3
```

هدر پیشنهادی:

```http
Content-Type: audio/mpeg
Cache-Control: public, max-age=31536000, immutable
Accept-Ranges: bytes
Access-Control-Allow-Origin: https://YOUR_APP_DOMAIN
X-Content-Type-Options: nosniff
```

`immutable` زمانی مناسب است که URL شامل نسخه یا hash باشد و فایل در همان URL تغییر نکند. این الگو از درخواست‌های اضافه برای بررسی دوباره جلوگیری می‌کند. [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

## مرحلهٔ ۷: Preload در اپ

ترتیب درست این است:

```text
وقتی درس باز شد: فایل جملهٔ فعلی را آماده کن.
هم‌زمان: فقط جملهٔ بعدی را preload کن.
وقتی جمله عوض شد: جملهٔ بعدی جدید را preload کن.
بیش از ۲ تا ۳ فایل را هم‌زمان دانلود نکن.
```

در App2، `lib/narrator/cloudNarrator.ts` همین مسیر را آغاز کرده است. تابع `prefetchCloudNarration` قبل از پخش درخواست را گرم می‌کند و `HTMLAudioElement` یا `expo-audio` فایل را پخش می‌کند.

برای جلوگیری از دانلود دوباره، یک cache محلی لازم است. در وب می‌توان از Cache Storage استفاده کرد:

```ts
const AUDIO_CACHE = 'lesson-audio-v3';

export async function cacheAudio(url: string): Promise<void> {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(AUDIO_CACHE);
  const existing = await cache.match(url);
  if (existing) return;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Audio download failed: ${response.status}`);
  await cache.put(url, response.clone());
}

export async function getCachedAudio(url: string): Promise<Response> {
  if (typeof caches === 'undefined') return fetch(url);
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (response.ok) await cache.put(url, response.clone());
  return response;
}
```

Cache Storage ماندگار است، اما فضای آن محدود است و سیستم‌عامل ممکن است در شرایط کمبود فضا cache را پاک کند. همچنین Cache API خودش به‌طور خودکار طبق هدر HTTP منقضی نمی‌شود؛ باید نسخهٔ cache را خودمان مدیریت کنیم. [MDN Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

برای Service Worker:

```js
const AUDIO_CACHE = 'lesson-audio-v3';

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!url.pathname.includes('/lesson-audio/')) return;

  event.respondWith((async () => {
    const cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      return cached || new Response('', { status: 503 });
    }
  })());
});
```

برای فایل‌های صوتی بزرگ، همهٔ دوره را یک‌باره دانلود نکنید. بهتر است کاربر یک دکمهٔ «دانلود این درس برای آفلاین» داشته باشد. آن دکمه فقط فایل‌های همان درس را دانلود کند و progress نشان دهد.

## مرحلهٔ ۸: آفلاین در موبایل Expo

در موبایل باید فایل را در FileSystem ذخیره کنیم. ایدهٔ ساده:

```ts
import * as FileSystem from 'expo-file-system';

const AUDIO_DIR = `${FileSystem.cacheDirectory}lesson-audio-v3/`;

export async function downloadForOffline(url: string, key: string) {
  await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  const localUri = `${AUDIO_DIR}${key}.mp3`;
  const info = await FileSystem.getInfoAsync(localUri);
  if (!info.exists) {
    await FileSystem.downloadAsync(url, localUri);
  }
  return localUri;
}
```

برای فایل‌هایی که کاربر صریحاً برای آفلاین نگه می‌دارد، بهتر است از محل پایدارتر مناسب نسخهٔ Expo پروژه استفاده شود، نه فقط cache موقت. قبل از پخش، اول `localUri` را بررسی کنید و اگر نبود، URL CDN را بدهید.

## بهترین سیاست preload برای App2

برای هر درس:

```text
ورود به درس:
- Manifest درس را دریافت کن.
- جملهٔ فعلی را دانلود یا از cache بخوان.
- جملهٔ بعدی را در پس‌زمینه دانلود کن.

در زمان پخش:
- پخش از local cache یا CDN.
- دو جملهٔ بعدی را در صف preload بگذار.
- اگر کاربر جمله را عوض کرد، درخواست‌های قدیمی را لغو کن.

خروج از درس:
- صدای در حال پخش را متوقف کن.
- فایل‌های کامل‌شده را نگه دار.
- فایل‌های نیمه‌دانلود را حذف کن.
```

## ترتیب اجرای واقعی برای پروژه

1. ابتدا ۳ جمله از هر زبان را تولید کنید.
2. هر ۹ فایل را با native speaker بررسی کنید.
3. Edge Function را با یک Secret واقعی تست کنید.
4. همان ۹ فایل را روی CDN بگذارید.
5. `EXPO_PUBLIC_NARRATOR_CDN_URL` را در build تنظیم کنید.
6. یک درس کوتاه را در وب و موبایل تست کنید.
7. سپس تولید همهٔ جمله‌ها را با concurrency برابر ۳ اجرا کنید.
8. بعد از بازبینی، وضعیت‌ها را به `approved` و `published` تغییر دهید.
9. در پایان، یک نسخهٔ جدید از Manifest را منتشر کنید.

## نتیجهٔ خیلی ساده

اسکریپت تولید، صدا را می‌سازد. Edge Function، درخواست‌های کوچک و فوری را مدیریت می‌کند. CDN، فایل‌های آماده را سریع به کاربر می‌رساند. Cache و preload باعث می‌شوند جملهٔ بعدی قبل از تمام‌شدن جملهٔ فعلی آماده باشد. برای آفلاین هم فقط درس انتخاب‌شده را روی دستگاه ذخیره می‌کنیم.

هیچ کلید API را داخل اپ، GitHub یا فایل `.env` ریشه commit نکنید. Secretهای تولیدی باید در Supabase ثبت شوند؛ مستندات رسمی Supabase همین روش را توصیه می‌کند. [Supabase Function Secrets](https://supabase.com/docs/guides/functions/secrets)
