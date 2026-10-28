-- Multiple concurrent contact invitations plus manager-controlled chat access.
-- Deleted conversations are soft-deleted so they can be restored; no messages are
-- irreversibly removed by this feature.
BEGIN;

-- Existing create_contact_invite revoked all previous pending invitations. Keep
-- every unexpired invite usable so a learner can add several contacts.
CREATE OR REPLACE FUNCTION public.create_contact_invite(p_display_name text DEFAULT 'زبان‌آموز')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  generated_code text;
  attempt integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_chat_access a WHERE a.user_id = auth.uid() AND a.is_blocked) THEN
    RAISE EXCEPTION 'CHAT_ACCESS_BLOCKED';
  END IF;

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (auth.uid(), COALESCE(NULLIF(pg_catalog.btrim(p_display_name), ''), 'زبان‌آموز'), pg_catalog.now())
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, last_seen = pg_catalog.now();

  LOOP
    attempt := attempt + 1;
    generated_code := pg_catalog.lpad((pg_catalog.floor(pg_catalog.random() * 900000) + 100000)::integer::text, 6, '0');
    BEGIN
      INSERT INTO public.contact_invites (code, creator_id) VALUES (generated_code, auth.uid());
      RETURN generated_code;
    EXCEPTION WHEN unique_violation THEN
      IF attempt >= 10 THEN RAISE EXCEPTION 'Could not generate invite code'; END IF;
    END;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.create_contact_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_contact_invite(text) TO authenticated;

-- Re-create claim RPC to deny blocked parties while retaining the existing
-- atomic invite claim and symmetric two-member conversation semantics.
CREATE OR REPLACE FUNCTION public.claim_contact_invite(p_code text, p_display_name text DEFAULT 'زبان‌آموز')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invite_row public.contact_invites%ROWTYPE;
  new_conversation_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_chat_access a WHERE a.user_id = auth.uid() AND a.is_blocked) THEN
    RAISE EXCEPTION 'CHAT_ACCESS_BLOCKED';
  END IF;

  SELECT * INTO invite_row FROM public.contact_invites
  WHERE code = pg_catalog.btrim(p_code) AND status = 'pending' AND expires_at > pg_catalog.now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite is invalid or expired'; END IF;
  IF invite_row.creator_id = auth.uid() THEN RAISE EXCEPTION 'You cannot claim your own invite'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_chat_access a WHERE a.user_id = invite_row.creator_id AND a.is_blocked) THEN
    RAISE EXCEPTION 'CONTACT_CHAT_ACCESS_BLOCKED';
  END IF;

  SELECT conversation_id INTO new_conversation_id FROM public.learning_contacts
  WHERE user_id = auth.uid() AND contact_id = invite_row.creator_id;
  IF new_conversation_id IS NOT NULL THEN RETURN new_conversation_id; END IF;

  INSERT INTO public.profiles (id, display_name, last_seen)
  VALUES (auth.uid(), COALESCE(NULLIF(pg_catalog.btrim(p_display_name), ''), 'زبان‌آموز'), pg_catalog.now())
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, last_seen = pg_catalog.now();

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO new_conversation_id;
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (new_conversation_id, invite_row.creator_id), (new_conversation_id, auth.uid());
  INSERT INTO public.learning_contacts (user_id, contact_id, conversation_id)
  VALUES
    (invite_row.creator_id, auth.uid(), new_conversation_id),
    (auth.uid(), invite_row.creator_id, new_conversation_id);

  UPDATE public.contact_invites
  SET status = 'claimed', claimed_by = auth.uid(), claimed_at = pg_catalog.now()
  WHERE id = invite_row.id;
  RETURN new_conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_contact_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_contact_invite(text, text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_chat_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_blocked boolean NOT NULL DEFAULT false,
  reason text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.user_chat_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_chat_access FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_chat_access TO authenticated;
DROP POLICY IF EXISTS user_chat_access_self_or_admin_read ON public.user_chat_access;
CREATE POLICY user_chat_access_self_or_admin_read ON public.user_chat_access
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_education_admin());

CREATE TABLE IF NOT EXISTS public.chat_conversation_moderation (
  conversation_id uuid PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.chat_conversation_moderation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_conversation_moderation FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chat_conversation_moderation TO authenticated;
DROP POLICY IF EXISTS chat_conversation_moderation_member_or_admin_read ON public.chat_conversation_moderation;
CREATE POLICY chat_conversation_moderation_member_or_admin_read ON public.chat_conversation_moderation
  FOR SELECT TO authenticated USING (
    public.is_education_admin()
    OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = chat_conversation_moderation.conversation_id AND cm.user_id = (SELECT auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_chat_access a WHERE a.user_id = auth.uid() AND a.is_blocked)
    AND NOT EXISTS (SELECT 1 FROM public.chat_conversation_moderation m WHERE m.conversation_id = p_conversation_id AND m.deleted_at IS NOT NULL)
    AND EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = p_conversation_id AND cm.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_conversation_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid) TO authenticated;

DROP POLICY IF EXISTS messages_update_sender ON public.messages;
CREATE POLICY messages_update_sender ON public.messages FOR UPDATE TO authenticated
USING (sender_id = (SELECT auth.uid()) AND public.is_conversation_member(conversation_id))
WITH CHECK (sender_id = (SELECT auth.uid()) AND public.is_conversation_member(conversation_id));

CREATE OR REPLACE FUNCTION public.admin_set_chat_access(p_user_id uuid, p_blocked boolean, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF p_user_id IS NULL OR p_user_id = auth.uid() THEN RAISE EXCEPTION 'INVALID_USER'; END IF;
  INSERT INTO public.user_chat_access(user_id, is_blocked, reason, updated_by, updated_at)
  VALUES (p_user_id, p_blocked, NULLIF(pg_catalog.left(pg_catalog.btrim(COALESCE(p_reason, '')), 240), ''), auth.uid(), pg_catalog.now())
  ON CONFLICT (user_id) DO UPDATE SET is_blocked = EXCLUDED.is_blocked, reason = EXCLUDED.reason,
    updated_by = auth.uid(), updated_at = pg_catalog.now();
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_chat_access(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_chat_access(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_conversation_deleted(p_conversation_id uuid, p_deleted boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF p_deleted THEN
    INSERT INTO public.chat_conversation_moderation(conversation_id, deleted_at, deleted_by, updated_at)
    VALUES (p_conversation_id, pg_catalog.now(), auth.uid(), pg_catalog.now())
    ON CONFLICT (conversation_id) DO UPDATE SET deleted_at = pg_catalog.now(), deleted_by = auth.uid(), updated_at = pg_catalog.now();
  ELSE
    INSERT INTO public.chat_conversation_moderation(conversation_id, deleted_at, deleted_by, updated_at)
    VALUES (p_conversation_id, NULL, auth.uid(), pg_catalog.now())
    ON CONFLICT (conversation_id) DO UPDATE SET deleted_at = NULL, deleted_by = auth.uid(), updated_at = pg_catalog.now();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_conversation_deleted(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_conversation_deleted(uuid, boolean) TO authenticated;

COMMIT;
