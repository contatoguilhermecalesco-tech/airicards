CREATE OR REPLACE FUNCTION public.get_public_profile_snapshot(_profile_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_data public.profile_data%ROWTYPE;
  v_cards jsonb;
  v_total int := 0;
  v_mastered int := 0;
  v_enemies int := 0;
  c jsonb;
BEGIN
  IF public.current_profile_id() IS NULL THEN
    RAISE EXCEPTION 'not linked to a profile';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.app_profiles WHERE id = _profile_id) THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE profile_id = _profile_id;
  SELECT * INTO v_data FROM public.profile_data WHERE profile_id = _profile_id;

  v_cards := COALESCE((to_jsonb(v_data.data) -> 'cards'), '[]'::jsonb);
  IF jsonb_typeof(v_cards) = 'array' THEN
    v_total := jsonb_array_length(v_cards);
    FOR c IN SELECT * FROM jsonb_array_elements(v_cards) LOOP
      IF COALESCE((c ->> 'lapses')::int, 0) >= 3 THEN
        v_enemies := v_enemies + 1;
      ELSIF COALESCE((c ->> 'successes')::int, 0) >= 3 THEN
        v_mastered := v_mastered + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'profile_id', _profile_id,
    'crystals', COALESCE(v_wallet.crystals, 0),
    'inventory', COALESCE(to_jsonb(v_wallet.inventory), '{}'::jsonb),
    'rank', to_jsonb(v_data.rank),
    'streak', COALESCE((to_jsonb(v_data.home_sessions) -> 'streak'), 'null'::jsonb),
    'cards_total', v_total,
    'mastered', v_mastered,
    'enemies', v_enemies,
    'decks_count', COALESCE(jsonb_array_length(COALESCE((to_jsonb(v_data.data) -> 'decks'), '[]'::jsonb)), 0),
    'updated_at', v_data.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_snapshot(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_snapshot(text) TO authenticated;