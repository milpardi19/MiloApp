import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Skill } from './englishSupplement/content';
import { ENGLISH_ENGINE_STEPS } from './englishLearningEngine';

export const STUDY_KEY = 'english_study_state_v1';

export interface LessonSession {
  stage: number;
  sentenceIndex: number;
  revealed: boolean;
  evidencePassed: boolean;
}

export interface CourseLessonEvidence {
  skill: Skill;
  correct: boolean;
  attempts: number;
  heard: boolean;
}

export interface StudyState {
  version: 1;
  sessions: Record<string, LessonSession>;
  days: Record<string, number>;
  /** Goal-based checks for mapped sentence-course lessons; absent in older v1 data. */
  lessonEvidence: Record<string, Record<string, CourseLessonEvidence>>;
}

export const studyDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const freshSession = (): LessonSession => ({ stage: 0, sentenceIndex: 0, revealed: false, evidencePassed: false });

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const validSkills = new Set<Skill>(['reading', 'listening', 'writing', 'grammar']);

/**
 * Reads the study state defensively.
 *
 * Earlier versions validated the *whole* blob at once and threw when a single
 * record was stale (for example a session saved by an older build whose stage
 * count differed). One bad record then blocked every English lesson with an
 * unrecoverable "session could not be read" screen. Each record is now checked
 * on its own: valid records are kept, unusable ones are dropped and simply
 * restart that one lesson. Only an unreadable JSON document or a foreign root
 * shape still throws, and that error is surfaced with a retry/safe-restart UI.
 */
function sanitizeSession(value: unknown): LessonSession | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const session = value as Partial<LessonSession>;
  if (!Number.isInteger(session.stage) || session.stage! < 0 || session.stage! >= ENGLISH_ENGINE_STEPS.length) return null;
  if (!Number.isInteger(session.sentenceIndex) || session.sentenceIndex! < 0) return null;
  if (typeof session.revealed !== 'boolean' || typeof session.evidencePassed !== 'boolean') return null;
  return {
    stage: session.stage!,
    sentenceIndex: session.sentenceIndex!,
    revealed: session.revealed,
    evidencePassed: session.evidencePassed,
  };
}

function sanitizeEvidenceResults(value: unknown): Record<string, CourseLessonEvidence> | null {
  if (!isRecord(value)) return null;
  const results: Record<string, CourseLessonEvidence> = {};
  let dropped = false;
  for (const [taskId, entry] of Object.entries(value)) {
    const result = entry as Partial<CourseLessonEvidence> | null | undefined;
    if (!result || !validSkills.has(result.skill as Skill) || typeof result.correct !== 'boolean'
      || typeof result.heard !== 'boolean' || !Number.isSafeInteger(result.attempts) || result.attempts! < 1) {
      dropped = true;
      continue;
    }
    results[taskId] = { skill: result.skill as Skill, correct: result.correct, heard: result.heard, attempts: result.attempts! };
  }
  return dropped ? results : (value as Record<string, CourseLessonEvidence>);
}

export function parseStudy(raw: string | null): StudyState {
  if (raw === null) return { version: 1, sessions: {}, days: {}, lessonEvidence: {} };
  let parsed: Partial<StudyState> | null;
  try {
    parsed = JSON.parse(raw) as Partial<StudyState> | null;
  } catch {
    throw Error('اطلاعات جلسه خوانده نشد؛ داده‌های قبلی بازنویسی نشدند.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
    || parsed.version !== 1 || !isRecord(parsed.sessions) || !isRecord(parsed.days)) {
    throw Error('اطلاعات جلسه خوانده نشد؛ داده‌های قبلی بازنویسی نشدند.');
  }

  const sessions: Record<string, LessonSession> = {};
  for (const [lessonId, entry] of Object.entries(parsed.sessions)) {
    const session = sanitizeSession(entry);
    if (session) sessions[lessonId] = session;
  }

  const days: Record<string, number> = {};
  for (const [day, value] of Object.entries(parsed.days)) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) days[day] = value;
  }

  // Keep existing v1 learner data readable; older records simply have no lessonEvidence field.
  const rawEvidence = parsed.lessonEvidence === undefined || parsed.lessonEvidence === null ? {} : parsed.lessonEvidence;
  if (!isRecord(rawEvidence)) throw Error('سنجش درس معتبر نیست؛ داده‌های قبلی بازنویسی نشدند.');
  const lessonEvidence: Record<string, Record<string, CourseLessonEvidence>> = {};
  for (const [lessonId, results] of Object.entries(rawEvidence)) {
    const clean = sanitizeEvidenceResults(results);
    if (clean && Object.keys(clean).length) lessonEvidence[lessonId] = clean;
  }

  return { version: 1, sessions, days, lessonEvidence };
}

/** Recovery helpers: used by the lesson screen's escape hatch, never automatically. */
export function resetLessonSession(lessonId: string) {
  return update(state => { delete state.sessions[lessonId]; });
}

export function resetAllLessonSessions() {
  return update(state => { state.sessions = {}; });
}

export async function loadStudy(): Promise<StudyState> {
  return parseStudy(Platform.OS === 'web'
    ? (typeof window === 'undefined' ? null : window.localStorage.getItem(STUDY_KEY))
    : await AsyncStorage.getItem(STUDY_KEY));
}

let queue: Promise<unknown> = Promise.resolve();
function scheduleAccountSync() {
  void import('./personalLearningSync')
    .then(({ schedulePersonalLearningSync }) => schedulePersonalLearningSync())
    .catch(() => undefined);
}
function update(change: (state: StudyState) => void): Promise<StudyState> {
  const job = queue.then(async () => {
    const state = await loadStudy();
    change(state);
    const raw = JSON.stringify(state);
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') throw Error('ذخیره‌سازی در دسترس نیست.');
      window.localStorage.setItem(STUDY_KEY, raw);
    } else await AsyncStorage.setItem(STUDY_KEY, raw);
    scheduleAccountSync();
    return state;
  });
  queue = job.catch(() => {});
  return job;
}

export function saveLessonSession(id: string, value: LessonSession) {
  return update(state => { state.sessions[id] = value; });
}

export function recordLessonEvidence(lessonId: string, taskId: string, skill: Skill, correct: boolean, heard: boolean) {
  if (!lessonId.trim() || !taskId.trim() || !validSkills.has(skill)
    || typeof correct !== 'boolean' || typeof heard !== 'boolean'
    || (skill === 'listening' && !heard)) {
    return Promise.reject(Error('پاسخ سنجش معتبر نیست یا فایل شنیداری کامل نشده است.'));
  }
  return update(state => {
    const existing = state.lessonEvidence[lessonId]?.[taskId];
    state.lessonEvidence[lessonId] = {
      ...state.lessonEvidence[lessonId],
      [taskId]: { skill, correct, heard, attempts: (existing?.attempts ?? 0) + 1 },
    };
  });
}

export function addStudyTime(day: string, milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds > 10000) {
    return Promise.reject(Error('Invalid measured interval'));
  }
  return update(state => { state.days[day] = (state.days[day] ?? 0) + milliseconds; });
}

/** A delayed timer, background tab or >60s idle gap never earns phantom minutes. */
export function measuredInterval(previous: number, now: number, lastInteraction: number, active: boolean) {
  const delta = now - previous;
  return active && delta > 0 && delta <= 10000 ? Math.max(0, Math.min(delta, lastInteraction + 60000 - previous)) : 0;
}
