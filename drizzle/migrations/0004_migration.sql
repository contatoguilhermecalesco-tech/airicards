CREATE TABLE public.duel_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  profile_id text NOT NULL,
  amount integer NOT NULL,
  payout_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (duel_id, profile_id)
);
GRANT SELECT, INSERT, UPDATE ON public.duel_bets TO authenticated;
GRANT ALL ON public.duel_bets TO service_role;
ALTER TABLE public.duel_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets read" ON public.duel_bets FOR SELECT TO authenticated USING (public.current_profile_id() IS NOT NULL);
CREATE POLICY "bets insert own" ON public.duel_bets FOR INSERT TO authenticated WITH CHECK (profile_id = public.current_profile_id() AND amount BETWEEN 10 AND 200);
CREATE POLICY "bets update own" ON public.duel_bets FOR UPDATE TO authenticated USING (profile_id = public.current_profile_id()) WITH CHECK (profile_id = public.current_profile_id());

CREATE TABLE public.secret_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile text NOT NULL,
  to_profile text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  reward integer NOT NULL DEFAULT 20,
  week_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  UNIQUE (from_profile, week_key)
);
GRANT SELECT, INSERT, UPDATE ON public.secret_cards TO authenticated;
GRANT ALL ON public.secret_cards TO service_role;
ALTER TABLE public.secret_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secret read own" ON public.secret_cards FOR SELECT TO authenticated USING (from_profile = public.current_profile_id() OR to_profile = public.current_profile_id());
CREATE POLICY "secret send" ON public.secret_cards FOR INSERT TO authenticated WITH CHECK (from_profile = public.current_profile_id() AND to_profile <> from_profile);
CREATE POLICY "secret answer" ON public.secret_cards FOR UPDATE TO authenticated USING (to_profile = public.current_profile_id()) WITH CHECK (to_profile = public.current_profile_id());