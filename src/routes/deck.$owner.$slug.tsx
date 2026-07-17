import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Loader2 } from "lucide-react";
import type { Card, Deck } from "@/lib/flashcards-store";
import { fetchSharedDeck, importSharedDeck } from "@/lib/share";
import { useCurrentProfile, type Profile } from "@/lib/profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/deck/$owner/$slug")({
  head: () => ({
    meta: [
      { title: "Deck compartilhado — Airi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedDeckPage,
});

function SharedDeckPage() {
  const { owner, slug } = Route.useParams();
  const router = useRouter();
  const currentProfile = useCurrentProfile();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<{
    owner: Profile;
    deck: Deck;
    cards: Card[];
  } | null>(null);
  const [importedId, setImportedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchSharedDeck(owner, slug).then((res) => {
      if (!alive) return;
      setPayload(res);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [owner, slug]);

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-5">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Deck não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link pode ter sido removido ou o deck foi renomeado.
        </p>
        <Link
          to="/library"
          className="mt-6 inline-flex text-sm text-primary hover:opacity-80"
        >
          Ir para a biblioteca
        </Link>
      </main>
    );
  }

  const { owner: ownerProfile, deck, cards } = payload;
  const isOwn = currentProfile?.id === ownerProfile.id;

  function handleImport() {
    if (!currentProfile) return;
    const id = importSharedDeck(deck, cards);
    setImportedId(id);
    setConfirmOpen(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pt-6 pb-24">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Biblioteca
      </Link>

      <div className="ios-card mt-6 rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
          Deck compartilhado por {ownerProfile.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{deck.name}</h1>
        {deck.description && (
          <p className="mt-2 text-sm text-muted-foreground">{deck.description}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {cards.length} carta{cards.length === 1 ? "" : "s"}
        </p>

        {!currentProfile ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Entre em um perfil para salvar este deck na sua conta.
          </p>
        ) : isOwn && !importedId ? (
          <div className="mt-6">
            <Link
              to="/library/$deckId"
              params={{ deckId: deck.id }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Abrir o deck original
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Este deck já é seu. Compartilhe o link para outra pessoa importar.
            </p>
          </div>
        ) : importedId ? (
          <div className="mt-6 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Deck salvo na sua conta
            </div>
            <div>
              <button
                onClick={() =>
                  router.navigate({
                    to: "/library/$deckId",
                    params: { deckId: importedId },
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                Abrir meu novo deck
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Salvar na minha conta
          </button>
        )}
      </div>

      {cards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Prévia das cartas
          </h2>
          <ul className="mt-3 space-y-2">
            {cards.slice(0, 12).map((c) => (
              <li
                key={c.id}
                className="ios-card flex items-center justify-between gap-4 rounded-2xl px-4 py-3"
              >
                <p className="truncate font-medium">{c.front}</p>
                <p className="truncate text-sm text-muted-foreground">{c.back}</p>
              </li>
            ))}
          </ul>
          {cards.length > 12 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              +{cards.length - 12} carta{cards.length - 12 === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm rounded-3xl border-0 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="space-y-3 text-left">
            <AlertDialogTitle className="text-xl font-semibold">
              Importar deck?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Você vai salvar uma <strong>cópia independente</strong> do deck{" "}
              <em>"{deck.name}"</em> no seu perfil. Alterações futuras no deck
              original não afetarão essa cópia, e o que você fizer nela não
              passa para o perfil de {ownerProfile.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-col-reverse">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="w-full rounded-full border-border bg-transparent py-5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              className="w-full rounded-full bg-primary py-5 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <Download className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Sim, salvar cópia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
