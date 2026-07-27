Vou resolver os três pontos técnicos, na ordem que o app pede (o mais rápido/isolado primeiro, o refactor grande por último).

## 1. Remover o card "Em breve" de `/study`

Hoje todos os cinco dias da semana já têm rota (`to`). O trecho de `Lock` + `"Em breve"` em `src/routes/study.index.tsx` nunca renderiza — é código morto que só polui a leitura.

- Simplificar o componente: remover `available`, `Lock`, `!available && "Em breve"`.
- Deixar apenas o caminho com `Link to={d.to}`.
- Sem mudança visual para o usuário (o dia bloqueado nunca aparecia).

## 2. Sincronizar missões das inimigas na nuvem

**Problema:** `src/lib/enemy-system.ts` guarda `airi.enemy-missions.<profile>` só no `localStorage`, então progresso de missão diária/semanal não bate entre PC e celular.

**Combo** eu deixo local: ele é uma métrica de sessão da Arena (zera ao sair, não faz sentido sincronizar contador em tempo real entre abas). Vou apenas persistir o `best` do dia dentro da mesma estrutura de missões, para ficar cross-device.

**Solução (sem migration nova):** guardar missões dentro do `profile_data.data` JSONB, num sub-objeto `enemyMissions`. Isso reusa o pipeline de sync já existente (`flashcards-store` faz merge por `updated_at` e tem `lastLocalMutationAt`).

Passos:
- Estender `flashcards-store` para expor um espaço leve `getMeta("enemyMissions") / setMeta(...)` gravando dentro de `data.meta.enemyMissions`, marcando `lastLocalMutationAt` para não ser sobrescrito pela nuvem.
- Em `enemy-system.ts`:
  - `loadState()` lê primeiro do store (nuvem→memória) e cai no `localStorage` como fallback/migração única.
  - `persistMissions()` grava no store (que dispara sync) e também no `localStorage` (offline).
  - `onEnemyDefeated` / `onComboReached` / `claimMission` continuam iguais — só a persistência muda.
  - Ao trocar de perfil (evento existente), `refreshMissionsForCurrentProfile()` recarrega do store.
- Reconciliação de datas: se dailyKey/weeklyKey da nuvem for mais recente que o local, adota a nuvem; se local tem mais progresso na mesma chave, faz `max(progress)` por missão de mesmo `id` (evita perder progresso ao abrir o outro device com estado antigo em cache).

## 3. Refatorar `src/routes/admin.tsx` (2653 linhas)

Hoje o arquivo é um monólito com ~12 painéis. Vou extrair cada painel para `src/components/admin/*.tsx`, mantendo comportamento 100% igual. A rota `admin.tsx` fica só com o Gate + navegação entre painéis (~250 linhas).

Nova estrutura:

```text
src/components/admin/
  types.ts                  // PanelDef, constantes compartilhadas
  SessionsPanel.tsx
  RankAdminSection.tsx
  ProfilesRankOverview.tsx
  TagsSection.tsx
  NotificationsSection.tsx
  ExamAdminSection.tsx
  ChangelogSection.tsx
  ArlysAdminSection.tsx
  DuelsAdminSection.tsx
  PinAdminSection.tsx
  BackupSection.tsx
  StreakAdminSection.tsx
src/routes/admin.tsx        // Gate + AdminPage (registry + roteador de painéis)
```

Regras do refactor:
- Nenhuma mudança de comportamento, texto, estilo ou fluxo.
- Constantes locais (`ADMIN_PROFILE_ID`, `TAG_COLORS`, `QUICK_GRANTS`, `NOTIFICATION_ROUTES`, `CHANGELOG_CATEGORIES`) vão para `types.ts` ou ficam no arquivo do painel que as usa.
- Helpers puros usados por só um painel viajam junto com ele.
- Imports do Supabase, stores e libs continuam iguais dentro de cada arquivo movido.
- Rota exporta o mesmo `Route` e usa `ADMIN_PANELS` montado a partir dos componentes extraídos.

### Ordem de execução
1. Study "Em breve" (1 arquivo).
2. Sync das missões (2 arquivos: `flashcards-store.ts`, `enemy-system.ts`).
3. Refactor admin (criação dos 12 arquivos + reescrita enxuta de `admin.tsx`).

Sem mudanças de schema, sem novas rotas, sem alterar UI.