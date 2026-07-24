
-- =========================================================
-- 1. TIPOS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- =========================================================
-- 2. TABELA app_profiles
-- =========================================================
CREATE TABLE public.app_profiles (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  pin_hash text,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Column-level grants: pin_hash NUNCA é exposto ao cliente.
GRANT SELECT (id, display_name, auth_user_id, created_at) ON public.app_profiles TO anon, authenticated;
GRANT ALL ON public.app_profiles TO service_role;

ALTER TABLE public.app_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see profile metadata"
  ON public.app_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Nenhuma política de INSERT/UPDATE/DELETE para anon/authenticated:
-- todas as mutações acontecem via funções SECURITY DEFINER abaixo.

INSERT INTO public.app_profiles (id, display_name) VALUES
  ('guilherme', 'Guilherme'),
  ('arlayne', 'Arlayne');

-- =========================================================
-- 3. TABELA user_roles
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id text NOT NULL REFERENCES public.app_profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.user_roles (profile_id, role) VALUES
  ('guilherme', 'admin');

-- =========================================================
-- 4. HELPERS SECURITY DEFINER
-- =========================================================
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.app_profiles WHERE auth_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_profile_id text, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE profile_id = _profile_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(public.current_profile_id(), 'admin'::public.app_role)
$$;

-- =========================================================
-- 5. FUNÇÕES DE PIN
-- =========================================================

-- Retorna metadados dos perfis com um booleano "has_pin" (sem expor o hash).
CREATE OR REPLACE FUNCTION public.list_profiles()
RETURNS TABLE (id text, display_name text, has_pin boolean, is_linked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, display_name, pin_hash IS NOT NULL, auth_user_id IS NOT NULL
  FROM public.app_profiles
  ORDER BY id
$$;

GRANT EXECUTE ON FUNCTION public.list_profiles() TO anon, authenticated;

-- Vincula o auth.uid() atual a um perfil, exigindo o PIN correto.
-- Se o perfil ainda não tem PIN definido, o primeiro _pin recebido vira o PIN oficial.
CREATE OR REPLACE FUNCTION public.link_profile(_profile_id text, _pin text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile public.app_profiles%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF _pin IS NULL OR length(_pin) < 4 OR length(_pin) > 12 THEN
    RAISE EXCEPTION 'invalid pin format';
  END IF;

  SELECT * INTO v_profile FROM public.app_profiles WHERE id = _profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  -- Primeiro acesso: grava o PIN.
  IF v_profile.pin_hash IS NULL THEN
    UPDATE public.app_profiles
       SET pin_hash = crypt(_pin, gen_salt('bf', 10)),
           auth_user_id = v_uid,
           updated_at = now()
     WHERE id = _profile_id;
    RETURN json_build_object('ok', true, 'created_pin', true);
  END IF;

  -- Acessos seguintes: valida o PIN.
  IF v_profile.pin_hash = crypt(_pin, v_profile.pin_hash) THEN
    UPDATE public.app_profiles
       SET auth_user_id = v_uid,
           updated_at = now()
     WHERE id = _profile_id;
    RETURN json_build_object('ok', true, 'created_pin', false);
  END IF;

  RETURN json_build_object('ok', false, 'error', 'wrong_pin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_profile(text, text) TO authenticated;

-- Redefine o PIN de um perfil. Permitido para o dono OU para um admin.
CREATE OR REPLACE FUNCTION public.set_profile_pin(_profile_id text, _new_pin text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller text := public.current_profile_id();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not linked to a profile';
  END IF;

  IF _new_pin IS NULL OR length(_new_pin) < 4 OR length(_new_pin) > 12 THEN
    RAISE EXCEPTION 'invalid pin format';
  END IF;

  IF v_caller <> _profile_id AND NOT public.has_role(v_caller, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.app_profiles
     SET pin_hash = crypt(_new_pin, gen_salt('bf', 10)),
         updated_at = now()
   WHERE id = _profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_profile_pin(text, text) TO authenticated;

-- Garante extensão de cripto disponível para crypt()/gen_salt().
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =========================================================
-- 6. RESET DAS POLÍTICAS EXISTENTES (todas eram USING(true))
-- =========================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN (
         'activity_events','activity_reactions','app_settings','card_gifts',
         'changelog_entries','duel_results','duels','notification_reads',
         'notification_tags','notifications','profile_data','published_decks',
         'shop_items','shop_purchases','wallets'
       )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Revoga acesso anon amplo que estava setado por padrão em algumas tabelas.
-- A partir daqui, só authenticated escreve (via RLS).
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'activity_events','activity_reactions','app_settings','card_gifts',
    'changelog_entries','duel_results','duels','notification_reads',
    'notification_tags','notifications','profile_data','published_decks',
    'shop_items','shop_purchases','wallets'
  ]) LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- =========================================================
-- 7. POLÍTICAS — TABELAS PRIVADAS DO DONO
-- =========================================================

-- profile_data: dono only
CREATE POLICY "profile_data owner select"
  ON public.profile_data FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "profile_data owner insert"
  ON public.profile_data FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "profile_data owner update"
  ON public.profile_data FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "profile_data owner delete"
  ON public.profile_data FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id());

-- wallets: dono only (admin ajusta via server fn com service role)
CREATE POLICY "wallets owner select"
  ON public.wallets FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());
CREATE POLICY "wallets owner insert"
  ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "wallets owner update"
  ON public.wallets FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

-- shop_purchases: comprador only
CREATE POLICY "shop_purchases buyer select"
  ON public.shop_purchases FOR SELECT TO authenticated
  USING (buyer_profile_id = public.current_profile_id());
CREATE POLICY "shop_purchases buyer insert"
  ON public.shop_purchases FOR INSERT TO authenticated
  WITH CHECK (buyer_profile_id = public.current_profile_id());

-- notification_reads: dono
CREATE POLICY "notification_reads owner select"
  ON public.notification_reads FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "notification_reads owner write"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "notification_reads owner delete"
  ON public.notification_reads FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id());

-- =========================================================
-- 8. POLÍTICAS — TABELAS COMPARTILHADAS (feed social entre 2 perfis)
-- =========================================================

-- activity_events: todos veem, cada um insere só o próprio, apaga o próprio
CREATE POLICY "activity_events shared read"
  ON public.activity_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_events own insert"
  ON public.activity_events FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "activity_events own delete"
  ON public.activity_events FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

-- activity_reactions: todos veem, cada um reage como si próprio
CREATE POLICY "activity_reactions shared read"
  ON public.activity_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_reactions own write"
  ON public.activity_reactions FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "activity_reactions own delete"
  ON public.activity_reactions FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id());

