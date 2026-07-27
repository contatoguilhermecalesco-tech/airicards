# Painel Admin — Vitrine da Loja

Sistema para o admin curar manualmente o que aparece no carrossel principal da loja (`ShopHero`), estilo Riot Games — com splash arts customizadas, ordem controlada, tagline e agendamento.

## Tamanhos oficiais de imagem

Documentados dentro do próprio painel (dica visual ao lado dos uploads):

- **Splash art (fundo)**: `2400 × 1200 px` (2:1), JPG ou PNG, até ~800KB
  - Zona segura de texto: 40% esquerdo (título + preço + botão vivem ali)
  - Ponto focal do personagem/item: metade direita
- **Art do item (opcional, canto direito)**: `1024 × 1024 px`, PNG com fundo transparente
- **Ambos são opcionais** — se não subir, o Hero usa o gradient de raridade + ícone (comportamento atual)

## O que o admin controla por slot

- Item vinculado (busca entre `shop_items` ativos + `published_decks` premium)
- Splash art (upload)
- Art do item (upload, opcional)
- Overline/tagline curta ("NOVO", "EDIÇÃO LIMITADA", "VOLTOU")
- Descrição customizada (opcional — sobrescreve a do item)
- Override de raridade visual (opcional)
- Ordem (drag-to-reorder)
- Ativo/inativo (toggle)
- Agendamento opcional: `starts_at` / `ends_at`

## Banco de dados

Nova tabela `shop_featured_slots`:

```text
id              uuid PK
item_kind       text  ('shop_item' | 'deck')
item_id         text  (id em shop_items OU id do published_deck)
splash_url      text?
art_url         text?
tagline         text?
description_override text?
rarity_override text?
position        int   (ordem)
active          bool
starts_at       timestamptz?
ends_at         timestamptz?
created_at/updated_at
```

RLS:
- SELECT: `authenticated` (todos leem — a loja renderiza)
- ALL (write): `is_admin()`

Bucket de storage `shop-featured` (público, apenas admin escreve).

## Estrutura de arquivos

```text
src/routes/admin.tsx                          (adiciona aba "Vitrine")
src/components/admin/FeaturedSlotsPanel.tsx   (lista + drag-reorder + toggle)
src/components/admin/FeaturedSlotEditor.tsx   (modal edição + uploads)
src/lib/featured-slots.ts                     (CRUD + upload helpers)
src/components/shop/ShopHero.tsx              (aceita splash_url/art_url)
src/routes/shop.tsx                           (lê slots reais em vez de derivar por preço)
```

## Fluxo do admin

1. Aba "Vitrine da Loja" no `/admin`
2. Lista de slots ordenada, cada um com preview em miniatura
3. Botão "+ Adicionar slot" → modal:
   - Seletor de item (dropdown com busca)
   - Upload splash (drag & drop com preview real do Hero embaixo)
   - Upload art quadrado (opcional)
   - Campos tagline + descrição
   - Toggle ativo + datas opcionais
4. Reordenar por drag ou setas ↑↓
5. Deletar com confirmação

## Fluxo do usuário (loja)

- Se existem slots ativos e válidos (dentro da janela `starts_at`/`ends_at`), o `ShopHero` mostra APENAS eles, na ordem definida
- Se não há slots ativos, cai no fallback atual (auto-featured pelo preço)
- Splash renderiza como `background-image` cobrindo o card; overlay escuro no lado esquerdo garante legibilidade do texto

## Detalhes técnicos

- Upload usa `supabase.storage.from('shop-featured').upload()` com nome `${slotId}-splash.jpg`; URL pública salva no slot
- Deletar slot também deleta os assets do storage
- `shop.tsx` faz um `.from('shop_featured_slots').select('*').eq('active', true)` no mount e resolve o `item` correspondente do `shop_items`/`published_decks` já carregados em memória
- `ShopHero` ganha props opcionais `splashUrl`/`artUrl`; quando presentes, substituem o backdrop gradient e o preview quadrado
- Agendamento é filtrado client-side no `shop.tsx` (não precisa de cron)

## Fora do escopo desta etapa

- Bundles/skins agrupados (tabela `shop_items.kind='bundle'` com múltiplos itens) — fica pra próxima iteração assim que você tiver as artes
- Analytics de cliques na vitrine
- A/B test entre slots

---

Confirma e eu implemento tudo (migration + storage bucket + painel + integração com o Hero).
