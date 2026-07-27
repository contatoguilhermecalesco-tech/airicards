DO $$
BEGIN
  ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_kind_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.shop_items
  ADD CONSTRAINT shop_items_kind_check
  CHECK (kind IN ('pack','cosmetic','powerup','bundle'));

INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) VALUES
  ('cosmetic.aura.florescer_celestial', 'cosmetic',
    'Aura Florescer Celestial',
    'Pétalas de sakura orbitando em roxo profundo, com filamentos dourados espirituais. Feita para quem carrega o silêncio da cerejeira eterna.',
    750,
    '{"key":"florescer_celestial","slot":"decoration"}'::jsonb,
    'sparkles', 'violet', true, 200),
  ('cosmetic.frame.coroa_guardia', 'cosmetic',
    'Moldura Coroa da Guardiã',
    'Galhos dourados entrelaçados com flores de cerejeira e um cristal violeta no topo. Uma coroa para quem protege o florescer.',
    700,
    '{"key":"coroa_guardia","slot":"nameplate"}'::jsonb,
    'crown', 'violet', true, 201),
  ('cosmetic.badge.guardia_flores', 'cosmetic',
    'Emblema Guardiã das Flores',
    'Selo em caligrafia dourada com uma raposa espiritual ao lado. Exibido junto do seu nome.',
    550,
    '{"key":"guardia_flores","slot":"badge"}'::jsonb,
    'star', 'violet', true, 202),
  ('cosmetic.effect.bosque_celestial', 'cosmetic',
    'Efeito Bosque Celestial',
    'Neblina rosada, pétalas caindo e reflexos violetas percorrem o banner do seu perfil.',
    800,
    '{"key":"bosque_celestial","slot":"effect"}'::jsonb,
    'sparkles', 'pink', true, 203),
  ('cosmetic.effect.veu_celestial', 'cosmetic',
    'Véu Celestial',
    'Aura dourada e mística de nível superior — um segundo efeito de banner que se sobrepõe ao Bosque em ocasiões especiais.',
    650,
    '{"key":"veu_celestial","slot":"effect"}'::jsonb,
    'moon', 'lavender', true, 204),
  ('cosmetic.companion.kitsune_florescer', 'cosmetic',
    'Raposa Guardiã',
    'Uma pequena kitsune branca de nove caudas que aparece ao lado do seu avatar no perfil. Chibi, delicada, olhos violetas.',
    850,
    '{"key":"kitsune_florescer","slot":"companion"}'::jsonb,
    'heart', 'pink', true, 205)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) VALUES
  ('bundle.florescer_celestial', 'bundle',
    'Florescer Celestial',
    'A coleção lendária. Seis peças cosméticas inspiradas no despertar de um espírito guardião sob a cerejeira eterna: aura, moldura, emblema, dois efeitos de banner e a Raposa Guardiã como companheira do seu perfil.',
    2799,
    '{"items":["cosmetic.aura.florescer_celestial","cosmetic.frame.coroa_guardia","cosmetic.badge.guardia_flores","cosmetic.effect.bosque_celestial","cosmetic.effect.veu_celestial","cosmetic.companion.kitsune_florescer"]}'::jsonb,
    'crown', 'violet', true, 5)
ON CONFLICT (id) DO NOTHING;