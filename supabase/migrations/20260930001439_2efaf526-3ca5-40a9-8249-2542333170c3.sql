DROP POLICY IF EXISTS "activity_comments member read" ON public.activity_comments;

CREATE POLICY "activity_comments linked members read"
  ON public.activity_comments FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);