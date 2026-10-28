#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const input = process.env.NARRATION_INPUT || 'audio-manifest.json';
const outputDir = process.env.NARRATION_OUT || 'generated-audio';
const provider = (process.env.NARRATION_PROVIDER || 'elevenlabs').toLowerCase();
const concurrency = Math.max(1, Math.min(6, Number(process.env.NARRATION_CONCURRENCY || 3)));
const retries = 4;
const openAiKey = process.env.OPENAI_API_KEY;
const elevenKey = process.env.ELEVENLABS_API_KEY;
if (provider === 'openai' && !openAiKey) throw new Error('OPENAI_API_KEY is missing');
if (provider === 'elevenlabs' && !elevenKey) throw new Error('ELEVENLABS_API_KEY is missing');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(task, label) {
  let error;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try { return await task(); } catch (caught) {
      error = caught;
      if (attempt === retries - 1) break;
      await sleep(Math.min(30_000, 800 * 2 ** attempt));
      console.warn(`${label}: retry ${attempt + 1}/${retries - 1}`);
    }
  }
  throw error;
}

function prepareTtsText(text, lang) {
  const nfc = String(text || '').normalize('NFC');
  if (lang === 'ru' || /[А-Яа-яЁё]/.test(nfc)) {
    return nfc.replace(/[\u0300\u0301]/g, '').replace(/\s+/g, ' ').trim();
  }
  return nfc.replace(/\s+/g, ' ').trim();
}

async function openAiAudio(sentence) {
  const voice = process.env[`OPENAI_TTS_VOICE_${sentence.language.toUpperCase()}`] || 'coral';
  const spokenText = prepareTtsText(sentence.text, sentence.language);
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts', voice, input: spokenText,
      response_format: 'mp3', speed: 1,
      instructions: `Read only this ${sentence.locale} language-learning sentence as a native female speaker. Use clear natural connected speech, authentic native phonology, gentle warmth, and natural pauses. Never translate, explain, repeat, or add words.`,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return Buffer.from(await response.arrayBuffer());
}

async function elevenLabsAudio(sentence) {
  const lang = sentence.language.toLowerCase();
  const explicitVoice = process.env[`ELEVENLABS_VOICE_${sentence.language.toUpperCase()}`];
  const voice = explicitVoice || (lang === 'ru' ? 'pFZP5JQG7iQjIQuC4Bku' : 'EXAVITQu4vr4xnSDxMaL');
  const spokenText = prepareTtsText(sentence.text, lang);
  const model = lang === 'ru'
    ? (process.env.ELEVENLABS_MODEL_RU || process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5')
    : (process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2');
  const supportsLanguageCode = /turbo_v2_5|flash_v2_5|eleven_v3/i.test(model);
  const voiceSettings = lang === 'ru' && !explicitVoice
    ? { stability: 0.62, similarity_boost: 0.42, style: 0.0, use_speaker_boost: false }
    : { stability: 0.55, similarity_boost: 0.80, style: 0.12, use_speaker_boost: true };
  const body = {
    text: spokenText,
    model_id: model,
    voice_settings: voiceSettings,
    pronunciation_dictionary_locators: sentence.pronunciationDictionaryLocators || [],
  };
  if (supportsLanguageCode) {
    body.language_code = lang;
    body.apply_text_normalization = 'on';
  }
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return Buffer.from(await response.arrayBuffer());
}

async function generate(sentence) {
  const target = path.join(outputDir, sentence.language, `${sentence.id}.mp3`);
  await mkdir(path.dirname(target), { recursive: true });
  try { await readFile(target); return { ...sentence, status: 'generated', localFile: target }; } catch {}
  const audio = await retry(() => provider === 'elevenlabs' ? elevenLabsAudio(sentence) : openAiAudio(sentence), sentence.id);
  if (!audio.length) throw new Error(`${sentence.id}: provider returned empty audio`);
  await writeFile(target, audio);
  console.log(`generated ${sentence.id}`);
  return { ...sentence, status: 'generated', localFile: target };
}

const manifest = JSON.parse(await readFile(input, 'utf8'));
const pending = manifest.sentences.filter(sentence => sentence.status !== 'published');
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const index = cursor++;
    results[index] = await generate(pending[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
await writeFile(`${input}.generated.json`, JSON.stringify({ ...manifest, sentences: results }, null, 2) + '\n');
console.log(`Done: ${results.length} files in ${outputDir}`);
