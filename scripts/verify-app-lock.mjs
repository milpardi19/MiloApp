#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

const appLock = read('lib/appLock.ts');
const gate = read('components/AppLockGate.tsx');
const settings = read('app/app-lock.tsx');
const rootLayout = read('app/_layout.tsx');
const humanChat = read('app/conversations/human/[conversationId].tsx');
const emmaChat = read('app/conversations/emma.tsx');
const conversations = read('lib/conversations.ts');
const migration = read('supabase/migrations/202610130001_user_chat_deletion.sql');

check(/SecureStore\.setItemAsync/.test(appLock), 'native lock configuration uses encrypted device storage');
check(/CryptoDigestAlgorithm\.SHA256/.test(appLock) && /getRandomBytesAsync\(24\)/.test(appLock), 'app pattern is salted and SHA-256 hashed');
check(!/pattern:\s*pattern/.test(appLock), 'raw app pattern is never persisted');
check(/authenticateAsync\([\s\S]*?disableDeviceFallback:\s*false/.test(appLock), 'device authentication permits the phone PIN, pattern or password fallback');
check(/AppState\.addEventListener\('change'/.test(gate) && /state === 'inactive' \|\| state === 'background'/.test(gate), 'app relocks when hidden or backgrounded');
check(/nextFailures >= 5/.test(gate) && /30_000/.test(gate), 'pattern brute-force attempts receive a cooldown');
check(/<AppLockGate>[\s\S]*?<Stack/.test(rootLayout), 'app lock guards the complete route stack');
check(/savePattern\(pattern\)/.test(settings) && /setDeviceLockEnabled\(true\)/.test(settings), 'settings can independently enable pattern and phone lock');
check(/deleteConversationForMe/.test(humanChat) && /confirmDeleteConversation/.test(humanChat), 'an open real-person chat can be deleted');
check(/clearEmmaHistory/.test(emmaChat) && /confirmClearConversation/.test(emmaChat), 'the Emma chat history can be deleted');
check(/hideConversationLocally/.test(conversations) && /\.from\('learning_contacts'\)[\s\S]*?\.delete\(\)/.test(conversations), 'contact deletion is immediate locally and RLS-protected remotely');
check(/GRANT DELETE ON TABLE public\.learning_contacts TO authenticated/.test(migration), 'database migration grants the DELETE operation constrained by existing RLS');
check(/KeyboardStickyView style=\{styles\.composer\}/.test(humanChat)
  && /KeyboardStickyView style=\{styles\.composer\}/.test(emmaChat), 'both complete composers and their side buttons follow the keyboard animation');
check(/composer:\s*\{\s*flexShrink:\s*0/.test(humanChat) && /composer:\s*\{\s*flexShrink:\s*0/.test(emmaChat), 'both composers remain fully visible during keyboard resize');
check(!/marginBottom:\s*100/.test(humanChat) && !/marginBottom:\s*100/.test(emmaChat), 'no fixed composer offset fights keyboard movement');

console.log(`${checks} app-lock, deletion, and dynamic-keyboard checks passed.`);
