WITH source AS (
  SELECT data
  FROM public.profile_data
  WHERE profile_id = 'arlayne'
), selected_decks AS (
  SELECT deck
  FROM source,
       jsonb_array_elements(COALESCE(data->'decks', '[]'::jsonb)) AS deck
  WHERE lower(deck->>'name') LIKE '%reading%'
     OR lower(deck->>'name') LIKE '%listen%'
), selected_deck_ids AS (
  SELECT array_agg(deck->>'id') AS ids
  FROM selected_decks
), selected_cards AS (
  SELECT card
  FROM source,
       selected_deck_ids,
       jsonb_array_elements(COALESCE(data->'cards', '[]'::jsonb)) AS card
  WHERE card->>'deckId' = ANY(selected_deck_ids.ids)
), target AS (
  SELECT profile_id, COALESCE(data, '{"decks": [], "cards": []}'::jsonb) AS data
  FROM public.profile_data
  WHERE profile_id = 'guilherme'
), merged AS (
  SELECT
    target.profile_id,
    jsonb_build_object(
      'decks', (
        SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM (
          SELECT existing_deck AS item
          FROM jsonb_array_elements(COALESCE(target.data->'decks', '[]'::jsonb)) AS existing_deck
          WHERE NOT EXISTS (
            SELECT 1 FROM selected_decks sd WHERE sd.deck->>'id' = existing_deck->>'id'
          )
          UNION ALL
          SELECT deck AS item FROM selected_decks
        ) all_decks
      ),
      'cards', (
        SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM (
          SELECT existing_card AS item
          FROM jsonb_array_elements(COALESCE(target.data->'cards', '[]'::jsonb)) AS existing_card
          WHERE NOT EXISTS (
            SELECT 1 FROM selected_cards sc WHERE sc.card->>'id' = existing_card->>'id'
          )
          UNION ALL
          SELECT card AS item FROM selected_cards
        ) all_cards
      )
    ) AS restored_data
  FROM target
)
UPDATE public.profile_data p
SET data = merged.restored_data,
    updated_at = now()
FROM merged
WHERE p.profile_id = merged.profile_id;