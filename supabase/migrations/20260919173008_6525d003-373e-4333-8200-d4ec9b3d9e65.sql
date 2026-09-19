CREATE TABLE public.pokes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
  to_profile text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '👆',
  seen boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX pokes_to_profile_created_idx ON public.pokes (to_profile, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.pokes TO authenticated;
GRANT ALL ON public.pokes TO service_role;

ALTER TABLE public.pokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pokes_select_participants" ON public.pokes FOR SELECT TO authenticated
USING (public.current_profile_id() IN (from_profile, to_profile));

CREATE POLICY "pokes_insert_own" ON public.pokes FOR INSERT TO authenticated
WITH CHECK (public.current_profile_id() = from_profile AND from_profile <> to_profile);

CREATE POLICY "pokes_update_recipient" ON public.pokes FOR UPDATE TO authenticated
USING (public.current_profile_id() = to_profile)
WITH CHECK (public.current_profile_id() = to_profile);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pokes;