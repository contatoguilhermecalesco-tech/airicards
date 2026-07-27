import { ArlysIcon } from "@/components/StatChip";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Download,
  Info,
  Layers,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  listPublishedDecks,
  type PublishedCard,
  type PublishedDeckRow,
} from "@/lib/marketplace";
import { buyPublishedDeck } from "@/lib/shop";
import { useWallet, loadWallet } from "@/lib/wallet-store";
import { useCurrentProfile } from "@/lib/profile";
import { useStore } from "@/lib/flashcards-store";
import { slugify } from "@/lib/share";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace de decks — airi" },
      {
        name: "description",
        content:
          "Explore decks publicados pela comunidade airi e adicione à sua biblioteca com um toque.",
      },
      { property: "og:title", content: "Marketplace de decks — airi" },
      {
        property: "og:description",
        content: "Decks curados pela comunidade airi. Estude o que você quiser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketplacePage,
});

type Filter = "all" | "free" | "premium" | "mine";
type Sort = "popular" | "recent";

function MarketplacePage() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const localDecks = useStore((s) => s.decks);
  const [decks, setDecks] = useState<PublishedDeckRow[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PublishedDeckRow | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<PublishedDeckRow | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (profile) void loadWallet(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    listPublishedDecks().then((rows) => {
      if (!cancelled) setDecks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Set de slugs locais para marcar decks já na biblioteca
  const localSlugs = useMemo(
    () => new Set(localDecks.map((d) => slugify(d.name))),
    [localDecks],
  );

  const filtered = useMemo(() => {
    if (!decks) return [];
    const needle = q.trim().toLowerCase();
    let list = decks.filter((d) => {
      if (filter === "mine" && profile && d.owner_profile_id !== profile.id) return false;
      if (filter === "free" && d.price > 0) return false;
      if (filter === "premium" && d.price === 0) return false;
      if (!needle) return true;
      return (
        d.name.toLowerCase().includes(needle) ||
        d.description.toLowerCase().includes(needle) ||
        d.owner_name.toLowerCase().includes(needle)
      );
    });
    if (sort === "recent") {
      list = [...list].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
    } else {
      list = [...list].sort((a, b) => (b.imports ?? 0) - (a.imports ?? 0));
    }
    return list;
  }, [decks, q, filter, sort, profile]);

  async function doImport(row: PublishedDeckRow) {
    if (importing || !profile) return;
    setImporting(row.id);
    const r = await buyPublishedDeck(profile.id, row);
    setImporting(null);
    setConfirmBuy(null);
    if (r.ok && r.deckId) {
      setImported((s) => ({ ...s, [row.id]: r.deckId! }));
      // Bump local imports count optimistically so o ranking reflete
      setDecks((prev) =>
        prev
          ? prev.map((d) =>
              d.id === row.id ? { ...d, imports: (d.imports ?? 0) + 1 } : d,
            )
          : prev,
      );
      setToast({
        kind: "ok",
        text:
          row.price > 0
            ? `Deck adquirido por ${row.price} ✦ e adicionado à sua biblioteca.`
            : "Deck adicionado à sua biblioteca.",
      });
    } else if (!r.ok) {
      setToast({
        kind: "err",
        text:
          r.reason === "insufficient"
            ? `Você precisa de ${row.price} ✦ para adquirir este deck.`
            : "Não foi possível adquirir o deck. Tente novamente.",
      });
    }
    setTimeout(() => setToast(null), 3200);
  }

  function handlePrimary(row: PublishedDeckRow) {
    if (imported[row.id]) return;
    if (row.price > 0 && profile && row.owner_profile_id !== profile.id) {
      setConfirmBuy(row);
      return;
    }
    void doImport(row);
  }

  return (
    <main className="mx-auto max-w-6xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/library"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Biblioteca
      </Link>

      {/* Header hero */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-white/[0.03] to-fuchsia-500/10 px-5 py-6 sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
              <Compass className="h-3.5 w-3.5" strokeWidth={2.5} />
              Marketplace
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Decks da comunidade
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Explore decks publicados por outros perfis e adicione à sua
              biblioteca em um toque. Alguns exigem Arlys ✦.
            </p>
            <button
              onClick={() => setHowOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/90 transition hover:bg-white/[0.09]"
            >
              <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
              Como funciona
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100">
              <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {wallet.crystals} ✦
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow"
            >
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
              Loja
            </Link>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
            strokeWidth={2.25}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, descrição ou autor…"
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-white/[0.06]"
          />
        </label>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-xs font-medium">
          <SortBtn active={sort === "popular"} onClick={() => setSort("popular")}>
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} /> Populares
          </SortBtn>
          <SortBtn active={sort === "recent"} onClick={() => setSort("recent")}>
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} /> Recentes
          </SortBtn>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5 text-xs font-medium">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>Todos</Chip>
        <Chip active={filter === "free"} onClick={() => setFilter("free")}>
          Grátis
        </Chip>
        <Chip active={filter === "premium"} onClick={() => setFilter("premium")}>
          Premium ✦
        </Chip>
        <Chip
          active={filter === "mine"}
          onClick={() => setFilter("mine")}
          disabled={!profile}
        >
          Meus decks
        </Chip>
      </div>

      {decks === null ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={q.length > 0 || filter !== "all"} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const isImporting = importing === row.id;
            const newDeckId = imported[row.id];
            const isMine = profile && row.owner_profile_id === profile.id;
            const alreadyInLibrary = !newDeckId && localSlugs.has(row.slug);
            return (
              <li
                key={row.id}
                className="ios-card group flex h-full flex-col rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30"
              >
                <button
                  type="button"
                  onClick={() => setPreview(row)}
                  className="flex flex-1 flex-col text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex items-center gap-1 truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <User className="h-3 w-3" strokeWidth={2.5} />
                        {row.owner_name}
                      </p>
                      <h2 className="mt-0.5 truncate text-lg font-semibold text-foreground">
                        {row.name}
                      </h2>
                    </div>
                    {row.price > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
                        <ArlysIcon className="h-3 w-3" strokeWidth={2.5} />
                        {row.price}
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        Grátis
                      </span>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                    {row.description || "Sem descrição."}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" strokeWidth={2.5} />
                      {row.card_count} carta{row.card_count === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Download className="h-3 w-3" strokeWidth={2.5} />
                      {row.imports ?? 0} import{(row.imports ?? 0) === 1 ? "e" : "es"}
                    </span>
                  </div>
                </button>

                <div className="mt-4 flex items-center gap-2">
                  {isMine && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Seu deck
                    </span>
                  )}
                  {!isMine && alreadyInLibrary && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      <Check className="h-3 w-3" strokeWidth={2.75} />
                      Já na biblioteca
                    </span>
                  )}
                  <div className="ml-auto">
                    {newDeckId ? (
                      <Link
                        to="/library/$deckId"
                        params={{ deckId: newDeckId }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                        Abrir
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePrimary(row)}
                        disabled={isImporting || !profile}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <Sparkles
                              className="h-3.5 w-3.5 animate-pulse"
                              strokeWidth={2.5}
                            />
                            Importando…
                          </>
                        ) : row.price > 0 && !isMine ? (
                          <>
                            <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.75} />
                            Comprar
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" strokeWidth={2.75} />
                            Adicionar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Preview dialog */}
      {preview && (
        <PreviewDialog
          row={preview}
          onClose={() => setPreview(null)}
          onImport={() => {
            const r = preview;
            setPreview(null);
            handlePrimary(r);
          }}
          isImporting={importing === preview.id}
          importedDeckId={imported[preview.id]}
          isMine={!!profile && preview.owner_profile_id === profile.id}
        />
      )}

      {/* How it works */}
      {howOpen && <HowItWorksDialog onClose={() => setHowOpen(false)} />}

      {/* Confirm purchase */}
      {confirmBuy && (
        <ConfirmBuyDialog
          row={confirmBuy}
          crystals={wallet.crystals}
          onCancel={() => setConfirmBuy(null)}
          onConfirm={() => doImport(confirmBuy)}
          loading={importing === confirmBuy.id}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            className={`pointer-events-auto rounded-2xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur ${
              toast.kind === "ok"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/15 text-rose-100"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </main>
  );
}

function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 transition disabled:opacity-40 ${
        active
          ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
          : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewDialog({
  row,
  onClose,
  onImport,
  isImporting,
  importedDeckId,
  isMine,
}: {
  row: PublishedDeckRow;
  onClose: () => void;
  onImport: () => void;
  isImporting: boolean;
  importedDeckId?: string;
  isMine: boolean;
}) {
  const sample: PublishedCard[] = (row.cards ?? []).slice(0, 4);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3" strokeWidth={2.5} />
              {row.owner_name}
            </p>
            <h3 className="mt-0.5 text-xl font-semibold">{row.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {row.price > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 font-semibold text-violet-100">
              <ArlysIcon className="h-3 w-3" strokeWidth={2.5} />
              {row.price} ✦
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
              Grátis
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-muted-foreground">
            <BookOpen className="h-3 w-3" strokeWidth={2.5} />
            {row.card_count} carta{row.card_count === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-muted-foreground">
            <Download className="h-3 w-3" strokeWidth={2.5} />
            {row.imports ?? 0} import{(row.imports ?? 0) === 1 ? "e" : "es"}
          </span>
        </div>

        {row.description && (
          <p className="mt-3 text-sm text-muted-foreground">{row.description}</p>
        )}

        <div className="mt-5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Layers className="h-3.5 w-3.5" strokeWidth={2.5} />
            Amostra do deck
          </p>
          <ul className="space-y-2">
            {sample.length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
                Sem cartas de amostra.
              </li>
            )}
            {sample.map((c, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <p className="text-sm font-medium text-foreground">{c.front}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.back}</p>
              </li>
            ))}
          </ul>
          {row.cards.length > sample.length && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              + {row.cards.length - sample.length} carta
              {row.cards.length - sample.length === 1 ? "" : "s"} ao importar
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
          {importedDeckId ? (
            <Link
              to="/library/$deckId"
              params={{ deckId: importedDeckId }}
              className="flex-1 rounded-full bg-emerald-500/20 py-2.5 text-center text-sm font-semibold text-emerald-300"
            >
              Abrir na biblioteca
            </Link>
          ) : (
            <button
              onClick={onImport}
              disabled={isImporting}
              className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
            >
              {isImporting
                ? "Importando…"
                : row.price > 0 && !isMine
                  ? `Comprar por ${row.price} ✦`
                  : "Adicionar à biblioteca"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmBuyDialog({
  row,
  crystals,
  onCancel,
  onConfirm,
  loading,
}: {
  row: PublishedDeckRow;
  crystals: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const enough = crystals >= row.price;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-6 shadow-2xl"
      >
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
          <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          Confirmar compra
        </p>
        <h3 className="mt-1 text-lg font-semibold">{row.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Este deck custa <b className="text-foreground">{row.price} ✦</b>. Após
          a compra, ele será adicionado à sua biblioteca.
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Seu saldo</span>
            <span className="inline-flex items-center gap-1 font-semibold">
              <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {crystals} ✦
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Após a compra</span>
            <span
              className={`font-semibold ${enough ? "text-foreground" : "text-rose-300"}`}
            >
              {crystals - row.price} ✦
            </span>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !enough}
            className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Comprando…" : enough ? "Confirmar" : "Saldo insuficiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HowItWorksDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
              <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
              Marketplace
            </p>
            <h3 className="mt-1 text-lg font-semibold">Como funciona</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-200">
              <Compass className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p>
              <b className="text-foreground">Explore</b> — busque decks por
              tema, autor ou popularidade. Use os filtros para achar decks
              grátis ou premium.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-200">
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p>
              <b className="text-foreground">Adicione</b> — decks grátis vão
              direto para a sua biblioteca. Uma cópia é criada, você pode
              editar sem afetar o original.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-200">
              <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p>
              <b className="text-foreground">Premium com Arlys ✦</b> — alguns
              decks exigem Arlys, a moeda do airi que você ganha estudando.
              Confirme a compra antes de gastar.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p>
              <b className="text-foreground">Publique o seu</b> — na página de
              um deck seu na biblioteca, toque em <i>Publicar</i> e defina o
              preço (0 para grátis). O deck aparece aqui na hora.
            </p>
          </li>
        </ul>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="ios-card h-44 animate-pulse rounded-3xl bg-white/[0.03]"
        />
      ))}
    </ul>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="ios-card grid place-items-center rounded-3xl px-6 py-16 text-center">
      <div className="max-w-sm">
        <Compass
          className="mx-auto h-8 w-8 text-muted-foreground"
          strokeWidth={2}
        />
        <h2 className="mt-3 text-lg font-semibold">
          {hasQuery ? "Nenhum resultado" : "Nenhum deck publicado ainda"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasQuery
            ? "Tente ajustar a busca ou os filtros."
            : "Publique um deck da sua biblioteca e ele aparece aqui na hora."}
        </p>
        <Link
          to="/library"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Ir para a biblioteca
        </Link>
      </div>
    </div>
  );
}
