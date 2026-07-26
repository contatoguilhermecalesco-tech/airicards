import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  Gift,
  Globe,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  Play,
  Plus,
  Search,
  Share2,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useStore,
  createCard,
  updateCard,
  deleteCard,
  deleteDeck,
  isEnemy,
  type Card,
  type CardMode,
} from "@/lib/flashcards-store";
import { translateEnToPt } from "@/lib/translate.functions";
import { buildShareUrl } from "@/lib/share";
import { useCurrentProfile } from "@/lib/profile";
import { publishDeck, unpublishDeck, findPublishedDeck } from "@/lib/marketplace";
import { SendGiftDialog } from "@/components/SendGiftDialog";
import { SyncDot } from "@/components/SyncIndicator";
import { deckGradient, getDeckColor } from "@/lib/deck-colors";
import {
  useCardPrefs,
  setCardPrefs,
  type CardFilter,
  type CardSort,
  type CardViewMode,
} from "@/lib/library-prefs";
import { Field, ConfirmDialog } from "./library.index";

export const Route = createFileRoute("/library/$deckId")({
  head: () => ({
    meta: [
      { title: "Deck — Airi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeckDetail,
});

function DeckDetail() {
  const { deckId } = Route.useParams();
  const router = useRouter();
  const deck = useStore((s) => s.decks.find((d) => d.id === deckId));
  const allCards = useStore((s) => s.cards);
  const cards = useMemo(
    () => allCards.filter((c) => c.deckId === deckId),
    [allCards, deckId],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [giftCard, setGiftCard] = useState<Card | null>(null);
  const [deleteDeckOpen, setDeleteDeckOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published" | "unpublishing">("idle");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedPrice, setPublishedPrice] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [priceInput, setPriceInput] = useState(0);
  const currentProfile = useCurrentProfile();

  useEffect(() => {
    let cancel = false;
    if (!deck || !currentProfile) return;
    findPublishedDeck(currentProfile.id, deck.name).then((row) => {
      if (!cancel) {
        setIsPublished(!!row);
        setPublishedPrice(row?.price ?? 0);
        setPriceInput(row?.price ?? 0);
      }
    });
    return () => {
      cancel = true;
    };
  }, [deck?.name, currentProfile?.id]);

  async function handlePublish(price: number) {
    if (!deck || !currentProfile || publishState !== "idle") return;
    if (cards.length === 0) return;
    try {
      setPublishState("publishing");
      await publishDeck({
        ownerId: currentProfile.id,
        ownerName: currentProfile.name,
        deck,
        cards,
        price,
      });
      setIsPublished(true);
      setPublishedPrice(price);
      setPublishState("published");
      setPublishOpen(false);
      setTimeout(() => setPublishState("idle"), 1800);
    } catch {
      setPublishState("idle");
    }
  }

  async function handleUnpublish() {
    if (!deck || !currentProfile || publishState !== "idle") return;
    try {
      setPublishState("unpublishing");
      await unpublishDeck(currentProfile.id, deck.name);
      setIsPublished(false);
      setPublishState("idle");
    } catch {
      setPublishState("idle");
    }
  }


  async function handleShare() {
    if (!deck || !currentProfile) return;
    const url = buildShareUrl(currentProfile.id, deck.name);
    const message = `Olha esse deck de estudo — "${deck.name}": ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: deck.name,
          text: `Olha esse deck de estudo — "${deck.name}":`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  }

  if (!deck) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Deck não encontrado</h1>
        <Link
          to="/library"
          className="mt-4 inline-flex text-sm text-primary hover:opacity-80"
        >
          Voltar à biblioteca
        </Link>
      </main>
    );
  }

  const due = cards.filter((c) => c.dueAt <= Date.now()).length;
  const enemies = cards.filter(isEnemy).length;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-6 pb-24">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Biblioteca
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{deck.name}</h1>
          {deck.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {deck.description}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {cards.length} carta{cards.length === 1 ? "" : "s"}
            {due > 0 && <> · <span className="text-primary">{due} para revisar</span></>}
            {enemies > 0 && (
              <> · <span className="inline-flex items-center gap-1 text-destructive"><Swords className="h-3 w-3" strokeWidth={2.5} />{enemies} inimiga{enemies === 1 ? "" : "s"}</span></>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-accent sm:flex-none"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nova carta
          </button>
          <button
            onClick={handleShare}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-accent sm:flex-none"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Link copiado
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" strokeWidth={2.5} />
                Compartilhar
              </>
            )}
          </button>
          <button
            onClick={() => (isPublished ? handleUnpublish() : setPublishOpen(true))}
            disabled={cards.length === 0 || publishState !== "idle"}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
              isPublished
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                : "border-border bg-surface hover:bg-accent"
            } ${cards.length === 0 || publishState !== "idle" ? "opacity-50" : ""}`}
            title={
              cards.length === 0
                ? "Adicione cartas antes de publicar"
                : isPublished
                ? "Remover do marketplace"
                : "Publicar no marketplace"
            }
          >
            {publishState === "publishing" ? (
              <>
                <Upload className="h-4 w-4 animate-pulse" strokeWidth={2.5} />
                Publicando…
              </>
            ) : publishState === "published" ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Publicado
              </>
            ) : publishState === "unpublishing" ? (
              <>
                <X className="h-4 w-4" strokeWidth={2.5} />
                Removendo…
              </>
            ) : isPublished ? (
              <>
                <Globe className="h-4 w-4" strokeWidth={2.5} />
                {publishedPrice > 0 ? `${publishedPrice} ✦ no marketplace` : "No marketplace"}
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" strokeWidth={2.5} />
                Publicar
              </>
            )}
          </button>
          <Link
            to="/review"
            search={{ deck: deckId }}
            aria-disabled={due === 0}
            onClick={(e) => {
              if (due === 0) e.preventDefault();
            }}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 sm:flex-none ${
              due === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <Play className="h-4 w-4" strokeWidth={2.5} />
            Revisar
          </Link>
        </div>
      </div>

      <CardsPanel
        deckId={deckId}
        deckColor={deck.color}
        cards={cards}
        onAdd={() => setAddOpen(true)}
        onEdit={(c) => setEditCard(c)}
        onGift={(c) => setGiftCard(c)}
        onDelete={(id) => setConfirmDelete(id)}
      />


      <div className="mt-10 text-center">
        <button
          onClick={() => setDeleteDeckOpen(true)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Excluir este deck
        </button>
      </div>

      {addOpen && (
        <CardSheet deckId={deckId} onClose={() => setAddOpen(false)} />
      )}
      {editCard && (
        <CardSheet
          deckId={deckId}
          card={editCard}
          onClose={() => setEditCard(null)}
        />
      )}
      {giftCard && (
        <SendGiftDialog card={giftCard} onClose={() => setGiftCard(null)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Excluir carta?"
          description="Esta carta será removida permanentemente."
          confirmLabel="Excluir"
          onConfirm={() => {
            deleteCard(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {deleteDeckOpen && (
        <ConfirmDialog
          title="Excluir deck?"
          description="Isso remove o deck e todas as suas cartas."
          confirmLabel="Excluir"
          onConfirm={() => {
            deleteDeck(deckId);
            router.navigate({ to: "/library" });
          }}
          onCancel={() => setDeleteDeckOpen(false)}
        />
      )}
      {publishOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setPublishOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-6 shadow-2xl"
          >
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              Publicar no marketplace
            </p>
            <h3 className="mt-1 text-lg font-semibold">Defina um preço</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Deixe em <b>0</b> para publicar gratuitamente. Compradores pagam em Arlys ✦.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[0, 50, 100, 200, 400].map((v) => (
                <button
                  key={v}
                  onClick={() => setPriceInput(v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    priceInput === v
                      ? "border-violet-400/60 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === 0 ? "Grátis" : `${v} ✦`}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Preço customizado
              </span>
              <input
                type="number"
                min={0}
                max={5000}
                step={10}
                value={priceInput}
                onChange={(e) => setPriceInput(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm focus:border-primary/40 focus:outline-none"
              />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPublishOpen(false)}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePublish(priceInput)}
                disabled={publishState !== "idle"}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
              >
                {publishState === "publishing" ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CardSheet({
  deckId,
  card,
  onClose,
}: {
  deckId: string;
  card?: Card;
  onClose: () => void;
}) {
  const isEdit = !!card;
  const [mode, setMode] = useState<CardMode>(card?.mode ?? "word");
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [source, setSource] = useState(card?.source ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(!!card?.source);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const translate = useServerFn(translateEnToPt);

  async function handleTranslate() {
    if (!front.trim() || translating) return;
    setTranslating(true);
    setTranslateError(null);
    setAlternatives([]);
    try {
      const result = await translate({ data: { text: front.trim() } });
      setBack(result.translation);
      if (result.alternatives?.length) setAlternatives(result.alternatives);
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Falha ao traduzir");
    } finally {
      setTranslating(false);
    }
  }

  const isSentence = mode === "sentence";
  const isExpression = mode === "expression";
  const canSubmit = front.trim() && back.trim();

  const frontLabel = isSentence
    ? "Frase em inglês"
    : isExpression
      ? "Expressão em inglês"
      : "Inglês";
  const frontPlaceholder = isSentence
    ? "Although it was raining, we went outside."
    : isExpression
      ? "Break a leg"
      : "Serendipity";
  const backPlaceholder = isSentence
    ? "Embora estivesse chovendo, nós saímos."
    : isExpression
      ? "Boa sorte / Quebre a perna"
      : "Serendipidade";
  const kindLabel = isSentence ? "frase" : isExpression ? "expressão" : "palavra";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md">
        <div
          className="ios-card m-3 rounded-3xl p-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isEdit ? "Editar carta" : "Nova carta"}
            </h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-white/[0.04] p-1">
            {(["word", "sentence", "expression"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full py-2 text-xs font-semibold transition ${
                  mode === m
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "word" ? "Palavra" : m === "sentence" ? "Frase" : "Expressão"}
              </button>
            ))}
          </div>
          {isSentence && (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Sentence mining: uma frase com <span className="text-foreground">1 palavra nova</span> e contexto claro.
            </p>
          )}
          {isExpression && (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Expressões idiomáticas, phrasal verbs ou combinações de palavras
              cujo sentido não é literal.
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              if (isEdit && card) {
                updateCard(card.id, {
                  front,
                  back,
                  mode,
                  source: source.trim(),
                });
              } else {
                createCard(deckId, front, back, {
                  mode,
                  source: source.trim() || undefined,
                });
              }
              onClose();
            }}
            className="mt-4 space-y-3"
          >
            <Field
              label={frontLabel}
              autoFocus
              value={front}
              onChange={(v) => {
                setFront(v);
                setAlternatives([]);
                setTranslateError(null);
              }}
              placeholder={frontPlaceholder}
            />
            <button
              type="button"
              onClick={handleTranslate}
              disabled={!front.trim() || translating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-40"
            >
              <Sparkles className={`h-4 w-4 ${translating ? "animate-pulse" : ""}`} strokeWidth={2.5} />
              {translating ? "Traduzindo…" : "Traduzir com IA"}
            </button>
            {translateError && (
              <p className="text-xs text-destructive">{translateError}</p>
            )}
            <Field
              label="Tradução"
              value={back}
              onChange={setBack}
              placeholder={backPlaceholder}
            />
            {alternatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Alternativas:
                </span>
                {alternatives.map((alt) => (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => setBack(alt)}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-accent"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                  strokeWidth={2.5}
                />
                Opções avançadas
              </button>
              {advancedOpen && (
                <div className="mt-3">
                  <Field
                    label="Fonte"
                    value={source}
                    onChange={setSource}
                    placeholder="Ex: livro Sapiens, podcast BBC 6-min, série Friends S2E4…"
                  />
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    De onde você tirou essa {kindLabel}. Opcional.
                  </p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
            >
              {isEdit ? "Salvar alterações" : "Adicionar carta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Cards panel (search + view + filter + sort) — Spotify-style
// ============================================================
function CardsPanel({
  deckId,
  deckColor,
  cards,
  onAdd,
  onEdit,
  onGift,
  onDelete,
}: {
  deckId: string;
  deckColor?: string;
  cards: Card[];
  onAdd: () => void;
  onEdit: (c: Card) => void;
  onGift: (c: Card) => void;
  onDelete: (id: string) => void;
}) {
  const prefs = useCardPrefs(deckId);
  const [query, setQuery] = useState("");
  const now = Date.now();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...cards];
    if (q) {
      list = list.filter(
        (c) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q) ||
          (c.source ?? "").toLowerCase().includes(q),
      );
    }
    switch (prefs.filter) {
      case "word":
        list = list.filter((c) => (c.mode ?? "word") === "word");
        break;
      case "sentence":
        list = list.filter((c) => c.mode === "sentence");
        break;
      case "expression":
        list = list.filter((c) => c.mode === "expression");
        break;
      case "new":
        list = list.filter((c) => (c.reps ?? 0) === 0);
        break;
      case "learning":
        list = list.filter((c) => (c.reps ?? 0) > 0 && (c.successes ?? 0) < 3);
        break;
      case "mastered":
        list = list.filter((c) => (c.successes ?? 0) >= 3);
        break;
      case "enemies":
        list = list.filter(isEnemy);
        break;
    }
    switch (prefs.sort) {
      case "recent":
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        break;
      case "alpha":
        list.sort((a, b) => a.front.localeCompare(b.front, "pt"));
        break;
      case "due":
        list.sort((a, b) => a.dueAt - b.dueAt);
        break;
      case "hardest":
        list.sort((a, b) => (b.lapses ?? 0) - (a.lapses ?? 0));
        break;
    }
    return list;
  }, [cards, prefs.filter, prefs.sort, query]);

  if (cards.length === 0) {
    return (
      <div className="mt-8 ios-card grid place-items-center rounded-3xl px-6 py-16 text-center">
        <div>
          <h2 className="text-lg font-semibold">Nenhuma carta ainda</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Adicione palavras em inglês com sua tradução. Elas vão aparecer
            na sua próxima sessão de revisão.
          </p>
          <button
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Adicionar primeira carta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {/* Toolbar */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
        <div className="relative min-w-0">
          <div className="flex items-center gap-2.5 rounded-[16px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 backdrop-blur-2xl transition focus-within:border-primary/40 focus-within:bg-white/[0.06]">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cartas…"
              className="w-full min-w-0 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CardViewToggle mode={prefs.view} onChange={(v) => setCardPrefs(deckId, { view: v })} />
          <CardSortMenu sort={prefs.sort} onChange={(s) => setCardPrefs(deckId, { sort: s })} />
        </div>
      </div>

      <CardFilterChips
        current={prefs.filter}
        onChange={(f) => setCardPrefs(deckId, { filter: f })}
        cards={cards}
        now={now}
      />

      {filtered.length === 0 ? (
        <p className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
          Nenhuma carta com esses filtros.
        </p>
      ) : prefs.view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <CardGridItem
              key={c.id}
              card={c}
              deckColor={deckColor}
              onEdit={() => onEdit(c)}
              onGift={() => onGift(c)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          {filtered.map((c) => (
            <CardListItem
              key={c.id}
              card={c}
              onEdit={() => onEdit(c)}
              onGift={() => onGift(c)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CardViewToggle({
  mode,
  onChange,
}: {
  mode: CardViewMode;
  onChange: (m: CardViewMode) => void;
}) {
  const items: { id: CardViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { id: "list", icon: ListIcon, label: "Lista" },
    { id: "grid", icon: LayoutGrid, label: "Grade" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-[14px] border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md">
      {items.map((it) => {
        const active = mode === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            aria-label={it.label}
            title={it.label}
            className={`grid h-8 w-8 place-items-center rounded-[10px] transition ${
              active
                ? "bg-white/[0.12] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}

function CardSortMenu({
  sort,
  onChange,
}: {
  sort: CardSort;
  onChange: (s: CardSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: { id: CardSort; label: string }[] = [
    { id: "recent", label: "Recentes" },
    { id: "due", label: "Vencimento" },
    { id: "hardest", label: "Mais erradas" },
    { id: "alpha", label: "A → Z" },
  ];
  const label = options.find((o) => o.id === sort)?.label ?? "Ordenar";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1.5 rounded-[14px] border border-white/10 bg-white/[0.03] px-3 text-[13px] font-medium text-foreground/85 backdrop-blur-md hover:bg-white/[0.06]"
      >
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 overflow-hidden rounded-[16px] border border-white/10 bg-[color-mix(in_oklab,var(--surface)_88%,black)]/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] transition ${
                  sort === opt.id
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/85 hover:bg-white/[0.06]"
                }`}
              >
                {opt.label}
                {sort === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={2.75} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CardFilterChips({
  current,
  onChange,
  cards,
  now,
}: {
  current: CardFilter;
  onChange: (f: CardFilter) => void;
  cards: Card[];
  now: number;
}) {
  void now;
  const counts = useMemo(() => {
    return {
      all: cards.length,
      word: cards.filter((c) => (c.mode ?? "word") === "word").length,
      sentence: cards.filter((c) => c.mode === "sentence").length,
      expression: cards.filter((c) => c.mode === "expression").length,
      new: cards.filter((c) => (c.reps ?? 0) === 0).length,
      learning: cards.filter((c) => (c.reps ?? 0) > 0 && (c.successes ?? 0) < 3).length,
      mastered: cards.filter((c) => (c.successes ?? 0) >= 3).length,
      enemies: cards.filter(isEnemy).length,
    };
  }, [cards]);

  const chips: { id: CardFilter; label: string; count: number; tone?: string }[] = [
    { id: "all", label: "Todas", count: counts.all },
    { id: "new", label: "Novas", count: counts.new, tone: "rgb(129 140 248)" },
    { id: "learning", label: "Aprendendo", count: counts.learning, tone: "rgb(251 191 36)" },
    { id: "mastered", label: "Dominadas", count: counts.mastered, tone: "rgb(52 211 153)" },
    { id: "enemies", label: "Inimigas", count: counts.enemies, tone: "rgb(248 113 113)" },
    { id: "word", label: "Palavras", count: counts.word },
    { id: "sentence", label: "Frases", count: counts.sentence },
    { id: "expression", label: "Expressões", count: counts.expression },
  ];

  return (
    <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const active = current === c.id;
        if (c.count === 0 && c.id !== "all") return null;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`shrink-0 snap-start rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
              active
                ? "border-primary/40 bg-primary/15 text-foreground"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            }`}
            style={active && c.tone ? { color: c.tone, borderColor: `${c.tone}55` } : undefined}
          >
            {c.label}
            <span className="ml-1.5 text-[11px] opacity-70">{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function CardListItem({
  card: c,
  onEdit,
  onGift,
  onDelete,
}: {
  card: Card;
  onEdit: () => void;
  onGift: () => void;
  onDelete: () => void;
}) {
  const enemy = isEnemy(c);
  const isNew = (c.reps ?? 0) === 0;
  const mastered = (c.successes ?? 0) >= 3;
  return (
    <li
      className={`group relative flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] ${
        enemy ? "bg-destructive/[0.04]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14.5px] font-semibold text-foreground">
            {c.front}
          </p>
          <SyncDot id={c.id} />
          {c.mode === "expression" && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-primary">
              expr
            </span>
          )}
          {c.mode === "sentence" && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              frase
            </span>
          )}
          {isNew && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-400/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-indigo-300">
              nova
            </span>
          )}
          {mastered && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-300">
              dominada
            </span>
          )}
          {enemy && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-destructive">
              <Swords className="h-2.5 w-2.5" strokeWidth={2.5} />
              inimiga
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{c.back}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          aria-label="Editar carta"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onGift}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
          aria-label="Enviar carta"
          title="Enviar para o outro perfil"
        >
          <Gift className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
          aria-label="Excluir carta"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function CardGridItem({
  card: c,
  deckColor,
  onEdit,
  onGift,
  onDelete,
}: {
  card: Card;
  deckColor?: string;
  onEdit: () => void;
  onGift: () => void;
  onDelete: () => void;
}) {
  const gradient = deckGradient(deckColor);
  const color = getDeckColor(deckColor);
  const enemy = isEnemy(c);
  return (
    <li
      className={`group relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition ${
        enemy ? "border-destructive/30 bg-destructive/[0.04]" : ""
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ background: gradient }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{c.front}</p>
          <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{c.back}</p>
        </div>
        <SyncDot id={c.id} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {c.mode === "expression" && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: color.from, background: `${color.tint}22` }}
          >
            expressão
          </span>
        )}
        {c.mode === "sentence" && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            frase
          </span>
        )}
        {(c.reps ?? 0) === 0 && (
          <span className="rounded-full bg-indigo-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            nova
          </span>
        )}
        {(c.successes ?? 0) >= 3 && (
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            dominada
          </span>
        )}
        {enemy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
            <Swords className="h-2.5 w-2.5" strokeWidth={2.5} />
            inimiga
          </span>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-0.5 opacity-60 transition group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          aria-label="Editar carta"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onGift}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
          aria-label="Enviar carta"
        >
          <Gift className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
          aria-label="Excluir carta"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
