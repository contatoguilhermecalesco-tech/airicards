import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  ArrowRight,
  Trash2,
  X,
  Search,
  Sparkles,
  Pencil,
  Layers,
  Check,
  Globe,
  LayoutGrid,
  List as ListIcon,
  Rows3,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Flame,
  Swords,
} from "lucide-react";
import {
  useStore,
  createDeck,
  deleteDeck,
  updateDeck,
  isEnemy,
  type Deck,
  type Card,
} from "@/lib/flashcards-store";
import { SyncDot } from "@/components/SyncIndicator";
import {
  DECK_COLORS,
  DEFAULT_DECK_COLOR,
  deckGradient,
  getDeckColor,
} from "@/lib/deck-colors";
import {
  useDeckPrefs,
  setDeckPrefs,
  toggleArchived,
  type LibraryFilter,
  type LibrarySort,
  type LibraryViewMode,
} from "@/lib/library-prefs";

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

type DeckStats = {
  deck: Deck;
  cards: Card[];
  total: number;
  due: number;
  enemies: number;
  studied: number;
  progress: number;
  lastActivity: number;
  isNew: boolean;
};

function Library() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const prefs = useDeckPrefs();
  const [sheet, setSheet] = useState<
    { mode: "create" } | { mode: "edit"; deck: Deck } | null
  >(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const now = Date.now();

  const enriched: DeckStats[] = useMemo(() => {
    return decks.map((d) => {
      const dCards = cards.filter((c) => c.deckId === d.id);
      const total = dCards.length;
      const due = dCards.filter((c) => c.dueAt <= now).length;
      const enemies = dCards.filter(isEnemy).length;
      const studied = dCards.filter((c) => c.reps > 0).length;
      const progress = total === 0 ? 0 : Math.round((studied / total) * 100);
      const lastActivity = dCards.reduce(
        (m, c) => Math.max(m, c.createdAt ?? 0),
        d.createdAt,
      );
      const isNew = now - d.createdAt < 1000 * 60 * 60 * 24 * 3; // 3d
      return { deck: d, cards: dCards, total, due, enemies, studied, progress, lastActivity, isNew };
    });
  }, [decks, cards, now]);

  const archivedSet = useMemo(() => new Set(prefs.archived), [prefs.archived]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = enriched.filter((s) => (showArchived ? true : !archivedSet.has(s.deck.id)));
    if (q) {
      list = list.filter(
        (s) =>
          s.deck.name.toLowerCase().includes(q) ||
          (s.deck.description ?? "").toLowerCase().includes(q) ||
          s.cards.some(
            (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q),
          ),
      );
    }
    switch (prefs.filter) {
      case "due":
        list = list.filter((s) => s.due > 0);
        break;
      case "enemies":
        list = list.filter((s) => s.enemies > 0);
        break;
      case "new":
        list = list.filter((s) => s.isNew);
        break;
      case "shared":
        list = list.filter((s) => (s.deck.description ?? "").toLowerCase().includes("compartilh"));
        break;
    }
    // Sort
    switch (prefs.sort) {
      case "recent":
        list.sort((a, b) => b.lastActivity - a.lastActivity);
        break;
      case "studied":
        list.sort((a, b) => b.studied - a.studied);
        break;
      case "size":
        list.sort((a, b) => b.total - a.total);
        break;
      case "alpha":
        list.sort((a, b) => a.deck.name.localeCompare(b.deck.name, "pt"));
        break;
      case "progress":
        list.sort((a, b) => b.progress - a.progress);
        break;
    }
    return list;
  }, [enriched, prefs.filter, prefs.sort, query, showArchived, archivedSet]);

  const totalStats = useMemo(() => {
    const totalCards = cards.length;
    const totalDue = cards.filter((c) => c.dueAt <= now).length;
    return { totalCards, totalDue };
  }, [cards, now]);

  // Split into sections when sectioned mode enabled AND no active filter/search
  const useSections = prefs.sectioned && !query.trim() && prefs.filter === "all";
  const dueSection = useSections ? filtered.filter((s) => s.due > 0) : [];
  const restSection = useSections
    ? filtered.filter((s) => s.due === 0)
    : filtered;
  const archivedList = enriched.filter((s) => archivedSet.has(s.deck.id));

  return (
    <main className="relative mx-auto max-w-4xl px-5 pt-6 pb-28 sm:pt-10">
      {/* Ambient iOS-style backdrop */}
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
              ? `${decks.length} deck${decks.length === 1 ? "" : "s"} · ${totalStats.totalCards} carta${totalStats.totalCards === 1 ? "" : "s"}${totalStats.totalDue > 0 ? ` · ${totalStats.totalDue} para revisar` : ""}`
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

      {/* Toolbar: search + view mode + sort */}
      {decks.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
            {/* Search */}
            <div className="relative group min-w-0">
              <div className="pointer-events-none absolute inset-0 rounded-[16px] bg-primary/10 opacity-0 blur-xl transition group-focus-within:opacity-100" />
              <div className="relative flex items-center gap-2.5 rounded-[16px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 backdrop-blur-2xl transition focus-within:border-primary/40 focus-within:bg-white/[0.06]">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar decks e cartas…"
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

            {/* View + sort compact controls */}
            <div className="flex items-center gap-2">
              <ViewModeToggle mode={prefs.view} onChange={(v) => setDeckPrefs({ view: v })} />
              <SortMenu sort={prefs.sort} onChange={(s) => setDeckPrefs({ sort: s })} />
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips
            current={prefs.filter}
            onChange={(f) => setDeckPrefs({ filter: f })}
            counts={{
              all: enriched.filter((s) => !archivedSet.has(s.deck.id)).length,
              due: enriched.filter((s) => !archivedSet.has(s.deck.id) && s.due > 0).length,
              enemies: enriched.filter((s) => !archivedSet.has(s.deck.id) && s.enemies > 0).length,
              new: enriched.filter((s) => !archivedSet.has(s.deck.id) && s.isNew).length,
            }}
          />
        </div>
      )}

      {/* Deck list */}
      <div className="mt-6 space-y-8">
        {decks.length === 0 ? (
          <EmptyState onCreate={() => setSheet({ mode: "create" })} />
        ) : filtered.length === 0 && archivedList.length === 0 ? (
          <p className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground backdrop-blur-xl">
            Nenhum deck encontrado com esses filtros.
          </p>
        ) : useSections ? (
          <>
            {dueSection.length > 0 && (
              <Section
                title="Continuar revisando"
                subtitle={`${dueSection.length} deck${dueSection.length === 1 ? "" : "s"} com cartas pendentes`}
                icon={<Flame className="h-4 w-4" strokeWidth={2.5} />}
                accent="rgb(251 146 60)"
              >
                <DeckCollection
                  view={prefs.view}
                  items={dueSection}
                  archived={archivedSet}
                  onEdit={(d) => setSheet({ mode: "edit", deck: d })}
                  onDelete={(id) => setConfirmId(id)}
                  onArchive={(id) => toggleArchived(id)}
                />
              </Section>
            )}
            {restSection.length > 0 && (
              <Section
                title="Seus decks"
                subtitle={`${restSection.length} deck${restSection.length === 1 ? "" : "s"}`}
                icon={<Layers className="h-4 w-4" strokeWidth={2.5} />}
              >
                <DeckCollection
                  view={prefs.view}
                  items={restSection}
                  archived={archivedSet}
                  onEdit={(d) => setSheet({ mode: "edit", deck: d })}
                  onDelete={(id) => setConfirmId(id)}
                  onArchive={(id) => toggleArchived(id)}
                />
              </Section>
            )}
          </>
        ) : (
          <DeckCollection
            view={prefs.view}
            items={filtered}
            archived={archivedSet}
            onEdit={(d) => setSheet({ mode: "edit", deck: d })}
            onDelete={(id) => setConfirmId(id)}
            onArchive={(id) => toggleArchived(id)}
          />
        )}

        {/* Archived collapsible */}
        {archivedList.length > 0 && (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <Archive className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
                <span className="text-[14px] font-semibold text-foreground/90">Arquivados</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {archivedList.length}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showArchived ? "rotate-180" : ""}`}
              />
            </button>
            {showArchived && (
              <div className="border-t border-white/5 p-4">
                <DeckCollection
                  view="list"
                  items={archivedList}
                  archived={archivedSet}
                  onEdit={(d) => setSheet({ mode: "edit", deck: d })}
                  onDelete={(id) => setConfirmId(id)}
                  onArchive={(id) => toggleArchived(id)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {sheet?.mode === "create" && <DeckSheet onClose={() => setSheet(null)} />}
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

// ============================================================
// Toolbar sub-components
// ============================================================

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: LibraryViewMode;
  onChange: (m: LibraryViewMode) => void;
}) {
  const items: { id: LibraryViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { id: "grid", icon: LayoutGrid, label: "Grade" },
    { id: "list", icon: ListIcon, label: "Lista" },
    { id: "detailed", icon: Rows3, label: "Detalhado" },
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

function SortMenu({
  sort,
  onChange,
}: {
  sort: LibrarySort;
  onChange: (s: LibrarySort) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: { id: LibrarySort; label: string }[] = [
    { id: "recent", label: "Recentes" },
    { id: "studied", label: "Mais estudados" },
    { id: "size", label: "Mais cartas" },
    { id: "progress", label: "Progresso" },
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
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-[16px] border border-white/10 bg-[color-mix(in_oklab,var(--surface)_88%,black)]/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
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

function FilterChips({
  current,
  onChange,
  counts,
}: {
  current: LibraryFilter;
  onChange: (f: LibraryFilter) => void;
  counts: { all: number; due: number; enemies: number; new: number };
}) {
  const chips: { id: LibraryFilter; label: string; count?: number; tone?: string }[] = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "due", label: "Com pendentes", count: counts.due, tone: "rgb(251 146 60)" },
    { id: "enemies", label: "Inimigas", count: counts.enemies, tone: "rgb(248 113 113)" },
    { id: "new", label: "Recentes", count: counts.new, tone: "rgb(129 140 248)" },
  ];
  return (
    <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const active = current === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition ${
              active
                ? "border-primary/40 bg-primary/15 text-foreground"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            }`}
            style={active && c.tone ? { color: c.tone, borderColor: `${c.tone}55` } : undefined}
          >
            {c.label}
            {typeof c.count === "number" && (
              <span className="ml-1.5 text-[11px] opacity-70">{c.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Section header
// ============================================================
function Section({
  title,
  subtitle,
  icon,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center gap-2.5">
        {icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-foreground/80"
            style={accent ? { color: accent, background: `${accent}18` } : undefined}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

// ============================================================
// Deck collection — dispatches to the current view mode
// ============================================================
function DeckCollection({
  view,
  items,
  archived,
  onEdit,
  onDelete,
  onArchive,
}: {
  view: LibraryViewMode;
  items: DeckStats[];
  archived: Set<string>;
  onEdit: (d: Deck) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  if (view === "list") {
    return (
      <ul className="divide-y divide-white/5 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        {items.map((s) => (
          <DeckRow
            key={s.deck.id}
            stats={s}
            archived={archived.has(s.deck.id)}
            onEdit={() => onEdit(s.deck)}
            onDelete={() => onDelete(s.deck.id)}
            onArchive={() => onArchive(s.deck.id)}
          />
        ))}
      </ul>
    );
  }
  if (view === "detailed") {
    return (
      <ul className="space-y-3">
        {items.map((s) => (
          <DeckDetailedRow
            key={s.deck.id}
            stats={s}
            archived={archived.has(s.deck.id)}
            onEdit={() => onEdit(s.deck)}
            onDelete={() => onDelete(s.deck.id)}
            onArchive={() => onArchive(s.deck.id)}
          />
        ))}
      </ul>
    );
  }
  // grid
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <DeckCard
          key={s.deck.id}
          stats={s}
          archived={archived.has(s.deck.id)}
          onEdit={() => onEdit(s.deck)}
          onDelete={() => onDelete(s.deck.id)}
          onArchive={() => onArchive(s.deck.id)}
        />
      ))}
    </ul>
  );
}

