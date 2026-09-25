# Repaginação da área Social

## Objetivo
Transformar a aba Social em uma rede social simples e clara, inspirada na organização da referência enviada, preservando presentes, comparação e duelos já existentes.

## O que será alterado
- Criar no desktop uma composição em três áreas: navegação social compacta, feed central e painel lateral com amigo, duelo e progresso; no celular, reorganizar tudo em uma única coluna com navegação curta.
- Substituir a sequência repetitiva de conquistas por publicações agrupadas: promoções consecutivas aparecem como uma única evolução, por exemplo “Você chegou ao Ouro I”, com detalhes anteriores recolhidos.
- Refazer cada publicação como uma linha editorial limpa, com avatar, autor, horário, conquista, botão de curtir e comentários expansíveis.
- Adicionar comentários persistentes e em tempo real às atividades, disponíveis aos dois perfis.
- Manter presentes em uma seção própria e simplificada, com estados fáceis de identificar.
- Redesenhar o duelo como placar horizontal discreto, sem o grande bloco roxo e com uma ação clara para jogar ou ver o resultado.
- Aplicar superfícies grafite, divisórias finas e roxo apenas em ações/estados importantes, reduzindo caixas e textos decorativos.

## Regras do feed
- Eventos de subida de rank próximos do mesmo usuário serão consolidados no nível mais recente.
- Curtidas continuarão funcionando sobre as atividades atuais; comentários serão vinculados a cada publicação.
- O feed carregará uma quantidade inicial enxuta e oferecerá “Ver mais”, evitando uma lista visualmente infinita.

## Parte técnica
- Criar armazenamento de comentários com acesso restrito aos dois perfis e atualização em tempo real.
- Estender a camada social existente sem alterar regras de rank, presentes ou duelo.
- Validar a nova tela no computador e no celular, incluindo curtir, comentar, alternar seções e abrir o duelo.
