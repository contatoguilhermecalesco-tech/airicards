import { useState } from "react";
import { Gift, Check, X, Sparkles } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCurrentProfile } from "@/lib/profile";
import {
  usePendingGifts,
  respondToGift,
  profileMeta,
  type CardGift,
  type ProfileId,
} from "@/lib/social-store";
import { useStore, createCard, createDeck } from "@/lib/flashcards-store";

export function GiftInbox() {
  const me = useCurrentProfile();
  const gifts = usePendingGifts(me?.id as ProfileId | undefined);
  const decks = useStore((s) => s.decks);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!me || gifts.length === 0) return null;

  async function accept(g: CardGift) {
    setBusyId(g.id);
    // encontra ou cria deck "Presentes de <fulano>"
    const sender = profileMeta(g.fromProfile);
    const deckName = `Presentes de ${sender.name}`;
    let deck = decks.find((d) => d.name === deckName);
    if (!deck) {
      deck = createDeck(deckName, `Cartas enviadas por ${sender.name}`);
    }
    createCard(deck.id, g.front, g.back, {
      mode: (g.category as any) ?? "phrase",
      source: g.sourceNote ? `Presente de ${sender.name}: ${g.sourceNote}` : `Presente de ${sender.name}`,
    });
    await respondToGift(g.id, "imported");
    setBusyId(null);
  }

  async function decline(g: CardGift) {
    setBusyId(g.id);
    await respondToGift(g.id, "declined");
    setBusyId(null);
  }

  return (
    <section
      className="animate-fade-in mt-6"
      style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <Gift className="h-4 w-4 text-primary" strokeWidth={2.5} />
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
          Presentes para você
        </h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {gifts.length}
        </span>
      </div>

      <ul className="space-y-2.5">
        {gifts.map((g) => {
          const sender = profileMeta(g.fromProfile);
          return (
            <li
              key={g.id}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: sender.gradient }}
                >
                  {sender.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    De {sender.name} · <Sparkles className="inline h-3 w-3" /> nova carta
                  </p>
                  <p className="mt-1 truncate text-[15px] font-medium text-foreground">
                    {g.front}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {g.back}
                  </p>
                  {g.sourceNote && (
                    <p className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] italic text-muted-foreground">
                      "{g.sourceNote}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => accept(g)}
                  disabled={busyId === g.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Aceitar
                </button>
                <button
                  onClick={() => decline(g)}
                  disabled={busyId === g.id}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                  aria-label="Recusar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
