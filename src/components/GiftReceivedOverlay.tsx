import { useEffect, useRef } from "react";
import { Gift, Sparkles } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCurrentProfile } from "@/lib/profile";
import { getPrefs, isQuietNow } from "@/lib/notification-prefs";
import {
  usePendingGifts,
  profileMeta,
  type CardGift,
  type ProfileId,
} from "@/lib/social-store";

/**
 * Toca um "chime" mágico curto e discreto sintetizado via Web Audio API.
 * Três notas harmônicas (E5-B5-E6) em sinos senoidais suaves, com uma
 * "shimmer" superior. Respeita a preferência de som e o modo silencioso.
 */
let __audioCtx: AudioContext | null = null;
function playGiftChime() {
  if (typeof window === "undefined") return;
  try {
    const prefs = getPrefs();
    if (!prefs.sound) return;
    if (isQuietNow(prefs)) return;

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    if (!__audioCtx) __audioCtx = new AC();
    const ctx = __audioCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // Pequeno "swell" de entrada e cauda macia
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.28, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

    // Notas: E5, B5, E6 (arpejo cristalino ascendente)
    const notes = [
      { f: 659.25, t: 0.0 },
      { f: 987.77, t: 0.09 },
      { f: 1318.51, t: 0.2 },
    ];

    for (const n of notes) {
      const t0 = now + n.t;
      // Fundamental (senoidal, sino puro)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.f, t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      osc.connect(g).connect(master);
      osc.start(t0);
      osc.stop(t0 + 1.5);

      // Harmônica superior sutil (brilho)
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(n.f * 2, t0);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      osc2.connect(g2).connect(master);
      osc2.start(t0);
      osc2.stop(t0 + 1.0);
    }

    // Shimmer aéreo (senoidal alta, quase inaudível mas dá "mágica")
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(2637.02, now + 0.25); // E7
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, now + 0.25);
    sg.gain.exponentialRampToValueAtTime(0.08, now + 0.32);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    shimmer.connect(sg).connect(master);
    shimmer.start(now + 0.25);
    shimmer.stop(now + 1.7);
  } catch {
    /* audio bloqueado ou indisponível — silencioso */
  }
}


/**
 * Overlay cinematográfico estilo LoL — dispara quando o usuário recebe
 * um novo presente (uma carta enviada por outro perfil). Só mostra IDs
 * inéditos; presentes pendentes antigos ficam para a `GiftInbox`.
 */
