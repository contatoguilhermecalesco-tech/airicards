DROP POLICY IF EXISTS "activity_comments shared read" ON public.activity_comments;

CREATE POLICY "activity_comments member read"
  ON public.activity_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.app_profiles
      WHERE auth_user_id = auth.uid()
    )
  );