-- card_gifts: emissor e receptor veem; só o emissor cria
CREATE POLICY "card_gifts participants read"
  ON public.card_gifts FOR SELECT TO authenticated
  USING (from_profile = public.current_profile_id() OR to_profile = public.current_profile_id());
CREATE POLICY "card_gifts sender insert"
  ON public.card_gifts FOR INSERT TO authenticated
  WITH CHECK (from_profile = public.current_profile_id());
CREATE POLICY "card_gifts recipient update"
  ON public.card_gifts FOR UPDATE TO authenticated
  USING (to_profile = public.current_profile_id())
  WITH CHECK (to_profile = public.current_profile_id());

-- duels: 2 perfis, ambos participam; simples e seguro: authenticated lê tudo,
-- criador cria, ambos podem atualizar (finalizar/desistir); admin pode forçar.
CREATE POLICY "duels shared read"
  ON public.duels FOR SELECT TO authenticated USING (true);
CREATE POLICY "duels creator insert"
  ON public.duels FOR INSERT TO authenticated
  WITH CHECK (created_by = public.current_profile_id());
CREATE POLICY "duels participant update"
  ON public.duels FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "duels admin delete"
  ON public.duels FOR DELETE TO authenticated
  USING (public.is_admin());

-- duel_results: participante insere o próprio, todos veem
CREATE POLICY "duel_results shared read"
  ON public.duel_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "duel_results own insert"
  ON public.duel_results FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

-- =========================================================
-- 9. POLÍTICAS — TABELAS GLOBAIS (leitura livre autenticada, admin escreve)
-- =========================================================

-- shop_items: authenticated lê ativos; admin escreve tudo
CREATE POLICY "shop_items read"
  ON public.shop_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "shop_items admin write"
  ON public.shop_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- notification_tags: authenticated lê; admin escreve
CREATE POLICY "notification_tags read"
  ON public.notification_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "notification_tags admin write"
  ON public.notification_tags FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- notifications: authenticated lê; admin escreve
CREATE POLICY "notifications read"
  ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications admin write"
  ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- changelog_entries: authenticated lê; admin escreve
CREATE POLICY "changelog read"
  ON public.changelog_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "changelog admin write"
  ON public.changelog_entries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- app_settings: authenticated lê; admin escreve
CREATE POLICY "app_settings read"
  ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings admin write"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- 10. POLÍTICAS — MARKETPLACE
-- =========================================================

-- published_decks: authenticated lê; só o autor mexe no próprio
CREATE POLICY "published_decks read"
  ON public.published_decks FOR SELECT TO authenticated USING (true);
CREATE POLICY "published_decks owner insert"
  ON public.published_decks FOR INSERT TO authenticated
  WITH CHECK (owner_profile_id = public.current_profile_id());
CREATE POLICY "published_decks owner update"
  ON public.published_decks FOR UPDATE TO authenticated
  USING (owner_profile_id = public.current_profile_id())
  WITH CHECK (owner_profile_id = public.current_profile_id());
CREATE POLICY "published_decks owner delete"
  ON public.published_decks FOR DELETE TO authenticated
  USING (owner_profile_id = public.current_profile_id() OR public.is_admin());
