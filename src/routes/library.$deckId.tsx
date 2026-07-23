import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ChevronDown, Pencil, Play, Plus, Share2, Sparkles, Swords, Trash2, X } from "lucide-react";
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
  const [deleteDeckOpen, setDeleteDeckOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentProfile = useCurrentProfile();

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

      <div className="mt-8">
        {cards.length === 0 ? (
          <div className="ios-card grid place-items-center rounded-3xl px-6 py-16 text-center">
            <div>
              <h2 className="text-lg font-semibold">Nenhuma carta ainda</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Adicione palavras em inglês com sua tradução. Elas vão aparecer
                na sua próxima sessão de revisão.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Adicionar primeira carta
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {cards.map((c) => (
              <li
                key={c.id}
                className={`ios-card group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${
                  isEnemy(c) ? "ring-1 ring-destructive/30" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{c.front}</p>
                    {c.mode === "expression" && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        expressão
                      </span>
                    )}
                    {isEnemy(c) && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                        <Swords className="h-2.5 w-2.5" strokeWidth={2.5} />
                        inimiga
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {c.back}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditCard(c)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Editar carta"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Excluir carta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
