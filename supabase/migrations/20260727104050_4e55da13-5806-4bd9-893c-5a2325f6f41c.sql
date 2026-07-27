CREATE TABLE public.shop_featured_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_kind text NOT NULL CHECK (item_kind IN ('shop_item','deck')),
  item_id text NOT NULL,
  splash_url text,
  art_url text,
  tagline text,
  description_override text,
  rarity_override text CHECK (rarity_override IS NULL OR rarity_override IN ('common','rare','epic','legendary','mythic')),
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_featured_slots TO authenticated;
GRANT ALL ON public.shop_featured_slots TO service_role;

ALTER TABLE public.shop_featured_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_slots read"
  ON public.shop_featured_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "featured_slots admin write"
  ON public.shop_featured_slots FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER shop_featured_slots_touch_updated_at
  BEFORE UPDATE ON public.shop_featured_slots
  FOR EACH ROW EXECUTE FUNCTION public.published_decks_touch_updated_at();

CREATE INDEX shop_featured_slots_active_position_idx
  ON public.shop_featured_slots (active, position);