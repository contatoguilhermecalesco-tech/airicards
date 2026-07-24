
-- ==========================================================================
-- 1) Curated system decks (owner = "airi_system")
-- ==========================================================================
INSERT INTO public.published_decks
  (owner_profile_id, owner_name, slug, name, description, color_key, card_count, cards, price, likes, imports)
VALUES
  (
    'airi_system','airi','essenciais-de-viagem','Essenciais de Viagem',
    'Frases essenciais para se virar em aeroportos, hotéis, restaurantes e transporte pelo mundo.',
    'sky', 20,
    '[
      {"front":"Where is the boarding gate?","back":"Onde é o portão de embarque?","mode":"phrase"},
      {"front":"I''d like to check in, please.","back":"Eu gostaria de fazer o check-in, por favor.","mode":"phrase"},
      {"front":"Is this seat taken?","back":"Este assento está ocupado?","mode":"phrase"},
      {"front":"Could I have a window seat?","back":"Eu poderia ter um assento na janela?","mode":"phrase"},
      {"front":"How much is the taxi to downtown?","back":"Quanto custa o táxi até o centro?","mode":"phrase"},
      {"front":"I have a reservation under…","back":"Eu tenho uma reserva no nome de…","mode":"phrase"},
      {"front":"What time is check-out?","back":"Que horas é o check-out?","mode":"phrase"},
      {"front":"Could you call me a cab?","back":"Você poderia chamar um táxi para mim?","mode":"phrase"},
      {"front":"Is breakfast included?","back":"O café da manhã está incluído?","mode":"phrase"},
      {"front":"Excuse me, I''m lost.","back":"Com licença, estou perdido(a).","mode":"phrase"},
      {"front":"Could you take a picture of us?","back":"Você poderia tirar uma foto da gente?","mode":"phrase"},
      {"front":"I''ll have the same, please.","back":"Eu quero o mesmo, por favor.","mode":"phrase"},
      {"front":"Could I get the bill, please?","back":"Poderia trazer a conta, por favor?","mode":"phrase"},
      {"front":"Do you accept credit cards?","back":"Vocês aceitam cartão de crédito?","mode":"phrase"},
      {"front":"Where can I exchange money?","back":"Onde posso trocar dinheiro?","mode":"phrase"},
      {"front":"I need to catch a train to…","back":"Preciso pegar um trem para…","mode":"phrase"},
      {"front":"Is there Wi-Fi here?","back":"Tem Wi-Fi aqui?","mode":"phrase"},
      {"front":"Could you speak more slowly?","back":"Você poderia falar mais devagar?","mode":"phrase"},
      {"front":"I don''t feel well.","back":"Eu não estou me sentindo bem.","mode":"phrase"},
      {"front":"Thanks for everything!","back":"Obrigado(a) por tudo!","mode":"phrase"}
    ]'::jsonb,
    120, 42, 0
  ),
  (
    'airi_system','airi','ingles-para-negocios','Inglês para Negócios',
    'Vocabulário e frases prontas para reuniões, e-mails e apresentações profissionais.',
    'amber', 20,
    '[
      {"front":"Let''s circle back to that.","back":"Vamos voltar a esse ponto depois.","mode":"expression"},
      {"front":"Can we schedule a follow-up?","back":"Podemos agendar um retorno?","mode":"phrase"},
      {"front":"Please find attached…","back":"Segue em anexo…","mode":"expression"},
      {"front":"Looking forward to your reply.","back":"Fico no aguardo da sua resposta.","mode":"expression"},
      {"front":"Just to clarify,","back":"Só para esclarecer,","mode":"expression"},
      {"front":"Could you elaborate on that?","back":"Você poderia detalhar melhor?","mode":"phrase"},
      {"front":"That''s a great point.","back":"Esse é um ótimo ponto.","mode":"phrase"},
      {"front":"Let''s take this offline.","back":"Vamos tratar isso em separado depois.","mode":"expression"},
      {"front":"I''ll get back to you shortly.","back":"Volto a falar com você em breve.","mode":"phrase"},
      {"front":"On second thought,","back":"Pensando melhor,","mode":"expression"},
      {"front":"deadline","back":"prazo final","mode":"word"},
      {"front":"stakeholder","back":"parte interessada","mode":"word"},
      {"front":"deliverable","back":"entregável","mode":"word"},
      {"front":"leverage","back":"aproveitar / potencializar","mode":"word"},
      {"front":"outsource","back":"terceirizar","mode":"word"},
      {"front":"Let''s align on the next steps.","back":"Vamos alinhar os próximos passos.","mode":"phrase"},
      {"front":"I''ll loop you in.","back":"Vou te incluir na conversa.","mode":"expression"},
      {"front":"We need to touch base.","back":"Precisamos nos falar rapidamente.","mode":"expression"},
      {"front":"By the end of the day (EOD).","back":"Até o fim do dia.","mode":"expression"},
      {"front":"Thanks in advance.","back":"Desde já, obrigado(a).","mode":"expression"}
    ]'::jsonb,
    150, 38, 0
  ),
  (
    'airi_system','airi','conversacao-do-dia-a-dia','Conversação do Dia a Dia',
    'As frases mais úteis para conversas naturais em inglês, do bom dia ao "a gente se vê".',
    'pink', 20,
    '[
      {"front":"How''s it going?","back":"Como vão as coisas?","mode":"phrase"},
      {"front":"Long time no see!","back":"Quanto tempo sem te ver!","mode":"expression"},
      {"front":"What are you up to?","back":"O que você está aprontando?","mode":"phrase"},
      {"front":"Sounds good to me.","back":"Por mim, tudo bem.","mode":"phrase"},
      {"front":"Never mind.","back":"Deixa pra lá.","mode":"expression"},
      {"front":"You bet!","back":"Com certeza!","mode":"expression"},
      {"front":"No worries.","back":"Sem problema.","mode":"expression"},
      {"front":"I''m just kidding.","back":"Estou só brincando.","mode":"phrase"},
      {"front":"Let me think about it.","back":"Deixa eu pensar sobre isso.","mode":"phrase"},
      {"front":"That makes sense.","back":"Isso faz sentido.","mode":"phrase"},
      {"front":"Fair enough.","back":"É justo. / Faz sentido.","mode":"expression"},
      {"front":"Take it easy.","back":"Vai com calma.","mode":"expression"},
      {"front":"See you around!","back":"A gente se vê por aí!","mode":"expression"},
      {"front":"I could go for some coffee.","back":"Estou a fim de um café.","mode":"phrase"},
      {"front":"Are you free tonight?","back":"Você está livre hoje à noite?","mode":"phrase"},
      {"front":"What''s the plan?","back":"Qual é o plano?","mode":"phrase"},
      {"front":"That''s a bummer.","back":"Que chato. / Que fossa.","mode":"expression"},
      {"front":"You made my day!","back":"Você fez o meu dia!","mode":"expression"},
      {"front":"I owe you one.","back":"Fico te devendo essa.","mode":"expression"},
      {"front":"Catch you later.","back":"A gente se fala depois.","mode":"expression"}
    ]'::jsonb,
    150, 51, 0
  ),
  (
    'airi_system','airi','phrasal-verbs-essenciais','Phrasal Verbs Essenciais',
    'Os 20 phrasal verbs que aparecem em toda conversa. Aprenda uma vez, use pra sempre.',
    'violet', 20,
    '[
      {"front":"give up","back":"desistir","mode":"expression"},
      {"front":"figure out","back":"entender / descobrir","mode":"expression"},
      {"front":"look forward to","back":"aguardar com expectativa","mode":"expression"},
      {"front":"run into","back":"encontrar por acaso","mode":"expression"},
      {"front":"come up with","back":"bolar / inventar (uma ideia)","mode":"expression"},
      {"front":"put off","back":"adiar","mode":"expression"},
      {"front":"turn down","back":"recusar","mode":"expression"},
      {"front":"pick up","back":"pegar / buscar","mode":"expression"},
      {"front":"drop by","back":"passar rapidinho (visitar)","mode":"expression"},
      {"front":"hang out","back":"passar tempo (com amigos)","mode":"expression"},
      {"front":"break down","back":"quebrar (mecanicamente) / desabar","mode":"expression"},
      {"front":"work out","back":"dar certo / malhar","mode":"expression"},
      {"front":"show up","back":"aparecer / comparecer","mode":"expression"},
      {"front":"look up","back":"pesquisar / consultar","mode":"expression"},
      {"front":"take off","back":"decolar / sair correndo","mode":"expression"},
      {"front":"get along","back":"se dar bem (com alguém)","mode":"expression"},
      {"front":"hold on","back":"esperar / segurar firme","mode":"expression"},
      {"front":"count on","back":"contar com","mode":"expression"},
      {"front":"call off","back":"cancelar","mode":"expression"},
      {"front":"end up","back":"acabar (fazendo algo)","mode":"expression"}
    ]'::jsonb,
    180, 67, 0
  ),
  (
    'airi_system','airi','entrevista-de-emprego','Entrevista de Emprego',
    'Perguntas clássicas de entrevista em inglês e vocabulário para se destacar.',
    'emerald', 20,
    '[
      {"front":"Tell me about yourself.","back":"Me fale sobre você.","mode":"phrase"},
      {"front":"What are your strengths?","back":"Quais são seus pontos fortes?","mode":"phrase"},
      {"front":"What are your weaknesses?","back":"Quais são seus pontos fracos?","mode":"phrase"},
      {"front":"Why do you want to work here?","back":"Por que você quer trabalhar aqui?","mode":"phrase"},
      {"front":"Where do you see yourself in 5 years?","back":"Onde você se vê em 5 anos?","mode":"phrase"},
      {"front":"Why should we hire you?","back":"Por que devemos te contratar?","mode":"phrase"},
      {"front":"Can you walk me through your resume?","back":"Você pode me guiar pelo seu currículo?","mode":"phrase"},
      {"front":"Do you have any questions for us?","back":"Você tem alguma pergunta para nós?","mode":"phrase"},
      {"front":"I''m a quick learner.","back":"Eu aprendo rápido.","mode":"phrase"},
      {"front":"I work well under pressure.","back":"Trabalho bem sob pressão.","mode":"phrase"},
      {"front":"I''m passionate about…","back":"Eu sou apaixonado(a) por…","mode":"phrase"},
      {"front":"I''m looking for a new challenge.","back":"Estou em busca de um novo desafio.","mode":"phrase"},
      {"front":"role","back":"cargo / função","mode":"word"},
      {"front":"background","back":"experiência / formação","mode":"word"},
      {"front":"achievement","back":"conquista","mode":"word"},
      {"front":"skill set","back":"conjunto de habilidades","mode":"expression"},
      {"front":"team player","back":"pessoa que trabalha bem em equipe","mode":"expression"},
      {"front":"proactive","back":"proativo(a)","mode":"word"},
      {"front":"open to feedback","back":"aberto(a) a feedback","mode":"expression"},
      {"front":"Thank you for your time.","back":"Obrigado(a) pelo seu tempo.","mode":"phrase"}
    ]'::jsonb,
    200, 74, 0
  )
