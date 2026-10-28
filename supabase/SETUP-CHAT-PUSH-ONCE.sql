-- Dashboard copy/paste bundle for the existing learner/admin chat backend and offline Expo push.
-- Applies the current relevant migrations in order; all included migrations are idempotent.
-- Prerequisite: run supabase/SETUP-COPY-PASTE-ONCE.sql first for base conversation/learning tables.


-- ===== Source migration: supabase/migrations/202610070001_education_admin.sql =====

-- Educational management only. No device, message, or contact policies are changed.
-- Prerequisite: learning_progress (SETUP-PRODUCTION.sql).
BEGIN;
CREATE TABLE IF NOT EXISTS public.education_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 80)
);
ALTER TABLE public.education_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_admins FROM anon, authenticated;
GRANT SELECT ON public.education_admins TO authenticated;
DROP POLICY IF EXISTS education_admin_self ON public.education_admins;
CREATE POLICY education_admin_self ON public.education_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_education_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.education_admins WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_education_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_education_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.education_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.education_admins(user_id) ON DELETE CASCADE,
 label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 80),
 code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
 claimed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.education_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_invites FROM anon, authenticated;
GRANT SELECT, DELETE ON public.education_invites TO authenticated;
GRANT INSERT (label) ON public.education_invites TO authenticated;
DROP POLICY IF EXISTS education_invites_owner ON public.education_invites;
CREATE POLICY education_invites_owner ON public.education_invites FOR ALL TO authenticated
USING (admin_id = auth.uid() AND public.is_education_admin())
WITH CHECK (admin_id = auth.uid() AND public.is_education_admin());

CREATE TABLE IF NOT EXISTS public.education_enrollments (
 admin_id uuid NOT NULL REFERENCES public.education_admins(user_id) ON DELETE CASCADE,
 student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 80),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
 consent_version text NOT NULL DEFAULT 'education-v1',
 consent_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (admin_id, student_id),
 CHECK (admin_id <> student_id)
);
ALTER TABLE public.education_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_enrollments FROM anon, authenticated;
GRANT SELECT, DELETE ON public.education_enrollments TO authenticated;
GRANT UPDATE (status) ON public.education_enrollments TO authenticated;
DROP POLICY IF EXISTS education_enrollment_read ON public.education_enrollments;
CREATE POLICY education_enrollment_read ON public.education_enrollments FOR SELECT TO authenticated
USING (student_id = auth.uid() OR (admin_id = auth.uid() AND public.is_education_admin()));
DROP POLICY IF EXISTS education_enrollment_update ON public.education_enrollments;
CREATE POLICY education_enrollment_update ON public.education_enrollments FOR UPDATE TO authenticated
USING (admin_id = auth.uid() AND public.is_education_admin())
WITH CHECK (admin_id = auth.uid() AND public.is_education_admin());
DROP POLICY IF EXISTS education_enrollment_delete ON public.education_enrollments;
CREATE POLICY education_enrollment_delete ON public.education_enrollments FOR DELETE TO authenticated
USING (student_id = auth.uid() OR (admin_id = auth.uid() AND public.is_education_admin()));

