CREATE TABLE public.shard_gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile text NOT NULL,
  to_profile text NOT NULL,
  shard_key text NOT NULL,
  shard_name text NOT NULL,
  slot text NOT NULL DEFAULT 'cosmetic',
  price integer NOT NULL DEFAULT 0,
  accent text NOT NULL DEFAULT '#d8b4fe',
  tier text NOT NULL DEFAULT 'comum',
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.shard_gifts TO authenticated;
GRANT ALL ON public.shard_gifts TO service_role;

ALTER TABLE public.shard_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shard_gifts participants read" ON public.shard_gifts
  FOR SELECT TO authenticated
  USING ((from_profile = public.current_profile_id()) OR (to_profile = public.current_profile_id()));

CREATE POLICY "shard_gifts sender insert" ON public.shard_gifts
  FOR INSERT TO authenticated
  WITH CHECK (from_profile = public.current_profile_id() AND to_profile <> public.current_profile_id());

CREATE POLICY "shard_gifts recipient update" ON public.shard_gifts
  FOR UPDATE TO authenticated
  USING (to_profile = public.current_profile_id())
  WITH CHECK (to_profile = public.current_profile_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.shard_gifts;