ON CONFLICT (owner_profile_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      color_key = EXCLUDED.color_key,
      card_count = EXCLUDED.card_count,
      cards = EXCLUDED.cards,
      price = EXCLUDED.price,
      updated_at = now();

-- ==========================================================================
-- 2) Expand shop_items catalog: many cosmetics + more power-ups
-- ==========================================================================
INSERT INTO public.shop_items
  (id, kind, name, description, price, payload, icon, accent, active, sort_order)
VALUES
  -- ---- Deck frames (cosmetic slot: deck_frame) ----
  ('frame_aurora','cosmetic','Moldura Aurora','Aurora boreal animada em torno dos seus decks.', 220,
    '{"slot":"deck_frame","key":"aurora"}'::jsonb,'palette','violet',true,100),
  ('frame_ocean','cosmetic','Moldura Oceano','Ondas suaves em azul profundo.', 180,
    '{"slot":"deck_frame","key":"ocean"}'::jsonb,'palette','sky',true,101),
  ('frame_sunset','cosmetic','Moldura Pôr do Sol','Degradê quente entre laranja e rosa.', 180,
    '{"slot":"deck_frame","key":"sunset"}'::jsonb,'palette','amber',true,102),
  ('frame_midnight','cosmetic','Moldura Meia-noite','Preto profundo com detalhes prata.', 220,
    '{"slot":"deck_frame","key":"midnight"}'::jsonb,'palette','lavender',true,103),
  ('frame_sakura','cosmetic','Moldura Sakura','Pétalas rosa flutuando ao redor do deck.', 200,
    '{"slot":"deck_frame","key":"sakura"}'::jsonb,'palette','pink',true,104),
  ('frame_forest','cosmetic','Moldura Floresta','Verde esmeralda com folhas discretas.', 180,
    '{"slot":"deck_frame","key":"forest"}'::jsonb,'palette','emerald',true,105),
  ('frame_rose_gold','cosmetic','Moldura Rose Gold','Elegância metálica em rose gold.', 260,
    '{"slot":"deck_frame","key":"rose_gold"}'::jsonb,'palette','pink',true,106),
  ('frame_obsidian','cosmetic','Moldura Obsidiana','Vidro escuro cintilante. Puro estilo.', 260,
    '{"slot":"deck_frame","key":"obsidian"}'::jsonb,'palette','lavender',true,107),
  ('frame_cyber','cosmetic','Moldura Ciber','Grade neon violeta em movimento.', 240,
    '{"slot":"deck_frame","key":"cyber"}'::jsonb,'palette','violet',true,108),
  ('frame_marble','cosmetic','Moldura Mármore','Textura de mármore branco premium.', 200,
    '{"slot":"deck_frame","key":"marble"}'::jsonb,'palette','lavender',true,109),

  -- ---- Profile badges (cosmetic slot: profile_badge) ----
  ('badge_streak_hero','cosmetic','Emblema Herói do Streak','Selo dourado para quem não perde um dia.', 150,
    '{"slot":"profile_badge","key":"streak_hero"}'::jsonb,'flame','amber',true,120),
  ('badge_duelist','cosmetic','Emblema Duelista','Duas espadas cruzadas — para os campeões da arena.', 150,
    '{"slot":"profile_badge","key":"duelist"}'::jsonb,'swords','violet',true,121),
  ('badge_scholar','cosmetic','Emblema Erudito','Livro aberto brilhante — sabedoria em primeiro lugar.', 150,
    '{"slot":"profile_badge","key":"scholar"}'::jsonb,'book','sky',true,122),
  ('badge_night_owl','cosmetic','Emblema Coruja da Noite','Estude tarde? Este emblema é seu.', 130,
    '{"slot":"profile_badge","key":"night_owl"}'::jsonb,'moon','lavender',true,123),
  ('badge_early_bird','cosmetic','Emblema Pássaro Madrugador','Para quem começa o dia estudando.', 130,
    '{"slot":"profile_badge","key":"early_bird"}'::jsonb,'sun','amber',true,124),
  ('badge_comeback','cosmetic','Emblema Volta por Cima','Para quem venceu cartas inimigas repetidas.', 180,
    '{"slot":"profile_badge","key":"comeback"}'::jsonb,'target','emerald',true,125),
  ('badge_polyglot','cosmetic','Emblema Poliglota','Uma coleção elegante para quem ama línguas.', 200,
    '{"slot":"profile_badge","key":"polyglot"}'::jsonb,'star','pink',true,126),
  ('badge_champion','cosmetic','Emblema Campeão','Coroa dourada — top do ranking.', 350,
    '{"slot":"profile_badge","key":"champion"}'::jsonb,'trophy','amber',true,127),

  -- ---- Avatar auras (cosmetic slot: avatar_aura) ----
  ('aura_violet','cosmetic','Aura Violeta','Brilho violeta suave no avatar.', 160,
    '{"slot":"avatar_aura","key":"violet"}'::jsonb,'sparkles','violet',true,140),
  ('aura_ember','cosmetic','Aura Brasa','Chamas suaves em tom âmbar.', 160,
    '{"slot":"avatar_aura","key":"ember"}'::jsonb,'flame','amber',true,141),
  ('aura_arctic','cosmetic','Aura Ártica','Frio cintilante em azul gelo.', 160,
    '{"slot":"avatar_aura","key":"arctic"}'::jsonb,'sparkles','sky',true,142),
  ('aura_sakura','cosmetic','Aura Sakura','Rosa delicado ao redor do perfil.', 160,
    '{"slot":"avatar_aura","key":"sakura"}'::jsonb,'heart','pink',true,143),
  ('aura_emerald','cosmetic','Aura Esmeralda','Brilho esmeralda para os focados.', 160,
    '{"slot":"avatar_aura","key":"emerald"}'::jsonb,'sparkles','emerald',true,144),
  ('aura_prism','cosmetic','Aura Prisma','Multicolor animada — a mais rara.', 400,
    '{"slot":"avatar_aura","key":"prism"}'::jsonb,'sparkles','violet',true,145),

  -- ---- More power-ups ----
  ('pu_lumen_doubler','powerup','Dobrador de Lumens (24h)','Ganhe 2x Lumens em toda ação por 24 horas.', 220,
    '{"effect":"lumen_doubler","uses":1,"duration_h":24}'::jsonb,'zap','amber',true,180),
  ('pu_second_chance','powerup','Segunda Chance','Uma revisão errada não conta como erro na próxima carta inimiga.', 90,
    '{"effect":"second_chance","uses":3}'::jsonb,'shield','emerald',true,181),
  ('pu_enemy_freeze','powerup','Congelamento Inimigo','Pausa a evolução de uma carta inimiga por 3 dias.', 140,
    '{"effect":"enemy_freeze","uses":2}'::jsonb,'shield','sky',true,182),
  ('pu_review_boost','powerup','Boost de Revisão','+50% de Lumens na próxima sessão de revisão completa.', 120,
    '{"effect":"review_boost","uses":1}'::jsonb,'zap','violet',true,183),
  ('pu_duel_shield','powerup','Escudo de Duelo','Anula uma derrota em duelo (sem prejudicar seu placar).', 180,
    '{"effect":"duel_shield","uses":1}'::jsonb,'shield','pink',true,184)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      payload = EXCLUDED.payload,
      icon = EXCLUDED.icon,
      accent = EXCLUDED.accent,
      active = EXCLUDED.active,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();
