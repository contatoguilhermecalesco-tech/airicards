import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ArrowRight, Trash2, X, Search, Sparkles, Pencil, Layers, Check, Globe } from "lucide-react";
import {
  useStore,
  createDeck,
  deleteDeck,
  updateDeck,
  type Deck,
} from "@/lib/flashcards-store";
import {
  DECK_COLORS,
  DEFAULT_DECK_COLOR,
  deckGradient,
  getDeckColor,
} from "@/lib/deck-colors";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Airi" },
      {
        name: "description",
        content: "Gerencie seus decks de flashcards de inglês.",
      },
    ],
  }),
  component: Library,
});

function Library() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const [sheet, setSheet] = useState<{ mode: "create" } | { mode: "edit"; deck: Deck } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const now = Date.now();
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalDue = cards.filter((c) => c.dueAt <= now).length;
    return { totalCards, totalDue };
  }, [cards, now]);

  const filteredDecks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q),
    );
  }, [decks, query]);

  return (
    <main className="relative mx-auto max-w-3xl px-5 pt-6 pb-28 sm:pt-10">
      {/* Ambient iOS-style backdrop (soft) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[320px] opacity-40"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 0%, rgba(167,139,250,0.14), transparent 70%), radial-gradient(45% 60% at 85% 5%, rgba(96,165,250,0.10), transparent 70%)",
        }}
      />

      {/* Large iOS title */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
            Biblioteca
          </p>
          <h1 className="mt-2 bg-linear-to-br from-foreground to-foreground/55 bg-clip-text text-[34px] font-bold leading-tight tracking-tight text-transparent sm:text-[42px]">
            Seus decks
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {decks.length > 0
              ? `${decks.length} deck${decks.length === 1 ? "" : "s"} · ${stats.totalCards} carta${stats.totalCards === 1 ? "" : "s"}${stats.totalDue > 0 ? ` · ${stats.totalDue} para revisar` : ""}`
              : "Organize seu vocabulário e revise todos os dias."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/marketplace"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-foreground/85 backdrop-blur-md transition hover:bg-white/[0.08]"
            title="Explorar decks públicos"
          >
            <Globe className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Marketplace</span>
          </Link>
          <button
            onClick={() => setSheet({ mode: "create" })}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition active:scale-95 hover:brightness-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
            <span className="hidden sm:inline">Novo deck</span>
          </button>
        </div>
      </header>

      {/* Search — iOS 18 chunky field */}
      {decks.length > 0 && (
        <div className="relative mt-6 group">
          <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-primary/10 opacity-0 blur-xl transition group-focus-within:opacity-100" />
          <div className="relative flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-2xl transition focus-within:border-primary/40 focus-within:bg-white/[0.06]">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar decks…"
              className="w-full min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none"
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
      )}

      {/* Deck list */}
      <div className="mt-6">
        {decks.length === 0 ? (
          <EmptyState onCreate={() => setSheet({ mode: "create" })} />
        ) : filteredDecks.length === 0 ? (
          <p className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
            Nenhum deck encontrado para “{query}”.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {filteredDecks.map((d) => {
              const deckCards = cards.filter((c) => c.deckId === d.id);
              const total = deckCards.length;
              const due = deckCards.filter((c) => c.dueAt <= now).length;
              const studied = deckCards.filter((c) => c.reps > 0).length;
              const progress = total === 0 ? 0 : Math.round((studied / total) * 100);
              return (
                <DeckCard
                  key={d.id}
                  deck={d}
                  total={total}
                  due={due}
                  progress={progress}
                  onEdit={() => setSheet({ mode: "edit", deck: d })}
                  onDelete={() => setConfirmId(d.id)}
                />
              );
            })}
          </ul>
        )}
      </div>

      {sheet?.mode === "create" && (
        <DeckSheet onClose={() => setSheet(null)} />
      )}
      {sheet?.mode === "edit" && (
        <DeckSheet deck={sheet.deck} onClose={() => setSheet(null)} />
      )}
      {confirmId && (
        <ConfirmDialog
          title="Excluir deck?"
          description="Isso remove o deck e todas as suas cartas. Não pode ser desfeito."
          confirmLabel="Excluir"
          onConfirm={() => {
            deleteDeck(confirmId);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </main>
  );
}

function DeckCard({
  deck,
  total,
  due,
  progress,
  onEdit,
  onDelete,
}: {
  deck: Deck;
  total: number;
  due: number;
  progress: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = getDeckColor(deck.color);
  const hasReview = due > 0;
  const gradient = deckGradient(deck.color);
  return (
    <li className="group relative">
      {/* Colored ambient glow behind card (subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-[28px] opacity-0 blur-xl transition group-hover:opacity-20"
        style={{ background: gradient }}
      />
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl transition active:scale-[0.99]">



        <Link
          to="/library/$deckId"
          params={{ deckId: deck.id }}
          className="relative flex items-start gap-3.5"
        >
          {/* iOS app-icon tile */}
          <div
            className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={{ background: gradient }}
          >
            <Layers className="h-6 w-6 drop-shadow" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-bold leading-tight text-foreground">
              {deck.name}
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {total} carta{total === 1 ? "" : "s"}
              {deck.description ? ` · ${deck.description}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={
                  hasReview
                    ? {
                        color: color.from,
                        background: `${color.tint}22`,
                        boxShadow: `inset 0 0 0 1px ${color.tint}55`,
                      }
                    : {
                        color: "rgb(148 163 184)",
                        background: "rgba(148,163,184,0.12)",
                        boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.25)",
                      }
                }
              >
                {hasReview ? `${due} revisar` : "em dia"}
              </span>
            </div>
          </div>
        </Link>

        {/* Progress bar */}
        <div className="relative mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Progresso</span>
            <span className="text-foreground/80">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: gradient,
                boxShadow: undefined,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="relative mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              aria-label={`Editar ${deck.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
              aria-label={`Excluir ${deck.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/library/$deckId"
            params={{ deckId: deck.id }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[13px] font-semibold text-foreground/90 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.10]"
          >
            Abrir
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[28px]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
          style={{ background: deckGradient("violet") }}
        >
          <Sparkles className="h-7 w-7" strokeWidth={2.25} />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Crie seu primeiro deck</h2>
        <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted-foreground">
          Um deck é uma coleção temática de cartas — verbos, palavras de
          viagem, phrasal verbs, o que você quiser aprender.
        </p>
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" strokeWidth={2.75} />
          Novo deck
        </button>
      </div>
    </div>
  );
}

function DeckSheet({ deck, onClose }: { deck?: Deck; onClose: () => void }) {
  const editing = !!deck;
  const [name, setName] = useState(deck?.name ?? "");
  const [desc, setDesc] = useState(deck?.description ?? "");
  const [color, setColor] = useState(deck?.color ?? DEFAULT_DECK_COLOR.id);
  const previewColor = getDeckColor(color);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md">
        <div className="m-3 overflow-hidden rounded-[28px] border border-white/10 bg-[color-mix(in_oklab,var(--surface)_86%,black)]/90 p-6 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          {/* Preview badge */}
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
              style={{ background: deckGradient(color) }}
            >
              <Layers className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold">
                {editing ? "Editar deck" : "Novo deck"}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {previewColor.label}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              if (editing && deck) {
                updateDeck(deck.id, {
                  name: name.trim(),
                  description: desc.trim() || undefined,
                  color,
                });
              } else {
                createDeck(name, desc, color);
              }
              onClose();
            }}
            className="mt-5 space-y-4"
          >
            <Field
              label="Nome"
              autoFocus
              value={name}
              onChange={setName}
              placeholder="Essenciais de viagem"
            />
            <Field
              label="Descrição"
              optional
              value={desc}
              onChange={setDesc}
              placeholder="Palavras que preciso no aeroporto"
            />

            {/* Color picker */}
            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cor do deck
              </span>
              <div className="grid grid-cols-6 gap-2.5">
                {DECK_COLORS.map((c) => {
                  const selected = c.id === color;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      aria-label={c.label}
                      className="relative grid aspect-square place-items-center rounded-[14px] transition active:scale-90"
                      style={{
                        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                        boxShadow: selected
                          ? `0 0 0 2px var(--background), 0 0 0 4px ${c.tint}, 0 8px 20px -8px ${c.tint}`
                          : "inset 0 1px 0 rgba(255,255,255,0.3)",
                      }}
                    >
                      {selected && (
                        <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-2 w-full rounded-2xl py-3 text-[15px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              style={{ background: deckGradient(color) }}
            >
              {editing ? "Salvar alterações" : "Criar deck"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  autoFocus,
  as = "input",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  autoFocus?: boolean;
  as?: "input" | "textarea";
}) {
  const commonClass =
    "w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-primary/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-primary/15";
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {optional && (
          <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/60">
            opcional
          </span>
        )}
      </span>
      {as === "textarea" ? (
        <textarea
          rows={3}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={commonClass}
        />
      ) : (
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={commonClass}
        />
      )}
    </label>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm px-3">
        <div className="rounded-[24px] border border-white/10 bg-[color-mix(in_oklab,var(--surface)_86%,black)]/90 p-6 text-center backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-sm font-medium hover:bg-white/[0.1]"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-95"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
