import { useState } from "react";
import { Gift, X } from "lucide-react";
import { useCurrentProfile, PROFILES } from "@/lib/profile";
import { sendCardGift, otherProfile, type ProfileId } from "@/lib/social-store";
import type { Card } from "@/lib/flashcards-store";

export function SendGiftDialog({
  card,
  onClose,
}: {
  card: Card;
  onClose: () => void;
}) {
  const me = useCurrentProfile();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!me) return null;
  const toId = otherProfile(me.id as ProfileId);
  const toProfile = PROFILES.find((p) => p.id === toId)!;

  async function handleSend() {
    if (!me) return;
    setSending(true);
    await sendCardGift({
      from: me.id as ProfileId,
      to: toId,
      front: card.front,
      back: card.back,
      category: (card.mode as any) ?? "phrase",
      note,
    });
    setSent(true);
    setSending(false);
    setTimeout(onClose, 900);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-[oklch(0.14_0.02_285)] p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: toProfile.gradient }}
          >
            <Gift className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Enviar carta
            </p>
            <p className="text-[15px] font-semibold text-foreground">
              Para {toProfile.name}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Frente
          </p>
          <p className="mt-1 text-[15px] font-medium text-foreground">{card.front}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Verso
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">{card.back}</p>
        </div>

        <label className="mt-4 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Bilhete (opcional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={140}
            placeholder="Achei que ia te ajudar 💜"
            className="mt-1.5 w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
          />
        </label>

        <button
          onClick={handleSend}
          disabled={sending || sent}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          {sent ? (
            <>Enviado ✓</>
          ) : sending ? (
            <>Enviando…</>
          ) : (
            <>
              <Gift className="h-4 w-4" strokeWidth={2.5} />
              Enviar para {toProfile.name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
