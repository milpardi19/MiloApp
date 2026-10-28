/**
 * One-time SQL setup for live manager popups & real analytics.
 * Kept identical in behavior to `supabase/SETUP-ADMIN-POPUPS-ONCE.sql` so the
 * manager can copy it with one tap from the Admin App if the migration has not
 * yet been executed on the connected Supabase project.
 */
export const ADMIN_POPUPS_SETUP_SQL = `-- نصب یک‌مرحله‌ای سیستم پاپ‌آپ زنده و آمار واقعی پنل مدیریت
-- این اسکریپت را در Supabase Dashboard -> SQL Editor اجرا کنید.
BEGIN;

ALTER TABLE public.learning_progress
  ADD COLUMN IF NOT EXISTS language_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pronunciation_progress jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.admin_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.education_admins(user_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (pg_catalog.length(pg_catalog.btrim(title)) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (pg_catalog.length(pg_catalog.btrim(body)) BETWEEN 1 AND 1200),
  variant text NOT NULL DEFAULT 'info' CHECK (variant IN ('info', 'celebration', 'warning', 'update')),
  badge_text text CHECK (badge_text IS NULL OR pg_catalog.length(pg_catalog.btrim(badge_text)) <= 40),
  image_url text CHECK (
    image_url IS NULL
    OR (pg_catalog.length(pg_catalog.btrim(image_url)) <= 600 AND image_url ~* '^https://')
  ),
  cta_label text CHECK (cta_label IS NULL OR pg_catalog.length(pg_catalog.btrim(cta_label)) <= 60),
  cta_url text CHECK (
    cta_url IS NULL
    OR (
      pg_catalog.length(pg_catalog.btrim(cta_url)) <= 500
      AND (cta_url LIKE '/%' OR cta_url ~* '^https://')
    )
  ),
  dismiss_label text NOT NULL DEFAULT 'متوجه شدم' CHECK (pg_catalog.length(pg_catalog.btrim(dismiss_label)) BETWEEN 1 AND 40),
  display_mode text NOT NULL DEFAULT 'once' CHECK (display_mode IN ('once', 'every_launch', 'persistent_blocking')),
  target_scope text NOT NULL DEFAULT 'all' CHECK (target_scope IN ('all', 'user')),
  target_edition text NOT NULL DEFAULT 'all' CHECK (target_edition IN ('all', 'main', 'turkish')),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  priority smallint NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT admin_popups_target_consistency CHECK (
    (target_scope = 'user' AND target_user_id IS NOT NULL)
    OR (target_scope = 'all' AND target_user_id IS NULL)
  ),
  CONSTRAINT admin_popups_cta_consistency CHECK (
    (cta_label IS NULL AND cta_url IS NULL)
    OR (cta_label IS NOT NULL AND cta_url IS NOT NULL)
  ),
  CONSTRAINT admin_popups_expiry_window CHECK (
    expires_at IS NULL OR expires_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS admin_popups_active_lookup_idx
  ON public.admin_popups (is_active, target_scope, target_edition, priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_popups_target_user_idx
  ON public.admin_popups (target_user_id)
  WHERE target_scope = 'user' AND is_active = true;

ALTER TABLE public.admin_popups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_popups FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_popups TO anon, authenticated;
GRANT INSERT (
  title, body, variant, badge_text, image_url, cta_label, cta_url,
  dismiss_label, display_mode, target_scope, target_edition, target_user_id,
  priority, is_active, starts_at, expires_at
) ON public.admin_popups TO authenticated;
GRANT UPDATE (
  title, body, variant, badge_text, image_url, cta_label, cta_url,
  dismiss_label, display_mode, target_scope, target_edition, target_user_id,
  priority, is_active, starts_at, expires_at, updated_at
) ON public.admin_popups TO authenticated;
GRANT DELETE ON public.admin_popups TO authenticated;

DROP POLICY IF EXISTS admin_popups_public_active_read ON public.admin_popups;
CREATE POLICY admin_popups_public_active_read ON public.admin_popups
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND target_scope = 'all'
    AND starts_at <= pg_catalog.now()
    AND (expires_at IS NULL OR expires_at > pg_catalog.now())
  );

DROP POLICY IF EXISTS admin_popups_targeted_or_admin_read ON public.admin_popups;
CREATE POLICY admin_popups_targeted_or_admin_read ON public.admin_popups
  FOR SELECT TO authenticated
  USING (
    public.is_education_admin()
    OR (
      is_active = true
      AND target_scope = 'user'
      AND target_user_id = (SELECT auth.uid())
      AND starts_at <= pg_catalog.now()
      AND (expires_at IS NULL OR expires_at > pg_catalog.now())
    )
  );

DROP POLICY IF EXISTS admin_popups_manager_insert ON public.admin_popups;
CREATE POLICY admin_popups_manager_insert ON public.admin_popups
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = (SELECT auth.uid()) AND public.is_education_admin());

DROP POLICY IF EXISTS admin_popups_manager_update ON public.admin_popups;
CREATE POLICY admin_popups_manager_update ON public.admin_popups
  FOR UPDATE TO authenticated
  USING (admin_id = (SELECT auth.uid()) AND public.is_education_admin())
  WITH CHECK (admin_id = (SELECT auth.uid()) AND public.is_education_admin());

DROP POLICY IF EXISTS admin_popups_manager_delete ON public.admin_popups;
CREATE POLICY admin_popups_manager_delete ON public.admin_popups
  FOR DELETE TO authenticated
  USING (admin_id = (SELECT auth.uid()) AND public.is_education_admin());

CREATE TABLE IF NOT EXISTS public.admin_popup_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  popup_id uuid NOT NULL REFERENCES public.admin_popups(id) ON DELETE CASCADE,
  actor_key text NOT NULL CHECK (pg_catalog.length(pg_catalog.btrim(actor_key)) BETWEEN 6 AND 128),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'cta_click', 'dismiss')),
  edition text NOT NULL DEFAULT 'main' CHECK (edition IN ('main', 'turkish')),
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('android', 'ios', 'web')),
  first_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  last_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  hit_count integer NOT NULL DEFAULT 1 CHECK (hit_count >= 1),
  UNIQUE (popup_id, actor_key, event_type)
);

CREATE INDEX IF NOT EXISTS admin_popup_events_popup_idx
  ON public.admin_popup_events (popup_id, event_type);

ALTER TABLE public.admin_popup_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_popup_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_popup_events TO authenticated;

DROP POLICY IF EXISTS admin_popup_events_manager_read ON public.admin_popup_events;
CREATE POLICY admin_popup_events_manager_read ON public.admin_popup_events
  FOR SELECT TO authenticated
  USING (
    public.is_education_admin()
    AND EXISTS (
      SELECT 1 FROM public.admin_popups ap
      WHERE ap.id = admin_popup_events.popup_id AND ap.admin_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.record_admin_popup_event(
  p_popup_id uuid,
  p_event_type text,
  p_client_id text DEFAULT NULL,
  p_edition text DEFAULT 'main',
  p_platform text DEFAULT 'web'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_popup public.admin_popups%ROWTYPE;
  v_actor text;
  v_clean_client text := pg_catalog.btrim(COALESCE(p_client_id, ''));
  v_edition text := CASE WHEN p_edition = 'turkish' THEN 'turkish' ELSE 'main' END;
  v_platform text := CASE WHEN p_platform IN ('android', 'ios', 'web') THEN p_platform ELSE 'web' END;
BEGIN
  IF p_popup_id IS NULL THEN RAISE EXCEPTION 'POPUP_ID_REQUIRED'; END IF;
  IF p_event_type IS NULL OR p_event_type NOT IN ('impression', 'cta_click', 'dismiss') THEN
    RAISE EXCEPTION 'INVALID_EVENT_TYPE';
  END IF;
  SELECT * INTO v_popup FROM public.admin_popups WHERE id = p_popup_id;
  IF NOT FOUND OR NOT v_popup.is_active THEN RETURN; END IF;
  IF v_popup.starts_at > pg_catalog.now() OR (v_popup.expires_at IS NOT NULL AND v_popup.expires_at <= pg_catalog.now()) THEN
    RETURN;
  END IF;
  IF v_popup.target_scope = 'user' AND (v_uid IS NULL OR v_popup.target_user_id IS DISTINCT FROM v_uid) THEN
    RAISE EXCEPTION 'TARGET_MISMATCH';
  END IF;
  IF v_uid IS NOT NULL THEN
    v_actor := 'u:' || v_uid::text;
  ELSE
    IF v_clean_client !~ '^[A-Za-z0-9_-]{8,80}$' THEN RAISE EXCEPTION 'CLIENT_ID_INVALID'; END IF;
    v_actor := 'd:' || v_clean_client;
  END IF;
  INSERT INTO public.admin_popup_events (popup_id, actor_key, user_id, event_type, edition, platform, first_at, last_at, hit_count)
  VALUES (p_popup_id, v_actor, v_uid, p_event_type, v_edition, v_platform, pg_catalog.now(), pg_catalog.now(), 1)
  ON CONFLICT (popup_id, actor_key, event_type) DO UPDATE
  SET hit_count = public.admin_popup_events.hit_count + 1,
      user_id = COALESCE(EXCLUDED.user_id, public.admin_popup_events.user_id),
      edition = EXCLUDED.edition,
      platform = EXCLUDED.platform,
      last_at = pg_catalog.now();
END;
$$;
REVOKE ALL ON FUNCTION public.record_admin_popup_event(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_admin_popup_event(uuid, text, text, text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.admin_list_popups_with_stats();
CREATE FUNCTION public.admin_list_popups_with_stats()
RETURNS TABLE(
  id uuid, title text, body text, variant text, badge_text text, image_url text,
  cta_label text, cta_url text, dismiss_label text, display_mode text,
  target_scope text, target_edition text, target_user_id uuid, priority smallint,
  is_active boolean, starts_at timestamptz, expires_at timestamptz,
  created_at timestamptz, updated_at timestamptz,
  unique_impressions bigint, total_impressions bigint,
  unique_clicks bigint, total_clicks bigint, unique_dismissals bigint, last_event_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  RETURN QUERY
  SELECT
    p.id, p.title, p.body, p.variant, p.badge_text, p.image_url,
    p.cta_label, p.cta_url, p.dismiss_label, p.display_mode,
    p.target_scope, p.target_edition, p.target_user_id, p.priority,
    p.is_active, p.starts_at, p.expires_at, p.created_at, p.updated_at,
    COALESCE(COUNT(*) FILTER (WHERE ev.event_type = 'impression'), 0)::bigint,
    COALESCE(SUM(ev.hit_count) FILTER (WHERE ev.event_type = 'impression'), 0)::bigint,
    COALESCE(COUNT(*) FILTER (WHERE ev.event_type = 'cta_click'), 0)::bigint,
    COALESCE(SUM(ev.hit_count) FILTER (WHERE ev.event_type = 'cta_click'), 0)::bigint,
    COALESCE(COUNT(*) FILTER (WHERE ev.event_type = 'dismiss'), 0)::bigint,
    MAX(ev.last_at)
  FROM public.admin_popups p
  LEFT JOIN public.admin_popup_events ev ON ev.popup_id = p.id
  WHERE p.admin_id = auth.uid()
  GROUP BY p.id
  ORDER BY p.is_active DESC, p.priority DESC, p.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_popups_with_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_popups_with_stats() TO authenticated;

DROP FUNCTION IF EXISTS public.education_roster_multilang();
CREATE FUNCTION public.education_roster_multilang()
RETURNS TABLE(student_id uuid, display_name text, status text, consent_at timestamptz, synced_at timestamptz, summary jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_education_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  RETURN QUERY
  SELECT e.student_id, e.display_name, e.status, e.consent_at,
    CASE WHEN e.status = 'active' THEN p.updated_at END,
    CASE WHEN e.status = 'active' AND p.user_id IS NOT NULL THEN jsonb_build_object(
      'completedLessonIds', p.progress->'completedLessonIds',
      'learnedEssential504Words', p.progress->'learnedEssential504Words',
      'totalMinutes', p.progress->'totalMinutes',
      'currentStreak', p.progress->'currentStreak',
      'germanCompletedLessonIds', COALESCE(p.language_progress #> '{de,course,completedLessonIds}', p.language_progress #> '{de,completedLessonIds}', '[]'::jsonb),
      'russianCompletedLessonIds', COALESCE(p.language_progress #> '{ru,completedLessonIds}', '[]'::jsonb),
      'turkishCompletedLessonIds', COALESCE(p.language_progress #> '{tr,completedLessonIds}', '[]'::jsonb),
      'pronunciationKeysCount', CASE WHEN jsonb_typeof(p.pronunciation_progress) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(p.pronunciation_progress)) ELSE 0 END
    ) END
  FROM public.education_enrollments e
  LEFT JOIN public.learning_progress p ON p.user_id = e.student_id
  WHERE e.admin_id = auth.uid()
  ORDER BY e.consent_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.education_roster_multilang() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.education_roster_multilang() TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_popups') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_popups;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_popup_events') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_popup_events;
    END IF;
  END IF;
END
$$;

COMMIT;
`;
