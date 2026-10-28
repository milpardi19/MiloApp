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
