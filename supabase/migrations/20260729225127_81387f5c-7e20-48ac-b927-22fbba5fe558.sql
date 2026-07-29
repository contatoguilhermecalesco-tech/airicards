UPDATE public.wallets
SET inventory = jsonb_set(
      jsonb_set(
        inventory,
        '{cosmetics}',
        COALESCE((
          SELECT jsonb_agg(c)
          FROM jsonb_array_elements_text(COALESCE(inventory->'cosmetics','[]'::jsonb)) AS c
          WHERE c <> 'table:mesa_eclipse'
        ), '[]'::jsonb)
      ),
      '{equipped}',
      COALESCE(inventory->'equipped','{}'::jsonb) - 'table'
    ),
    updated_at = now()
WHERE inventory->'cosmetics' @> '["table:mesa_eclipse"]'::jsonb
   OR inventory->'equipped'->>'table' = 'table:mesa_eclipse';