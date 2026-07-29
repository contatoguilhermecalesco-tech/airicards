insert into public.shop_items (id, kind, name, description, price, payload, icon, accent, active, sort_order) values
('cosmetic.streak_flame.brasa_carmesim','cosmetic','Brasa Carmesim','Sua chama de sequência vira brasa negra e rubra, com fagulhas subindo. Quanto maior a streak, mais intensa a queima.',550,'{"key":"brasa_carmesim","slot":"streak_flame"}','flame','crimson',true,316),
('cosmetic.streak_flame.eclipse_vivo','cosmetic','Eclipse Vivo','No lugar do fogo, um pequeno eclipse pulsa com coroa de luz âmbar marcando os dias seguidos.',550,'{"key":"eclipse_vivo","slot":"streak_flame"}','moon','crimson',true,317),
('cosmetic.enemy_seal.selo_eclipse','cosmetic','Selo do Eclipse','Cartas inimigas ganham um sigilo rúnico girando atrás da carta e um selo estampado a cada acerto ou erro.',700,'{"key":"selo_eclipse","slot":"enemy_seal"}','sparkles','crimson',true,318),
('cosmetic.title.arauto_eclipse','cosmetic','Arauto do Eclipse','Título animado com gradiente carmesim exibido logo abaixo do seu nome no perfil.',500,'{"key":"arauto_eclipse","slot":"title"}','crown','crimson',true,319),
('cosmetic.victory_splash.ascensao_carmesim','cosmetic','Ascensão Carmesim','Ao vencer um duelo, a tela inteira explode em raios rubros e brasas com o brasão da vitória.',800,'{"key":"ascensao_carmesim","slot":"victory_splash"}','trophy','crimson',true,320)
on conflict (id) do update set name=excluded.name, description=excluded.description, price=excluded.price, payload=excluded.payload, icon=excluded.icon, accent=excluded.accent, active=true, sort_order=excluded.sort_order;

update public.shop_items
set payload = jsonb_build_object('items', jsonb_build_array(
  'cosmetic.effect.catedral_eclipse',
  'cosmetic.overlay.rosas_crepusculo',
  'cosmetic.aura.veu_carmesim',
  'cosmetic.frame.coroa_crepusculo',
  'cosmetic.veil.veu_rubro',
  'cosmetic.companion.corvo_carmesim',
  'cosmetic.streak_flame.brasa_carmesim',
  'cosmetic.enemy_seal.selo_eclipse',
  'cosmetic.title.arauto_eclipse',
  'cosmetic.victory_splash.ascensao_carmesim'
))
where id = 'bundle.eclipse_carmesim';