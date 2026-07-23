import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { onStreakChange, type StreakChangeEvent } from "@/lib/flashcards-store";

/**
 * Overlay global — dá feedback visual imediato ao GANHAR ou PERDER
 * um dia de streak. Curto (~1.4s), discreto, não bloqueia a interação.
 * Marcos grandes usam o StreakMilestoneOverlay separado.
 */
export function StreakChangeOverlay() {
  const [event, setEvent] = useState<StreakChangeEvent | null>(null);

  useEffect(() => {
    const off = onStreakChange((e) => {
      setEvent(e);
      window.setTimeout(() => {
        setEvent((cur) => (cur && cur.at === e.at ? null : cur));
      }, 1600);
    });
    return () => {
      off();
    };
  }, []);

  if (!event) return null;

  if (event.kind === "gained") {
    return (
      <div
        className="fixed inset-x-0 top-6 z-[70] pointer-events-none flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="motion-safe:animate-[streakToast_1600ms_ease-out_forwards] flex items-center gap-3 px-4 py-3 rounded-2xl border border-orange-300/25 bg-gradient-to-b from-orange-500/15 to-rose-500/10 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(251,146,60,0.5)]">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-orange-400/30 to-rose-500/15 ring-1 ring-orange-300/30">
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl blur-md opacity-60"
              style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 65%)" }}
            />
            <Flame
              className="relative h-4 w-4 text-orange-200 motion-safe:animate-pulse"
              strokeWidth={2.5}
              fill="currentColor"
              fillOpacity={0.35}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-orange-100 leading-none">
              +1 dia de sequência
            </p>
            <p className="mt-1 text-[11px] font-medium text-orange-200/70 leading-none">
              Agora são {event.current} dia{event.current === 1 ? "" : "s"} seguido{event.current === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes streakToast {
            0% { transform: translateY(-16px); opacity: 0; }
            10% { transform: translateY(0); opacity: 1; }
            80% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-8px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Perdeu — feedback frio, cinza, com fumaça
  return (
    <div
      className="fixed inset-x-0 top-6 z-[70] pointer-events-none flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="motion-safe:animate-[streakToastLost_1800ms_ease-out_forwards] flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-lg">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-white/10">
          {/* smoke wisps */}
          <span
            aria-hidden
            className="absolute left-3 top-0 h-6 w-1.5 rounded-full bg-white/15 blur-sm motion-safe:animate-[smokeUp_1800ms_ease-out_forwards]"
          />
          <span
            aria-hidden
            className="absolute left-5 top-0 h-4 w-1 rounded-full bg-white/10 blur-sm motion-safe:animate-[smokeUp_1800ms_ease-out_forwards_200ms]"
          />
          <Flame
            className="relative h-4 w-4 text-muted-foreground/50 rotate-6"
            strokeWidth={2.25}
            fill="currentColor"
            fillOpacity={0.15}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-muted-foreground leading-none">
            Sua chama apagou
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground/70 leading-none">
            Perdeu {event.previous} dia{event.previous === 1 ? "" : "s"} de sequência
          </p>
        </div>
      </div>

      <style>{`
        @keyframes streakToastLost {
          0% { transform: translateY(-16px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          80% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-8px); opacity: 0; }
        }
        @keyframes smokeUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.7; }
          100% { transform: translateY(-16px) scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
