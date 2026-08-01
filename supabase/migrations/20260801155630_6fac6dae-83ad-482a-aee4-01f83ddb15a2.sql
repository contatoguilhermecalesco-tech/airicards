UPDATE public.shop_items
SET payload = jsonb_set(payload, '{items}', '["cosmetic.aura.piscina_infinita","cosmetic.frame.coroa_piscina","cosmetic.table.mesa_piscina","cosmetic.streak_flame.chama_piscina"]'::jsonb),
    updated_at = now()
WHERE id = 'bundle.piscina_infinita';

DELETE FROM public.shop_items
WHERE id IN (
  'cosmetic.veil.veu_piscina',
  'cosmetic.enemy_seal.selo_piscina',
  'cosmetic.victory_splash.ascensao_piscina'
);