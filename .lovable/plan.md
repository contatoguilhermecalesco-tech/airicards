## Sistema de Elo estilo League of Legends — "airi Rank"

Um sistema de ranqueamento visual e progressivo que transforma o estudo em jornada competitiva contra si mesmo. Nada de comparação social direta — é o **seu elo**, subindo conforme você domina o inglês.

### 🏆 Tiers (10 patamares clássicos do LoL)

```text
Ferro  →  Bronze  →  Prata  →  Ouro  →  Platina
   →  Esmeralda  →  Diamante  →  Mestre  →  Grão-Mestre  →  Desafiante
```

- Cada tier de Ferro até Diamante tem **4 divisões** (IV, III, II, I).
- Mestre / Grão-Mestre / Desafiante são **tiers absolutos** (sem divisão), acessados por LP total.
- Cada tier tem sua **cor, gradiente e emblema** próprios (visual iOS glass — sem neon de IA).

### 💎 LP (League Points) — como ganhar e perder

| Ação | LP |
|---|---|
| Acerto fácil em revisão | +2 |
| Acerto médio | +4 |
| Acerto difícil | +6 |
| Derrotar carta inimiga | +15 |
| Completar meta diária | +20 |
| Manter streak (bônus por dia) | +5 × dias (até cap) |
| Concluir aula de gramática | +25 |
| Redação corrigida (nota ≥ 7) | +30 |
| Prova mensal (varia por nota) | +50 a +200 |
| Erro em revisão | −1 |
| Inimigo evoluiu (lapse ≥ 3) | −10 |
| Quebrar streak | −25 |

### 📈 Promoção e Rebaixamento

- Chegou a **100 LP** numa divisão → dispara **Série de Promoção** (melhor de 3 acertos consecutivos numa mini-revisão especial).
- Passou na série → sobe de divisão com animação cinematográfica.
- Perdeu 3 dias seguidos sem estudar → risco de **rebaixamento** (barra vermelha, aviso claro).
- Existe **proteção de tier**: nunca cai de tier maior (ex: Ouro IV não cai pra Prata I na primeira falha — precisa esgotar buffer).

### 🎨 Onde o rank aparece

1. **Home** — badge do tier ao lado do nome, mini barra de LP abaixo do anel de progresso.
2. **Nova rota `/rank`** — página dedicada estilo tela de perfil do LoL:
   - Emblema grande do tier atual com animação de brilho.
   - Barra de LP com marcação da série de promoção.
   - Histórico de promoções (timeline).
   - "Próximo objetivo": quanto falta pra próxima divisão.
   - Estatísticas: taxa de acerto, inimigos derrotados, dias no tier atual.
3. **Review** — micro-popup "+4 LP" ao lado do botão quando acerta (estilo dano flutuante que já existe).
4. **Bottom bar** — ícone de escudo/coroa acessa `/rank`.

### 🛡️ Mecânicas anti-frustração (nada de punir demais)

- **LP nunca vai abaixo de 0** dentro de uma divisão até esgotar buffer de proteção.
- **Placement Games**: nas primeiras 10 sessões o usuário faz "partidas de posicionamento" e é colocado num tier inicial justo (baseado em acertos, não em Ferro forçado).
- Rebaixamento só acontece após **avisos claros** (notificação + toast).

### 🔧 Detalhes técnicos

**Novo arquivo `src/lib/rank-store.ts`:**
- `RankState = { tier: TierName, division: 1..4 | null, lp: number, promoSeries?: { wins, losses, target }, placementGamesLeft: number, history: RankEvent[] }`
- Persistido em `profile_data.data.rank` (JSON, isolado por perfil como o resto).
- Funções puras: `addLp(state, amount, reason)`, `checkPromotion(state)`, `checkDemotion(state)`, `tierMeta(tier)` (cor, gradiente, nome PT-BR, ícone SVG inline).
- Hook `useRank()` com subscription pattern igual ao `useStreak`.

**Gatilhos (sem quebrar fluxos existentes):**
- Em `flashcards-store.ts`: hooks `onCorrect(difficulty)`, `onWrong()`, `onEnemyDefeated()` chamam `addLp`.
- Em `writing-store.ts`, `grammar-store.ts`, `exam-store.ts`: gatilho ao completar.
- `bumpStreak` dispara bônus diário.

**Nova rota `src/routes/rank.tsx`:**
- Emblema SVG por tier (formas geométricas iOS — losango, escudo, coroa — nada de neon).
- Barra de LP animada (0-100).
- Modal da Série de Promoção quando LP = 100.
- Histórico em cards estilo iOS (data, evento, ganho/perda).

**Componente `<RankBadge size="sm|md|lg" />`:**
- Reutilizável em Home, admin, notificações.
- Emblema + tier + divisão + LP compacto.

**Admin (`/admin`):**
- Botão "Recalibrar rank do perfil" (reset para placement).
- Toggle "Ativar/desativar sistema de rank" via `app_settings` (caso queira esconder depois).

**Design (iOS glass, sem neon de IA):**
- Cada tier tem paleta sutil: Ferro (grafite), Bronze (âmbar queimado), Prata (cinza perolado), Ouro (dourado quente), Platina (verde-água claro), Esmeralda (verde jade), Diamante (azul gelo), Mestre (roxo do app), Grão-Mestre (vermelho vinho), Desafiante (branco luminescente com detalhe roxo).
- Emblemas em SVG geométrico com gradiente linear + rim light — sem partículas.
- Transições de tier: fade + scale suave, som opcional (respeita preferências de notificação).

### 📦 Ordem de implementação (num único envio)

1. `src/lib/rank-store.ts` — tipos, tiers, cálculos, hook, persistência.
2. `src/components/RankBadge.tsx` — badge reutilizável + emblemas SVG.
3. Integrações de gatilho em `flashcards-store.ts` (revisão), `writing-store.ts`, `grammar-store.ts`, `exam-store.ts`.
4. `src/routes/rank.tsx` — página completa do rank + série de promoção.
5. Home (`src/routes/index.tsx`) — badge ao lado do nome + mini barra de LP.
6. Bottom bar — novo ícone "Rank".
7. Admin — controle de recalibração e toggle global.

### 🎯 Fora do escopo (podemos fazer depois)

- Comparação entre perfis (Guilherme vs Arlayne) — hoje deixa cada um no seu.
- Leaderboard global.
- Cosméticos por tier (skins de deck).