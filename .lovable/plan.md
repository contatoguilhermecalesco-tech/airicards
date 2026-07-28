# Provações do Primeiro Bundle

Vamos refazer o sistema de desafios para virar uma **jornada de boas-vindas** que só existe até o usuário comprar o primeiro bundle. Sem horários, sem reset diário — ela pode fazer no ritmo dela.

## O que muda na ideia

- **Sem prazo.** Os desafios ficam abertos até serem cumpridos. A Arlayne pode voltar semanas depois e continuar de onde parou.
- **Só para quem ainda não tem bundle.** Assim que o usuário compra qualquer bundle da loja, as provações somem da Home e do menu — a missão foi cumprida.
- **Foco em juntar Arlys para o primeiro bundle.** As recompensas somam ~1.100 ✦ (o preço de um bundle mítico), então terminar tudo garante a primeira compra sem depender de sorte diária.
- **Progresso contínuo.** Cada revisão, duelo e redação empurra a barra até 100%. Nada expira à meia-noite.

## As 6 provações (jornada única)

Cada uma abre a próxima quando é reivindicada, criando ritmo sem pressão:

1. **Primeiros passos** — Revise 30 cartas · **80 ✦**
2. **Mira afiada** — Acerte 50 traduções · **120 ✦**
3. **Caçadora de inimigos** — Derrote 10 cartas inimigas · **180 ✦**
4. **Escritora** — Complete 3 exercícios de writing · **150 ✦**
5. **Duelista** — Vença 2 duelos · **220 ✦**
6. **Provação suprema** — Alcance rank Bronze ou superior · **350 ✦**

Total: **1.100 ✦** — exatamente o preço de um bundle mítico.

## Como aparece na Home

- Um único card "Provações do primeiro bundle" abaixo do hero, com barra geral (ex: 3/6 concluídas) e a próxima provação em destaque.
- Ao completar uma, aparece um overlay curto de "Provação cumprida · +X ✦" e a próxima destrava suavemente.
- Ao comprar o primeiro bundle, o card some e um pequeno pop de "Jornada concluída" toca uma vez.

## Detalhes técnicos

- Substituir `daily_challenges` (por dia) por um estado único por perfil em `profile_data.first_bundle_journey` (JSONB): lista de provações + índice atual + `completedAt` de cada uma. Sem migração destrutiva — o `daily_challenges` fica ignorado.
- `src/lib/daily-challenges.ts` vira `src/lib/first-bundle-journey.ts`. Mesmas funções de tracking (`trackReview`, `trackEnemyDefeated`, `trackDuelWin`, `trackWritingComplete`), mas sem `todayKey` nem reset.
- Guardar `hasAnyBundle` derivado do inventário (`wallets.inventory.cosmetics` já contém itens comprados) + histórico em `shop_purchases`. Se `true`, os hooks viram no-op e a UI esconde o card.
- Atualizar imports em `flashcards-store.ts`, `social-store.ts`, `writing-store.ts`, `review.tsx` para as novas funções.
- Novo componente `src/components/home/FirstBundleJourney.tsx` renderizado condicionalmente em `src/routes/index.tsx`.
- Overlay `src/components/ProvacaoCumpridaOverlay.tsx` reutilizando a estética do `GiftReceivedOverlay` (hexágono roxo, som curto).
- Remover `study_minutes` como challenge (não faz sentido sem prazo) e o `setInterval` que adicionei no `review.tsx`.

Confirma que faço nesse formato?