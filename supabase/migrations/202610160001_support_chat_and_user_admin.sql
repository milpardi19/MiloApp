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
