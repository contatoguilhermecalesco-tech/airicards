CREATE TABLE public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.activity_events(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL CHECK (profile_id IN ('guilherme', 'arlayne')),
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO authenticated;
GRANT ALL ON public.activity_comments TO service_role;

ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_comments shared read"
  ON public.activity_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_comments own insert"
  ON public.activity_comments FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "activity_comments own update"
  ON public.activity_comments FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "activity_comments own delete"
  ON public.activity_comments FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id());

CREATE INDEX activity_comments_event_created_idx
  ON public.activity_comments (event_id, created_at);

CREATE OR REPLACE FUNCTION public.set_activity_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_activity_comments_updated_at
  BEFORE UPDATE ON public.activity_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_activity_comment_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_comments;