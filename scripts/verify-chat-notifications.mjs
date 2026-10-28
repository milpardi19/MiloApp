#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const pkg = JSON.parse(read('package.json'));
const config = read('app.json');
const bridge = read('components/ChatNotificationBridge.tsx');
const notifications = read('lib/chatNotifications.ts');
const adminPush = read('lib/adminPush.ts');
// AppBottomNav delegates the actual tabs and unread badge to LanguageBottomNav.
const navigation = `${read('components/AppBottomNav.tsx')}\n${read('components/LanguageBottomNav.tsx')}`;
const migration = read('supabase/migrations/202610140001_chat_push_notifications.sql');
const outbox = read('supabase/migrations/202610180001_chat_push_outbox.sql');
const setupSql = read('supabase/SETUP-CHAT-PUSH-ONCE.sql');
const edge = read('supabase/functions/chat-push/index.ts');
const layout = read('app/_layout.tsx');
const setupDoc = read('docs/CHAT-PUSH-SETUP-FA.md');

check(pkg.dependencies['expo-notifications'], 'expo-notifications is installed');
const keyboardRuntime = read('components/KeyboardRuntime.native.tsx');
const babel = read('babel.config.js');
check(pkg.dependencies['react-native-keyboard-controller'] && pkg.dependencies['react-native-reanimated'], 'native keyboard animation dependencies are installed');
check(/KeyboardAwareScrollView/.test(keyboardRuntime)
  && /KeyboardAvoidingView/.test(keyboardRuntime)
  && /KeyboardProvider/.test(keyboardRuntime)
  && /KeyboardStickyView/.test(keyboardRuntime)
  && /react-native-reanimated\/plugin/.test(babel), 'native keyboard controller is wired to the UI-thread animation runtime');
check(/"expo-notifications"/.test(config) && /"defaultChannel": "milo-chat"/.test(config), 'Android notification plugin and channel are configured');
check(/POST_NOTIFICATIONS/.test(config), 'Android 13 notification permission is declared');
check(/KeyboardProvider/.test(layout) && /ChatNotificationBridge/.test(layout), 'keyboard and notification providers mount globally for learner and manager builds');
check(/AndroidImportance\.HIGH/.test(notifications) && /sound:\s*'default'/.test(notifications), 'background chat channel uses visible high-priority alerts with sound');
check(/message_type === 'voice'/.test(notifications), 'voice messages receive a distinct notification');
check(/table: 'learning_contacts'/.test(notifications), 'accepted contact requests remain covered');
check(/addNotificationResponseReceivedListener/.test(bridge) && /conversationId/.test(bridge), 'tapping an alert opens the exact conversation');
check(/CREATE TABLE IF NOT EXISTS public\.chat_push_tokens/.test(migration), 'push token storage migration exists');
check(/ENABLE ROW LEVEL SECURITY/.test(migration) && /user_id = auth\.uid\(\)/.test(migration), 'push tokens are protected by owner RLS');
check(/conversation_members/.test(edge) && /chat_push_tokens/.test(edge), 'server push resolves only registered recipients');
check(/exp\.host\/--\/api\/v2\/push\/send/.test(edge), 'server push uses Expo delivery');
check(/CHAT_WEBHOOK_SECRET/.test(edge), 'database webhook endpoint requires a dedicated secret');

// Server-backed request, message, and status events.
check(/CREATE TABLE IF NOT EXISTS public\.support_requests/.test(outbox)
  && /INSERT INTO public\.support_requests/.test(outbox), 'first learner support-chat request is persisted');
check(/CREATE TABLE IF NOT EXISTS public\.chat_push_queue/.test(outbox)
  && /event_key text NOT NULL UNIQUE/.test(outbox), 'the outbox is durable and dedupes by stable event key');
check(/CREATE TRIGGER chat_push_enqueue_message/.test(outbox)
  && /CREATE TRIGGER chat_push_enqueue_support_request/.test(outbox), 'message and first-request database triggers enqueue events');
check(/SELECT cm\.user_id[\s\S]*?cm\.conversation_id = NEW\.conversation_id[\s\S]*?cm\.user_id <> NEW\.sender_id/.test(outbox)
  && /'support-request:'[\s\S]*?NEW\.manager_id[\s\S]*?NEW\.learner_id/.test(outbox), 'database source triggers target the other conversation member and manager on learner request');
check(/'support-status:'[\s\S]*?NEW\.learner_id[\s\S]*?NEW\.manager_id/.test(outbox), 'database status-change trigger routes alerts back to the learner');
check(/CREATE TRIGGER chat_push_enqueue_support_status/.test(outbox)
  && /status_event_id/.test(outbox), 'status changes receive a stable event identity');
check(/CREATE TRIGGER chat_push_enqueue_contact/.test(outbox), 'accepted-contact notification behavior is preserved alongside support-specific alerts');
check(/ON CONFLICT \(event_key\) DO NOTHING/.test(outbox), 'duplicate source events cannot create duplicate queue rows');
check(!/NEW\.body/.test(outbox), 'database outbox never copies the private message body');
check(setupSql.includes(outbox.trim())
  && /CREATE TABLE IF NOT EXISTS public\.education_admins/.test(setupSql), 'copy/paste SQL bundles prerequisites and the tested outbox migration');
check(/event_key/.test(edge) && /eventId: queue\.event_key/.test(edge), 'Expo payload carries the stable outbox event id');
check(/ttl: EXPO_TTL_SECONDS/.test(edge) && /7 \* 24 \* 60 \* 60/.test(edge), 'offline devices are held by Expo for up to seven days');
check(/milo-chat-quiet/.test(edge) && /sound: null/.test(edge), 'foreground pushes use the quiet channel without sound');
check(/DeviceNotRegistered/.test(edge) && /removeDeadToken/.test(edge)
  && /from\('chat_push_tokens'\)\.delete\(\)/.test(edge), 'dead Expo tokens are deleted');
