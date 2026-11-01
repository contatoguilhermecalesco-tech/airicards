ALTER TABLE public.profile_data
  ADD COLUMN IF NOT EXISTS parabel_history jsonb NOT NULL DEFAULT '[]'::jsonb;