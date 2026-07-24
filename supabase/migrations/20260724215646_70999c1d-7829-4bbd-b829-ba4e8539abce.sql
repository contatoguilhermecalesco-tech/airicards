
INSERT INTO public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) VALUES
-- Novas auras épicas (10)
('aura_nebula',   'cosmetic', 'Aura Nebulosa',    'Duas nuvens cósmicas orbitando em direções opostas.',              320, '{"key":"nebula","slot":"avatar_aura"}',   'sparkles', 'lavender', true, 150),
('aura_phoenix',  'cosmetic', 'Aura Fênix',       'Chamas piscando em torno do seu avatar, feito uma fênix acordando.', 380, '{"key":"phoenix","slot":"avatar_aura"}',  'flame',    'amber',    true, 151),
('aura_void',     'cosmetic', 'Aura Void',        'Anéis contra-rotativos em violeta profundo — silencioso e denso.',   340, '{"key":"void","slot":"avatar_aura"}',     'moon',     'violet',   true, 152),
('aura_solar',    'cosmetic', 'Aura Solar',       'Raios dourados pulsando como um pequeno sol.',                        360, '{"key":"solar","slot":"avatar_aura"}',    'sun',      'amber',    true, 153),
('aura_glacier',  'cosmetic', 'Aura Glaciar',     'Anel cristalino que brilha com reflexos de gelo.',                    280, '{"key":"glacier","slot":"avatar_aura"}',  'snowflake','sky',      true, 154),
('aura_bloom',    'cosmetic', 'Aura Bloom',       'Pétalas cor-de-rosa orbitando em círculo.',                           300, '{"key":"bloom","slot":"avatar_aura"}',    'heart',    'pink',     true, 155),
('aura_hologram', 'cosmetic', 'Aura Holograma',   'Espectro RGB rodando com deslocamento de cor.',                       500, '{"key":"hologram","slot":"avatar_aura"}', 'sparkles', 'lavender', true, 156),
('aura_neon',     'cosmetic', 'Aura Neon',        'Estética glitch com aberração cromática rosa/ciano.',                 420, '{"key":"neon","slot":"avatar_aura"}',     'zap',      'pink',     true, 157),
('aura_abyss',    'cosmetic', 'Aura Abismo',      'Turquesa profundo em rotação lenta e hipnótica.',                     300, '{"key":"abyss","slot":"avatar_aura"}',    'moon',     'emerald',  true, 158),
('aura_cosmic',   'cosmetic', 'Aura Cósmica',     'Multi-cor com estrelas em órbita.',                                   600, '{"key":"cosmic","slot":"avatar_aura"}',   'star',     'violet',   true, 159),

-- Novos emblemas (6)
('badge_speedrunner', 'cosmetic', 'Emblema Speedrunner',   'Para quem termina revisões em tempo recorde.',       180, '{"key":"speedrunner","slot":"profile_badge"}', 'zap',      'amber',    true, 130),
('badge_perfectionist','cosmetic','Emblema Perfeccionista','Sessões impecáveis, sem uma única falha.',           220, '{"key":"perfectionist","slot":"profile_badge"}','star',    'sky',      true, 131),
('badge_mentor',      'cosmetic', 'Emblema Mentor',        'Compartilhou decks e ajudou a comunidade.',           200, '{"key":"mentor","slot":"profile_badge"}',       'book',    'emerald',  true, 132),
('badge_zen',         'cosmetic', 'Emblema Zen',           'Constância silenciosa, dia após dia.',                160, '{"key":"zen","slot":"profile_badge"}',          'moon',    'lavender', true, 133),
('badge_wildcard',    'cosmetic', 'Emblema Coringa',       'Para quem estuda de tudo, sem seguir padrão.',        170, '{"key":"wildcard","slot":"profile_badge"}',     'sparkles','pink',     true, 134),
('badge_legend',      'cosmetic', 'Emblema Lenda',         'Reservado a quem atinge o pico do rank.',             600, '{"key":"legend","slot":"profile_badge"}',       'crown',   'amber',    true, 135),

-- Novos packs (4)
('pack.cinema',   'pack', 'Pack Cinema',      '35 falas icônicas de filmes com contexto e vocabulário.',      160, '{"cards":35,"theme":"cinema"}',     'film',      'violet',   true, 40),
('pack.tech',     'pack', 'Pack Tech & Dev',  '40 termos técnicos, siglas e expressões do dia-a-dia dev.',    170, '{"cards":40,"theme":"tech"}',       'cpu',       'sky',      true, 41),
('pack.food',     'pack', 'Pack Culinária',   '30 cartas com ingredientes, técnicas e pratos internacionais.', 130, '{"cards":30,"theme":"food"}',       'utensils',  'amber',    true, 42),
('pack.idioms',   'pack', 'Pack Idioms',      '45 expressões idiomáticas que só nativos usam de verdade.',    210, '{"cards":45,"theme":"idioms"}',     'sparkles',  'pink',     true, 43),

-- Novos power-ups (3)
('powerup.double_xp',    'powerup', 'Double LP',        'Dobra o LP ganho na próxima sessão de revisão.',      220, '{"effect":"double_xp","uses":1}',    'zap',    'amber',    true, 91),
('powerup.time_warp',    'powerup', 'Time Warp',        'Antecipa todas as revisões pendentes em 24h.',        180, '{"effect":"time_warp","uses":1}',    'clock',  'violet',   true, 92),
('powerup.second_chance','powerup', 'Segunda Chance',   'Perdoa um "errei" nesta sessão — sem virar inimiga.', 140, '{"effect":"second_chance","uses":1}','shield', 'emerald',  true, 93)
ON CONFLICT (id) DO NOTHING;
