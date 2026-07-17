import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ArrowRight, Trash2, X, Search, Sparkles } from "lucide-react";
import { useStore, createDeck, deleteDeck } from "@/lib/flashcards-store";

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
  const [open, setOpen] = useState(false);
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
    <main className="relative mx-auto max-w-3xl px-5 pt-8 pb-24 sm:pt-10">
      {/* Ambient glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 30% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%), radial-gradient(50% 100% at 90% 10%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
            Biblioteca
          </p>
          <h1 className="mt-2 bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Seus decks
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {decks.length > 0
              ? `${decks.length} deck${decks.length === 1 ? "" : "s"} · ${stats.totalCards} carta${stats.totalCards === 1 ? "" : "s"}`
              : "Organize seu vocabulário e revise todos os dias."}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition active:scale-95 hover:brightness-110"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Novo deck</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Search */}
      {decks.length > 0 && (
        <div className="relative mt-6 group">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/10 opacity-0 blur-xl transition group-focus-within:opacity-100" />
          <div className="relative flex items-center gap-2 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 backdrop-blur-md transition focus-within:border-primary/50">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar decks…"
              className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        {decks.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-surface/60 px-6 py-16 text-center backdrop-blur-md">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-3xl"
              style={{
                background:
                  "radial-gradient(80% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]">
                <Sparkles className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h2 className="mt-5 text-lg font-semibold">Crie seu primeiro deck</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Um deck é uma coleção temática de cartas — verbos, palavras de
                viagem, phrasal verbs, o que você quiser aprender.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Novo deck
              </button>
            </div>
          </div>
        ) : filteredDecks.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-surface/40 px-4 py-8 text-center text-sm text-muted-foreground">
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
              const hasReview = due > 0;
              return (
                <li key={d.id} className="group relative">
                  {/* Outer glow for decks needing review */}
                  {hasReview && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-0.5 rounded-[1.6rem] bg-linear-to-br from-primary/30 to-primary/5 opacity-70 blur transition group-hover:opacity-100"
                    />
                  )}
                  <div
                    className={`relative flex flex-col gap-3 rounded-[1.5rem] border p-5 backdrop-blur-xl transition active:scale-[0.99] ${
                      hasReview
                        ? "border-primary/30 bg-surface/50"
                        : "border-border/70 bg-surface/40 hover:border-border"
                    }`}
                  >
                    <Link
                      to="/library/$deckId"
                      params={{ deckId: d.id }}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold leading-tight text-foreground">
                          {d.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {total} carta{total === 1 ? "" : "s"}
                          {d.description ? ` · ${d.description}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          hasReview
                            ? "border-primary/30 bg-primary/15 text-primary"
                            : "border-border bg-surface/60 text-muted-foreground"
                        }`}
                      >
                        {hasReview ? `${due} revisar` : "em dia"}
                      </span>
                    </Link>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Progresso</span>
                        <span className="text-foreground/80">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            background:
                              "linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--primary) 60%, white))",
                            boxShadow: progress > 0
                              ? "0 0 10px color-mix(in oklab, var(--primary) 50%, transparent)"
                              : undefined,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setConfirmId(d.id)}
                        className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                        aria-label={`Excluir ${d.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        to="/library/$deckId"
                        params={{ deckId: d.id }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-xs font-semibold text-foreground/90 transition hover:border-primary/40 hover:text-primary"
                        aria-label="Abrir deck"
                      >
                        Abrir
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {open && <NewDeckSheet onClose={() => setOpen(false)} />}
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

function NewDeckSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md">
        <div className="ios-card m-3 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Novo deck</h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createDeck(name, desc);
              onClose();
            }}
            className="mt-4 space-y-3"
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
            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
            >
              Criar deck
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
    "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15";
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm px-3">
        <div className="ios-card rounded-3xl p-6 text-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full border border-border bg-surface py-2.5 text-sm font-medium hover:bg-accent"
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
