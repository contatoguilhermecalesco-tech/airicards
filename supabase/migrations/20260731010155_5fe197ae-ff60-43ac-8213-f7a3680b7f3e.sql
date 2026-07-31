UPDATE public.shop_items
SET payload = jsonb_build_object('items', jsonb_build_array(
      'cosmetic.effect.santuario_espiritual',
      'cosmetic.aura.nevoa_espiritual',
      'cosmetic.frame.coroa_nevoa',
      'cosmetic.veil.veu_espectral',
      'cosmetic.companion.cordeiro_espiritual',
      'cosmetic.table.mesa_espiritual',
      'cosmetic.victory_splash.ascensao_espiritual'
    )),
    price = 900,
    description = 'Sob a lua do santuário congelado, lâminas espirituais flutuam em gelo azul e brasa carmesim. Sete peças essenciais: capa de santuário, aura, coroa, véu das cartas, cordeiro espectral, o Altar da Névoa e a Ascensão Espiritual.',
    updated_at = now()
WHERE id = 'bundle.nevoa_espiritual';

UPDATE public.shop_items
SET active = false, updated_at = now()
WHERE id IN (
  'cosmetic.overlay.petalas_espectrais',
  'cosmetic.streak_flame.chama_espiritual',
  'cosmetic.enemy_seal.selo_espiritual',
  'cosmetic.title.guardia_nevoa'
);