# Central de atualizações do sistema

## Objetivo
Criar uma área separada das notificações pessoais para comunicar manutenção, recursos temporariamente inativos, instabilidades e normalizações do airi.

## O que será criado
- Um segundo ícone de avisos no topo, ao lado do sino atual, com contador próprio de atualizações não lidas.
- Um painel rápido nesse ícone, seguindo o mesmo acabamento do sino, com os avisos mais recentes, estado do sistema e acesso à central completa.
- Uma nova página **Atualizações do sistema**, organizada por data e por estado: manutenção, indisponível, instável, informativo e normalizado.
- Leitura separada por perfil, incluindo “marcar tudo como lido”, sem misturar esses avisos com notificações sociais, presentes ou duelos.
- Uma nova opção no Admin chamada **Atualizações**, com formulário manual para título, mensagem, estado, ícone, cor, função afetada, botão opcional e destino dentro do app.
- Histórico no Admin para conferir e excluir os avisos publicados.

## Comportamento
- O administrador escolhe o estado do aviso; cada estado terá cor e símbolo claros, evitando o problema do avatar “G”.
- Um aviso pode informar, por exemplo, “Social em manutenção”, indicar a área afetada e levar diretamente a ela quando houver um botão configurado.
- Novos avisos aparecem em tempo real nos dois perfis e acendem apenas o contador da nova central.
- Avisos normalizados continuam no histórico para deixar claro quando uma função voltou a operar.

## Dados e segurança
- Criar tabelas próprias para atualizações e leituras por perfil, com acesso de leitura aos usuários autenticados e escrita limitada a administradores.
- Manter os dados separados das notificações atuais para evitar classificações erradas, avatares indevidos e contadores misturados.

## Validação
- Confirmar a criação manual no Admin, o recebimento no ícone do topo, a leitura individual e a central completa.
- Conferir desktop e mobile, estados vazios, contador, ações e atualização em tempo real.
- Validar compilação e ausência de erros no navegador.
