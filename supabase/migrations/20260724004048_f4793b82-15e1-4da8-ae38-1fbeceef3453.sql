
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.changelog_entries TO anon, authenticated;
GRANT ALL ON public.changelog_entries TO service_role;
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read changelog" ON public.changelog_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert changelog" ON public.changelog_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update changelog" ON public.changelog_entries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete changelog" ON public.changelog_entries FOR DELETE USING (true);
CREATE INDEX changelog_entries_created_at_idx ON public.changelog_entries (created_at DESC);
