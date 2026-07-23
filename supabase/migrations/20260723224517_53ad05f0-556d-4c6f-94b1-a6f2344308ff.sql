CREATE TABLE public.published_decks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_profile_id text NOT NULL,
  owner_name text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color_key text NOT NULL DEFAULT 'lavender',
  card_count integer NOT NULL DEFAULT 0,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  likes integer NOT NULL DEFAULT 0,
  imports integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX published_decks_owner_slug_key
  ON public.published_decks (owner_profile_id, slug);

CREATE INDEX published_decks_created_at_idx
  ON public.published_decks (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_decks TO anon, authenticated;
GRANT ALL ON public.published_decks TO service_role;

ALTER TABLE public.published_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published_decks"
  ON public.published_decks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert published_decks"
  ON public.published_decks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update published_decks"
  ON public.published_decks FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete published_decks"
  ON public.published_decks FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.published_decks_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER published_decks_set_updated_at
  BEFORE UPDATE ON public.published_decks
  FOR EACH ROW EXECUTE FUNCTION public.published_decks_touch_updated_at();
