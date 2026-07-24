
-- Allow both linked profiles (partners) to view each other's public profile data.
-- Writes remain restricted to owner. This app has exactly two profiles.
DROP POLICY IF EXISTS "wallets owner select" ON public.wallets;
CREATE POLICY "wallets readable by authenticated"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profile_data owner select" ON public.profile_data;
CREATE POLICY "profile_data readable by authenticated"
  ON public.profile_data FOR SELECT
  TO authenticated
  USING (true);
