import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const db = new PGlite();
let passed = 0;
const ok = (name, condition) => {
  assert.ok(condition, name);
  console.log('PASS', name);
  passed += 1;
};

const admin = '00000000-0000-4000-8000-000000000011';
const studentA = '00000000-0000-4000-8000-000000000021';
const studentB = '00000000-0000-4000-8000-000000000022';

await db.exec(`
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
  INSERT INTO auth.users VALUES ('${admin}'), ('${studentA}'), ('${studentB}');
  CREATE TABLE public.learning_progress (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    progress jsonb,
    updated_at timestamptz DEFAULT now()
  );
  ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
  GRANT SELECT ON public.learning_progress TO authenticated;
  CREATE POLICY self_progress ON public.learning_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
`);

const baseAdminSql = readFileSync(new URL('../supabase/migrations/202610070001_education_admin.sql', import.meta.url), 'utf8');
const popupsSql = readFileSync(new URL('../supabase/migrations/202610260001_admin_popups_and_pro_analytics.sql', import.meta.url), 'utf8');
const setupCopySql = readFileSync(new URL('../supabase/SETUP-ADMIN-POPUPS-ONCE.sql', import.meta.url), 'utf8');

ok('copy/paste SQL matches migration byte-for-byte', popupsSql === setupCopySql);

await db.exec(baseAdminSql);
await db.exec(popupsSql);
await db.exec(popupsSql);
ok('popup migration is idempotent when applied twice', true);

await db.exec(`INSERT INTO public.education_admins (user_id, display_name) VALUES ('${admin}', 'مدیر اصلی')`);
await db.query(
  `INSERT INTO public.learning_progress (user_id, progress, language_progress, pronunciation_progress)
   VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)`,
  [
    studentA,
    JSON.stringify({ completedLessonIds: ['foundation-introducing-yourself'], learnedEssential504Words: ['keen'], totalMinutes: 42, currentStreak: 4, secretField: 'hidden' }),
    JSON.stringify({ de: { course: { completedLessonIds: ['de-1', 'de-2'] } }, tr: { completedLessonIds: ['tr-1'] } }),
    JSON.stringify({ 'en-1': true, 'de-1': true }),
  ],
);

async function as(id, role = 'authenticated') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id || '']);
  await db.exec(`SET ROLE ${role}`);
}

async function rejected(name, query, params = []) {
  let failed = false;
  try {
    await db.query(query, params);
  } catch {
    failed = true;
  }
  ok(name, failed);
}

// 1. Authorization checks
await as(null, 'anon');
await rejected(
  'anonymous visitor cannot create popup',
  "INSERT INTO public.admin_popups (title, body) VALUES ('هک', 'متن')",
);
await rejected(
  'anonymous visitor cannot call admin popup stats RPC',
  'SELECT * FROM public.admin_list_popups_with_stats()',
);

await as(studentA);
await rejected(
  'signed-in learner cannot create popup',
  "INSERT INTO public.admin_popups (title, body) VALUES ('تست', 'متن')",
);
await rejected(
  'signed-in learner cannot call admin popup stats RPC',
  'SELECT * FROM public.admin_list_popups_with_stats()',
);

// 2. Admin creates global, edition-specific, targeted, and inactive popups
await as(admin);
await rejected(
  'unsafe javascript: CTA URL is rejected by constraint',
  "INSERT INTO public.admin_popups (title, body, cta_label, cta_url) VALUES ('تست', 'متن', 'کلیک', 'javascript:alert(1)')",
);
await rejected(
  'user-targeted popup without target_user_id is rejected',
  "INSERT INTO public.admin_popups (title, body, target_scope) VALUES ('تست', 'متن', 'user')",
);

const globalPopup = (await db.query(
  `INSERT INTO public.admin_popups (title, body, variant, badge_text, cta_label, cta_url, display_mode, target_scope, target_edition, priority)
   VALUES ('خوش آمدید', 'نسخه جدید دوره آماده است.', 'celebration', 'ویژه', 'شروع یادگیری', '/languages', 'once', 'all', 'all', 10)
   RETURNING id`,
)).rows[0];

const turkishPopup = (await db.query(
  `INSERT INTO public.admin_popups (title, body, variant, target_scope, target_edition, priority)
   VALUES ('دوره ترکی', 'درس‌های تازه ترکی اضافه شد.', 'update', 'all', 'turkish', 5)
   RETURNING id`,
)).rows[0];

const targetedPopup = (await db.query(
  `INSERT INTO public.admin_popups (title, body, variant, target_scope, target_user_id, display_mode)
   VALUES ('پیام اختصاصی سارا', 'آفرین بابت زنجیره ۴ روزه!', 'info', 'user', $1, 'once')
   RETURNING id`,
  [studentA],
)).rows[0];

const pausedPopup = (await db.query(
  `INSERT INTO public.admin_popups (title, body, is_active)
   VALUES ('پیش‌نویس غیرفعال', 'نباید نمایش داده شود', false)
   RETURNING id`,
)).rows[0];

