# Corrigir comentários no Social

## Objetivo
Restaurar o fluxo completo de comentários nas publicações: enviar, salvar e exibir imediatamente para os dois perfis.

## Implementação
- Reproduzir a falha com uma sessão válida e identificar se ocorre na interface ou nas permissões de gravação.
- Corrigir a gravação para usar a identidade real do perfil conectado e retornar erros claros à interface.
- Atualizar o feed imediatamente após o envio, mantendo a sincronização em tempo real entre perfis.
- Exibir confirmação ou erro sem apagar o texto quando o salvamento falhar.

## Validação
- Comentar em uma publicação e confirmar que o texto aparece sem recarregar.
- Reabrir o Social e confirmar que o comentário continua salvo.
- Confirmar que o outro perfil também consegue visualizar o comentário.
- Verificar desktop, mobile e compilação final.
