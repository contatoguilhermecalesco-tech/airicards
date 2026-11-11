-- Suporte a várias sessões anônimas por perfil, sem invalidar outros dispositivos.
CREATE TABLE IF NOT EXISTS public.profile_auth_sessions (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_auth_sessions_profile_id
  ON public.profile_auth_sessions (profile_id);

ALTER TABLE public.profile_auth_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profile_auth_sessions TO authenticated;
GRANT ALL ON public.profile_auth_sessions TO service_role;

DROP POLICY IF EXISTS "Users can read own auth session"
  ON public.profile_auth_sessions;
CREATE POLICY "Users can read own auth session"
  ON public.profile_auth_sessions
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unlink own auth session"
  ON public.profile_auth_sessions;
CREATE POLICY "Users can unlink own auth session"
  ON public.profile_auth_sessions
  FOR DELETE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Migra o vínculo legado atual para a tabela de sessões.
INSERT INTO public.profile_auth_sessions (auth_user_id, profile_id)
SELECT auth_user_id, id
FROM public.app_profiles
WHERE auth_user_id IS NOT NULL
ON CONFLICT (auth_user_id) DO UPDATE
SET profile_id = EXCLUDED.profile_id,
    last_seen_at = now();

-- A sessão atual tem prioridade; a coluna antiga continua como fallback.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT s.profile_id
      FROM public.profile_auth_sessions AS s
      WHERE s.auth_user_id = auth.uid()
      LIMIT 1
    ),
    (
      SELECT p.id
      FROM public.app_profiles AS p
      WHERE p.auth_user_id = auth.uid()
      LIMIT 1
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated, anon;

-- O trigger preserva o corpo existente de link_profile(): sempre que o RPC
-- vincular o auth.uid() atual a um perfil, registra também essa sessão.
CREATE OR REPLACE FUNCTION public.capture_profile_auth_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL AND NEW.auth_user_id = v_uid THEN
    INSERT INTO public.profile_auth_sessions (
      auth_user_id,
      profile_id,
      last_seen_at
    )
    VALUES (v_uid, NEW.id, now())
    ON CONFLICT (auth_user_id) DO UPDATE
      SET profile_id = EXCLUDED.profile_id,
          last_seen_at = now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_profile_auth_session() FROM PUBLIC;

DROP TRIGGER IF EXISTS capture_profile_auth_session
  ON public.app_profiles;
CREATE TRIGGER capture_profile_auth_session
  AFTER INSERT OR UPDATE
  ON public.app_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_profile_auth_session();

-- Logout remove somente a sessão associada ao auth.uid() deste dispositivo.
CREATE OR REPLACE FUNCTION public.unlink_current_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.profile_auth_sessions
  WHERE auth_user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_current_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_current_session() TO authenticated;
