-- Existing projects may have an older admin_registered_users() OUT-row shape.
-- PostgreSQL cannot change a RETURNS TABLE shape with CREATE OR REPLACE, so
-- replace the RPC atomically before applying the chat/support notification setup.
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
