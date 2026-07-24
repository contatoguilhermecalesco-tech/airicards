import { useEffect, useRef, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCurrentProfile } from "@/lib/profile";
import {
  usePendingGifts,
  profileMeta,
  type CardGift,
  type ProfileId,
} from "@/lib/social-store";

/**
 * Overlay cinematográfico estilo LoL — dispara quando o usuário recebe
 * um novo presente (uma carta enviada por outro perfil). Só mostra IDs
 * inéditos; presentes pendentes antigos ficam para a `GiftInbox`.
 */
export function GiftReceivedOverlay() {
  const me = useCurrentProfile();
  const pending = usePendingGifts(me?.id as ProfileId | undefined);

  const seenRef = useRef<Set<string> | null>(null);
  const seededRef = useRef<string | null>(null);
  const [queue, setQueue] = useState<CardGift[]>([]);
  const [current, setCurrent] = useState<CardGift | null>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");

  const storageKey = me ? `airi.giftsSeen.${me.id}` : null;

  // Carrega o conjunto "vistos" do localStorage ao trocar de perfil.
  // Não marca pendentes atuais como vistos — se o presente ainda não foi
  // exibido antes (não está no localStorage), ele deve disparar a animação
  // mesmo que já estivesse pendente quando o app abriu.
  useEffect(() => {
    if (!me || !storageKey) return;
    if (seededRef.current === me.id) return;
    seededRef.current = me.id;

    let seen: Set<string>;
    try {
      const raw = localStorage.getItem(storageKey);
      seen = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      seen = new Set<string>();
    }
    seenRef.current = seen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  // Detecta presentes verdadeiramente novos.
  useEffect(() => {
    if (!me || !storageKey) return;
    if (seededRef.current !== me.id) return;
    const seen = seenRef.current;
    if (!seen) return;
    const fresh = pending.filter((g) => !seen.has(g.id));
    if (fresh.length === 0) return;
    for (const g of fresh) seen.add(g.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...seen]));
    } catch {
      /* ignore */
    }
    setQueue((q) => [...q, ...fresh]);
  }, [pending, me?.id, storageKey]);

  // Puxa o próximo da fila quando estiver ocioso.
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
    setPhase("in");
  }, [queue, current]);

  // Auto-dispensar depois de ~5.5s.
  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => setPhase("out"), 5000);
    const t2 = window.setTimeout(() => setCurrent(null), 5500);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [current]);

  if (!current) return null;

  const sender = profileMeta(current.fromProfile);

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[85] flex justify-end sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto relative w-[320px] max-w-[calc(100vw-2rem)] transition-all duration-400 ${
          phase === "in"
            ? "translate-x-0 opacity-100"
            : "translate-x-6 opacity-0"
        }`}
      >
        {/* Glow sutil ao redor */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-300/40 via-fuchsia-400/30 to-violet-500/40 opacity-70 blur-md" />

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0713]/95 shadow-xl backdrop-blur-xl">
          {/* Shimmer discreto */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-safe:animate-[giftShimmer_2600ms_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
            }}
          />

          {/* Barra de progresso auto-dismiss */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-500 motion-safe:animate-[giftProgress_5000ms_linear_forwards]"
          />

          <button
            onClick={() => setPhase("out")}
            aria-label="Fechar"
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>

          <div className="relative flex items-start gap-3 p-3.5 pr-9">
            {/* Selo compacto */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 -m-1.5 rounded-full bg-gradient-to-br from-amber-300/40 via-fuchsia-400/30 to-violet-500/40 blur-md motion-safe:animate-[giftGlow_2400ms_ease-in-out_infinite]" />
              <div className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 shadow-inner motion-safe:animate-[giftPop_500ms_cubic-bezier(.2,.9,.3,1.2)_backwards]">
                <Gift className="h-5 w-5 text-amber-200 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" strokeWidth={2.25} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                <Sparkles className="h-2.5 w-2.5" />
                Presente recebido
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-white">
                <ProfileAvatar
                  profileId={current.fromProfile}
                  initial={sender.initial}
                  gradient={sender.gradient}
                  size={14}
                  fontScale={0.42}
                />
                <span className="truncate">{sender.name}</span>
                <span className="text-white/50">te enviou uma carta</span>
              </p>
              <p className="mt-1 truncate text-[12px] text-white/70">
                "{current.front}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes giftShimmer {
          0%, 100% { transform: translateX(-30%); opacity: 0.4; }
          50% { transform: translateX(30%); opacity: 0.9; }
        }
        @keyframes giftGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes giftPop {
          0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
          70% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes giftProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
