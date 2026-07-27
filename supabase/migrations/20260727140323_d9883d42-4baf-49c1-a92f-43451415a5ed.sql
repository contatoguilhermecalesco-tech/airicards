
DELETE FROM public.shop_items WHERE kind = 'powerup';

INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) VALUES
('pu.streak_shield',  'powerup', 'Escudo de Streak',
 'Perdoa 1 dia sem estudar sem quebrar sua sequência. Empilha até 3 cargas.',
 220, '{"effect":"streak_shield","max":3,"uses":1}'::jsonb,
 'shield',   'sky',      true, 10),
('pu.double_arlys',  'powerup', 'Dobrador de Arlys',
 'Ganhe 2× Arlys em toda ação recompensada por 24h.',
 260, '{"effect":"double_arlys","duration_h":24,"uses":1}'::jsonb,
 'sparkles', 'amber',    true, 20),
('pu.double_lp',      'powerup', 'Dobrador de LP',
 'Dobra o LP ganho na próxima sessão de revisão completa.',
 200, '{"effect":"double_lp","uses":1}'::jsonb,
 'zap',      'violet',   true, 30),
('pu.time_warp',      'powerup', 'Portal Temporal',
 'Antecipa todas as revisões pendentes das próximas 24h para agora.',
 180, '{"effect":"time_warp","uses":1}'::jsonb,
 'moon',     'lavender', true, 40),
('pu.second_chance',  'powerup', 'Segunda Chance',
 'Perdoa 1 erro em revisão sem transformar a carta em inimiga. 3 usos.',
 150, '{"effect":"second_chance","uses":3}'::jsonb,
 'heart',    'pink',     true, 50),
('pu.enemy_purge',    'powerup', 'Purga Inimiga',
 'Reseta o status de 1 carta inimiga escolhida — volta a ser carta comum.',
 140, '{"effect":"enemy_purge","uses":1}'::jsonb,
 'swords',   'emerald',  true, 60);
