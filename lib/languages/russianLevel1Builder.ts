import type { LearningLesson, LearningSentence } from './types';
import { buildRussianSentence } from './russianPhonetics';

export type L1VocabTuple = readonly [
  readonly [string, string],
  readonly [string, string],
  readonly [string, string],
];

const PROPER_NOUN_FORMS = new Set([
  'анна', 'анну', 'анне', 'анной', 'анны',
  'иван', 'ивана', 'ивану', 'иваном', 'иване',
  'мария', 'марию', 'марии', 'марией',
  'ольга', 'ольгу', 'ольге', 'ольгой', 'ольги',
  'али',
  'сара', 'сару', 'саре', 'сарой', 'сары',
  'нима', 'нимы', 'ниме',
  'реза', 'резы', 'резе',
  'иран', 'ирана', 'иране',
  'россия', 'россии', 'россию', 'россией',
  'москва', 'москвы', 'москве', 'москву', 'москвой',
  'тегеран', 'тегерана', 'тегеране',
  'шираз', 'шираза', 'ширазе',
  'петербург', 'петербурга', 'петербурге',
]);

function normalizeVocabWord(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  return trimmed
    .split(' ')
    .map(token => {
      const bareLower = token
        .normalize('NFD')
        .replace(/\u0301/g, '')
        .normalize('NFC')
        .toLocaleLowerCase('ru-RU');
      if (PROPER_NOUN_FORMS.has(bareLower)) {
        return token.charAt(0).toLocaleUpperCase('ru-RU') + token.slice(1).toLocaleLowerCase('ru-RU');
      }
      return token.toLocaleLowerCase('ru-RU');
    })
    .join(' ');
}

export function l1Sent(
  id: string,
  text: string,
  fa: string,
  pattern: string,
  vocab: L1VocabTuple,
  pronunciationOverride?: string,
): LearningSentence {
  return buildRussianSentence(
    id,
    text,
    fa,
    vocab.map(([word, meaning]) => [normalizeVocabWord(word), meaning.trim()] as [string, string]),
    pattern,
    pronunciationOverride,
  );
}

export interface L1LessonSpec {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly situation: string;
  readonly teachingFa: string;
  readonly sentences: readonly [string, string, string, L1VocabTuple][];
  readonly sentencePrefix: string;
  readonly dialogue: LearningLesson['dialogue'];
  readonly checks: NonNullable<LearningLesson['checks']>;
}

export function buildL1Lesson(spec: L1LessonSpec): LearningLesson {
  return {
    id: spec.id,
    title: spec.title,
    subtitle: spec.subtitle,
    situation: spec.situation,
    durationMinutes: 10,
    teachingFa: spec.teachingFa,
    sentences: spec.sentences.map(([text, fa, pattern, vocab], idx) =>
      l1Sent(
        `${spec.sentencePrefix}-${String(idx + 1).padStart(2, '0')}`,
        text,
        fa,
        pattern,
        vocab,
      ),
    ),
    dialogue: spec.dialogue,
    checks: spec.checks,
  };
}
