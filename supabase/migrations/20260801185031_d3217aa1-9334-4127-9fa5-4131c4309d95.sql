CREATE TABLE public.journey_shared (
  id text PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  contributions jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.journey_shared TO authenticated;
GRANT ALL ON public.journey_shared TO service_role;

ALTER TABLE public.journey_shared ENABLE ROW LEVEL SECURITY;

CREATE POLICY "linked profiles can view journey"
  ON public.journey_shared FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

CREATE POLICY "linked profiles can create journey"
  ON public.journey_shared FOR INSERT TO authenticated
  WITH CHECK (public.current_profile_id() IS NOT NULL);

CREATE POLICY "linked profiles can update journey"
  ON public.journey_shared FOR UPDATE TO authenticated
  USING (public.current_profile_id() IS NOT NULL)
  WITH CHECK (public.current_profile_id() IS NOT NULL);

INSERT INTO public.journey_shared (id) VALUES ('casal');

CREATE OR REPLACE FUNCTION public.journey_add_progress(_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pid text := public.current_profile_id();
  v_row public.journey_shared%ROWTYPE;
BEGIN
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'not linked to a profile';
  END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 500 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  INSERT INTO public.journey_shared (id) VALUES ('casal')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.journey_shared
     SET xp = xp + _amount,
         contributions = jsonb_set(
           contributions,
           ARRAY[v_pid],
           to_jsonb(COALESCE((contributions ->> v_pid)::int, 0) + _amount),
           true
         ),
         updated_at = now()
   WHERE id = 'casal'
  RETURNING * INTO v_row;

  RETURN json_build_object('xp', v_row.xp, 'contributions', v_row.contributions, 'claimed', v_row.claimed);
END;
$$;

CREATE OR REPLACE FUNCTION public.journey_claim_stop(_stop_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pid text := public.current_profile_id();
  v_row public.journey_shared%ROWTYPE;
BEGIN
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'not linked to a profile';
  END IF;
  IF _stop_id IS NULL OR length(_stop_id) = 0 OR length(_stop_id) > 64 THEN
    RAISE EXCEPTION 'invalid stop';
  END IF;

  SELECT * INTO v_row FROM public.journey_shared WHERE id = 'casal' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'journey not found';
  END IF;

  IF v_row.claimed ? _stop_id THEN
    RETURN json_build_object('ok', false, 'error', 'already_claimed', 'xp', v_row.xp, 'contributions', v_row.contributions, 'claimed', v_row.claimed);
  END IF;

  UPDATE public.journey_shared
     SET claimed = claimed || to_jsonb(_stop_id),
         updated_at = now()
   WHERE id = 'casal'
  RETURNING * INTO v_row;

  RETURN json_build_object('ok', true, 'xp', v_row.xp, 'contributions', v_row.contributions, 'claimed', v_row.claimed);
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_shared;