// ============================================================
// Grid card
// ============================================================
function DeckCard({
  stats,
  archived,
  onEdit,
  onDelete,
  onArchive,
}: {
  stats: DeckStats;
  archived: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const { deck, total, due, enemies, progress } = stats;
  const color = getDeckColor(deck.color);
  const gradient = deckGradient(deck.color);
  return (
    <li className="group relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-[28px] opacity-0 blur-xl transition group-hover:opacity-25"
        style={{ background: gradient }}
      />
      <div className={`relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl transition active:scale-[0.99] ${archived ? "opacity-70" : ""}`}>
        <Link
          to="/library/$deckId"
          params={{ deckId: deck.id }}
          className="relative flex items-start gap-3.5"
        >
          <div
            className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={{ background: gradient }}
          >
            <Layers className="h-6 w-6 drop-shadow" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 truncate text-[17px] font-bold leading-tight text-foreground">
              <span className="truncate">{deck.name}</span>
              <SyncDot id={deck.id} />
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {total} carta{total === 1 ? "" : "s"}
              {deck.description ? ` · ${deck.description}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={
                  due > 0
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
                {due > 0 ? `${due} revisar` : "em dia"}
              </span>
              {enemies > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                  <Swords className="h-2.5 w-2.5" strokeWidth={2.5} />
                  {enemies}
                </span>
              )}
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
              style={{ width: `${progress}%`, background: gradient }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="relative mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IconBtn label={archived ? "Desarquivar" : "Arquivar"} onClick={onArchive}>
              {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </IconBtn>
            <IconBtn label={`Editar ${deck.name}`} onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </IconBtn>
            <IconBtn label={`Excluir ${deck.name}`} onClick={onDelete} destructive>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
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

// ============================================================
// Compact list row (Spotify-style)
// ============================================================
function DeckRow({
  stats,
  archived,
  onEdit,
  onDelete,
  onArchive,
}: {
  stats: DeckStats;
  archived: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const { deck, total, due, enemies, progress } = stats;
  const gradient = deckGradient(deck.color);
  return (
    <li className={`group relative flex items-center gap-3 px-3.5 py-3 transition hover:bg-white/[0.03] ${archived ? "opacity-70" : ""}`}>
      <Link
        to="/library/$deckId"
        params={{ deckId: deck.id }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          style={{ background: gradient }}
        >
          <Layers className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14.5px] font-semibold text-foreground">
              {deck.name}
            </span>
            <SyncDot id={deck.id} />
          </div>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {total} carta{total === 1 ? "" : "s"}
            {due > 0 && ` · ${due} pendente${due === 1 ? "" : "s"}`}
            {enemies > 0 && ` · ${enemies} inimiga${enemies === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: gradient }}
            />
          </div>
          <span className="w-8 text-right text-[11px] font-semibold text-muted-foreground">
            {progress}%
          </span>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
        <IconBtn small label={archived ? "Desarquivar" : "Arquivar"} onClick={onArchive}>
          {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn small label="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn small label="Excluir" onClick={onDelete} destructive>
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </li>
  );
}

// ============================================================
// Detailed row (list + preview of next cards)
// ============================================================
function DeckDetailedRow({
  stats,
  archived,
  onEdit,
  onDelete,
  onArchive,
}: {
  stats: DeckStats;
  archived: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const { deck, cards, total, due, enemies, progress } = stats;
  const gradient = deckGradient(deck.color);
  const now = Date.now();
  const preview = useMemo(
    () =>
      [...cards]
        .filter((c) => c.dueAt <= now)
        .sort((a, b) => a.dueAt - b.dueAt)
        .slice(0, 3),
    [cards, now],
  );
  return (
    <li className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] backdrop-blur-xl ${archived ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Link
          to="/library/$deckId"
          params={{ deckId: deck.id }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={{ background: gradient }}
          >
            <Layers className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-bold text-foreground">{deck.name}</span>
              <SyncDot id={deck.id} />
            </div>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {total} carta{total === 1 ? "" : "s"} · {progress}% · {due > 0 ? `${due} para revisar` : "em dia"}
              {enemies > 0 && ` · ${enemies} inimiga${enemies === 1 ? "" : "s"}`}
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn small label={archived ? "Desarquivar" : "Arquivar"} onClick={onArchive}>
            {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn small label="Editar" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn small label="Excluir" onClick={onDelete} destructive>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
      {preview.length > 0 && (
        <div className="border-t border-white/5 bg-black/10 px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Próximas cartas
          </p>
          <ul className="space-y-1">
            {preview.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-[13px]">
                <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: gradient }} />
                <span className="truncate font-medium text-foreground/90">{c.front}</span>
                <span className="ml-auto shrink-0 truncate text-[11.5px] text-muted-foreground">
                  {c.back}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  destructive,
  small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  destructive?: boolean;
  small?: boolean;
}) {
  const size = small ? "h-8 w-8" : "h-9 w-9";
  const tone = destructive
    ? "hover:bg-destructive/15 hover:text-destructive"
    : "hover:bg-white/10 hover:text-foreground";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid ${size} place-items-center rounded-full text-muted-foreground transition ${tone}`}
    >
      {children}
    </button>
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
