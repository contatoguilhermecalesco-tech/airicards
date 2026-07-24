
ALTER TABLE public.duels
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  ADD COLUMN IF NOT EXISTS forfeit_by text,
  ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

CREATE INDEX IF NOT EXISTS duels_expires_idx ON public.duels (expires_at) WHERE status = 'active';
