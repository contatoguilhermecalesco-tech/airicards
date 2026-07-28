CREATE TABLE public.daily_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
    day text NOT NULL,
    challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
    surprise_unlocked boolean NOT NULL DEFAULT false,
    surprise_claimed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(profile_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_challenges TO authenticated;
GRANT ALL ON public.daily_challenges TO service_role;

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily challenges" ON public.daily_challenges FOR ALL TO authenticated USING (profile_id = public.current_profile_id()) WITH CHECK (profile_id = public.current_profile_id());

CREATE OR REPLACE FUNCTION public.update_daily_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER daily_challenges_updated_at BEFORE UPDATE ON public.daily_challenges FOR EACH ROW EXECUTE FUNCTION public.update_daily_challenges_updated_at();