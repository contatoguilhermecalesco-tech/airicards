// Chama de streak — visual padrão + versões cosméticas (slot `streak_flame`).
import { Flame } from "lucide-react";
import type { StreakFlameTheme } from "@/lib/eclipse-cosmetics";

export type FlameState = "ashes" | "risk" | "alive" | "empty";

export function streakHalo(state: FlameState, theme: StreakFlameTheme | null) {
  if (theme && state !== "ashes" && state !== "empty") return theme.halo;
  return {
    ashes: "radial-gradient(closest-side, rgba(148,163,184,0.15), transparent 70%)",
    risk: "radial-gradient(closest-side, rgba(251,191,36,0.28), transparent 70%)",
    alive: "radial-gradient(closest-side, rgba(251,146,60,0.35), transparent 70%)",
    empty: "radial-gradient(closest-side, rgba(167,139,250,0.20), transparent 70%)",
  }[state];
}

export function StreakFlame({
  state,
  studiedToday,
  theme,
  streak,
}: {
  state: FlameState;
  studiedToday: boolean;
  theme: StreakFlameTheme | null;
  streak: number;
}) {
  const isActive = state === "alive" || state === "risk";

  const defaultRing = {
    ashes:
      "border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] text-muted-foreground/50",
    risk: "border-amber-300/25 bg-gradient-to-b from-amber-400/15 to-amber-500/5 text-amber-200",
    alive: "border-orange-300/25 bg-gradient-to-b from-orange-400/25 to-rose-500/10 text-orange-200",
    empty: "border-white/[0.08] bg-white/[0.04] text-muted-foreground",
  }[state];

  const ring = theme && isActive ? theme.ring : defaultRing;

  // Intensidade sobe com a streak (limitada), usada pelos cosméticos.
  const intensity = Math.min(1, streak / 30);

  return (
    <div
      className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border transition-colors ${ring}`}
    >
      {theme && isActive && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70 motion-safe:animate-[emberGlow_2600ms_ease-in-out_infinite]"
            style={{
              background: `radial-gradient(closest-side at 50% 85%, ${theme.color}55, transparent 72%)`,
            }}
          />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute bottom-1 h-1 w-1 rounded-full motion-safe:animate-[emberRise_2800ms_linear_infinite]"
              style={{
                left: `${26 + i * 18}%`,
                background: theme.color,
                opacity: 0.45 + intensity * 0.4,
                animationDelay: `${i * 700}ms`,
                boxShadow: `0 0 6px ${theme.color}`,
              }}
            />
          ))}
        </>
      )}

      {theme?.glyph === "eclipse" && isActive ? (
        <span
          aria-hidden
          className="relative grid h-[22px] w-[22px] place-items-center"
        >
          <span
            className="absolute inset-0 rounded-full motion-safe:animate-[emberGlow_3200ms_ease-in-out_infinite]"
            style={{
              boxShadow: `0 0 12px 2px ${theme.color}`,
              background: theme.accent,
            }}
          />
          <span
            className="absolute inset-[3px] rounded-full"
            style={{ background: "#08050a" }}
          />
        </span>
      ) : (
        <Flame
          className={`relative h-[22px] w-[22px] transition-transform ${
            state === "alive" && studiedToday ? "motion-safe:animate-pulse" : ""
          } ${state === "risk" ? "motion-safe:animate-[flicker_1400ms_ease-in-out_infinite]" : ""} ${
            state === "ashes" ? "opacity-40 rotate-6" : ""
          }`}
          strokeWidth={2.25}
          style={theme && isActive ? { color: theme.color } : undefined}
          fill={state === "alive" || state === "risk" ? "currentColor" : "none"}
          fillOpacity={
            state === "alive" ? (studiedToday ? 0.3 : 0.18) : state === "risk" ? 0.22 : 0
          }
        />
      )}
    </div>
  );
}
