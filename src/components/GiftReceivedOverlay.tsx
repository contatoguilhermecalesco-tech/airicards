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

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[85] flex justify-end sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative w-[320px] max-w-[calc(100vw-2rem)] motion-safe:animate-[giftEnter_400ms_cubic-bezier(.2,.9,.3,1.1)_both]">
        {/* Glow sutil ao redor */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-300/40 via-fuchsia-400/30 to-violet-500/40 opacity-70 blur-md motion-safe:animate-[giftGlow_2400ms_ease-in-out_infinite]" />

        <Link
          to="/social"
          className="relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0b0713]/95 text-left shadow-xl backdrop-blur-xl transition hover:border-white/20"
          aria-label="Ir para Social e receber presente"
        >
          {/* Shimmer discreto */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-safe:animate-[giftShimmer_2600ms_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
            }}
          />

          {/* Barra pulsante superior (indica ação pendente) */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-500 motion-safe:animate-[giftPulseBar_2200ms_ease-in-out_infinite]"
          />

          <div className="relative flex items-start gap-3 p-3.5">
            {/* Selo compacto */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 -m-1.5 rounded-full bg-gradient-to-br from-amber-300/40 via-fuchsia-400/30 to-violet-500/40 blur-md motion-safe:animate-[giftGlow_2400ms_ease-in-out_infinite]" />
              <div className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 shadow-inner motion-safe:animate-[giftPop_500ms_cubic-bezier(.2,.9,.3,1.2)_backwards]">
                <Gift className="h-5 w-5 text-amber-200 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" strokeWidth={2.25} />
              </div>
              {pending.length > 1 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border border-black/60 bg-amber-300 px-1 text-[9px] font-bold text-black">
                  {pending.length}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                <Sparkles className="h-2.5 w-2.5" />
                Presente {pending.length > 1 ? `× ${pending.length}` : "recebido"}
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
                <span className="text-white/50">te enviou</span>
              </p>
              <p className="mt-1 truncate text-[12px] text-white/70">
                "{current.front}"
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/90">
                Abrir na aba Social
                <span aria-hidden className="motion-safe:animate-[giftArrow_1400ms_ease-in-out_infinite]">→</span>
              </p>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes giftEnter {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes giftShimmer {
          0%, 100% { transform: translateX(-30%); opacity: 0.4; }
          50% { transform: translateX(30%); opacity: 0.9; }
        }
        @keyframes giftGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        @keyframes giftPop {
          0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
          70% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes giftPulseBar {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes giftArrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
