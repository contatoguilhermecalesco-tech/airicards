import { useEffect } from "react";
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

  // Toca o chime em loop enquanto houver presente pendente e o usuário
  // não estiver na aba Social. Para assim que o toast some (aceito/aberto).
  useEffect(() => {
    if (!current || onSocial) return;
    playGiftChime();
    // Repete a cada ~3.2s (duração do chime + respiro) até ser dispensado.
    const id = window.setInterval(() => {
      playGiftChime();
    }, 3200);
    return () => window.clearInterval(id);
  }, [current?.id, onSocial]);

  if (!current || onSocial) return null;

  const sender = profileMeta(current.fromProfile);



  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[85] flex justify-end sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto relative w-[340px] max-w-[calc(100vw-2rem)] motion-safe:animate-[giftEnter_500ms_cubic-bezier(.2,.9,.3,1.05)_both]"
        style={{
          fontFamily:
            '"Space Grotesk", "DM Sans", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Halo violeta difuso ao redor (editorial, discreto) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 motion-safe:animate-[giftGlow_3600ms_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.35), transparent 70%)",
            filter: "blur(14px)",
          }}
        />

        <Link
          to="/social"
          aria-label="Ir para Social e receber presente"
          className="relative block overflow-hidden text-left transition hover:brightness-[1.08]"
          style={{
            background:
              "linear-gradient(160deg, #12081f 0%, #0a0a1a 55%, #05030d 100%)",
            border: "1px solid rgba(233,213,255,0.10)",
            borderRadius: "2px",
            boxShadow:
              "0 20px 50px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(124,58,237,0.15) inset",
          }}
        >
          {/* Barra editorial vertical à esquerda */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{
              background:
                "linear-gradient(180deg, transparent, #7c3aed 20%, #e9d5ff 50%, #7c3aed 80%, transparent)",
            }}
          />

          {/* Sheen diagonal sutil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-safe:animate-[giftShimmer_3200ms_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(115deg, transparent 44%, rgba(233,213,255,0.06) 50%, transparent 56%)",
            }}
          />

          {/* Textura de "papel" sutil (grão de estrelas) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 25%, #e9d5ff 0.4px, transparent 1.2px), radial-gradient(circle at 78% 65%, #a78bfa 0.4px, transparent 1.2px), radial-gradient(circle at 45% 85%, #7c3aed 0.3px, transparent 1px)",
              backgroundSize: "40px 40px, 32px 32px, 24px 24px",
            }}
          />

          <div className="relative flex items-start gap-3.5 px-4 py-4">
            {/* Selo mínimo — círculo com anel violeta */}
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 -m-1.5 rounded-full motion-safe:animate-[giftGlow_2600ms_ease-in-out_infinite]"
                style={{
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <div
                className="relative grid h-11 w-11 place-items-center rounded-full motion-safe:animate-[giftPop_600ms_cubic-bezier(.2,.9,.3,1.15)_backwards]"
                style={{
                  background:
                    "linear-gradient(155deg, #1a0b2e 0%, #05030d 100%)",
                  border: "1px solid rgba(233,213,255,0.25)",
                  boxShadow:
                    "0 0 0 1px rgba(124,58,237,0.35) inset, 0 6px 16px -4px rgba(124,58,237,0.6)",
                }}
              >
                <Gift
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.75}
                  style={{
                    color: "#e9d5ff",
                    filter: "drop-shadow(0 0 6px rgba(167,139,250,0.7))",
                  }}
                />
              </div>
              {pending.length > 1 && (
                <span
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-semibold"
                  style={{
                    background: "#e9d5ff",
                    color: "#1a0b2e",
                    boxShadow: "0 0 0 2px #0a0a1a",
                  }}
                >
                  {pending.length}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Eyebrow editorial */}
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-px w-3"
                  style={{ background: "#7c3aed" }}
                />
                <p
                  className="text-[9.5px] font-medium uppercase"
                  style={{
                    letterSpacing: "0.34em",
                    color: "#c4b5fd",
                  }}
                >
                  {pending.length > 1
                    ? `${pending.length} Presentes`
                    : "Presente Recebido"}
                </p>
                <Sparkles
                  className="h-2.5 w-2.5"
                  style={{ color: "#a78bfa" }}
                />
              </div>

              {/* Título — nome do remetente com tratamento editorial */}
              <p
                className="mt-1.5 flex items-center gap-2 text-[15px] font-semibold leading-tight"
                style={{
                  color: "#f5f3ff",
                  letterSpacing: "-0.01em",
                }}
              >
                <ProfileAvatar
                  profileId={current.fromProfile}
                  initial={sender.initial}
                  gradient={sender.gradient}
                  size={16}
                  fontScale={0.44}
                />
                <span className="truncate">{sender.name}</span>
              </p>

              {/* Citação editorial */}
              <p
                className="mt-1.5 truncate text-[12px] italic"
                style={{
                  color: "rgba(233,213,255,0.72)",
                  fontFamily:
                    '"DM Sans", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                &ldquo;{current.front}&rdquo;
              </p>

              {/* CTA minimal — linha + label + seta */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-px flex-1"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.5), transparent)",
                  }}
                />
                <p
                  className="text-[10px] font-medium uppercase"
                  style={{
                    letterSpacing: "0.24em",
                    color: "#e9d5ff",
                  }}
                >
                  Abrir em Social
                </p>
                <span
                  aria-hidden
                  className="motion-safe:animate-[giftArrow_1600ms_ease-in-out_infinite]"
                  style={{ color: "#e9d5ff", fontSize: "11px" }}
                >
                  →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes giftEnter {
          from { transform: translateY(-6px) translateX(20px); opacity: 0; }
          to { transform: translateY(0) translateX(0); opacity: 1; }
        }
        @keyframes giftShimmer {
          0%, 100% { transform: translateX(-45%); opacity: 0.25; }
          50% { transform: translateX(45%); opacity: 0.9; }
        }
        @keyframes giftGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.95; }
        }
        @keyframes giftPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes giftArrow {
          0%, 100% { transform: translateX(0); opacity: 0.75; }
          50% { transform: translateX(4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
