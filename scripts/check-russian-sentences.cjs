// Structural check for every Russian sentence (all content files).
// Run: node scripts/check-russian-sentences.cjs
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'lib', 'languages');
const files = [
  'russian.ts',
  'russianSurvivalExtension.ts',
  'russianEverydayPartA.ts',
  'russianEverydayPartB.ts',
];
const source = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

const re = /\b(?:sentence|s|everydaySentence)\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/g;
let m;
let count = 0;
const problems = [];
const seen = new Set();
while ((m = re.exec(source))) {
  count++;
  const [, id, text, fa, pron] = m;
  const issues = [];
  if (seen.has(id)) issues.push('duplicate-id');
  seen.add(id);
  if (!/[А-Яа-яЁё]/.test(text)) issues.push('text-not-cyrillic');
  if (!fa.trim()) issues.push('no-persian-meaning');
  if (!pron.trim()) issues.push('no-pronunciation');
  if (/[А-Яа-яЁё]/.test(pron)) issues.push('pronunciation-has-cyrillic');
  if (/[A-Za-z]/.test(pron)) issues.push('pronunciation-has-latin');
  if (issues.length) problems.push(`${id}: ${issues.join(', ')} | ${text}`);
}

console.log(`checked ${count} Russian sentences`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('no structural issues');

// Compile the modular Foundation generator too; source-only regex checks miss
// its tuple-driven sentence records and pronunciation generated at runtime.
const esbuild = require('esbuild');
(async () => {
  const output = path.resolve(__dirname, '..', 'node_modules/.cache/russian-level1-structural-check.cjs');
  await esbuild.build({
    entryPoints: [path.join(dir, 'russianLevel1Content.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: output,
  });
  const { RUSSIAN_LEVEL1_LESSONS } = require(output);
  const level1 = RUSSIAN_LEVEL1_LESSONS;
  const level1Problems = [];
  if (level1.length !== 40) level1Problems.push(`expected 40 Foundation lessons, found ${level1.length}`);
  const cyrillicVowels = word => (word.match(/[аеёиоуыэюя]/gi) || []).length;
  for (const lesson of level1) {
    if (lesson.sentences.length !== 35) level1Problems.push(`${lesson.id}: expected 35 examples, found ${lesson.sentences.length}`);
    if (lesson.checks?.length !== 2) level1Problems.push(`${lesson.id}: expected two formative checks`);
    const seenTexts = new Set();
    for (const sentence of lesson.sentences) {
      const issues = [];
      if (seenTexts.has(sentence.text)) issues.push('duplicate-sentence-in-lesson');
      seenTexts.add(sentence.text);
      if ((sentence.text.match(/[А-Яа-яЁё]+/g) || []).length < 2) issues.push('fewer-than-two-Cyrillic-words');
      if (/\s—\s/.test(sentence.text)) issues.push('standalone-dash-token');
      if (!sentence.fa || /[А-Яа-яЁёA-Za-z]/.test(sentence.fa)) issues.push('meaning-not-pure-Persian');
      if (!sentence.pronunciation || /[А-Яа-яЁёA-Za-z]/.test(sentence.pronunciation)) issues.push('pronunciation-not-pure-Persian');
      if (!sentence.pattern || sentence.vocabulary?.length < 3) issues.push('missing-pattern-or-vocabulary');
      for (const word of sentence.text.match(/[А-Яа-яЁё\u0301]+/g) || []) {
        if (!/[Ёё]/.test(word) && cyrillicVowels(word) > 1 && !word.includes('\u0301')) {
          issues.push(`missing-stress-mark:${word}`);
        }
      }
      if (issues.length) level1Problems.push(`${lesson.id}/${sentence.id}: ${issues.join(', ')} | ${sentence.text}`);
    }
    if (lesson.dialogue.length < 3 || lesson.dialogue.some(line => !/[А-Яа-яЁё]/.test(line.text) || !line.fa)) {
      level1Problems.push(`${lesson.id}: incomplete dialogue`);
    }
  }
  const level1SentenceCount = level1.reduce((sum, lesson) => sum + lesson.sentences.length, 0);
  console.log(`compiled and checked ${level1.length} Foundation lessons and ${level1SentenceCount} sentences`);
  if (level1Problems.length) {
    console.error(level1Problems.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Foundation sentences have unique, stressed Cyrillic text, pure-Persian meaning and pronunciation, patterns, vocabulary, dialogues and checks');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