-- Allows the learner to see the manager's name BEFORE consenting. No roster is exposed.
CREATE OR REPLACE FUNCTION public.preview_education_invite(p_code uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE manager_name text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT a.display_name INTO manager_name FROM public.education_invites i
 JOIN public.education_admins a ON a.user_id = i.admin_id
 WHERE i.code = p_code AND i.claimed_at IS NULL AND i.expires_at > now();
 IF manager_name IS NULL THEN RAISE EXCEPTION 'INVITE_INVALID'; END IF;
 RETURN manager_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_education_invite(p_code uuid, p_name text, p_consent boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invitation public.education_invites;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF p_consent IS DISTINCT FROM true THEN RAISE EXCEPTION 'CONSENT_REQUIRED'; END IF;
 IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'NAME_INVALID'; END IF;
 SELECT * INTO invitation FROM public.education_invites WHERE code = p_code FOR UPDATE;
 IF NOT FOUND OR invitation.claimed_at IS NOT NULL OR invitation.expires_at <= now() THEN RAISE EXCEPTION 'INVITE_INVALID'; END IF;
 IF invitation.admin_id = auth.uid() THEN RAISE EXCEPTION 'SELF_INVITE'; END IF;
 INSERT INTO public.education_enrollments(admin_id,student_id,display_name)
 VALUES (invitation.admin_id,auth.uid(),btrim(p_name));
 UPDATE public.education_invites SET claimed_at = now() WHERE id = invitation.id;
END;
$$;

-- Only a narrow educational summary; never grants admins access to whole progress rows,
-- private conversations, profiles, device tables, or other managers' students.
CREATE OR REPLACE FUNCTION public.education_roster()
RETURNS TABLE(student_id uuid, display_name text, status text, consent_at timestamptz, synced_at timestamptz, summary jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 RETURN QUERY SELECT e.student_id,e.display_name,e.status,e.consent_at,
 CASE WHEN e.status = 'active' THEN p.updated_at END,
 CASE WHEN e.status = 'active' AND p.user_id IS NOT NULL THEN jsonb_build_object(
 'completedLessonIds',p.progress->'completedLessonIds',
 'learnedEssential504Words',p.progress->'learnedEssential504Words',
 'totalMinutes',p.progress->'totalMinutes',
 'currentStreak',p.progress->'currentStreak') END
 FROM public.education_enrollments e LEFT JOIN public.learning_progress p ON p.user_id = e.student_id
 WHERE e.admin_id = auth.uid() ORDER BY e.consent_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.preview_education_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_education_invite(uuid,text,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.education_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_education_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_education_invite(uuid,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.education_roster() TO authenticated;
COMMIT;


-- ===== Source migration: supabase/migrations/202610070002_education_disabled_default.sql =====

-- Default-off switch for the educational admin backend.
-- Does not disable students' ability to withdraw previous consent.
BEGIN;
CREATE TABLE IF NOT EXISTS public.education_feature_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 management_enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.education_feature_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_feature_settings FROM PUBLIC, anon, authenticated;
INSERT INTO public.education_feature_settings(id,management_enabled) VALUES (true,false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.education_management_enabled()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT COALESCE((SELECT management_enabled FROM public.education_feature_settings WHERE id),false);
$$;
REVOKE ALL ON FUNCTION public.education_management_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.education_management_enabled() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_education_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT public.education_management_enabled() AND EXISTS (
 SELECT 1 FROM public.education_admins WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_education_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_education_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.preview_education_invite(p_code uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE manager_name text;
BEGIN
 IF NOT public.education_management_enabled() THEN RAISE EXCEPTION 'EDUCATION_DISABLED'; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT a.display_name INTO manager_name FROM public.education_invites i
 JOIN public.education_admins a ON a.user_id = i.admin_id
 WHERE i.code = p_code AND i.claimed_at IS NULL AND i.expires_at > now();
 IF manager_name IS NULL THEN RAISE EXCEPTION 'INVITE_INVALID'; END IF;
 RETURN manager_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_education_invite(p_code uuid, p_name text, p_consent boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invitation public.education_invites;
BEGIN
 IF NOT public.education_management_enabled() THEN RAISE EXCEPTION 'EDUCATION_DISABLED'; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF p_consent IS DISTINCT FROM true THEN RAISE EXCEPTION 'CONSENT_REQUIRED'; END IF;
 IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'NAME_INVALID'; END IF;
 SELECT * INTO invitation FROM public.education_invites WHERE code = p_code FOR UPDATE;
 IF NOT FOUND OR invitation.claimed_at IS NOT NULL OR invitation.expires_at <= now() THEN RAISE EXCEPTION 'INVITE_INVALID'; END IF;
 IF invitation.admin_id = auth.uid() THEN RAISE EXCEPTION 'SELF_INVITE'; END IF;
 INSERT INTO public.education_enrollments(admin_id,student_id,display_name)
 VALUES (invitation.admin_id,auth.uid(),btrim(p_name));
 UPDATE public.education_invites SET claimed_at = now() WHERE id = invitation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_education_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_education_invite(uuid,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_education_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_education_invite(uuid,text,boolean) TO authenticated;
COMMIT;


-- ===== Source migration: supabase/migrations/202610140001_chat_push_notifications.sql =====

-- Device registrations used by the chat notification Edge Function.
CREATE TABLE IF NOT EXISTS public.chat_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL CHECK (expo_push_token ~ '^ExponentPushToken|^ExpoPushToken'),
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  device_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_chat_push_tokens_user ON public.chat_push_tokens(user_id);
ALTER TABLE public.chat_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_push_tokens_read_self ON public.chat_push_tokens;
CREATE POLICY chat_push_tokens_read_self ON public.chat_push_tokens
FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS chat_push_tokens_insert_self ON public.chat_push_tokens;
CREATE POLICY chat_push_tokens_insert_self ON public.chat_push_tokens
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS chat_push_tokens_update_self ON public.chat_push_tokens;
CREATE POLICY chat_push_tokens_update_self ON public.chat_push_tokens
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS chat_push_tokens_delete_self ON public.chat_push_tokens;
CREATE POLICY chat_push_tokens_delete_self ON public.chat_push_tokens
FOR DELETE TO authenticated USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_push_tokens TO authenticated;

-- The foreground/background realtime bridge listens for accepted contacts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'learning_contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_contacts;
  END IF;
END $$;


-- ===== Source migration: supabase/migrations/202610140002_registered_users_admin.sql =====

-- Registered learner directory for the single-owner management application.
-- Profiles contain account/operational metadata only; private messages are never exposed.
BEGIN;

CREATE TABLE IF NOT EXISTS public.app_user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (length(btrim(email)) BETWEEN 3 AND 254),
  platform text CHECK (platform IN ('android', 'ios', 'web')),
  app_version text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_user_profiles_last_seen_idx
  ON public.app_user_profiles(last_seen_at DESC);

ALTER TABLE public.app_user_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_user_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_user_profiles TO authenticated;

DROP POLICY IF EXISTS app_user_profiles_read_self ON public.app_user_profiles;
CREATE POLICY app_user_profiles_read_self ON public.app_user_profiles
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS app_user_profiles_insert_self ON public.app_user_profiles;
CREATE POLICY app_user_profiles_insert_self ON public.app_user_profiles
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS app_user_profiles_update_self ON public.app_user_profiles;
CREATE POLICY app_user_profiles_update_self ON public.app_user_profiles
FOR UPDATE TO authenticated USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Older projects may have the same RPC name with a different OUT-row shape.
-- PostgreSQL cannot change a RETURNS TABLE shape with CREATE OR REPLACE; drop and
-- recreate it inside this migration transaction so the change remains atomic.
DROP FUNCTION IF EXISTS public.admin_registered_users();
CREATE OR REPLACE FUNCTION public.admin_registered_users()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  platform text,
  app_version text,
  registered_at timestamptz,
  last_seen_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.email, p.platform, p.app_version,
         p.registered_at, p.last_seen_at
  FROM public.app_user_profiles p
  ORDER BY p.registered_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_registered_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_registered_users() TO authenticated;

-- Exactly one operational manager may exist. The migration intentionally fails
-- if production already contains multiple managers so ownership is resolved explicitly.
ALTER TABLE public.education_admins
  ADD COLUMN IF NOT EXISTS singleton_key smallint NOT NULL DEFAULT 1 CHECK (singleton_key = 1);
CREATE UNIQUE INDEX IF NOT EXISTS education_admins_single_owner_idx
  ON public.education_admins(singleton_key);

COMMIT;


-- ===== Source migration: supabase/migrations/202610160001_support_chat_and_user_admin.sql =====

-- Learner support chat with the single manager account.
-- Each learner gets one private one-to-one conversation with the manager.
-- Reuses the existing conversations, conversation_members, learning_contacts,
-- and messages tables, so the existing RLS rules keep the chat private.
BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_support_conversation(p_display_name text DEFAULT 'زبان‌آموز')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id uuid := auth.uid();
  manager_id uuid;
  existing_conversation uuid;
  new_conversation_id uuid;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT user_id INTO manager_id FROM public.education_admins
  WHERE singleton_key = 1 LIMIT 1;
  IF manager_id IS NULL THEN RAISE EXCEPTION 'SUPPORT_UNAVAILABLE'; END IF;
  IF manager_id = caller_id THEN RAISE EXCEPTION 'SUPPORT_SELF'; END IF;

  SELECT conversation_id INTO existing_conversation FROM public.learning_contacts
  WHERE user_id = caller_id AND contact_id = manager_id;
  IF existing_conversation IS NOT NULL THEN RETURN existing_conversation; END IF;

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (caller_id, COALESCE(NULLIF(btrim(p_display_name), ''), 'زبان‌آموز'), now())
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, last_seen = now();

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (manager_id, 'پشتیبانی Milo', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO new_conversation_id;
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (new_conversation_id, manager_id), (new_conversation_id, caller_id);
  INSERT INTO public.learning_contacts (user_id, contact_id, conversation_id)
  VALUES
    (manager_id, caller_id, new_conversation_id),
    (caller_id, manager_id, new_conversation_id);

  RETURN new_conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_support_conversation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_support_conversation(text) TO authenticated;

COMMIT;


-- ===== Source migration: supabase/migrations/202610180001_chat_push_outbox.sql =====

-- Durable chat/support notification outbox.
-- Source-table triggers enqueue metadata only; a Supabase Database Webhook on
-- chat_push_queue INSERT invokes the chat-push Edge Function, which sends Expo
-- pushes and records tickets/receipts. Message bodies are never copied here.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.conversations') IS NULL
     OR to_regclass('public.conversation_members') IS NULL
     OR to_regclass('public.learning_contacts') IS NULL
     OR to_regclass('public.messages') IS NULL
     OR to_regclass('public.profiles') IS NULL
     OR to_regclass('public.education_admins') IS NULL
     OR to_regclass('public.chat_push_tokens') IS NULL THEN
    RAISE EXCEPTION 'Chat, education-admin, and chat_push_tokens migrations must be applied first.';
  END IF;
END
$$;

-- A support conversation is also a request with a manager-visible status.
CREATE TABLE IF NOT EXISTS public.support_requests (
  conversation_id uuid PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.education_admins(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  status_event_id uuid NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (learner_id <> manager_id)
);

CREATE INDEX IF NOT EXISTS support_requests_learner_created_idx
  ON public.support_requests(learner_id, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.support_requests TO authenticated;
GRANT UPDATE (status) ON public.support_requests TO authenticated;

DROP POLICY IF EXISTS support_requests_participant_read ON public.support_requests;
CREATE POLICY support_requests_participant_read ON public.support_requests
  FOR SELECT TO authenticated
  USING (
    learner_id = (SELECT auth.uid())
    OR (manager_id = (SELECT auth.uid()) AND public.is_education_admin())
  );

DROP POLICY IF EXISTS support_requests_manager_update ON public.support_requests;
CREATE POLICY support_requests_manager_update ON public.support_requests
  FOR UPDATE TO authenticated
  USING (manager_id = (SELECT auth.uid()) AND public.is_education_admin())
  WITH CHECK (manager_id = (SELECT auth.uid()) AND public.is_education_admin());

CREATE OR REPLACE FUNCTION public.set_support_request_event_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.updated_at := pg_catalog.now();
    NEW.status_event_id := pg_catalog.gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_support_request_event_metadata() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS support_requests_set_event_metadata ON public.support_requests;
CREATE TRIGGER support_requests_set_event_metadata
  BEFORE UPDATE OF status ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_support_request_event_metadata();

-- Keep the existing RPC and conversation model; record a request only when
-- the first private manager conversation is created (or repair an older row).
CREATE OR REPLACE FUNCTION public.ensure_support_conversation(p_display_name text DEFAULT 'زبان‌آموز')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  manager_id uuid;
  existing_conversation uuid;
  new_conversation_id uuid;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT a.user_id INTO manager_id
  FROM public.education_admins AS a
  WHERE a.singleton_key = 1
  LIMIT 1;
  IF manager_id IS NULL THEN RAISE EXCEPTION 'SUPPORT_UNAVAILABLE'; END IF;
  IF manager_id = caller_id THEN RAISE EXCEPTION 'SUPPORT_SELF'; END IF;

  SELECT c.conversation_id INTO existing_conversation
  FROM public.learning_contacts AS c
  WHERE c.user_id = caller_id AND c.contact_id = manager_id;
  IF existing_conversation IS NOT NULL THEN
    INSERT INTO public.support_requests (conversation_id, learner_id, manager_id)
    VALUES (existing_conversation, caller_id, manager_id)
    ON CONFLICT (conversation_id) DO NOTHING;
    RETURN existing_conversation;
  END IF;

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (caller_id, COALESCE(NULLIF(pg_catalog.btrim(p_display_name), ''), 'زبان‌آموز'), pg_catalog.now())
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name, last_seen = pg_catalog.now();

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (manager_id, 'پشتیبانی Milo', pg_catalog.now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (new_conversation_id, manager_id), (new_conversation_id, caller_id);

  INSERT INTO public.learning_contacts (user_id, contact_id, conversation_id)
  VALUES
    (manager_id, caller_id, new_conversation_id),
    (caller_id, manager_id, new_conversation_id);

  INSERT INTO public.support_requests (conversation_id, learner_id, manager_id)
  VALUES (new_conversation_id, caller_id, manager_id);

  RETURN new_conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_support_conversation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_support_conversation(text) TO authenticated;

-- Backfill existing manager conversations without producing historical alerts.
INSERT INTO public.support_requests (conversation_id, learner_id, manager_id)
SELECT lc.conversation_id, lc.contact_id, lc.user_id
FROM public.learning_contacts AS lc
JOIN public.education_admins AS a ON a.user_id = lc.user_id
WHERE lc.contact_id <> lc.user_id
ON CONFLICT (conversation_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;
  END IF;
END
$$;

-- Device/app state is per Expo token. Fresh foreground state selects a quiet
-- notification channel; missing/stale state defaults to the background channel.
ALTER TABLE public.chat_push_tokens
  ADD COLUMN IF NOT EXISTS app_state text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS state_updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chat_push_tokens'::regclass
      AND conname = 'chat_push_tokens_app_state_check'
  ) THEN
    ALTER TABLE public.chat_push_tokens
      ADD CONSTRAINT chat_push_tokens_app_state_check
      CHECK (app_state IN ('active', 'background', 'unknown'));
  END IF;
END
$$;

-- One durable row per logical event and recipient. event_key uses persistent
-- source identifiers (message id, conversation id + status event id, etc.).
CREATE TABLE IF NOT EXISTS public.chat_push_queue (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  event_type text NOT NULL CHECK (event_type IN ('message', 'support_request', 'support_status', 'contact')),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (pg_catalog.char_length(title) <= 120),
  body text NOT NULL CHECK (pg_catalog.char_length(body) <= 160),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'submitted', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  submitted_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_push_queue_pending_idx
  ON public.chat_push_queue(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS chat_push_queue_recipient_idx
  ON public.chat_push_queue(recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_push_deliveries (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.chat_push_queue(id) ON DELETE CASCADE,
  token_id uuid REFERENCES public.chat_push_tokens(id) ON DELETE SET NULL,
  expo_ticket_id text UNIQUE,
  status text NOT NULL CHECK (status IN ('submitting', 'submitted', 'retry', 'unknown', 'dead_token', 'receipt_ok', 'receipt_error')),
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  last_error text,
  receipt_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (queue_id, token_id)
);

CREATE INDEX IF NOT EXISTS chat_push_deliveries_receipts_idx
  ON public.chat_push_deliveries(status, created_at)
  WHERE expo_ticket_id IS NOT NULL AND receipt_checked_at IS NULL;

ALTER TABLE public.chat_push_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_push_queue, public.chat_push_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.chat_push_queue, public.chat_push_deliveries TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.chat_push_tokens TO service_role;

COMMENT ON TABLE public.chat_push_queue IS
  'Private server outbox for Expo push. Contains safe titles/sender labels only; never message text.';
COMMENT ON COLUMN public.chat_push_queue.event_key IS
  'Stable per-event/per-recipient idempotency key; unique conflicts are ignored by source triggers.';

CREATE OR REPLACE FUNCTION public.enqueue_chat_push_event(
  p_event_key text,
  p_event_type text,
  p_recipient_id uuid,
  p_conversation_id uuid,
  p_actor_id uuid,
  p_title text,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_recipient_id IS NULL OR p_event_key IS NULL OR pg_catalog.length(p_event_key) > 240 THEN
    RETURN;
  END IF;

  INSERT INTO public.chat_push_queue (
    event_key, event_type, recipient_id, conversation_id, actor_id, title, body
  ) VALUES (
    p_event_key,
    p_event_type,
    p_recipient_id,
    p_conversation_id,
    p_actor_id,
    pg_catalog.left(COALESCE(NULLIF(pg_catalog.btrim(p_title), ''), 'میلو'), 120),
    pg_catalog.left(COALESCE(NULLIF(pg_catalog.btrim(p_body), ''), 'رویداد تازه در گفتگو'), 160)
  )
  ON CONFLICT (event_key) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_chat_push_event(text, text, uuid, uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_chat_message_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  sender_is_manager boolean;
  is_support_conversation boolean;
  event_type text;
  event_title text;
  event_body text;
BEGIN
  SELECT COALESCE(NULLIF(pg_catalog.btrim(p.display_name), ''), 'زبان‌آموز')
  INTO sender_name
  FROM public.profiles AS p
  WHERE p.id = NEW.sender_id;
  sender_name := COALESCE(sender_name, 'زبان‌آموز');

  SELECT EXISTS (
    SELECT 1 FROM public.education_admins AS a WHERE a.user_id = NEW.sender_id
  ) INTO sender_is_manager;
  SELECT EXISTS (
    SELECT 1 FROM public.support_requests AS r WHERE r.conversation_id = NEW.conversation_id
  ) INTO is_support_conversation;

  FOR recipient_id IN
    SELECT cm.user_id
    FROM public.conversation_members AS cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id
  LOOP
    IF is_support_conversation AND sender_is_manager THEN
      event_type := 'message';
      event_title := 'پاسخ تازه از پشتیبانی';
      event_body := 'فرستنده: پشتیبانی Milo';
    ELSIF is_support_conversation THEN
      event_type := 'message';
      event_title := 'پیام تازه از زبان‌آموز';
      event_body := 'فرستنده: ' || pg_catalog.left(sender_name, 80);
    ELSIF NEW.message_type = 'voice' THEN
      event_type := 'message';
      event_title := 'پیام صوتی تازه از ' || pg_catalog.left(sender_name, 70);
      event_body := 'برای شنیدن پیام، گفتگو را باز کنید.';
    ELSE
      event_type := 'message';
      event_title := 'پیام تازه از ' || pg_catalog.left(sender_name, 70);
      event_body := 'برای مشاهده پیام، گفتگو را باز کنید.';
    END IF;

    PERFORM public.enqueue_chat_push_event(
      'message:' || NEW.id::text || ':' || recipient_id::text,
      event_type,
      recipient_id,
      NEW.conversation_id,
      NEW.sender_id,
      event_title,
      event_body
    );
  END LOOP;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_chat_message_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chat_push_enqueue_message ON public.messages;
CREATE TRIGGER chat_push_enqueue_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_chat_message_push();

CREATE OR REPLACE FUNCTION public.enqueue_support_request_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  learner_name text;
BEGIN
  SELECT COALESCE(NULLIF(pg_catalog.btrim(p.display_name), ''), 'زبان‌آموز')
  INTO learner_name
  FROM public.profiles AS p
  WHERE p.id = NEW.learner_id;

  PERFORM public.enqueue_chat_push_event(
    'support-request:' || NEW.conversation_id::text || ':' || NEW.manager_id::text,
    'support_request',
    NEW.manager_id,
    NEW.conversation_id,
    NEW.learner_id,
    'درخواست چت تازه',
    'فرستنده: ' || pg_catalog.left(COALESCE(learner_name, 'زبان‌آموز'), 80)
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_support_request_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chat_push_enqueue_support_request ON public.support_requests;
CREATE TRIGGER chat_push_enqueue_support_request
  AFTER INSERT ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_support_request_push();

CREATE OR REPLACE FUNCTION public.enqueue_support_status_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  status_message text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  status_message := CASE NEW.status
    WHEN 'resolved' THEN 'درخواست پشتیبانی شما پاسخ داده شد.'
    ELSE 'درخواست پشتیبانی شما دوباره باز شد.'
  END;

  PERFORM public.enqueue_chat_push_event(
    'support-status:' || NEW.conversation_id::text || ':' || NEW.status_event_id::text,
    'support_status',
    NEW.learner_id,
    NEW.conversation_id,
    NEW.manager_id,
    'وضعیت درخواست پشتیبانی تغییر کرد',
    status_message
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_support_status_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chat_push_enqueue_support_status ON public.support_requests;
CREATE TRIGGER chat_push_enqueue_support_status
  AFTER UPDATE OF status ON public.support_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enqueue_support_status_push();

-- Preserve the existing accepted-contact notification for regular private chats;
-- support contacts are handled once by support_requests instead.
CREATE OR REPLACE FUNCTION public.enqueue_contact_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.education_admins AS a
    WHERE a.user_id = NEW.user_id OR a.user_id = NEW.contact_id
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.enqueue_chat_push_event(
    'contact:' || NEW.conversation_id::text || ':' || NEW.user_id::text,
    'contact',
    NEW.user_id,
    NEW.conversation_id,
    NEW.contact_id,
    'مخاطب تازه در میلو',
    'یک گفتگوی خصوصی جدید برای شما فعال شد.'
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_contact_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chat_push_enqueue_contact ON public.learning_contacts;
CREATE TRIGGER chat_push_enqueue_contact
  AFTER INSERT ON public.learning_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_contact_push();

COMMIT;


-- ===== Source migration: supabase/migrations/202610180002_admin_registered_users_return_shape.sql =====

-- Compatibility fix for existing installations with a different RPC row shape.
BEGIN;
DROP FUNCTION IF EXISTS public.admin_registered_users();
CREATE FUNCTION public.admin_registered_users()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  platform text,
  app_version text,
  registered_at timestamptz,
  last_seen_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.email, p.platform, p.app_version,
         p.registered_at, p.last_seen_at
  FROM public.app_user_profiles p
  ORDER BY p.registered_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_registered_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_registered_users() TO authenticated;
COMMIT;

