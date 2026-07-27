INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) VALUES
  ('cosmetic.effect.chuva_sakura', 'cosmetic',
    'Chuva de Sakura',
    'Pétalas de cerejeira caindo lentamente sobre o banner do seu perfil, com um halo rosado e dourado. Delicado, angelical e épico.',
    650,
    '{"key":"chuva_sakura","slot":"effect"}'::jsonb,
    'sparkles', 'pink', true, 206)
ON CONFLICT (id) DO NOTHING;