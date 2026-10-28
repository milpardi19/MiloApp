import type { LearningLesson, LearningSentence } from './types';

const SPECIAL_RUSSIAN_WORDS: Readonly<Record<string, string>> = {
  'что': 'شتُو',
  'чтобы': 'شتُوبی',
  'потому': 'پاتامو',
  'поэтому': 'پائِتامو',
  'пожалуйста': 'پاژالوستا',
  'здравствуйте': 'زدراستْوویتِ',
  'здравствуй': 'زدراستْووی',
  'сегодня': 'سِوُدنیا',
  'конечно': 'کانیِشنا',
  'скучно': 'سکوچنا',
  'отлично': 'آتلیچنا',
  'его': 'ییوُو',
  'её': 'یی‌یُو',
  'кто': 'کتُو',
  'кто-то': 'کتُوتا',
  'что-то': 'شتُوتا',
  'лёгкий': 'لیوخکی',
  'лёгкая': 'لیوخکایا',
  'лёгкое': 'لیوخکایِ',
  'мягкий': 'میاخکی',
  'мягкая': 'میاخکایا',
  'счастливый': 'شّیستلیوی',
  'счастлива': 'شّیستلیوا',
  'счастлив': 'شّیستلیف',
  'чувство': 'چوستوا',
  'чувствую': 'چوستوویو',
  'сердце': 'سِرتسِ',
  'солнце': 'سُنتسِ',
  'легко': 'لیخکُو',
  'много': 'مْنوگا',
  'немного': 'نیمنوگا',
  'дорого': 'دُوراگا',
  'недорого': 'نیدُوراگا',
  'строго': 'سترُوگا',
  'мои': 'مایی',
  'твои': 'تْوایی',
  'свои': 'سْوایی',
  'неё': 'نی‌یُو',
  'праздник': 'پرازنیک',
  'лестница': 'لِستنیتسا',
  'поздно': 'پُوزنا',
  'ничего': 'نیچِوُو',
  'счёт': 'شّوت',
  'счет': 'شّوت',
  'мужчина': 'موشّینا',
  'мужчины': 'موشّینی',
  'помощник': 'پامُوشنیک',
  'счастливого': 'شّیستلیواوا',
  'дождь': 'دُوشت',
  'могу': 'ماگو',
  'него': 'نیوُو',
  'свидания': 'سویدانییا',
  'большое': 'بالشُویِ',
  'из': 'ایز',
  'россия': 'راسی‌یا',
  'россии': 'راسی‌یی',
  'анна': 'آنا',
  'обычно': 'آبیچنا',
  'чувствуете': 'چوستوویی‌تِ',
  'чувствуешь': 'چوستوویش',
  'познакомимся': 'پازناکُمیمسا',
  'друзья': 'دروزیا',
};

const CONSONANT_MAP: Readonly<Record<string, string>> = {
  'б': 'ب',
  'в': 'و',
  'г': 'گ',
  'д': 'د',
  'ж': 'ژ',
  'з': 'ز',
  'й': 'ی',
  'к': 'ک',
  'л': 'ل',
  'м': 'م',
  'н': 'ن',
  'п': 'پ',
  'р': 'ر',
  'с': 'س',
  'т': 'ت',
  'ф': 'ف',
  'х': 'خ',
  'ц': 'تس',
  'ч': 'چ',
  'ш': 'ش',
  'щ': 'شّ',
};

const FINAL_DEVOICE: Readonly<Record<string, string>> = {
  'б': 'پ',
  'в': 'ف',
  'г': 'ک',
  'д': 'ت',
  'ж': 'ش',
  'з': 'س',
};

const VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
const UNSTRESSED_CLITICS = new Set([
  'о', 'об', 'обо', 'по', 'до', 'во', 'со', 'ко', 'от',
  'за', 'на', 'из', 'под', 'над', 'не', 'ни', 'же', 'ли', 'бы', 'но', 'а', 'и',
]);