export function GiftReceivedOverlay() {
  const me = useCurrentProfile();
  const pending = usePendingGifts(me?.id as ProfileId | undefined);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Enquanto houver presente pendente e o usuário não estiver na aba Social,
  // mostra o card do presente mais recente. Ao aceitar/dispensar em /social,
  // `pending` fica vazio e o toast some sozinho.
  const current: CardGift | null = pending[0] ?? null;
  const onSocial = pathname?.startsWith("/social") ?? false;

  // Toca o chime apenas uma vez por presente novo.
  const chimedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!current) {
      chimedRef.current = null;
      return;
    }
    if (chimedRef.current !== current.id) {
      chimedRef.current = current.id;
      playGiftChime();
    }
  }, [current?.id]);

  if (!current || onSocial) return null;

  const sender = profileMeta(current.fromProfile);

  // Clip-path hextech (cantos cortados em diagonal — assinatura visual LoL)
  const hexClip =
    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[85] flex justify-end sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative w-[340px] max-w-[calc(100vw-2rem)] motion-safe:animate-[giftEnter_450ms_cubic-bezier(.2,.9,.3,1.1)_both]">
        {/* Glow dourado hextech ao redor */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[2px] motion-safe:animate-[giftGlow_2600ms_ease-in-out_infinite]"
          style={{
            clipPath: hexClip,
            background:
              "linear-gradient(135deg, #f0e6d2 0%, #c8aa6e 30%, #785a28 60%, #c8aa6e 100%)",
            filter: "blur(6px)",
            opacity: 0.55,
          }}
        />

        {/* Moldura dourada externa */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            clipPath: hexClip,
            background:
              "linear-gradient(135deg, #f0e6d2 0%, #c8aa6e 25%, #463714 50%, #c8aa6e 75%, #f0e6d2 100%)",
          }}
        />

        <Link
          to="/social"
          aria-label="Ir para Social e receber presente"
          className="relative block text-left transition hover:brightness-110"
          style={{ clipPath: hexClip, margin: 1.5 }}
        >
          {/* Fundo azul-navio LoL com textura sutil */}
          <div
            className="relative overflow-hidden"
            style={{
              clipPath:
                "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)",
              background:
                "radial-gradient(120% 100% at 0% 0%, #0a323c 0%, #091428 55%, #010a13 100%)",
            }}
          >
            {/* Padrão hexagonal sutil */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, #c8aa6e 0.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, #c8aa6e 0.5px, transparent 1.5px)",
                backgroundSize: "22px 22px, 28px 28px",
              }}
            />

            {/* Shimmer diagonal dourado */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 motion-safe:animate-[giftShimmer_2800ms_ease-in-out_infinite]"
              style={{
                background:
                  "linear-gradient(115deg, transparent 42%, rgba(240,230,210,0.14) 50%, transparent 58%)",
              }}
            />

            {/* Barra dourada superior pulsante */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] motion-safe:animate-[giftPulseBar_2200ms_ease-in-out_infinite]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #c8aa6e 20%, #f0e6d2 50%, #c8aa6e 80%, transparent)",
              }}
            />
            {/* Barra inferior */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[2px] opacity-70"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #785a28 50%, transparent)",
              }}
            />

            {/* Cantos-ângulo (brackets) estilo LoL */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t"
              style={{ borderColor: "#c8aa6e" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 border-r border-t"
              style={{ borderColor: "#c8aa6e" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l"
              style={{ borderColor: "#c8aa6e" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r"
              style={{ borderColor: "#c8aa6e" }}
            />

            <div className="relative flex items-start gap-3 px-4 py-3.5">
              {/* Selo hexagonal com presente */}
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 -m-1"
                  style={{
                    clipPath:
                      "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                    background:
                      "linear-gradient(135deg, #f0e6d2, #c8aa6e 50%, #463714)",
                    filter: "blur(4px)",
                    opacity: 0.75,
                  }}
                />
                <div
                  className="relative grid h-12 w-12 place-items-center motion-safe:animate-[giftPop_550ms_cubic-bezier(.2,.9,.3,1.2)_backwards]"
                  style={{
                    clipPath:
                      "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                    background:
                      "linear-gradient(160deg, #c8aa6e 0%, #785a28 55%, #463714 100%)",
                  }}
                >
                  <div
                    className="grid h-[calc(100%-4px)] w-[calc(100%-4px)] place-items-center"
                    style={{
                      clipPath:
                        "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                      background:
                        "radial-gradient(circle at 30% 25%, #0a323c 0%, #010a13 100%)",
                    }}
                  >
                    <Gift
                      className="h-5 w-5"
                      strokeWidth={2.25}
                      style={{
                        color: "#f0e6d2",
                        filter:
                          "drop-shadow(0 0 6px rgba(240,230,210,0.7))",
                      }}
                    />
                  </div>
                </div>
                {pending.length > 1 && (
                  <span
                    className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-sm border px-1 text-[9px] font-bold"
                    style={{
                      background: "#f0e6d2",
                      color: "#010a13",
                      borderColor: "#010a13",
                    }}
                  >
                    {pending.length}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase"
                  style={{
                    letterSpacing: "0.28em",
                    color: "#c8aa6e",
                    textShadow: "0 0 8px rgba(200,170,110,0.35)",
                  }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {pending.length > 1
                    ? `${pending.length} Presentes`
                    : "Presente Recebido"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-white">
                  <ProfileAvatar
                    profileId={current.fromProfile}
                    initial={sender.initial}
                    gradient={sender.gradient}
                    size={14}
                    fontScale={0.42}
                  />
                  <span className="truncate" style={{ color: "#f0e6d2" }}>
                    {sender.name}
                  </span>
                  <span className="text-white/45">enviou</span>
                </p>
                <p className="mt-1 truncate text-[12px] italic text-white/75">
                  "{current.front}"
                </p>
                <p
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase"
                  style={{
                    letterSpacing: "0.22em",
                    color: "#f0e6d2",
                  }}
                >
                  Reivindicar em Social
                  <span
                    aria-hidden
                    className="motion-safe:animate-[giftArrow_1400ms_ease-in-out_infinite]"
                  >
                    ▸
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes giftEnter {
          from { transform: translateX(28px) scale(0.96); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes giftShimmer {
          0%, 100% { transform: translateX(-40%); opacity: 0.3; }
          50% { transform: translateX(40%); opacity: 0.95; }
        }
        @keyframes giftGlow {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
        @keyframes giftPop {
          0% { transform: scale(0.4) rotate(-10deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes giftPulseBar {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes giftArrow {
          0%, 100% { transform: translateX(0); opacity: 0.8; }
          50% { transform: translateX(3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
