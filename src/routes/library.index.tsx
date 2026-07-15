import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ArrowRight, Trash2, X } from "lucide-react";
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

  return (
    <main className="mx-auto max-w-3xl px-5 pt-10 pb-24">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
            Biblioteca
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Seus decks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organize seu vocabulário em decks e revise todos os dias.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Novo deck
        </button>
      </div>

      <div className="mt-8">
        {decks.length === 0 ? (
          <div className="ios-card grid place-items-center rounded-3xl px-6 py-20 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h2 className="mt-5 text-lg font-semibold">Crie seu primeiro deck</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Um deck é uma coleção temática de cartas — verbos, palavras de
                viagem, phrasal verbs, o que você quiser aprender.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Novo deck
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {decks.map((d) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const due = cards.filter(
                (c) => c.deckId === d.id && c.dueAt <= Date.now(),
              ).length;
              return (
                <li
                  key={d.id}
                  className="ios-card group flex items-center justify-between rounded-2xl px-5 py-4"
                >
                  <Link
                    to="/library/$deckId"
                    params={{ deckId: d.id }}
                    className="flex-1"
                  >
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {total} carta{total === 1 ? "" : "s"}
                      {due > 0 && (
                        <>
                          {" · "}
                          <span className="text-primary">{due} para revisar</span>
                        </>
                      )}
                      {d.description && ` · ${d.description}`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmId(d.id)}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                      aria-label={`Excluir ${d.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link
                      to="/library/$deckId"
                      params={{ deckId: d.id }}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Abrir deck"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
