
CREATE OR REPLACE FUNCTION public.link_profile(_profile_id text, _pin text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  IF v_profile.pin_hash IS NULL THEN
    UPDATE public.app_profiles
       SET pin_hash = crypt(_pin, gen_salt('bf', 10)),
           auth_user_id = v_uid,
           updated_at = now()
     WHERE id = _profile_id;
    RETURN json_build_object('ok', true, 'created_pin', true);
  END IF;

  IF v_profile.pin_hash = crypt(_pin, v_profile.pin_hash) THEN
    UPDATE public.app_profiles
       SET auth_user_id = v_uid,
           updated_at = now()
     WHERE id = _profile_id;
    RETURN json_build_object('ok', true, 'created_pin', false);
  END IF;

  RETURN json_build_object('ok', false, 'error', 'wrong_pin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_profile_pin(_profile_id text, _new_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;
