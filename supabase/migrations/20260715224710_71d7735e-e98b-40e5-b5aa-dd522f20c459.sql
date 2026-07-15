CREATE TABLE public.profile_data (
  profile_id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{"decks":[],"cards":[]}'::jsonb,
  home_sessions jsonb NOT NULL DEFAULT '{"day":"","count":0}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_data TO authenticated;
GRANT ALL ON public.profile_data TO service_role;

ALTER TABLE public.profile_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profile_data"
  ON public.profile_data FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert profile_data"
  ON public.profile_data FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update profile_data"
  ON public.profile_data FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_data;

INSERT INTO public.profile_data (profile_id) VALUES ('guilherme'), ('arlayne')
ON CONFLICT (profile_id) DO NOTHING;