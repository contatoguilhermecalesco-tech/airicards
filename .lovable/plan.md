# Lista de amigos no Perfil

## Objetivo
Substituir o bloco “Perfil do parceiro” por uma lista de amigos compacta, inspirada na lista social do League of Legends. Nesta versão, a lista mostra apenas o outro usuário do sistema.

## Experiência
- Exibir uma seção “Amigos” dentro da aba Perfil.
- Mostrar o outro usuário em uma linha limpa com avatar, nome e presença recente.
- Ao tocar no usuário, abrir um painel reduzido sobre a página.
- O painel terá três ações claras:
  - **Ver perfil**: abre o perfil público do amigo.
  - **Presentear**: leva à área apropriada para escolher algo para enviar.
  - **Cutucar**: envia a cutucada usando o sistema e o tempo de espera já existentes.
- Manter boa usabilidade no celular, com área de toque confortável e fechamento simples.

## Detalhes técnicos
- Reutilizar `ProfileAvatar`, `PokeButton`, o estado de presença existente e as rotas sociais atuais.
- Criar um componente dedicado à lista/painel de amizade para não aumentar ainda mais a página de perfil.
- Não criar sistema de convites, busca ou múltiplos amigos nesta etapa.
- Não alterar dados ou regras do backend: Guilherme e Arlayne continuam sendo os únicos perfis disponíveis.
- Validar tipos e o fluxo no perfil mobile após a implementação.
