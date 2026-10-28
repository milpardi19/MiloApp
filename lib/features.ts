import Constants from 'expo-constants';

export type AppEdition =
  | 'admin'
  | 'en_ru'
  | 'all_four'
  | 'login_en_de_tr'
  | 'turkish'
  | 'classic_default';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

/** Deployment switches, not authorization. Server roles/RLS remain mandatory. */
const privateAdminBuild = extra.appRole === 'admin';
const educationAdminEnabled = privateAdminBuild || process.env.EXPO_PUBLIC_ENABLE_EDUCATION_ADMIN === 'true';

/** True in the private manager APK. Chat and user tools then run as the manager. */
export const MANAGEMENT_BUILD = privateAdminBuild || process.env.EXPO_PUBLIC_MILO_ADMIN_APP === 'true';

/** Build-time switch: a learner APK that contains only the Russian course. */
export const RUSSIAN_ONLY_BUILD = process.env.EXPO_PUBLIC_RUSSIAN_ONLY === 'true';

const rawEdition = (typeof extra.edition === 'string' ? extra.edition : process.env.EXPO_PUBLIC_APP_EDITION || '').trim();

const learnerLoginEnabled = extra.learnerLogin === true
  || process.env.EXPO_PUBLIC_LEARNER_LOGIN === 'true'
  || rawEdition === 'login_en_de_tr';

/**
 * Build-time switch for Turkish-enabled non-Russian editions.
 * The Login Learner App (`learnerLoginEnabled`) ALWAYS uses English + German + Turkish (no Russian).
 */
export const TURKISH_EDITION = learnerLoginEnabled
  || extra.turkishEdition === true
  || process.env.EXPO_PUBLIC_TURKISH_EDITION === 'true'
  || rawEdition === 'turkish'
  || rawEdition === 'login_en_de_tr';

export const APP_EDITION: AppEdition = MANAGEMENT_BUILD
  ? 'admin'
  : learnerLoginEnabled
    ? 'login_en_de_tr'
    : rawEdition === 'en_ru'
      ? 'en_ru'
      : rawEdition === 'all_four'
        ? 'all_four'
        : TURKISH_EDITION
          ? 'turkish'
          : 'classic_default';

const resolveCourseFlag = (extraKey: string, fallback: boolean): boolean =>
  typeof extra[extraKey] === 'boolean' ? (extra[extraKey] as boolean) : fallback;

export const FEATURES = Object.freeze({
  /**
   * Learner login/registration screen.
   * Read from Expo extra so release APKs keep the login identity at runtime.
   */
  learnerLogin: learnerLoginEnabled,
  adminPanel: educationAdminEnabled,
  educationEnrollment: educationAdminEnabled,
  // Roadmap modules are not implemented yet. Enabling a boolean cannot build them.
  contentEditor: false,
  assignments: false,
  announcements: false,
  billing: false,
  germanAI: false,
  englishCourse: resolveCourseFlag('englishCourse', !RUSSIAN_ONLY_BUILD),
  germanCourse: resolveCourseFlag('germanCourse', !RUSSIAN_ONLY_BUILD && APP_EDITION !== 'en_ru'),
  /** Login app NEVER includes Russian; No-login `en_ru` and `all_four` include Russian. */
  russianCourse: learnerLoginEnabled
    ? false
    : resolveCourseFlag('russianCourse', APP_EDITION === 'all_four' || APP_EDITION === 'en_ru' || !TURKISH_EDITION),
  /** Turkish is included in `all_four`, `login_en_de_tr`, and `turkish` editions. */
  turkishCourse: resolveCourseFlag('turkishCourse', APP_EDITION === 'all_four' || TURKISH_EDITION),
  /** Automatic native Istanbul Turkish narrator — enabled exclusively in App #4 (`login_en_de_tr`) or explicit env override. */
  turkishCloudNarrator:
    extra.turkishCloudNarrator === true
    || process.env.EXPO_PUBLIC_TURKISH_CLOUD_NARRATOR === 'true'
    || APP_EDITION === 'login_en_de_tr',
});
