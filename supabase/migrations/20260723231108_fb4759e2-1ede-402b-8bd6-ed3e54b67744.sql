
-- ============================================================
-- Duelos, presentes de cartas e feed de atividade (kudos)
-- App familiar com 2 perfis fixos ('guilherme','arlayne')
-- ============================================================

-- 1) DUELOS SEMANAIS ------------------------------------------------
CREATE TABLE public.duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_key TEXT NOT NULL UNIQUE,            -- ex: 2026-W30
  deck_name TEXT NOT NULL,
  deck_source_id TEXT,                       -- id do deck original (local), pode ser null
  cards_snapshot JSONB NOT NULL,             -- [{front,back,category}, ...]
  created_by TEXT NOT NULL,                  -- 'guilherme' | 'arlayne'
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'completed'
  winner TEXT,                                -- perfil vencedor, definido quando ambos jogam
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.duels TO anon, authenticated;
GRANT ALL ON public.duels TO service_role;

ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read duels" ON public.duels FOR SELECT USING (true);
CREATE POLICY "Anyone can insert duels" ON public.duels FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update duels" ON public.duels FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete duels" ON public.duels FOR DELETE USING (true);

CREATE INDEX duels_week_idx ON public.duels (week_key DESC);

-- 2) RESULTADOS DO DUELO --------------------------------------------
CREATE TABLE public.duel_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,                  -- 'guilherme' | 'arlayne'
  correct INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  time_ms INT NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,4) NOT NULL DEFAULT 0,  -- 0.0000 - 1.0000
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (duel_id, profile_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.duel_results TO anon, authenticated;
GRANT ALL ON public.duel_results TO service_role;

ALTER TABLE public.duel_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read duel_results" ON public.duel_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert duel_results" ON public.duel_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update duel_results" ON public.duel_results FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete duel_results" ON public.duel_results FOR DELETE USING (true);

CREATE INDEX duel_results_duel_idx ON public.duel_results (duel_id);

-- 3) PRESENTES DE CARTAS ("mandar pra Arlayne") ---------------------
CREATE TABLE public.card_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile TEXT NOT NULL,                -- quem enviou
  to_profile TEXT NOT NULL,                  -- destinatário
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'phrase',   -- 'word' | 'phrase' | 'expression'
  source_note TEXT,                          -- opcional: nota do remetente
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'imported' | 'declined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_gifts TO anon, authenticated;
GRANT ALL ON public.card_gifts TO service_role;

ALTER TABLE public.card_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read card_gifts" ON public.card_gifts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert card_gifts" ON public.card_gifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update card_gifts" ON public.card_gifts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete card_gifts" ON public.card_gifts FOR DELETE USING (true);

CREATE INDEX card_gifts_to_status_idx ON public.card_gifts (to_profile, status, created_at DESC);

-- 4) FEED DE ATIVIDADE (kudos) --------------------------------------
CREATE TABLE public.activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,                  -- quem gerou o evento
  kind TEXT NOT NULL,                        -- 'rank_up' | 'exam_done' | 'streak_milestone' | 'enemy_defeated' | 'duel_won'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO anon, authenticated;
GRANT ALL ON public.activity_events TO service_role;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read activity_events" ON public.activity_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert activity_events" ON public.activity_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update activity_events" ON public.activity_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete activity_events" ON public.activity_events FOR DELETE USING (true);

CREATE INDEX activity_events_recent_idx ON public.activity_events (created_at DESC);

-- 5) REAÇÕES (kudos) -------------------------------------------------
CREATE TABLE public.activity_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.activity_events(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  emoji TEXT NOT NULL,                       -- '🔥' | '❤️' | '👏'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, profile_id, emoji)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_reactions TO anon, authenticated;
GRANT ALL ON public.activity_reactions TO service_role;

ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read activity_reactions" ON public.activity_reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert activity_reactions" ON public.activity_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update activity_reactions" ON public.activity_reactions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete activity_reactions" ON public.activity_reactions FOR DELETE USING (true);

CREATE INDEX activity_reactions_event_idx ON public.activity_reactions (event_id);

-- Realtime para todas as tabelas novas
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.card_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;
