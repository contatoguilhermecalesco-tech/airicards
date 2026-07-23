# Plano — UX + Social

Vou entregar todos os 7 itens de uma vez, priorizando os que dão mais valor imediato. Os dois pesados (offline real e marketplace) recebem tratamento cuidadoso para não quebrar o app.

## 1. Widget iOS / Instalável (PWA manifest)
- Criar `public/manifest.webmanifest` com nome "airi", ícones (do logo atual), `theme_color` roxo, `display: standalone`.
- Adicionar `<link rel="manifest">`, `apple-touch-icon` e `apple-mobile-web-app-*` no `__root.tsx`.
- Resultado: no iPhone, "Adicionar à Tela de Início" cria ícone airi, abre em fullscreen sem barra do Safari. Não é widget nativo (iOS não permite via web), mas é o mais próximo possível.

## 2. Modo Offline
- Instalar `vite-plugin-pwa` com `generateSW` + `registerType: "autoUpdate"`.
- Criar wrapper `src/lib/register-sw.ts` que **só registra em produção** (bloqueia iframe/preview/dev — conforme regras Lovable).
- Estratégia: `NetworkFirst` para HTML, `CacheFirst` para assets hasheados. Cartas e progresso já ficam no Supabase — o app volta a abrir offline e cartas locais (LocalStorage) funcionam sem rede.
- Aviso: offline só funciona no app publicado, nunca no preview.

## 3. Atalhos de teclado (review)
- Em `src/routes/review.tsx`, adicionar `useEffect` com `keydown`:
  - `Espaço` → virar carta
  - `1` ou `E` → Errei
  - `2` ou `A` → Acertei
  - `F` (após acerto) → Fácil, `M` → Médio, `D` → Difícil
  - `Esc` → sair
- Adicionar dica visual pequena ("Espaço para virar · 1 Errei · 2 Acertei") só em `sm:` (desktop).

## 4. Modo Foco
- Toggle no topo da tela de revisão (ícone `Focus`/`Minimize2`).
- Ativo: esconde header interno, contador de sessão, botão sair, atalhos de teclado; deixa só a carta + botões grandes. Vinheta escura no fundo.
- Estado guardado em `localStorage` (`airi.focus-mode`) — quem gosta, mantém sempre.

## 5. Onboarding progressivo
- Novo `src/components/OnboardingTour.tsx` — 4 slides curtos estilo iOS (Início / Biblioteca / Revisão / Rank).
- Trigger: `localStorage.getItem("airi.onboarded") !== "v1"` na primeira visita do perfil.
- Estilo: bottom sheet no mobile, modal centrado no desktop. Botão "Pular" + "Próximo/Começar".

## 6. Compartilhar conquistas (estilo Wrapped)
- Botão "Compartilhar" no `/rank` e no header do streak em `/`.
- Novo componente `src/components/ShareCard.tsx` que renderiza um card 1080×1920 (formato stories) via HTML Canvas puro (sem `html-to-image`):
  - Gradiente roxo profundo, emblema do rank, LP, tier, streak, cartas dominadas, nome do perfil, marca "airi".
- Ação: `canvas.toBlob` → `navigator.share` no mobile (com fallback para `download`).

## 7. Marketplace de decks
- **Migration**: nova tabela `public.published_decks` (owner_profile_id, slug, name, description, color_key, card_count, cards jsonb, likes int, created_at, updated_at). Índice único em `(owner_profile_id, slug)`. RLS: leitura pública, escrita só pelo dono do slug (baseado em `X-Profile-ID` header — simplificando: qualquer authenticated pode inserir/atualizar já que o app já usa profile_id texto).
- **Publicar deck**: no `library.$deckId.tsx`, adicionar botão "Publicar no Marketplace" ao lado do "Compartilhar link". Copia cartas p/ tabela pública.
- **Nova rota `/marketplace`**: grid dos decks públicos com filtro por autor, busca, contagem de cartas, botão "Curtir" (incrementa `likes`) e "Adicionar à minha biblioteca" (reusa lógica de importação atual).
- Item no navbar bottom não muda (já cheio); acesso via `/library` — botão "Explorar marketplace".

## Ordem de execução técnica

1. Disparar migration do marketplace (aprovação assíncrona).
2. Em paralelo, escrever: manifest, wrapper SW, config vite, review keyboard/focus, OnboardingTour, ShareCard, componente do marketplace.
3. Ligar botões no `/rank`, `/library.$deckId`, `/library.index`.
4. Verificação final: build/typecheck automático + screenshot rápido do review + rank.

## O que NÃO faço (por segurança)
- Widget de tela de bloqueio nativo do iOS — impossível via PWA.
- Marketplace com pagamentos/moderação — só listagem pública gratuita.
- Estatísticas complexas no share card (v1 mostra rank + streak + cartas).

Se você aprovar, sigo direto para implementação. Se quiser ajustar algo (ex: remover algum atalho, mudar formato do share pra quadrado, etc.), me diz agora.
