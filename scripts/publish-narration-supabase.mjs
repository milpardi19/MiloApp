#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const input = process.env.NARRATION_INPUT || 'audio-manifest.json.generated.json';
const audioRoot = process.env.NARRATION_OUT || 'generated-audio';
const projectUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.NARRATION_BUCKET || 'lesson-audio';
const version = process.env.NARRATION_VERSION || 'v1';
if (!projectUrl || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

const headers = {
  Authorization: `Bearer ${serviceKey}`,
  apikey: serviceKey,
};
const encoded = value => value.split('/').map(encodeURIComponent).join('/');
const publicRoot = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}`;
function stableAudioKey(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function filesIn(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) result.push(...await filesIn(full));
    else if (entry.name.endsWith('.mp3')) result.push(full);
  }
  return result;
}

async function upload(localFile, objectPath) {
  const body = Buffer.isBuffer(localFile) ? localFile : await readFile(localFile);
  const response = await fetch(`${projectUrl}/storage/v1/object/${encoded(bucket)}/${encoded(objectPath)}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': '31536000',
      'x-upsert': 'true',
    },
    body,
  });
  if (!response.ok) throw new Error(`${objectPath}: ${response.status} ${(await response.text()).slice(0, 300)}`);
}

const manifest = JSON.parse(await readFile(input, 'utf8'));
const byId = new Map(manifest.sentences.map(sentence => [sentence.id, sentence]));
const files = await filesIn(audioRoot);
for (const localFile of files) {
  const language = path.basename(path.dirname(localFile));
  const filename = path.basename(localFile);
  const sentenceId = filename.replace(/\.mp3$/, '');
  const sentence = byId.get(sentenceId);
  if (!sentence) throw new Error(`No manifest sentence for ${sentenceId}`);
  const objectPath = `${version}/${language}/${stableAudioKey(sentence.text)}.mp3`; 
  await upload(localFile, objectPath);
  const size = (await stat(localFile)).size;
  console.log(`published ${objectPath} (${size} bytes)`);
}

const published = {
  ...manifest,
  version,
  publishedAt: new Date().toISOString(),
  sentences: manifest.sentences.map(sentence => ({
    ...sentence,
    status: 'published',
    audio: {
      mp3: `${publicRoot}/${version}/${sentence.language}/${stableAudioKey(sentence.text)}.mp3`,
    },
  })),
};
await upload(Buffer.from(JSON.stringify(published, null, 2)), `${version}/manifest.json`);
console.log(`published manifest: ${publicRoot}/${version}/manifest.json`);
