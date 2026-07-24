import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Download,
  Gem,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  likePublishedDeck,
  listPublishedDecks,
  type PublishedDeckRow,
} from "@/lib/marketplace";
import { buyPublishedDeck } from "@/lib/shop";
import { useWallet, loadWallet } from "@/lib/wallet-store";
import { useCurrentProfile } from "@/lib/profile";

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

function MarketplacePage() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const [decks, setDecks] = useState<PublishedDeckRow[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    if (!decks) return [];
    const needle = q.trim().toLowerCase();
    return decks.filter((d) => {
      if (filter === "mine" && profile && d.owner_profile_id !== profile.id) return false;
      if (!needle) return true;
      return (
        d.name.toLowerCase().includes(needle) ||
        d.description.toLowerCase().includes(needle) ||
        d.owner_name.toLowerCase().includes(needle)
      );
    });
  }, [decks, q, filter, profile]);

  async function handleImport(row: PublishedDeckRow) {
    if (importing || !profile) return;
    setImporting(row.id);
    setError(null);
    const r = await buyPublishedDeck(profile.id, row);
    setImporting(null);
    if (r.ok && r.deckId) {
      setImported((s) => ({ ...s, [row.id]: r.deckId! }));
    } else if (!r.ok) {
      setError(
        r.reason === "insufficient"
          ? `Você precisa de ${row.price} ✦ para este deck.`
          : "Não foi possível adquirir o deck.",
      );
      setTimeout(() => setError(null), 2500);
    }
  }

  async function handleLike(row: PublishedDeckRow) {
    if (liked[row.id]) return;
    const next = await likePublishedDeck(row.id);
    if (next !== null) {
      setLiked((s) => ({ ...s, [row.id]: next }));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/library"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Biblioteca
      </Link>

      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Compass className="h-3.5 w-3.5" strokeWidth={2.5} />
            Marketplace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Decks da comunidade
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore, curta e importe para sua biblioteca.
          </p>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="relative flex flex-1 min-w-[220px] items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, descrição ou autor…"
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-white/[0.06]"
          />
        </label>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-xs font-medium">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1.5 transition ${
              filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("mine")}
            disabled={!profile}
            className={`rounded-full px-3 py-1.5 transition ${
              filter === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Meus
          </button>
        </div>
      </div>

      {decks === null ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const isImporting = importing === row.id;
            const newDeckId = imported[row.id];
            const likeCount = liked[row.id] ?? row.likes;
            const iLiked = row.id in liked;
            return (
              <li
                key={row.id}
                className="ios-card group flex h-full flex-col rounded-3xl p-5 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      por {row.owner_name}
                    </p>
                    <h2 className="mt-0.5 truncate text-lg font-semibold text-foreground">
                      {row.name}
                    </h2>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    <BookOpen className="h-3 w-3" strokeWidth={2.5} />
                    {row.card_count}
                  </div>
                </div>

                <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                  {row.description || "Sem descrição."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleLike(row)}
                    disabled={iLiked}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      iLiked
                        ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
                        : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${iLiked ? "fill-current" : ""}`}
                      strokeWidth={2.5}
                    />
                    {likeCount}
                  </button>

                  {newDeckId ? (
                    <Link
                      to="/library/$deckId"
                      params={{ deckId: newDeckId }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                      Adicionado
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleImport(row)}
                      disabled={isImporting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.5} />
                          Importando…
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
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="ios-card h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="ios-card grid place-items-center rounded-3xl px-6 py-16 text-center">
      <div className="max-w-sm">
        <Compass className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={2} />
        <h2 className="mt-3 text-lg font-semibold">Nenhum deck ainda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assim que alguém publicar um deck, ele aparece aqui. Publique o seu na biblioteca!
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
