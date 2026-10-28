import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'CRON';
  table?: 'chat_push_queue' | 'chat_push_tokens';
  schema?: 'public';
  record?: Record<string, unknown>;
};

type QueueRow = {
  id: string;
  event_key: string;
  event_type: string;
  recipient_id: string;
  conversation_id: string | null;
  title: string;
  body: string;
  status: 'pending' | 'processing' | 'submitted' | 'failed';
  attempt_count: number;
};

type PushToken = {
  id: string;
  expo_push_token: string;
  app_state: 'active' | 'background' | 'unknown';
  state_updated_at: string;
};

type DeliveryRow = {
  id: string;
  token_id: string | null;
  status: string;
  attempt_count: number;
};

type ExpoTicket = {
  status?: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

// Source-table triggers already resolve message recipients from conversation_members;
// this worker deliberately receives only the private, recipient-scoped outbox row.
const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const EXPO_TTL_SECONDS = 7 * 24 * 60 * 60;
const FOREGROUND_STATE_MAX_AGE_MS = 90_000;
const RECEIPT_WAIT_MS = 15 * 60 * 1000;
const MAX_BATCH_SIZE = 100;
const MAX_RECEIPTS = 300;
const RETRY_DELAY_MS = 60_000;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const asText = (value: unknown) => typeof value === 'string' ? value : '';

function expoError(ticket: ExpoTicket): string {
  return asText(ticket.details?.error) || asText(ticket.message) || 'Expo rejected the notification';
}

function isDeadToken(ticket: ExpoTicket): boolean {
  return ticket.details?.error === 'DeviceNotRegistered';
}

async function postExpo(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
}

async function setQueueStatus(
  admin: ReturnType<typeof createClient>,
  queueId: string,
  values: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from('chat_push_queue').update({
    ...values,
    updated_at: new Date().toISOString(),
  }).eq('id', queueId);
  if (error) throw error;
}

async function removeDeadToken(
  admin: ReturnType<typeof createClient>,
  tokenId: string | null,
): Promise<void> {
  if (!tokenId) return;
  const { error } = await admin.from('chat_push_tokens').delete().eq('id', tokenId);
  if (error) throw error;
}

async function claimQueueRow(
  admin: ReturnType<typeof createClient>,
  queueId: string,
  ignoreRetryDelay = false,
): Promise<QueueRow | null> {
  const now = new Date().toISOString();
  let pendingQuery = admin.from('chat_push_queue')
    .select('attempt_count')
    .eq('id', queueId)
    .eq('status', 'pending');
  if (!ignoreRetryDelay) pendingQuery = pendingQuery.lte('next_attempt_at', now);
  const { data: pending, error: lookupError } = await pendingQuery.maybeSingle();
  if (lookupError) throw lookupError;
  if (!pending) return null;

  // The status predicate makes this claim atomic even if duplicate webhooks race.
  let claimQuery = admin.from('chat_push_queue')
    .update({
      status: 'processing',
      claimed_at: now,
      updated_at: now,
      attempt_count: Number(pending.attempt_count || 0) + 1,
    })
    .eq('id', queueId)
    .eq('status', 'pending');
  if (!ignoreRetryDelay) claimQuery = claimQuery.lte('next_attempt_at', now);
  const { data, error } = await claimQuery
    .select('id,event_key,event_type,recipient_id,conversation_id,title,body,status,attempt_count')
    .maybeSingle();
  if (error) throw error;
  return data as QueueRow | null;
}

async function prepareDelivery(
  admin: ReturnType<typeof createClient>,
  queueId: string,
  tokenId: string,
  existing: DeliveryRow | undefined,
): Promise<DeliveryRow | null> {
  if (existing && !['retry'].includes(existing.status)) return null;
  if (existing) {
    const { data, error } = await admin.from('chat_push_deliveries')
      .update({
        status: 'submitting',
        attempt_count: existing.attempt_count + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('status', 'retry')
      .select('id,token_id,status,attempt_count')
      .maybeSingle();
    if (error) throw error;
    return data as DeliveryRow | null;
  }

  const { data, error } = await admin.from('chat_push_deliveries')
    .insert({ queue_id: queueId, token_id: tokenId, status: 'submitting', attempt_count: 1 })
    .select('id,token_id,status,attempt_count')
    .single();
  if (error) {
    // A duplicate queue webhook may race the first worker. A unique conflict is
    // a safe no-op; any other database error must keep the queue retryable.
    if (error.code === '23505') return null;
    throw error;
  }
  return data as DeliveryRow;
}

async function finishQueueFromDeliveries(
  admin: ReturnType<typeof createClient>,
  queueId: string,
): Promise<'pending' | 'submitted'> {
  const { data, error } = await admin.from('chat_push_deliveries')
    .select('status')
    .eq('queue_id', queueId);
  if (error) throw error;
  const statuses = (data || []).map(row => String(row.status));
  const hasRetry = statuses.includes('retry');
  const hasInFlight = statuses.includes('submitting');
  if (hasRetry) {
    await setQueueStatus(admin, queueId, {
      status: 'pending',
      next_attempt_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
    });
    return 'pending';
  }
  if (hasInFlight) {
    // An unresolved network result is intentionally not resent automatically;
    // doing so could duplicate a push already accepted by Expo.
    await setQueueStatus(admin, queueId, { status: 'failed', last_error: 'DELIVERY_RESULT_UNCERTAIN' });
    return 'submitted';
  }
  await setQueueStatus(admin, queueId, {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    last_error: null,
  });
  return 'submitted';
}

async function processQueueRow(
  admin: ReturnType<typeof createClient>,
  queueId: string,
  ignoreRetryDelay = false,
): Promise<{ submitted: number; pending: number; skipped: number }> {
  const queue = await claimQueueRow(admin, queueId, ignoreRetryDelay);
  if (!queue) return { submitted: 0, pending: 0, skipped: 1 };

  const { data: tokens, error: tokenError } = await admin.from('chat_push_tokens')
    .select('id,expo_push_token,app_state,state_updated_at')
    .eq('user_id', queue.recipient_id);
  if (tokenError) {
    await setQueueStatus(admin, queue.id, { status: 'pending', last_error: 'TOKEN_LOOKUP_FAILED' });
    throw tokenError;
  }
  if (!tokens?.length) {
    await setQueueStatus(admin, queue.id, {
      status: 'pending',
      next_attempt_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
      last_error: 'NO_REGISTERED_DEVICE_TOKEN',
    });
    return { submitted: 0, pending: 1, skipped: 0 };
  }

  const { data: previousDeliveries, error: deliveryLookupError } = await admin.from('chat_push_deliveries')
    .select('id,token_id,status,attempt_count')
    .eq('queue_id', queue.id);
  if (deliveryLookupError) {
    await setQueueStatus(admin, queue.id, { status: 'pending', last_error: 'DELIVERY_LOOKUP_FAILED' });
    throw deliveryLookupError;
  }
  const deliveryByToken = new Map<string, DeliveryRow>(
    (previousDeliveries || []).flatMap(row => row.token_id
      ? [[row.token_id, row as DeliveryRow] as const]
      : []),
  );

  const prepared: Array<{ token: PushToken; delivery: DeliveryRow; message: Record<string, unknown> }> = [];
  for (const rawToken of tokens) {
    const token = rawToken as PushToken;
    const delivery = await prepareDelivery(admin, queue.id, token.id, deliveryByToken.get(token.id));
    if (!delivery) continue;

    const stateUpdatedAt = Date.parse(token.state_updated_at);
    const isForeground = token.app_state === 'active'
      && Number.isFinite(stateUpdatedAt)
      && Date.now() - stateUpdatedAt <= FOREGROUND_STATE_MAX_AGE_MS;
    const conversationId = queue.conversation_id;
    const data = {
      eventId: queue.event_key,
      eventType: queue.event_type,
      ...(conversationId ? {
        conversationId,
        route: `/conversations/human/${conversationId}`,
      } : {
        route: '/conversations',
      }),
    };
    const message: Record<string, unknown> = {
      to: token.expo_push_token,
      title: queue.title,
      body: queue.body,
      priority: 'high',
      ttl: EXPO_TTL_SECONDS,
      channelId: isForeground ? 'milo-chat-quiet' : 'milo-chat',
      // Expo/FCM/APNs retain a submitted push until a disconnected device is
      // online, bounded by ttl. A submitted event is never enqueued twice.
      ...(isForeground ? { sound: null } : { sound: 'default' }),
      data,
    };
    prepared.push({ token, delivery, message });
  }

  if (!prepared.length) {
    const status = await finishQueueFromDeliveries(admin, queue.id);
    return status === 'pending'
      ? { submitted: 0, pending: 1, skipped: 0 }
      : { submitted: 0, pending: 0, skipped: 1 };
  }

  let submitted = 0;
  let retry = false;
  let uncertain = false;
  for (let offset = 0; offset < prepared.length; offset += MAX_BATCH_SIZE) {
    const batch = prepared.slice(offset, offset + MAX_BATCH_SIZE);
    let response: Response;
    try {
      response = await postExpo(EXPO_SEND_URL, batch.map(item => item.message));
    } catch {
      // The provider may have accepted the batch before a timeout/reset. Keep
      // these delivery rows as submitting so they are never automatically sent
      // again and cannot create duplicate alarms.
      uncertain = true;
      await Promise.all(batch.map(({ delivery }) => admin.from('chat_push_deliveries')
        .update({ status: 'unknown', last_error: 'EXPO_RESULT_UNCERTAIN', updated_at: new Date().toISOString() })
        .eq('id', delivery.id)));
      continue;
    }

    if (!response.ok) {
      retry = true;
      const message = `EXPO_HTTP_${response.status}`;
      await Promise.all(batch.map(({ delivery }) => admin.from('chat_push_deliveries')
        .update({ status: 'retry', last_error: message, updated_at: new Date().toISOString() })
        .eq('id', delivery.id)));
      continue;
    }

    let result: { data?: ExpoTicket | ExpoTicket[] };
    try {
      result = await response.json();
    } catch {
      uncertain = true;
      await Promise.all(batch.map(({ delivery }) => admin.from('chat_push_deliveries')
        .update({ status: 'unknown', last_error: 'EXPO_RESULT_UNCERTAIN', updated_at: new Date().toISOString() })
        .eq('id', delivery.id)));
      continue;
    }

    const tickets = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    for (let index = 0; index < batch.length; index += 1) {
      const { token, delivery } = batch[index];
      const ticket = tickets[index];
      if (ticket?.status === 'ok' && ticket.id) {
        const { error } = await admin.from('chat_push_deliveries').update({
          status: 'submitted',
          expo_ticket_id: ticket.id,
          last_error: null,
          updated_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        if (error) throw error;
        submitted += 1;
      } else if (ticket && isDeadToken(ticket)) {
        await removeDeadToken(admin, token.id);
        const { error } = await admin.from('chat_push_deliveries').update({
          status: 'dead_token',
          last_error: expoError(ticket),
          receipt_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        if (error) throw error;
      } else if (ticket?.status === 'error') {
        retry = true;
        const { error } = await admin.from('chat_push_deliveries').update({
          status: 'retry',
          last_error: expoError(ticket).slice(0, 240),
          updated_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        if (error) throw error;
      } else {
        retry = true;
        const { error } = await admin.from('chat_push_deliveries').update({
          status: 'retry',
          last_error: 'EXPO_TICKET_MISSING',
          updated_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        if (error) throw error;
      }
    }
  }

  const finalStatus = await finishQueueFromDeliveries(admin, queue.id);
  if (uncertain && finalStatus === 'submitted') {
    await setQueueStatus(admin, queue.id, { status: 'failed', last_error: 'DELIVERY_RESULT_UNCERTAIN' });
  }
  if (retry && finalStatus === 'pending') return { submitted, pending: 1, skipped: 0 };
  return { submitted, pending: 0, skipped: 0 };
}

async function processPendingQueue(
  admin: ReturnType<typeof createClient>,
  recipientId?: string,
): Promise<{ submitted: number; pending: number; skipped: number }> {
  let query = admin.from('chat_push_queue')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);
  if (recipientId) query = query.eq('recipient_id', recipientId);
  else query = query.lte('next_attempt_at', new Date().toISOString());
  const { data, error } = await query;
  if (error) throw error;

  const total = { submitted: 0, pending: 0, skipped: 0 };
  for (const row of data || []) {
    const result = await processQueueRow(admin, String(row.id), !!recipientId);
    total.submitted += result.submitted;
    total.pending += result.pending;
    total.skipped += result.skipped;
  }
  return total;
}

async function processReceipts(admin: ReturnType<typeof createClient>): Promise<{ checked: number; deadTokens: number }> {
  const cutoff = new Date(Date.now() - RECEIPT_WAIT_MS).toISOString();
  const { data: deliveries, error } = await admin.from('chat_push_deliveries')
    .select('id,token_id,expo_ticket_id')
    .eq('status', 'submitted')
    .is('receipt_checked_at', null)
    .not('expo_ticket_id', 'is', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_RECEIPTS);
  if (error) throw error;
  if (!deliveries?.length) return { checked: 0, deadTokens: 0 };

  const ids = deliveries.map(row => String(row.expo_ticket_id));
  const response = await postExpo(EXPO_RECEIPTS_URL, { ids });
  if (!response.ok) return { checked: 0, deadTokens: 0 };
  const result = await response.json() as { data?: Record<string, ExpoTicket> };
  const receipts = result.data || {};
  let checked = 0;
  let deadTokens = 0;
  const checkedAt = new Date().toISOString();

  for (const delivery of deliveries) {
    const receipt = receipts[String(delivery.expo_ticket_id)];
    if (!receipt) continue;
    if (receipt.status === 'ok') {
      const { error: updateError } = await admin.from('chat_push_deliveries').update({
        status: 'receipt_ok',
        receipt_checked_at: checkedAt,
        updated_at: checkedAt,
      }).eq('id', delivery.id);
      if (updateError) throw updateError;
      checked += 1;
    } else if (isDeadToken(receipt)) {
      await removeDeadToken(admin, delivery.token_id ? String(delivery.token_id) : null);
      const { error: updateError } = await admin.from('chat_push_deliveries').update({
        status: 'dead_token',
        last_error: expoError(receipt).slice(0, 240),
        receipt_checked_at: checkedAt,
        updated_at: checkedAt,
      }).eq('id', delivery.id);
      if (updateError) throw updateError;
      checked += 1;
      deadTokens += 1;
    } else if (receipt.status === 'error') {
      const { error: updateError } = await admin.from('chat_push_deliveries').update({
        status: 'receipt_error',
        last_error: expoError(receipt).slice(0, 240),
        receipt_checked_at: checkedAt,
        updated_at: checkedAt,
      }).eq('id', delivery.id);
      if (updateError) throw updateError;
      checked += 1;
    }
  }
  return { checked, deadTokens };
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('CHAT_WEBHOOK_SECRET');
  if (!secret || request.headers.get('x-chat-webhook-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json() as WebhookPayload;
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server configuration is incomplete' }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    if (payload.type === 'CRON') {
      const receipts = await processReceipts(admin);
      const queue = await processPendingQueue(admin);
      return json({ ...queue, receipts });
    }

    if (payload.schema !== 'public') return json({ skipped: true });
    if (payload.table === 'chat_push_queue' && payload.type === 'INSERT') {
      const queueId = asText(payload.record?.id);
      if (!queueId) return json({ error: 'Queue row id is missing' }, 400);
      return json(await processQueueRow(admin, queueId));
    }

    // A newly registered device token wakes the existing outbox without making
    // message delivery depend on either sender's app process.
    if (payload.table === 'chat_push_tokens' && payload.type === 'INSERT') {
      const userId = asText(payload.record?.user_id);
      if (!userId) return json({ error: 'Token owner is missing' }, 400);
      return json(await processPendingQueue(admin, userId));
    }

    return json({ skipped: true });
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message).slice(0, 300)
      : 'Push processing failed';
    return json({ error: message }, 500);
  }
});
