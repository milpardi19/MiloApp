#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const cacheDir = path.join(root, 'node_modules/.cache/narration-export');
await mkdir(cacheDir, { recursive: true });
const entry = path.join(cacheDir, 'entry.ts');
await writeFile(entry, `
export { SENTENCE_LESSONS } from '${root.replaceAll('\\\\', '/')}/lib/courseContent.ts';
export { GERMAN_SENTENCE_LESSONS } from '${root.replaceAll('\\\\', '/')}/lib/languages/germanSentenceCourse.ts';
export { RUSSIAN_LESSONS } from '${root.replaceAll('\\\\', '/')}/lib/languages/russian.ts';
`);
const output = path.join(cacheDir, 'bundle.mjs');
await build({
  entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: output, logLevel: 'silent',
  plugins: [{ name: 'runtime-stubs', setup(buildApi) {
    buildApi.onResolve({ filter: /^(react-native|@react-native-async-storage\/async-storage|@supabase\/supabase-js|expo-.*)$/ }, args => ({ path: args.path, namespace: 'stub' }));
    buildApi.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({
      contents: args.path === 'react-native'
        ? 'export const Platform={OS:"node"}; export const NativeModules={}; export default {};'
        : args.path === '@supabase/supabase-js'
          ? 'export const createClient=()=>({}); export default { createClient };'
          : 'const store=new Map(); export default {getItem:async k=>store.get(k)||null,setItem:async(k,v)=>store.set(k,v),removeItem:async k=>store.delete(k)};'
    }));
  }}]
});
const data = await import(`${output}?v=${Date.now()}`);
const rows = [];
const push = (language, locale, voiceProfile, lessons, getSentence) => {
  for (const lesson of lessons) {
    for (const sentence of lesson.sentences) {
      const text = getSentence(sentence);
      if (!text?.trim()) continue;
      rows.push({
        id: `${language}-${lesson.id}-${sentence.id}`.replace(/[^a-zA-Z0-9_-]+/g, '-'),
        lessonId: lesson.id,
        sentenceId: sentence.id,
        language,
        locale,
        voiceProfile,
        text: text.trim(),
        status: 'draft',
        pronunciation: { status: 'pending' },
      });
    }
  }
};
push('en', 'en-US', 'en-au-storyteller-4', data.SENTENCE_LESSONS, s => s.en);
push('de', 'de-DE', 'de-de-storyteller-1', data.GERMAN_SENTENCE_LESSONS, s => s.text);
push('ru', 'ru-RU', 'Erinome', data.RUSSIAN_LESSONS, s => s.text);
const manifest = { version: 1, generatedAt: new Date().toISOString(), sentences: rows };
const target = process.env.NARRATION_INPUT || path.join(root, 'audio-manifest.json');
await writeFile(target, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${rows.length} sentences to ${target}`);