ok('admin created all 4 popups', Boolean(globalPopup.id && turkishPopup.id && targetedPopup.id && pausedPopup.id));

// 3. Visibility checks for anon, studentA, studentB
await as(null, 'anon');
const anonVisible = (await db.query('SELECT id FROM public.admin_popups ORDER BY priority DESC')).rows.map(r => r.id);
ok('anon sees active global popups only (not user-targeted or paused)', anonVisible.length === 2 && anonVisible.includes(globalPopup.id) && anonVisible.includes(turkishPopup.id));

await as(studentA);
const studentAVisible = (await db.query('SELECT id FROM public.admin_popups')).rows.map(r => r.id);
ok('target learner sees global popups plus their own targeted popup', studentAVisible.length === 3 && studentAVisible.includes(targetedPopup.id));

await as(studentB);
const studentBVisible = (await db.query('SELECT id FROM public.admin_popups')).rows.map(r => r.id);
ok('other learner never sees popup targeted to studentA', studentBVisible.length === 2 && !studentBVisible.includes(targetedPopup.id));

// 4. Event tracking & anti-spoofing
await as(null, 'anon');
await db.query("SELECT public.record_admin_popup_event($1, 'impression', 'anon_device_12345', 'main', 'web')", [globalPopup.id]);
await db.query("SELECT public.record_admin_popup_event($1, 'impression', 'anon_device_12345', 'main', 'web')", [globalPopup.id]);
await db.query("SELECT public.record_admin_popup_event($1, 'cta_click', 'anon_device_12345', 'main', 'web')", [globalPopup.id]);
await rejected(
  'anon cannot record event on user-targeted popup',
  "SELECT public.record_admin_popup_event($1, 'impression', 'anon_device_12345', 'main', 'web')",
  [targetedPopup.id],
);
await rejected('anon cannot read raw popup events table', 'SELECT * FROM public.admin_popup_events');

await as(studentB);
ok('authenticated non-admin sees 0 rows in raw popup events table', (await db.query('SELECT * FROM public.admin_popup_events')).rows.length === 0);
await rejected(
  'studentB cannot record event on studentA targeted popup',
  "SELECT public.record_admin_popup_event($1, 'impression', 'device_b_12345', 'main', 'android')",
  [targetedPopup.id],
);

await as(studentA);
await db.query("SELECT public.record_admin_popup_event($1, 'impression', 'ignored_for_auth', 'main', 'android')", [globalPopup.id]);
await db.query("SELECT public.record_admin_popup_event($1, 'dismiss', 'ignored_for_auth', 'main', 'android')", [globalPopup.id]);
await db.query("SELECT public.record_admin_popup_event($1, 'impression', 'ignored_for_auth', 'main', 'android')", [targetedPopup.id]);

// 5. Admin stats aggregation & multi-language roster
await as(admin);
const stats = (await db.query('SELECT * FROM public.admin_list_popups_with_stats()')).rows;
ok('admin sees all 4 popups including inactive drafts', stats.length === 4);
const globalStats = stats.find(row => row.id === globalPopup.id);
ok(
  'unique vs total impressions, clicks, and dismissals aggregate accurately',
  Number(globalStats.unique_impressions) === 2
    && Number(globalStats.total_impressions) === 3
    && Number(globalStats.unique_clicks) === 1
    && Number(globalStats.unique_dismissals) === 1,
);

const inviteCode = (await db.query("INSERT INTO public.education_invites (label) VALUES ('سارا') RETURNING code")).rows[0].code;
await as(studentA);
await db.query('SELECT public.accept_education_invite($1, $2, true)', [inviteCode, 'سارا احمدی']);
await as(admin);
const mlRoster = (await db.query('SELECT * FROM public.education_roster_multilang()')).rows;
ok(
  'multilang roster exposes DE/TR counts and pronunciation count without private fields',
  mlRoster.length === 1
    && mlRoster[0].summary.germanCompletedLessonIds.length === 2
    && mlRoster[0].summary.turkishCompletedLessonIds.length === 1
    && Number(mlRoster[0].summary.pronunciationKeysCount) === 2
    && !('secretField' in mlRoster[0].summary),
);

// 6. Global & Per-User Language Access Policies (__MILO_LANG_ACCESS_V1__)
await as(studentA);
await rejected(
  'non-admin learner cannot forge language access policy row',
  "INSERT INTO public.admin_popups (title, body, badge_text) VALUES ('[SYSTEM] Global', '{\"v\":1,\"enabled\":[\"en\"]}', '__MILO_LANG_ACCESS_V1__')",
);

