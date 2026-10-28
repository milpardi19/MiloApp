#!/usr/bin/env node
/**
 * Verification for the professional lesson narrator (English, German, Russian).
 *
 * The real narrator modules are bundled with esbuild — with react-native,
 * AsyncStorage, expo-audio and expo-speech replaced by small controllable
 * stubs — and executed in Node. This checks the two promises the feature makes:
 *
 *   1. voice selection always prefers a warm female neural voice per language;
 *   2. sentences are read automatically, once, and stop cleanly when another
 *      speaker control interrupts.
 *
 * It also exercises the optional cloud narrator path end to end with a stubbed
 * health check and audio element.
 *
 * Run: npm run validate:narrator
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const STUBS = path.join(HERE, 'test-stubs');
const TMP = path.join(APP, 'node_modules', '.cache', 'narrator-test');
mkdirSync(TMP, { recursive: true });

let esbuild;
try {
  esbuild = await import('esbuild');
} catch {
  console.log('SKIPPED — esbuild is required for this check: npm install -D esbuild');
  process.exit(0);
}

const SPEECH_STUB = `
export const getAvailableVoicesAsync = async () => globalThis.__VOICES__ || [];
export const speak = (text, options = {}) => {
  (globalThis.__SPEECH_CALLS__ ||= []).push({ text, options });
  globalThis.__SPEAKING__ = true;
  setTimeout(() => {
    globalThis.__SPEAKING__ = false;
    options.onDone?.();
  }, globalThis.__SPEECH_DURATION_MS__ ?? 25);
};
export const stop = async () => {
  globalThis.__SPEAKING__ = false;
  (globalThis.__STOPS__ ||= []).push(Date.now());
};
export const pause = () => {};
export const resume = () => {};
export const isSpeakingAsync = async () => !!globalThis.__SPEAKING__;
`;

const FILESYSTEM_STUB = `
export const cacheDirectory = 'file:///cache/';
export const makeDirectoryAsync = async () => {};
export const getInfoAsync = async () => ({ exists: false, size: 0 });
export const downloadAsync = async (uri, fileUri) => ({ status: 200, uri: fileUri });
export const deleteAsync = async () => {};
`;

const AUDIO_STUB = `
export const setAudioModeAsync = async () => {};
export const createAudioPlayer = () => ({
  playing: true,
  playbackRate: 1,
  play() {},
  pause() {},
  remove() {},
  addListener() { return { remove() {} }; },
});
`;

const ENTRY = `
export {
  pickNarratorVoice,
  splitForNarration,
  narratorRateFor,
  narratorVoiceLabel,
  scoreNarratorVoice,
  prepareTextForTts,
} from '@/lib/narrator/voiceCast';
export {
  narrate,
  stopNarration,
  getNarratorSnapshot,
  setNarratorAuto,
  setNarratorSpeed,
  primeNarrator,
} from '@/lib/narrator/engine';
export * as Speech from '@/lib/narration';
`;

async function bundle(name, env) {
  const entryPath = path.join(TMP, 'entry', `${name}.ts`);
  mkdirSync(path.dirname(entryPath), { recursive: true });
  writeFileSync(entryPath, ENTRY);
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    logLevel: 'silent',
    absWorkingDir: APP,
    define: {
      'process.env.EXPO_PUBLIC_NARRATOR_CLOUD': JSON.stringify(env.cloud),
      'process.env.EXPO_PUBLIC_NARRATION_TTS_URL': JSON.stringify(env.ttsUrl ?? ''),
      'process.env.EXPO_PUBLIC_NARRATION_TTS_TOKEN': JSON.stringify(''),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(env.supabaseUrl ?? 'https://test-project.supabase.co'),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    },
    plugins: [
      {
        name: 'narrator-stubs',
        setup(b) {
          b.onResolve({ filter: /^@\// }, args => {
            const base = path.join(APP, args.path.slice(2));
            const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
            const hit = candidates.find(candidate => existsSync(candidate));
            return hit ? { path: hit } : { errors: [{ text: `Cannot resolve ${args.path}` }] };
          });
          b.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: path.join(STUBS, 'async-storage.js') }));
          b.onResolve({ filter: /^react-native$/ }, () => ({ path: path.join(STUBS, 'react-native.js') }));
          b.onResolve({ filter: /^expo-speech$/ }, () => ({ path: 'speech-stub.js', namespace: 'narrator' }));
          b.onResolve({ filter: /^expo-audio$/ }, () => ({ path: 'audio-stub.js', namespace: 'narrator' }));
          b.onResolve({ filter: /^expo-file-system\/legacy$/ }, () => ({ path: 'filesystem-stub.js', namespace: 'narrator' }));
          b.onLoad({ filter: /^speech-stub\.js$/, namespace: 'narrator' }, () => ({ contents: SPEECH_STUB, loader: 'js' }));
          b.onLoad({ filter: /^audio-stub\.js$/, namespace: 'narrator' }, () => ({ contents: AUDIO_STUB, loader: 'js' }));
          b.onLoad({ filter: /^filesystem-stub\.js$/, namespace: 'narrator' }, () => ({ contents: FILESYSTEM_STUB, loader: 'js' }));
        },
      },
    ],
  });
  const outFile = path.join(TMP, `${name}.mjs`);
  writeFileSync(outFile, result.outputFiles[0].text);
  return import(`${outFile}?v=${Date.now()}`);
}

// ------------------------------------------------------------------ harness ---
let pass = 0;
const problems = [];
function check(label, condition, detail = '') {
  if (condition) pass += 1;
  else problems.push(label + (detail ? ` — ${detail}` : ''));
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${!condition && detail ? ` — ${detail}` : ''}`);
}
const section = title => console.log(`\n=== ${title} ===`);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// --------------------------------------------------------------- environment ---
const storage = new Map();
const WEB_VOICES = [
  { voiceURI: 'en-US-DavidNeural', name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true },
  { voiceURI: 'en-US-AriaNeural', name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false },
  { voiceURI: 'de-DE-ConradNeural', name: 'Microsoft Conrad - German (Germany)', lang: 'de-DE', localService: true },
  { voiceURI: 'de-DE-KatjaNeural', name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE', localService: false },
  { voiceURI: 'ru-RU-DmitryNeural', name: 'Microsoft Dmitry - Russian (Russia)', lang: 'ru-RU', localService: true },
  { voiceURI: 'ru-RU-SvetlanaNeural', name: 'Microsoft Svetlana Online (Natural) - Russian (Russia)', lang: 'ru-RU', localService: false },
];

globalThis.window = {
  speechSynthesis: {
    getVoices: () => WEB_VOICES,
    addEventListener: () => undefined,
    speaking: false,
  },
  sessionStorage: {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  },
};
globalThis.__RN_OS__ = 'web';
globalThis.Audio = class FakeAudio {
  constructor() {
    this.paused = true;
    this.src = '';
    this.onended = null;
    this.onerror = null;
    this.playCount = 0;
    (globalThis.__AUDIOS__ ||= []).push(this);
  }
  play() {
    this.paused = false;
    this.playCount += 1;
    this.lastPlayedSrc = this.src;
    setTimeout(() => {
      this.paused = true;
      this.onended?.();
    }, 25);
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  load() {}
  removeAttribute(name) { if (name === 'src') this.src = ''; }
};
globalThis.fetch = async url => {
  const text = String(url);
  (globalThis.__FETCH_URLS__ ||= []).push(text);
  if (text.includes('health=1')) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
};

const VOICES = [
  { identifier: 'en-US-DavidNeural', name: 'Microsoft David - English (United States)', language: 'en-US', quality: 'Default' },
  { identifier: 'en-US-AriaNeural', name: 'Microsoft Aria Online (Natural) - English (United States)', language: 'en-US', quality: 'Enhanced' },
  { identifier: 'de-DE-ConradNeural', name: 'Microsoft Conrad - German (Germany)', language: 'de-DE', quality: 'Default' },
  { identifier: 'de-DE-KatjaNeural', name: 'Microsoft Katja Online (Natural) - German (Germany)', language: 'de-DE', quality: 'Enhanced' },
  { identifier: 'ru-RU-DmitryNeural', name: 'Microsoft Dmitry - Russian (Russia)', language: 'ru-RU', quality: 'Default' },
  { identifier: 'ru-RU-SvetlanaNeural', name: 'Microsoft Svetlana Online (Natural) - Russian (Russia)', language: 'ru-RU', quality: 'Enhanced' },
  { identifier: 'tr-TR-AhmetNeural', name: 'Microsoft Ahmet - Turkish (Türkiye)', language: 'tr-TR', quality: 'Default' },
  { identifier: 'tr-TR-EmelNeural', name: 'Microsoft Emel Online (Natural) - Turkish (Türkiye)', language: 'tr-TR', quality: 'Enhanced' },
  { identifier: 'fr-FR-DeniseNeural', name: 'Microsoft Denise - French (France)', language: 'fr-FR', quality: 'Enhanced' },
];
globalThis.__VOICES__ = VOICES;

// -------------------------------------------------------------------- device ---
section('Voice casting (device, offline narrator)');
const device = await bundle('device', { cloud: 'off' });

check('English picks the warm female neural voice, never the male one',
  device.pickNarratorVoice(VOICES, 'en-US')?.identifier === 'en-US-AriaNeural',
  device.pickNarratorVoice(VOICES, 'en-US')?.identifier);
check('German picks the female neural voice, never the male one',
  device.pickNarratorVoice(VOICES, 'de-DE')?.identifier === 'de-DE-KatjaNeural',
  device.pickNarratorVoice(VOICES, 'de-DE')?.identifier);
check('Russian picks the female neural voice, never the male one',
  device.pickNarratorVoice(VOICES, 'ru-RU')?.identifier === 'ru-RU-SvetlanaNeural',
  device.pickNarratorVoice(VOICES, 'ru-RU')?.identifier);
check('Turkish picks the Istanbul female neural voice, never the male one',
  device.pickNarratorVoice(VOICES, 'tr-TR')?.identifier === 'tr-TR-EmelNeural',
  device.pickNarratorVoice(VOICES, 'tr-TR')?.identifier);
check('A female voice outranks a male voice of the same language',
  device.scoreNarratorVoice(VOICES[1], 'en-US') > device.scoreNarratorVoice(VOICES[0], 'en-US'));
check('Voice labels are human readable',
  device.narratorVoiceLabel(VOICES[1]) === 'Aria Online' || device.narratorVoiceLabel(VOICES[1]) === 'Aria',
  device.narratorVoiceLabel(VOICES[1]));
check('Slow narration is faster to follow than normal narration',
  device.narratorRateFor('de-DE', 'slow') < device.narratorRateFor('de-DE', 'normal'));
check('Fast narration is faster than normal narration',
  device.narratorRateFor('en-US', 'fast') > device.narratorRateFor('en-US', 'normal'));

const shortSentence = 'Guten Morgen! Wie geht es dir?';
const longSentence = 'Guten Morgen! Wie geht es dir heute? Ich freue mich sehr, dich wiederzusehen, und hoffe, dass du einen ruhigen und angenehmen Tag hattest, so wie wir ihn geplant haben.'.repeat(3);
const punctuatedSentence = 'Guten Morgen! Wie geht es dir heute? Mir geht es gut, danke, und ich freue mich auf unseren ruhigen Tag zusammen.';
check('A short sentence stays in one breath group', device.splitForNarration(shortSentence).length === 1);
check('A punctuated sentence is still read as ONE connected phrase',
  device.splitForNarration(punctuatedSentence).length === 1,
  String(device.splitForNarration(punctuatedSentence).length));
check('A long sentence is split into breath-sized groups',
  device.splitForNarration(longSentence).length >= 2
  && device.splitForNarration(longSentence).every(part => part.length <= 260),
  String(device.splitForNarration(longSentence).length));

section('Device fallback protection');
globalThis.__SPEECH_CALLS__ = [];
await device.narrate('Guten Morgen! Wie geht es dir?', 'de-DE');
check('Device speech is never used when cloud/CDN is unavailable', globalThis.__SPEECH_CALLS__.length === 0);
check('Unavailable cloud/CDN narration reports an actionable error', device.getNarratorSnapshot().status === 'error');

section('Russian and English remain device-free');
globalThis.__SPEECH_CALLS__ = [];
await device.narrate('Доброе утро! Как дела?', 'ru-RU');
await device.narrate('Good morning! How are you today?', 'en-US');
check('Russian narration never calls the device engine', globalThis.__SPEECH_CALLS__.length === 0);
check('English narration never calls the device engine', globalThis.__SPEECH_CALLS__.length === 0);

// --------------------------------------------------------------------- cloud ---
section('Cloud/CDN narrator (human voice, no device fallback)');
const cloud = await bundle('cloud', { cloud: 'auto' });
globalThis.__AUDIOS__ = [];
globalThis.__SPEECH_CALLS__ = [];

await cloud.primeNarrator('en-US');
check('The cloud narrator is discovered from the Supabase project', cloud.getNarratorSnapshot().cloudAvailable === true);
check('Russian TTS normalization strips combining stress marks while preserving ё and й',
  cloud.prepareTextForTts('Приве́т! Э́то моё молоко́ и горя́чий чай.', 'ru-RU') === 'Привет! Это моё молоко и горячий чай.',
  cloud.prepareTextForTts('Приве́т! Э́то моё молоко́ и горя́чий чай.', 'ru-RU'));

void cloud.narrate('Good morning! How are you today?', 'en-US');
await wait(140);
const cloudSnapshot = cloud.getNarratorSnapshot();
check('Cloud narration takes priority over the device voice', cloudSnapshot.engine === 'cloud', String(cloudSnapshot.engine));
check('The cloud voice is presented as a human narrator', cloudSnapshot.qualityLabel === 'CDN/ابری تأییدشده', cloudSnapshot.qualityLabel);
check('Audio is actually requested from the narrator function', (globalThis.__AUDIOS__ ?? []).some(audio => audio.playCount > 0));
await wait(160);
check('Cloud narration finishes back at idle', cloud.getNarratorSnapshot().status === 'idle', cloud.getNarratorSnapshot().status);
check('Cloud voice is requested at its natural synthesis pace',
  (globalThis.__AUDIOS__ ?? []).some(audio => typeof audio.src === 'string' && audio.src.length > 0),
  String((globalThis.__AUDIOS__ ?? []).at(0)?.src ?? ''));

void cloud.narrate('Guten Morgen! Wie geht es dir heute?', 'de-DE');
await wait(140);
cloud.setNarratorSpeed('slow');
await wait(280);
const slowAudio = (globalThis.__AUDIOS__ ?? []).at(-1);
check('Slow mode stays human: natural synthesis, pitch-preserving slower playback',
  slowAudio?.playbackRate === 0.71,
  String(slowAudio?.playbackRate));
cloud.setNarratorSpeed('fast');
await wait(280);
const fastAudio = (globalThis.__AUDIOS__ ?? []).at(-1);
check('Fast mode stays human: pitch-preserving faster playback',
  fastAudio?.playbackRate === 0.97,
  String(fastAudio?.playbackRate));
cloud.setNarratorSpeed('normal');
await wait(60);

await cloud.narrate('Приве́т! Пожа́луйста, молоко́.', 'ru-RU');
const ruSrc = String((globalThis.__AUDIOS__ ?? []).at(-1)?.lastPlayedSrc ?? '');
check('Russian cloud narrator sends stress-free Cyrillic text to ElevenLabs/Supabase',
  ruSrc.includes('lang=ru') && !/%CC%81/i.test(ruSrc),
  ruSrc);

await cloud.narrate('Merhaba! İyiyim, teşekkürler.', 'tr-TR');
const trSrc = String((globalThis.__AUDIOS__ ?? []).at(-1)?.lastPlayedSrc ?? '');
check('Turkish cloud narrator requests native tr audio from Supabase narration-tts',
  trSrc.includes('lang=tr') && trSrc.includes('Merhaba'),
  trSrc);

section('Automatic narration switch');
cloud.setNarratorAuto(false);
check('Turning the narrator off is reflected in the shared state', cloud.getNarratorSnapshot().auto === false);
cloud.setNarratorAuto(true);
check('Turning it back on restores automatic reading', cloud.getNarratorSnapshot().auto === true);

console.log(`\nTOTAL: ${pass} checks passed, ${problems.length} failed`);
if (problems.length) {
  console.log('failed checks:');
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
