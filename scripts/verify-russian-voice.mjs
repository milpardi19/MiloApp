#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, 'node_modules', '.cache', 'russian-voice-test');
const entry = path.join(cache, 'entry.ts');
const output = path.join(cache, 'bundle.mjs');
mkdirSync(cache, { recursive: true });
writeFileSync(entry, `export * from '${path.join(root, 'lib/speechLanguage.ts')}';`);
const esbuild = await import('esbuild');
const bundle = await esbuild.build({
  entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22', logLevel: 'silent',
  plugins: [{ name: 'react-native-platform-stub', setup(build) {
    build.onResolve({ filter: /^react-native$/ }, () => ({ path: 'react-native', namespace: 'speech-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'speech-stub' }, () => ({ contents: "export const Platform={OS:'web'};", loader: 'js' }));
  } }],
});
writeFileSync(output, bundle.outputFiles[0].text);
const speech = await import(`${output}?run=${Date.now()}`);
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

const voices = [
  { identifier: 'ru-RU-male-local', name: 'Yuri', language: 'ru-RU', quality: 'Enhanced' },
  { identifier: 'ru-RU-female-network', name: 'Irina', language: 'ru-RU', quality: 'Default' },
  { identifier: 'en-US-female', name: 'Anna', language: 'en-US', quality: 'Enhanced' },
];
check(speech.selectBestVoiceForLocale(voices, 'ru-RU')?.name === 'Irina',
  'a recognizable female Russian voice wins even when the male voice has higher device quality');

const androidGoogleVoices = [
  { identifier: 'ru-ru-x-rud-local', name: 'ru-ru-x-rud-local', language: 'ru-RU', quality: 'Enhanced' },
  { identifier: 'ru-ru-x-ruf-local', name: 'ru-ru-x-ruf-local', language: 'ru-RU', quality: 'Enhanced' },
];
check(speech.selectBestVoiceForLocale(androidGoogleVoices, 'ru-RU')?.identifier === 'ru-ru-x-ruf-local',
  'Android Google TTS female identifier ruf is preferred over male identifier rud');

const cyrillicFemale = [
  { identifier: 'ru-generic-local', name: 'Russian voice', language: 'ru-RU' },
  { identifier: 'ru-other', name: 'Елена', language: 'ru-RU' },
];
check(speech.selectBestVoiceForLocale(cyrillicFemale, 'ru-RU')?.name === 'Елена',
  'Russian female voice names written in Cyrillic are recognized');

const unlabelledOverMale = [
  { identifier: 'ru-voice-1', name: 'Russian voice 1', language: 'ru-RU' },
  { identifier: 'ru-voice-2', name: 'Pavel', language: 'ru-RU' },
];
check(speech.selectBestVoiceForLocale(unlabelledOverMale, 'ru-RU')?.identifier === 'ru-voice-1',
  'an unlabelled Russian voice is preferred over a clearly male voice when no female label is exposed');
check(speech.selectBestVoiceForLocale(voices, 'de-DE') === undefined,
  'Russian voices are never selected for a different locale');
console.log(`${checks} Russian voice-selection checks passed.`);