await as(admin);
const globalLangRow = (await db.query(
  `INSERT INTO public.admin_popups (title, body, badge_text, target_scope, target_edition, is_active, priority)
   VALUES ('[SYSTEM] Global Language Access', '{"v":1,"enabled":["en","tr"],"message":"آلمانی موقتاً بسته است"}', '__MILO_LANG_ACCESS_V1__', 'all', 'all', true, 0)
   RETURNING id`,
)).rows[0];
const userALangLockAll = (await db.query(
  `INSERT INTO public.admin_popups (title, body, badge_text, target_scope, target_user_id, target_edition, is_active, priority)
   VALUES ('[SYSTEM] User Language Access', '{"v":1,"enabled":[],"message":"همه زبان‌ها بسته شدند"}', '__MILO_LANG_ACCESS_V1__', 'user', $1, 'all', true, 0)
   RETURNING id`,
  [studentA],
)).rows[0];
ok('admin stored global language policy and per-user disable-all policy', Boolean(globalLangRow.id && userALangLockAll.id));

await as(studentA);
const studentAPolicies = (await db.query(
  "SELECT target_scope, body FROM public.admin_popups WHERE badge_text = '__MILO_LANG_ACCESS_V1__' AND is_active = true",
)).rows;
ok(
  'studentA receives both global policy and their own disable-all language policy',
  studentAPolicies.length === 2
    && JSON.parse(studentAPolicies.find(r => r.target_scope === 'user').body).enabled.length === 0,
);

await as(studentB);
const studentBPolicies = (await db.query(
  "SELECT target_scope, body FROM public.admin_popups WHERE badge_text = '__MILO_LANG_ACCESS_V1__' AND is_active = true",
)).rows;
ok(
  'studentB sees only global language policy (never studentA lock)',
  studentBPolicies.length === 1 && studentBPolicies[0].target_scope === 'all',
);

// 7. Verify 4-APK app.config.js editions
const { createRequire } = await import('node:module');
const requireCjs = createRequire(import.meta.url);
const loadAppConfig = (envVars) => {
  const prev = {};
  for (const [k, v] of Object.entries(envVars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    delete requireCjs.cache[requireCjs.resolve('../app.config.js')];
    const mod = requireCjs('../app.config.js');
    const base = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
    return mod({ config: base.expo });
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
};

const cfgAdmin = loadAppConfig({ MILO_ADMIN_APP: 'true', EXPO_PUBLIC_APP_EDITION: undefined, EXPO_PUBLIC_LEARNER_LOGIN: undefined });
const cfgEnRu = loadAppConfig({ MILO_ADMIN_APP: undefined, EXPO_PUBLIC_APP_EDITION: 'en_ru', EXPO_PUBLIC_LEARNER_LOGIN: undefined });
const cfgAll4 = loadAppConfig({ MILO_ADMIN_APP: undefined, EXPO_PUBLIC_APP_EDITION: 'all_four', EXPO_PUBLIC_LEARNER_LOGIN: undefined });
const cfgLogin = loadAppConfig({ MILO_ADMIN_APP: undefined, EXPO_PUBLIC_APP_EDITION: 'login_en_de_tr', EXPO_PUBLIC_LEARNER_LOGIN: 'true' });

const rawAppJson = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const buildPropsPlugin = rawAppJson.expo.plugins.find(p => Array.isArray(p) && p[0] === 'expo-build-properties');
ok('Android packaging uses legacy native library compression for reliable sideloading', buildPropsPlugin?.[1]?.android?.useLegacyPackaging === true);

ok('App 1 (Admin) uses conflict-free com.devicecontrol.miloadmin.v2 (versionCode >= 200)', cfgAdmin.android.package === 'com.devicecontrol.miloadmin.v2' && cfgAdmin.android.versionCode >= 200);
ok('App 2 (No-Login EN+RU) uses conflict-free com.devicecontrol.mml.v2 without login', cfgEnRu.android.package === 'com.devicecontrol.mml.v2' && cfgEnRu.android.versionCode >= 200 && cfgEnRu.extra.edition === 'en_ru' && cfgEnRu.extra.learnerLogin === false);
ok('App 3 (No-Login All 4) uses conflict-free com.devicecontrol.miloall.v2 without login and keeps Turkish cloud narrator untouched', cfgAll4.android.package === 'com.devicecontrol.miloall.v2' && cfgAll4.android.versionCode >= 200 && cfgAll4.extra.edition === 'all_four' && cfgAll4.extra.learnerLogin === false && !cfgAll4.extra.turkishCloudNarrator);
ok('App 4 (Login EN+DE+TR) uses conflict-free com.devicecontrol.milomultilang.v2 with login and Turkish automatic narrator enabled', cfgLogin.android.package === 'com.devicecontrol.milomultilang.v2' && cfgLogin.android.versionCode >= 200 && cfgLogin.extra.edition === 'login_en_de_tr' && cfgLogin.extra.learnerLogin === true && cfgLogin.extra.turkishCloudNarrator === true);

await db.close();
console.log(`\nAdmin popups, language access & 4-APK suite: ${passed} checks passed`);