function transcribeSingleWord(rawWord: string): string {
  const nfd = rawWord.normalize('NFD').toLowerCase();
  const bare = nfd.replace(/\u0301/g, '').normalize('NFC');
  if (!bare) return '';
  if (SPECIAL_RUSSIAN_WORDS[bare]) return SPECIAL_RUSSIAN_WORDS[bare];

  // Parse letters + acute stress markers cleanly
  const letters: { ch: string; stressed: boolean }[] = [];
  for (let i = 0; i < nfd.length; i++) {
    const code = nfd[i];
    if (code === '\u0301') {
      if (letters.length > 0) letters[letters.length - 1].stressed = true;
      continue;
    }
    // NFC recombine й / ё if decomposed
    if ((code === 'и' || code === 'е') && nfd[i + 1] === '\u0306') {
      letters.push({ ch: 'й', stressed: false });
      i++;
      continue;
    }
    if (code === 'е' && nfd[i + 1] === '\u0308') {
      const stressed = nfd[i + 2] === '\u0301' || true;
      letters.push({ ch: 'ё', stressed });
      i += nfd[i + 2] === '\u0301' ? 2 : 1;
      continue;
    }
    letters.push({ ch: code, stressed: code === 'ё' });
  }

  // Monosyllabic content words (дом, сок, стол, кот, он, мой, мост, борщ...) are stressed on their sole vowel
  const vowelIndices = letters.map((l, idx) => (VOWELS.has(l.ch) ? idx : -1)).filter(idx => idx >= 0);
  if (vowelIndices.length === 1 && !UNSTRESSED_CLITICS.has(bare)) {
    letters[vowelIndices[0]].stressed = true;
  }

  // Handle reflexive verb endings -ться / -тся and genitive -ого / -его
  const joined = letters.map(x => x.ch).join('');
  if (joined.endsWith('ться') || joined.endsWith('тся')) {
    const cut = joined.endsWith('ться') ? 4 : 3;
    const stemTokens = letters.slice(0, letters.length - cut);
    return transcribeLetters(stemTokens, false) + 'تسا';
  }
  if (joined.length > 4 && (joined.endsWith('ого') || joined.endsWith('его'))) {
    const stemTokens = letters.slice(0, letters.length - 3);
    const tail = joined.endsWith('его') ? 'یِوا' : 'اوا';
    return transcribeLetters(stemTokens, false) + tail;
  }

  return transcribeLetters(letters, true);
}

function transcribeLetters(letters: readonly { ch: string; stressed: boolean }[], allowFinalDevoice = true): string {
  let out = '';
  const n = letters.length;
  for (let i = 0; i < n; i++) {
    const { ch, stressed } = letters[i];
    const prev = i > 0 ? letters[i - 1].ch : '';
    const isInitial = i === 0;
    const afterVowelOrSign = isInitial || VOWELS.has(prev) || prev === 'ь' || prev === 'ъ';

    if (ch === 'ь' || ch === 'ъ') continue;
    if (ch === '-') {
      out += '‌';
      continue;
    }

    if (CONSONANT_MAP[ch]) {
      if (allowFinalDevoice && i === n - 1 && FINAL_DEVOICE[ch]) {
        out += FINAL_DEVOICE[ch];
      } else if (allowFinalDevoice && i === n - 2 && letters[n - 1].ch === 'ь' && FINAL_DEVOICE[ch]) {
        out += FINAL_DEVOICE[ch];
      } else {
        out += CONSONANT_MAP[ch];
      }
      continue;
    }

    switch (ch) {
      case 'а':
        out += isInitial ? 'آ' : 'ا';
        break;
      case 'о':
        if (stressed) out += isInitial ? 'اُ' : 'ُو';
        else out += isInitial ? 'آ' : 'ا';
        break;
      case 'у':
        out += isInitial ? 'او' : 'و';
        break;
      case 'э':
        out += isInitial ? 'اِ' : 'ِ';
        break;
      case 'и':
        out += isInitial ? 'ای' : 'ی';
        break;
      case 'ы':
        out += 'ی';
        break;
      case 'е':
        if (afterVowelOrSign) out += stressed ? 'یِ' : 'یی';
        else out += stressed ? 'ِ' : 'ی';
        break;
      case 'ё':
        out += afterVowelOrSign ? 'یُو' : 'یو';
        break;
      case 'ю':
        out += afterVowelOrSign ? 'یو' : 'یو';
        break;
      case 'я':
        if (afterVowelOrSign) out += stressed || n === 1 ? 'یا' : 'یی';
        else out += stressed ? 'یا' : 'ی';
        break;
      default:
        break;
    }
  }
  return out;
}

