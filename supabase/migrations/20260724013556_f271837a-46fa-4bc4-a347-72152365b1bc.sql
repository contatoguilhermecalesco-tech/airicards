
-- 1) Wallets
CREATE TABLE public.wallets (
  profile_id TEXT PRIMARY KEY,
  crystals INTEGER NOT NULL DEFAULT 0,
  inventory JSONB NOT NULL DEFAULT '{"cosmetics": [], "powerups": {}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO anon, authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read wallets" ON public.wallets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone insert wallets" ON public.wallets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone update wallets" ON public.wallets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wallets_set_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.published_decks_touch_updated_at();

-- 2) Shop items catalog
CREATE TABLE public.shop_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('pack','cosmetic','powerup')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  accent TEXT NOT NULL DEFAULT 'lavender',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_items TO anon, authenticated;
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read shop_items" ON public.shop_items FOR SELECT TO anon, authenticated USING (true);

-- 3) Purchases log
CREATE TABLE public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id TEXT NOT NULL,
  item_kind TEXT NOT NULL,
  item_id TEXT,
  deck_id UUID REFERENCES public.published_decks(id) ON DELETE SET NULL,
  price_paid INTEGER NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shop_purchases TO anon, authenticated;
GRANT ALL ON public.shop_purchases TO service_role;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read shop_purchases" ON public.shop_purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone insert shop_purchases" ON public.shop_purchases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX shop_purchases_buyer_idx ON public.shop_purchases(buyer_profile_id, created_at DESC);
CREATE INDEX shop_purchases_deck_idx ON public.shop_purchases(deck_id);

-- 4) Add price column to published_decks
ALTER TABLE public.published_decks
  ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0);

-- 5) Seed catalog
INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, sort_order) VALUES
  ('pack.travel', 'pack', 'Pack Viagem',
    '30 cartas essenciais de aeroporto, hotel e restaurante.', 120,
    '{"theme":"travel","cards":30}', 'plane', 'sky', 10),
  ('pack.business', 'pack', 'Pack Business',
    '40 cartas de reuniões, e-mails e negociação em inglês.', 180,
    '{"theme":"business","cards":40}', 'briefcase', 'amber', 20),
  ('pack.slang', 'pack', 'Pack Gírias 2026',
    '25 expressões modernas usadas em séries e redes.', 90,
    '{"theme":"slang","cards":25}', 'sparkles', 'pink', 30),
  ('cosmetic.frame.aurora', 'cosmetic', 'Moldura Aurora',
    'Moldura animada em roxo/rosa para seus decks favoritos.', 250,
    '{"slot":"deck_frame","key":"aurora"}', 'sparkles', 'violet', 40),
  ('cosmetic.frame.gold', 'cosmetic', 'Moldura Ouro',
    'Acabamento dourado premium para decks importantes.', 400,
    '{"slot":"deck_frame","key":"gold"}', 'crown', 'amber', 50),
  ('cosmetic.badge.founder', 'cosmetic', 'Emblema Founder',
    'Exibido no seu perfil e no rank comparativo.', 500,
    '{"slot":"profile_badge","key":"founder"}', 'shield', 'violet', 60),
  ('powerup.streak_shield', 'powerup', 'Escudo de Streak',
    'Perdoa 1 dia sem estudar sem quebrar a sequência. Estoca até 3.', 200,
    '{"effect":"streak_shield","max":3}', 'shield', 'emerald', 70),
  ('powerup.lp_boost', 'powerup', 'Boost de LP',
    '+50% de LP na próxima vitória em duelo.', 150,
    '{"effect":"lp_boost","uses":1}', 'zap', 'amber', 80),
  ('powerup.extra_review', 'powerup', 'Revisão Extra',
    '+1 sessão de "Revisar tudo" hoje.', 60,
    '{"effect":"extra_review","uses":1}', 'plus', 'sky', 90);
