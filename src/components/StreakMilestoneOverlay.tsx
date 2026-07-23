import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { onStreakMilestone, type StreakMilestoneEvent } from "@/lib/flashcards-store";

/**
 * Overlay global — celebra ao cruzar um marco de streak.
 * Anima ~2.2s com um flame gigante em vidro líquido, sem neon.
 * Respeita prefers-reduced-motion.
 */
export function StreakMilestoneOverlay() {
  const [event, setEvent] = useState<StreakMilestoneEvent | null>(null);

  useEffect(() => {
    const off = onStreakMilestone((e) => {
      setEvent(e);
      window.setTimeout(() => {
        setEvent((cur) => (cur && cur.at === e.at ? null : cur));
      }, 2200);
    });
    return () => {
      off();
    };
  }, []);

  if (!event) return null;

  // Paleta quente sofisticada — âmbar/laranja, sem neon.
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 110 + ((i * 41) % 80);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30;
    const rot = ((i * 53) % 360) - 180;
    const delay = (i % 6) * 30;
    const size = 4 + ((i * 3) % 5);
    const hues = ["#f59e0b", "#fb923c", "#fbbf24", "rgba(255,255,255,0.9)", "#fda4af"];
    const color = hues[i % hues.length];
    return { i, dx, dy, rot, delay, size, color };
  });

  return (
    <div
      className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      {/* Vinheta */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300"
        aria-hidden
      />

      {/* Confete */}
      {particles.map((p) => (
        <span
          key={p.i}
          className="absolute rounded-full motion-safe:animate-[streakConfetti_1400ms_ease-out_forwards] motion-reduce:hidden"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            // @ts-expect-error CSS var
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--rot": `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
            boxShadow: "0 0 12px rgba(251,146,60,0.35)",
          }}
        />
      ))}

      {/* Card central */}
      <div className="relative flex flex-col items-center gap-4 px-8 py-7 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-xl shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in duration-500">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-70"
            style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 65%)" }}
            aria-hidden
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-orange-500/15 ring-1 ring-amber-300/30">
            <Flame className="h-14 w-14 text-amber-300 drop-shadow-[0_0_20px_rgba(251,146,60,0.6)]" strokeWidth={1.8} />
          </div>
        </div>

        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 font-medium">
            Marco alcançado
          </div>
          <div className="mt-1 text-4xl font-semibold text-white tabular-nums">
            {event.days} dias
          </div>
          <div className="mt-2 text-sm text-white/70">
            Sequência de estudo em chamas
          </div>
          {event.lpGained > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[13px] text-white/90">
              <span className="text-amber-300">+{event.lpGained}</span>
              <span className="text-white/60">LP</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes streakConfetti {
          0% { transform: translate(0,0) rotate(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