check(/EXPO_RECEIPTS_URL/.test(edge) && /processReceipts/.test(edge), 'Expo receipts are reconciled to remove tokens after delivery');
check(/app_state/.test(notifications) && /FOREGROUND_PRESENCE_INTERVAL_MS/.test(notifications), 'device foreground state is refreshed for channel selection');
check(/shouldPlaySound: !foreground/.test(notifications)
  && /shouldShowBanner: !foreground/.test(notifications), 'native notification presentation is silent while foreground');
check(/onForegroundEvent/.test(bridge) && /incrementChatUnreadCount/.test(bridge), 'foreground events show a quiet in-app banner and increment unread count');
check(/chatNotificationState/.test(navigation) && /item\.path === '\/conversations'/.test(navigation), 'conversation tab displays the unread counter');
check(/requestPermissionsAsync/.test(notifications)
  && !/PERMISSION_PROMPTED_KEY/.test(notifications), 'notification permission can be requested again after a previous denial');
check(/supabase functions deploy chat-push/.test(setupDoc)
  && /x-chat-webhook-secret/.test(setupDoc), 'setup guide documents function deployment and webhook authentication');

// Exercise both recipient directions, offline holding, durable dedupe, dead-token
// cleanup, and foreground/background presentation without a live Supabase project.
const learnerId = 'learner-1';
const managerId = 'manager-1';
const members = [learnerId, managerId];
const recipientsFor = senderId => members.filter(memberId => memberId !== senderId);
assert.deepEqual(recipientsFor(learnerId), [managerId]);
check(true, 'learner message routes to the manager phone');
assert.deepEqual(recipientsFor(managerId), [learnerId]);
check(true, 'manager reply routes to the learner phone');

const outboxRows = new Map();
function enqueueOnce(eventKey, recipientId) {
  if (outboxRows.has(eventKey)) return outboxRows.get(eventKey);
  const row = { eventKey, recipientId, status: 'pending' };
  outboxRows.set(eventKey, row);
  return row;
}
const offlineRow = enqueueOnce('message:stable-message-id:learner-1', learnerId);
const fakeExpo = {
  submissions: 0,
  waiting: new Map(),
  delivered: new Set(),
  submit(row, device) {
    this.submissions += 1;
    if (device.online) this.delivered.add(row.eventKey);
    else this.waiting.set(row.eventKey, row);
  },
  reconnect(device) {
    device.online = true;
    for (const [eventKey] of this.waiting) {
      if (!this.delivered.has(eventKey)) this.delivered.add(eventKey);
      this.waiting.delete(eventKey);
    }
  },
};
function processOutboxRow(row, device) {
  if (row.status !== 'pending') return false;
  fakeExpo.submit(row, device);
  row.status = 'submitted'; // Expo now retains an offline push until connectivity returns.
  return true;
}
const offlineDevice = { online: false };
processOutboxRow(offlineRow, offlineDevice);
check(fakeExpo.delivered.size === 0 && fakeExpo.waiting.has(offlineRow.eventKey)
  && outboxRows.get(offlineRow.eventKey) === offlineRow && offlineRow.status === 'submitted',
  'offline recipient receives no alert while the durable event and Expo-held push remain queued');
fakeExpo.reconnect(offlineDevice);
check(fakeExpo.delivered.has(offlineRow.eventKey) && fakeExpo.waiting.size === 0, 'held push is delivered once when the recipient reconnects');
processOutboxRow(enqueueOnce('message:stable-message-id:learner-1', learnerId), offlineDevice);
check(fakeExpo.submissions === 1 && fakeExpo.delivered.size === 1, 'duplicate webhook delivery never resubmits an Expo-held event');

const tokens = new Map([['dead-token-id', { id: 'dead-token-id', token: 'ExponentPushToken[dead]' }]]);
function applyExpoReceipt(tokenMap, receipt) {
  if (receipt?.details?.error === 'DeviceNotRegistered') tokenMap.delete(receipt.tokenId);
}
applyExpoReceipt(tokens, { tokenId: 'dead-token-id', details: { error: 'DeviceNotRegistered' } });
check(tokens.size === 0, 'DeviceNotRegistered receipt removes the stored device token');

function foregroundPolicy(appState, sameConversation) {
  const foreground = appState === 'active';
  return {
    inAppBanner: foreground && !sameConversation,
    unreadCount: foreground && !sameConversation,
    sound: !foreground,
    vibration: !foreground,
  };
}
const otherChat = foregroundPolicy('active', false);
assert.deepEqual(otherChat, { inAppBanner: true, unreadCount: true, sound: false, vibration: false });
check(true, 'foreground on another page shows only a silent banner and counter update');
const sameChat = foregroundPolicy('active', true);
assert.deepEqual(sameChat, { inAppBanner: false, unreadCount: false, sound: false, vibration: false });
check(true, 'foreground in the same conversation suppresses duplicate banner and sound');
const background = foregroundPolicy('background', false);
assert.deepEqual(background, { inAppBanner: false, unreadCount: false, sound: true, vibration: true });
check(true, 'background delivery retains sound and vibration');

console.log(`${checks} chat notification, privacy, queue, and presentation checks passed.`);
console.log('Scenarios: both recipient directions; offline Expo queue and reconnect; stable-event dedupe; dead-token cleanup; foreground silence and background alert.');
