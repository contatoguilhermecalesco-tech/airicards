-- Cada perfil só pode consultar e registrar suas próprias leituras.
ALTER TABLE public.system_update_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles can read own system update reads" ON public.system_update_reads;
CREATE POLICY "Profiles can read own system update reads"
  ON public.system_update_reads
  FOR SELECT
  TO authenticated
  USING (profile_id = public.current_profile_id());

DROP POLICY IF EXISTS "Profiles can insert own system update reads" ON public.system_update_reads;
CREATE POLICY "Profiles can insert own system update reads"
  ON public.system_update_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

DROP POLICY IF EXISTS "Profiles can update own system update reads" ON public.system_update_reads;
CREATE POLICY "Profiles can update own system update reads"
  ON public.system_update_reads
  FOR UPDATE
  TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

GRANT SELECT, INSERT, UPDATE ON public.system_update_reads TO authenticated;
