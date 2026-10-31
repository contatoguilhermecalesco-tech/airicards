ALTER TABLE public.system_updates
  ADD COLUMN IF NOT EXISTS expected_return_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS related_update_id UUID REFERENCES public.system_updates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS system_updates_related_update_id_idx
  ON public.system_updates (related_update_id);

