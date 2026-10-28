import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TURKISH_LESSON_STAGES, TURKISH_LESSONS } from './turkish';

/** وضعیت جلسهٔ درس ترکی؛ از دادهٔ روسی و آلمانی جدا و مستقل است. */
export const TURKISH_STUDY_STORAGE_KEY = 'turkish_lesson_sessions_v1';

export interface TurkishLessonSession {
  stage: number;
  sentenceIndex: number;
  revealed: boolean;
  answers: Record<string, number>;
  showCheckAnswers: boolean;
}

interface TurkishStudyState {
  schema: 1;
  sessions: Record<string, TurkishLessonSession>;
}

export function freshTurkishLessonSession(): TurkishLessonSession {
  return { stage: 0, sentenceIndex: 0, revealed: false, answers: {}, showCheckAnswers: false };
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(TURKISH_STUDY_STORAGE_KEY);
  }
  return AsyncStorage.getItem(TURKISH_STUDY_STORAGE_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(TURKISH_STUDY_STORAGE_KEY, value);
    return;
  }
  await AsyncStorage.setItem(TURKISH_STUDY_STORAGE_KEY, value);
}

function parseState(raw: string | null): TurkishStudyState {
  if (raw === null) return { schema: 1, sessions: {} };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('دادهٔ جلسهٔ ترکی ساختار معتبری ندارد.');
  const state = value as Partial<TurkishStudyState>;
  if (state.schema !== 1 || !state.sessions || typeof state.sessions !== 'object' || Array.isArray(state.sessions)) {
    throw new Error('نسخهٔ دادهٔ جلسهٔ ترکی شناخته‌شده نیست.');
  }
  return { schema: 1, sessions: state.sessions as Record<string, TurkishLessonSession> };
}

function validateSession(lessonId: string, value: unknown): TurkishLessonSession {
  const lesson = TURKISH_LESSONS.find(item => item.id === lessonId);
  if (!lesson || !value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('جلسهٔ ترکی برای این درس معتبر نیست.');
  }
  const session = value as Partial<TurkishLessonSession>;
  if (
    !Number.isInteger(session.stage) ||
    session.stage! < 0 ||
    session.stage! >= TURKISH_LESSON_STAGES.length ||
    !Number.isInteger(session.sentenceIndex) ||
    session.sentenceIndex! < 0 ||
    session.sentenceIndex! >= lesson.sentences.length ||
    typeof session.revealed !== 'boolean' ||
    typeof session.showCheckAnswers !== 'boolean' ||
    !session.answers ||
    typeof session.answers !== 'object' ||
    Array.isArray(session.answers)
  ) {
    throw new Error('وضعیت ذخیره‌شدهٔ درس ترکی معتبر نیست؛ دادهٔ اصلی تغییر نکرده است.');
  }
  const answers: Record<string, number> = {};
  for (const [key, answer] of Object.entries(session.answers)) {
    const checkIndex = Number(key);
    const check = lesson.checks?.[checkIndex];
    if (
      !Number.isInteger(checkIndex) ||
      !check ||
      !Number.isInteger(answer) ||
      answer! < 0 ||
      answer! >= check.choices.length
    ) {
      throw new Error('پاسخ ذخیره‌شدهٔ تمرین ترکی معتبر نیست؛ دادهٔ اصلی تغییر نکرده است.');
    }
    answers[key] = answer!;
  }
  return {
    stage: session.stage!,
    sentenceIndex: session.sentenceIndex!,
    revealed: session.revealed,
    answers,
    showCheckAnswers: session.showCheckAnswers,
  };
}

export async function loadTurkishLessonSession(lessonId: string): Promise<TurkishLessonSession> {
  if (!TURKISH_LESSONS.some(item => item.id === lessonId)) throw new Error('درس ترکی پیدا نشد.');
  const state = parseState(await readRaw());
  const saved = state.sessions[lessonId];
  return saved === undefined ? freshTurkishLessonSession() : validateSession(lessonId, saved);
}

export async function loadAllTurkishLessonSessions(): Promise<Record<string, TurkishLessonSession | null>> {
  const result: Record<string, TurkishLessonSession | null> = {};
  let sessions: Record<string, TurkishLessonSession> = {};
  try {
    sessions = parseState(await readRaw()).sessions;
  } catch {
    sessions = {};
  }
  for (const lesson of TURKISH_LESSONS) {
    const saved = sessions[lesson.id];
    if (saved === undefined) {
      result[lesson.id] = freshTurkishLessonSession();
    } else {
      try {
        result[lesson.id] = validateSession(lesson.id, saved);
      } catch {
        result[lesson.id] = null;
      }
    }
  }
  return result;
}

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => undefined);
  return next;
}

export function saveTurkishLessonSession(lessonId: string, value: TurkishLessonSession): Promise<void> {
  return serial(async () => {
    const safe = validateSession(lessonId, value);
    const state = parseState(await readRaw());
    await writeRaw(JSON.stringify({ ...state, sessions: { ...state.sessions, [lessonId]: safe } }));
  });
}

export function clearTurkishLessonSession(lessonId: string): Promise<void> {
  return serial(async () => {
    if (!TURKISH_LESSONS.some(item => item.id === lessonId)) throw new Error('درس ترکی پیدا نشد.');
    const state = parseState(await readRaw());
    const sessions = { ...state.sessions };
    delete sessions[lessonId];
    if (Object.keys(sessions).length) {
      await writeRaw(JSON.stringify({ ...state, sessions }));
    } else if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(TURKISH_STUDY_STORAGE_KEY);
    } else {
      await AsyncStorage.removeItem(TURKISH_STUDY_STORAGE_KEY);
    }
  });
}
