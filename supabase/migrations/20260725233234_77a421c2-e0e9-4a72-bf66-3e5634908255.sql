
-- 1) app_profiles: remove broad SELECT that exposed pin_hash. The client reads names via list_profiles() RPC.
DROP POLICY IF EXISTS "Everyone can see profile metadata" ON public.app_profiles;
REVOKE SELECT ON public.app_profiles FROM anon, authenticated;

-- 2) duels: participant-only UPDATE (admin retains via separate rule)
DROP POLICY IF EXISTS "duels participant update" ON public.duels;
CREATE POLICY "duels participant update"
  ON public.duels FOR UPDATE TO authenticated
  USING (
    public.current_profile_id() IN (created_by)
    OR EXISTS (
      SELECT 1 FROM public.duel_results dr
      WHERE dr.duel_id = duels.id
        AND dr.profile_id = public.current_profile_id()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    public.current_profile_id() IN (created_by)
    OR EXISTS (
      SELECT 1 FROM public.duel_results dr
      WHERE dr.duel_id = duels.id
        AND dr.profile_id = public.current_profile_id()
    )
    OR public.is_admin()
  );

-- 3) profile_data: owner-only SELECT (+ admin)
DROP POLICY IF EXISTS "profile_data readable by authenticated" ON public.profile_data;
CREATE POLICY "profile_data owner select"
  ON public.profile_data FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

-- 4) wallets: owner-only SELECT (+ admin)
DROP POLICY IF EXISTS "wallets readable by authenticated" ON public.wallets;
CREATE POLICY "wallets owner select"
  ON public.wallets FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

-- 5) SECURITY DEFINER function execution: revoke from anon/public where not needed.
-- Keep link_profile and list_profiles publicly callable (login screen uses them).
REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(text, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.set_profile_pin(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_profile_pin(text, text) TO authenticated, service_role;

-- Ensure login helpers stay callable
GRANT EXECUTE ON FUNCTION public.link_profile(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_profiles() TO anon, authenticated;
