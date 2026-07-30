## Objetivo
Renomear o bundle **Crepúsculo Carmesim** para **Véu do Crepúsculo** e equilibrar a curva de preços/raridades dos bundles, já que ele tem mais itens (11) que os outros.

## Proposta de equilíbrio

| Bundle | Itens | Preço atual | Preço novo | Raridade nova |
|--------|-------|-------------|------------|---------------|
| **Véu do Crepúsculo** | 11 | 300 ✦ | **1.100 ✦** | Mítico |
| **Monarca das Sombras** | 7 | 1.100 ✦ | **700 ✦** | Lendário |
| **Florescer Celestial** | 6 | 1.100 ✦ | **500 ✦** | Épico |

### Por quê isso funciona
- **Véu do Crepúsculo** vira o bundle mais valioso: 11 itens, incluindo skin de mesa, streak flame, selo, título e splash de vitória.
- **Monarca das Sombras** fica no meio: 7 itens, temática dark premium, preço de "bundle lendário".
- **Florescer Celestial** vira o bundle de entrada: 6 itens, mais acessível para quem completa a jornada de boas-vindas.
- A jornada de boas-vindas continua premiando **1.100 ✦**, mas agora direciona para o bundle **Véu do Crepúsculo** (o mais caro), dando um objetivo claro de longo prazo.
- Os preços individuais dos cosméticos continuam altos como "preço de referência", então o modal de bundle mostrará economias grandes e atrativas.

## O que será alterado

### Banco de dados
1. Atualizar `shop_items`:
   - `bundle.eclipse_carmesim`: nome → **Véu do Crepúsculo**, preço → **1.100**
   - `bundle.monarca_sombras`: preço → **700**
   - `bundle.florescer_celestial`: preço → **500**

### Código
1. `src/routes/b.$id.tsx` — atualizar meta título/descrição do bundle `bundle.eclipse_carmesim` para "Véu do Crepúsculo".
2. `src/components/home/FirstBundleJourney.tsx` — trocar o texto/link do bundle alvo de "Florescer Celestial" para "Véu do Crepúsculo" (`bundle.eclipse_carmesim`).
3. `src/lib/daily-challenges.ts` — atualizar comentário sobre o bundle mítico alvo.
4. `src/lib/shop-asset-overrides.ts` — atualizar comentário do bundle.

### Opcional (se necessário)
- Ajustar descrição do bundle `bundle_concepts` se o título atual conflitar com a nova curva.

## Resultado esperado
- Loja mostra três bundles em tiers claros: Épico (500 ✦), Lendário (700 ✦) e Mítico (1.100 ✦).
- A jornada de boas-vindas guia o usuário ao bundle mais caro, aumentando retenção.
- Nenhum jogador perde itens já comprados — só o preço de novas compras muda.