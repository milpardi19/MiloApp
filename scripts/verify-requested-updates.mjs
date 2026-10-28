#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
let checks = 0;
const verify = (condition, message) => { assert.ok(condition, message); checks += 1; };
const sharedNav = read('components/LanguageBottomNav.tsx');
const ruNav = read('components/RussianBottomNav.tsx') + sharedNav;
const deNav = read('components/GermanBottomNav.tsx') + sharedNav;
const logo = read('components/MiloLogoMotion.tsx');
const root = read('app/_layout.tsx');
const entry = read('app/index.tsx');
const appConfig = read('app.json');
const invite = read('app/conversations/invite.tsx');
const conversations = read('lib/conversations.ts');
const admin = read('app/admin/index.tsx');
const migration = read('supabase/migrations/202610190001_multi_contact_chat_moderation.sql');
const copySql = read('supabase/SETUP-MULTI-CONTACT-ADMIN-ONCE.sql');

verify(ruNav.includes("'/learn/ru/pronunciation'") && ruNav.includes("'/conversations'"), 'Russian navigation links to pronunciation and real conversations');
verify(/flexDirection: 'row-reverse'/.test(ruNav) && /flexDirection: 'row-reverse'/.test(deNav), 'Russian and German navigation remain RTL');
verify(deNav.includes("'/conversations'"), 'German navigation links to real conversations');
verify(logo.includes("const SUBTITLE = 'MULTILANGUAGE'"), 'startup logo displays the full MiloMultiLanguage wordmark');
verify(/const \[introComplete, setIntroComplete\] = useState\(Platform\.OS === 'web'\)/.test(root) && /const \[fontsLoaded, fontError\] = useFonts/.test(root) && /if \(!fontsLoaded && !fontError\) return;[\s\S]*?setIntroComplete\(true\)/.test(root) && /if\s*\(!fontsLoaded && !fontError\)\s*return null/.test(root) && /useRootNavigationState/.test(root) && /!rootNavigationState\?\.key/.test(root) && /<Redirect href=\{target as never\} \/>/.test(entry) && !/},\s*3400\)/.test(root), 'startup waits for fonts and mounted root navigation before route normalization and has no fixed logo delay');
verify(/"name": "MiloMultiLanguage"/.test(appConfig), 'application display name uses the full brand');
verify(/admin \? '\/admin' : '\/languages'/.test(entry), 'fresh learner and admin launches go to their home screens');
verify(!/AsyncStorage\.clear\(/.test(root + conversations), 'normal startup and chat changes do not clear saved learner progress');
verify(invite.includes('ساخت کد دعوت برای مخاطب دیگر'), 'invite UI allows creating additional contact codes');
const inviteFn = migration.slice(migration.indexOf('FUNCTION public.create_contact_invite'), migration.indexOf('FUNCTION public.claim_contact_invite'));
verify(!/UPDATE public\.contact_invites SET status = 'revoked'/.test(inviteFn), 'creating a new invite no longer revokes earlier pending invitations');
verify(/CREATE TABLE IF NOT EXISTS public\.user_chat_access/.test(migration) && /ENABLE ROW LEVEL SECURITY/.test(migration), 'chat access controls are stored behind RLS');
verify(/a\.is_blocked/.test(migration) && /CHAT_ACCESS_BLOCKED/.test(migration), 'blocked users cannot create or claim chat invitations');
verify(/NOT EXISTS \(SELECT 1 FROM public\.user_chat_access/.test(migration), 'blocked users lose conversation membership and message access');
verify(/CREATE OR REPLACE FUNCTION public\.admin_set_chat_access[\s\S]*?IF NOT public\.is_education_admin\(\)/.test(migration), 'only an education admin can block or restore chat access');
verify(/CREATE OR REPLACE FUNCTION public\.admin_set_conversation_deleted[\s\S]*?IF NOT public\.is_education_admin\(\)/.test(migration), 'only an education admin can hide or restore conversations');
verify(/deleted_at timestamptz/.test(migration) && !/DELETE FROM public\.messages/.test(migration), 'conversation deletion is recoverable and does not erase message rows');
verify(/setChatUserBlocked/.test(admin) && /setChatConversationDeleted/.test(admin), 'admin panel exposes block/allow and hide/restore actions');
verify(migration.trim() === copySql.trim(), 'dashboard copy/paste SQL matches the deployable migration exactly');

console.log(`${checks} requested-update and moderation checks passed.`);