const DIGIT_WORDS_FA: Readonly<Record<string, string>> = {
  '0': 'نول',
  '1': 'آدین',
  '2': 'دوا',
  '3': 'تری',
  '4': 'چِتیری',
  '5': 'پیات',
  '6': 'شِست',
  '7': 'سِم',
  '8': 'وُسِم',
  '9': 'دیِویات',
};

/**
 * Converts a stressed Russian Cyrillic sentence into a natural pure-Persian
 * pronunciation guide (guaranteed 0 Cyrillic and 0 Latin characters).
 */
export function russianToPersianPronunciation(russianText: string): string {
  const cleaned = russianText
    .replace(/[«»"“”()]/g, '')
    .replace(/\s*—\s*/g, '، ')
    .replace(/,/g, '،')
    .replace(/\?/g, '؟')
    .replace(/[.;:!…]+/g, '')
    .trim();

  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  const converted = rawTokens.map(token => {
    const trailingPunct = token.endsWith('،') ? '،' : token.endsWith('؟') ? '؟' : '';
    const core = token.replace(/[،؟]/g, '');
    if (/^\d+$/.test(core)) {
      return [...core].map(d => DIGIT_WORDS_FA[d] ?? '').join(' ') + trailingPunct;
    }
    const subParts = core.split('-').map(transcribeSingleWord).filter(Boolean);
    return subParts.join('‌') + trailingPunct;
  }).filter(Boolean);

  return converted.join(' ').replace(/\s+/g, ' ').trim();
}

export function buildRussianSentence(
  id: string,
  text: string,
  fa: string,
  vocabulary: readonly [string, string][],
  pattern: string,
  pronunciationOverride?: string,
): LearningSentence {
  const vocabObjects: LearningSentence['vocabulary'] = vocabulary.map(([word, meaning]) => ({ word, meaning }));
  return {
    id,
    text,
    fa,
    pronunciation: pronunciationOverride ?? russianToPersianPronunciation(text),
    vocabulary: vocabObjects,
    pattern,
  };
}

export function mergeSentenceVocabulary(
  sentence: LearningSentence,
  extraVocabulary: readonly [string, string][],
): LearningSentence {
  const seen = new Set(sentence.vocabulary.map(v => v.word.toLocaleLowerCase('ru-RU')));
  const merged: LearningSentence['vocabulary'] = [...sentence.vocabulary];
  for (const [word, meaning] of extraVocabulary) {
    const norm = word.toLocaleLowerCase('ru-RU');
    if (!seen.has(norm)) {
      seen.add(norm);
      merged.push({ word, meaning });
    }
  }
  return { ...sentence, vocabulary: merged };
}

export function extendRussianLesson(
  baseLesson: LearningLesson,
  extraSentences: readonly LearningSentence[],
  extraVocabBySentenceIndex?: Readonly<Record<number, readonly [string, string][]>>,
): LearningLesson {
  const enrichedBase = baseLesson.sentences.map((s, idx) =>
    extraVocabBySentenceIndex?.[idx]
      ? mergeSentenceVocabulary(s, extraVocabBySentenceIndex[idx])
      : s,
  );
  return {
    ...baseLesson,
    sentences: [...enrichedBase, ...extraSentences],
  };
}
