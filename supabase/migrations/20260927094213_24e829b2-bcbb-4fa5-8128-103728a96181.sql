CREATE TABLE public.system_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  status text NOT NULL CHECK (status IN ('maintenance', 'offline', 'degraded', 'info', 'resolved')),
  affected_area text,
  icon text NOT NULL DEFAULT 'info',
  color text NOT NULL DEFAULT '#a78bfa',
  action_label text,
  action_route text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_updates TO authenticated;
GRANT ALL ON public.system_updates TO service_role;

ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_updates authenticated read"
ON public.system_updates FOR SELECT TO authenticated
USING (true);

CREATE POLICY "system_updates admin insert"
ON public.system_updates FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "system_updates admin update"
ON public.system_updates FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "system_updates admin delete"
ON public.system_updates FOR DELETE TO authenticated
USING (public.is_admin());

CREATE TABLE public.system_update_reads (
  update_id uuid NOT NULL REFERENCES public.system_updates(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (update_id, profile_id)
);

GRANT SELECT, INSERT, DELETE ON public.system_update_reads TO authenticated;
GRANT ALL ON public.system_update_reads TO service_role;

ALTER TABLE public.system_update_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_update_reads owner select"
ON public.system_update_reads FOR SELECT TO authenticated
USING (profile_id = public.current_profile_id());

CREATE POLICY "system_update_reads owner insert"
ON public.system_update_reads FOR INSERT TO authenticated
WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "system_update_reads owner delete"
ON public.system_update_reads FOR DELETE TO authenticated
USING (profile_id = public.current_profile_id());

CREATE OR REPLACE FUNCTION public.system_updates_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER system_updates_updated_at
BEFORE UPDATE ON public.system_updates
FOR EACH ROW EXECUTE FUNCTION public.system_updates_set_updated_at();