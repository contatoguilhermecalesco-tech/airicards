-- Refund Guilherme's test purchases (Florescer Celestial bundle + Chuva de Sakura standalone)
-- and remove the related cosmetics from his wallet.

WITH refund AS (
  SELECT COALESCE(SUM(price_paid), 0) AS total
  FROM public.shop_purchases
  WHERE buyer_profile_id = 'guilherme'
    AND (
      (item_kind = 'bundle'   AND item_id = 'bundle.florescer_celestial') OR
      (item_kind = 'cosmetic' AND item_id = 'cosmetic.effect.chuva_sakura')
    )
)
UPDATE public.wallets w
SET
  crystals = w.crystals + (SELECT total FROM refund),
  inventory = jsonb_set(
    jsonb_set(
      w.inventory,
      '{cosmetics}',
      COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(w.inventory->'cosmetics') elem
          WHERE elem::text NOT IN (
            '"decoration:florescer_celestial"',
            '"nameplate:coroa_guardia"',
            '"effect:bosque_celestial"',
            '"overlay:chuva_sakura"',
            '"veil:veu_celestial"',
            '"companion:kitsune_florescer"'
          )
        ),
        '[]'::jsonb
      )
    ),
    '{equipped}',
    (
      COALESCE(w.inventory->'equipped', '{}'::jsonb)
        - 'decoration' - 'nameplate' - 'effect' - 'overlay' - 'veil' - 'companion'
    )
  )
WHERE w.profile_id = 'guilherme';

DELETE FROM public.shop_purchases
WHERE buyer_profile_id = 'guilherme'
  AND (
    (item_kind = 'bundle'   AND item_id = 'bundle.florescer_celestial') OR
    (item_kind = 'cosmetic' AND item_id = 'cosmetic.effect.chuva_sakura')
  );
