CREATE TABLE public.bundle_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tagline text,
  concept text NOT NULL,
  palette text NOT NULL DEFAULT '#a855f7',
  splash_url text,
  shop_bundle_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_concepts TO anon, authenticated;
GRANT ALL ON public.bundle_concepts TO service_role;
ALTER TABLE public.bundle_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read bundle concepts" ON public.bundle_concepts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bundle concepts" ON public.bundle_concepts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bundle concepts" ON public.bundle_concepts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete bundle concepts" ON public.bundle_concepts FOR DELETE USING (true);
CREATE INDEX bundle_concepts_created_at_idx ON public.bundle_concepts (created_at DESC);