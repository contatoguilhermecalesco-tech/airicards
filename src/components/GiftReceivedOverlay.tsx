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
      className="fixed inset-0 z-[85] flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
    >
      {/* Vinheta escurecida */}
      <button
        aria-label="Fechar"
        onClick={() => setPhase("out")}
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500 ${
          phase === "in" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Raios de luz radiais estilo LoL */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          phase === "in" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute h-[140vmin] w-[140vmin] motion-safe:animate-[giftSpin_18s_linear_infinite] motion-reduce:hidden">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(168,85,247,0), rgba(168,85,247,0.22) 8%, rgba(168,85,247,0) 16%, rgba(236,72,153,0.20) 32%, rgba(168,85,247,0) 40%, rgba(250,204,21,0.18) 60%, rgba(168,85,247,0) 68%, rgba(168,85,247,0.22) 88%, rgba(168,85,247,0))",
              filter: "blur(6px)",
              maskImage:
                "radial-gradient(circle at center, transparent 22%, black 42%, black 72%, transparent 92%)",
              WebkitMaskImage:
                "radial-gradient(circle at center, transparent 22%, black 42%, black 72%, transparent 92%)",
            }}
          />
        </div>
        {/* Halo central */}
        <div
          className="absolute h-[60vmin] w-[60vmin] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.15) 40%, rgba(0,0,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Partículas douradas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 22 }).map((_, i) => {
          const angle = (i / 22) * Math.PI * 2 + (i % 4) * 0.18;
          const dist = 140 + ((i * 47) % 120);
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 20;
          const delay = (i % 8) * 40;
          const size = 4 + ((i * 3) % 6);
          const hues = ["#facc15", "#fbbf24", "#a855f7", "#c084fc", "rgba(255,255,255,0.95)"];
          const color = hues[i % hues.length];
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full motion-safe:animate-[giftParticle_1600ms_ease-out_forwards] motion-reduce:hidden"
              style={{
                width: size,
                height: size,
                background: color,
                boxShadow: `0 0 ${size * 2}px ${color}`,
                // @ts-expect-error CSS vars
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                animationDelay: `${delay}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Card cinematográfico */}
      <div
        className={`relative w-full max-w-md transition-all duration-500 ${
          phase === "in"
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        {/* Moldura brilhante */}
        <div className="pointer-events-none absolute -inset-[2px] rounded-[26px] bg-gradient-to-br from-amber-300/70 via-fuchsia-400/50 to-violet-500/60 opacity-90 blur-[2px]" />
        <div className="pointer-events-none absolute -inset-[6px] rounded-[30px] bg-gradient-to-br from-amber-300/30 via-fuchsia-400/25 to-violet-500/30 blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0713]/90 p-6 shadow-2xl">
          {/* Shimmer diagonal */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-safe:animate-[giftShimmer_2600ms_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%)",
            }}
          />

          {/* Fecha manual */}
          <button
            onClick={() => setPhase("out")}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <div className="relative flex flex-col items-center text-center">
            {/* Selo */}
            <div className="relative">
              <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-amber-300/40 via-fuchsia-400/30 to-violet-500/40 blur-xl motion-safe:animate-[giftGlow_2400ms_ease-in-out_infinite]" />
              <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 shadow-inner motion-safe:animate-[giftPop_600ms_cubic-bezier(.2,.9,.3,1.2)_backwards]">
                <Gift className="h-9 w-9 text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" strokeWidth={2.25} />
              </div>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/80">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Presente recebido
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white">
              Uma nova carta chegou
            </h2>

            {/* Remetente */}
            <div className="mt-4 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <ProfileAvatar
                profileId={current.fromProfile}
                initial={sender.initial}
                gradient={sender.gradient}
                size={22}
                fontScale={0.42}
              />
              <span className="text-[13px] font-medium text-white/90">
                De <span className="font-semibold">{sender.name}</span>
              </span>
            </div>

            {/* Preview da carta */}
            <div className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Frente
              </p>
              <p className="mt-1 line-clamp-2 text-[15px] font-medium text-white">
                {current.front}
              </p>
              <div className="my-3 h-px bg-white/10" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Verso
              </p>
              <p className="mt-1 line-clamp-2 text-[14px] text-white/80">{current.back}</p>
              {current.sourceNote && (
                <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] italic text-white/70">
                  "{current.sourceNote}"
                </p>
              )}
            </div>

            <button
              onClick={() => setPhase("out")}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black shadow-lg transition hover:bg-white/90"
            >
              Ver na caixa de entrada
            </button>
            <p className="mt-2 text-[11px] text-white/50">
              Aceite ou dispense pela aba Social
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes giftSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
        @keyframes giftParticle {
          0% {
            transform: translate(-50%, -50%) scale(0.4);
            opacity: 0;
          }
          20% { opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
