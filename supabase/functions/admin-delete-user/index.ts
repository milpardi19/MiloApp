import { createClient } from 'npm:@supabase/supabase-js@2';

// Permanently deletes a learner account. Only the single education manager may
// call it. The caller is verified from its own JWT (is_education_admin) before
// the service-role key is used.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) return json({ error: 'Invalid session', code: 'AUTH_REQUIRED' }, 401);

  const { data: allowed, error: roleError } = await callerClient.rpc('is_education_admin');
  if (roleError) return json({ error: 'Role check failed', code: 'ROLE_CHECK_FAILED' }, 500);
  if (!allowed) return json({ error: 'Manager role required', code: 'ADMIN_REQUIRED' }, 403);

  let body: { userId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid body', code: 'BAD_REQUEST' }, 400);
  }
  const targetId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!UUID.test(targetId)) return json({ error: 'userId is required', code: 'BAD_REQUEST' }, 400);
  if (targetId === callerData.user.id) return json({ error: 'The manager cannot delete their own account', code: 'SELF_DELETE' }, 400);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: managerRow, error: managerError } = await admin
    .from('education_admins')
    .select('user_id')
    .eq('user_id', targetId)
    .maybeSingle();
  if (managerError) return json({ error: 'Account check failed', code: 'DELETE_FAILED' }, 500);
  if (managerRow) return json({ error: 'Manager accounts cannot be deleted here', code: 'ADMIN_ACCOUNT' }, 400);

  // Remove app-level links first so the learner disappears from every chat list.
  const cleanup = [
    admin.from('learning_contacts').delete().or(`user_id.eq.${targetId},contact_id.eq.${targetId}`),
    admin.from('conversation_members').delete().eq('user_id', targetId),
    admin.from('profiles').delete().eq('id', targetId),
  ];
  for (const step of cleanup) {
    const { error } = await step;
    if (error) return json({ error: 'Cleanup failed', code: 'DELETE_FAILED' }, 500);
  }

  // app_user_profiles and other auth-linked rows cascade from auth.users.
  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
  if (deleteError) return json({ error: 'Account deletion failed', code: 'DELETE_FAILED' }, 500);

  return json({ ok: true, deletedUserId: targetId });
});
