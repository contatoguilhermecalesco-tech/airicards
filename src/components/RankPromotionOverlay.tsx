import { useEffect, useState } from "react";
import { RankEmblem } from "@/components/RankBadge";
import {
  onRankPromotion,
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
  type RankPromotionEvent,
} from "@/lib/rank-store";

/**
 * Overlay global — anima subida de divisão/tier por ~1.8s com destaque
 * do emblema e confete sutil em tema escuro.
 * Sem áudio; respeita prefers-reduced-motion.
 */
export function RankPromotionOverlay() {
  const [event, setEvent] = useState<RankPromotionEvent | null>(null);

  useEffect(() => {
    const off = onRankPromotion((e) => {
      setEvent(e);
      // 1.8s de destaque
      window.setTimeout(() => {
        setEvent((cur) => (cur && cur.at === e.at ? null : cur));
      }, 1800);
    });
    return () => {
      off();
    };
  }, []);

  if (!event) return null;

  const colors = TIER_COLORS[event.toTier];
  const label = isElite(event.toTier)
    ? TIER_LABEL[event.toTier]
    : `${TIER_LABEL[event.toTier]} ${DIVISION_ROMAN[event.toDivision as 1 | 2 | 3 | 4]}`;

  // Paleta de confete no tema escuro — sem neon.
  const confettiColors = [
    colors.ring,
    colors.from,
    "#c7b9ff",
    "#f2c94c",
    "rgba(255,255,255,0.9)",
  ];

  // 22 partículas — pré-calculadas para variação natural.
  const particles = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.15;
    const dist = 120 + ((i * 37) % 90);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 40;
    const rot = ((i * 53) % 360) - 180;
    const delay = (i % 6) * 30;
    const size = 5 + ((i * 3) % 5);
    const color = confettiColors[i % confettiColors.length];
    return { i, dx, dy, rot, delay, size, color };
  });

  return (
    <div
      key={event.at}
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Backdrop sutil */}
      <div className="airi-promo-backdrop absolute inset-0" />

      {/* Halo do tier */}
      <div
        className="airi-promo-halo absolute h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${colors.glow}, transparent 70%)` }}
      />

      {/* Confete */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <span
            key={p.i}
            className="airi-confetti absolute rounded-[2px]"
            style={
              {
                width: p.size,
                height: p.size * 1.6,
                backgroundColor: p.color,
                boxShadow: `0 0 6px ${p.color}`,
                animationDelay: `${p.delay}ms`,
                ["--dx" as string]: `${p.dx}px`,
                ["--dy" as string]: `${p.dy}px`,
                ["--rot" as string]: `${p.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Card central */}
      <div className="airi-promo-card relative flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/55 px-8 py-6 backdrop-blur-xl">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: colors.ring }}
        >
          {event.kind === "tier" ? "Novo Tier" : "Promoção"}
        </span>
        <div className="airi-promo-emblem">
          <RankEmblem tier={event.toTier} division={event.toDivision} size={120} />
        </div>
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: colors.text }}
        >
          {label}
        </span>
        <span className="text-[12px] text-white/60">
          {event.kind === "tier" ? "Você alcançou um novo tier" : "Você subiu de divisão"}
        </span>
      </div>

      <style>{`
        .airi-promo-backdrop {
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.45), rgba(0,0,0,0.05) 60%, transparent 100%);
          animation: airiPromoFade 1.8s ease-out forwards;
        }
        .airi-promo-halo {
          opacity: 0;
          animation: airiPromoHalo 1.8s ease-out forwards;
        }
        .airi-promo-card {
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset;
          transform: translateY(8px) scale(0.94);
          opacity: 0;
          animation: airiPromoCard 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .airi-promo-emblem {
          filter: drop-shadow(0 0 24px ${colors.glow});
          animation: airiPromoEmblem 1.8s ease-out forwards;
        }
        .airi-confetti {
          top: 50%;
          left: 50%;
          opacity: 0;
          transform: translate(-50%, -50%);
          animation: airiConfetti 1.6s cubic-bezier(0.16, 0.84, 0.3, 1) forwards;
        }
        @keyframes airiPromoFade {
          0% { opacity: 0; }
          15% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes airiPromoHalo {
          0% { opacity: 0; transform: scale(0.7); }
          25% { opacity: 0.9; transform: scale(1); }
          80% { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes airiPromoCard {
          0% { opacity: 0; transform: translateY(10px) scale(0.94); }
          18% { opacity: 1; transform: translateY(0) scale(1); }
          82% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-6px) scale(0.98); }
        }
        @keyframes airiPromoEmblem {
          0% { transform: scale(0.7) rotate(-6deg); }
          20% { transform: scale(1.08) rotate(0deg); }
          40% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes airiConfetti {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(0deg);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .airi-promo-card, .airi-promo-emblem, .airi-promo-halo, .airi-confetti, .airi-promo-backdrop {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
