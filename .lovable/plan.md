# Corrigir direcionamento da Central de Notificações

## Objetivo
Fazer as ações das notificações abrirem corretamente a aba configurada tanto no sino quanto na Central de Notificações.

## Implementação
- Unificar a navegação no item reutilizado pelos dois locais.
- Preservar a marcação como lida ao abrir uma notificação.
- Manter destinos com parâmetros, como desafios na tela inicial.
- Validar os fluxos no sino e na página `/notificacoes`, em desktop e mobile.

## Verificação
- Confirmar que a ação abre o destino correto nos dois locais.
- Confirmar que a leitura é registrada e que o projeto compila sem erros.
