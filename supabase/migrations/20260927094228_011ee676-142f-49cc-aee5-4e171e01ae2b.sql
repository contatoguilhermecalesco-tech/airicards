DROP POLICY "system_update_reads owner select" ON public.system_update_reads;
DROP POLICY "system_update_reads owner insert" ON public.system_update_reads;
DROP POLICY "system_update_reads owner delete" ON public.system_update_reads;

CREATE POLICY "system_update_reads owner select"
ON public.system_update_reads FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.app_profiles p
    WHERE p.id = system_update_reads.profile_id
      AND p.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "system_update_reads owner insert"
ON public.system_update_reads FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.app_profiles p
    WHERE p.id = system_update_reads.profile_id
      AND p.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "system_update_reads owner delete"
ON public.system_update_reads FOR DELETE TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.app_profiles p
    WHERE p.id = system_update_reads.profile_id
      AND p.auth_user_id = (SELECT auth.uid())
  )
);