
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_label text,
  ADD COLUMN IF NOT EXISTS action_route text;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert app_settings" ON public.app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update app_settings" ON public.app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES ('exam_visible', 'false'::jsonb)
  ON CONFLICT (key) DO NOTHING;
