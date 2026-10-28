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
