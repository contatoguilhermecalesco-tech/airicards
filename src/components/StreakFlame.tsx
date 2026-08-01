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

      {theme?.glyph === "marionette" && theme.art ? (
        <MarionetteFlame theme={theme} intensity={intensity} state={state} streak={streak} />

      ) : theme?.glyph === "rune" && isActive && theme.art ? (
        <span aria-hidden className="relative grid h-[26px] w-[26px] place-items-center">
          <img
            src={theme.art}
            alt=""
            draggable={false}
            className="h-[26px] w-[26px] object-contain motion-safe:animate-[puppetBreath_2600ms_ease-in-out_infinite]"
            style={{ filter: `drop-shadow(0 0 7px ${theme.color}aa)` }}
          />
        </span>
      ) : theme?.glyph === "eclipse" && isActive ? (
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

/* ---------------- Chama da Marionete ---------------- */
// Chama de porcelana suspensa por fios: balança como marionete, respira com a
// streak e derruba pétalas brancas. Quanto maior a sequência, mais viva.
function MarionetteFlame({
  theme,
  intensity,
}: {
  theme: StreakFlameTheme;
  intensity: number;
}) {
  const swayMs = 3400 - intensity * 900;

  return (
    <span aria-hidden className="relative grid h-full w-full place-items-center">
      {/* fios de comando */}
      {[30, 50, 70].map((left, i) => (
        <span
          key={left}
          className="pointer-events-none absolute top-0 h-3.5 w-px motion-safe:animate-[threadPull_2200ms_ease-in-out_infinite]"
          style={{
            left: `${left}%`,
            background: `linear-gradient(to bottom, ${theme.accent}cc, transparent)`,
            animationDelay: `${i * 320}ms`,
          }}
        />
      ))}

      {/* pulsos de porcelana */}
      <span
        className="pointer-events-none absolute h-7 w-7 rounded-full border motion-safe:animate-[porcelainRing_2800ms_ease-out_infinite]"
        style={{ borderColor: `${theme.color}66` }}
      />

      {/* pétalas caindo */}
      {[22, 62, 82].map((left, i) => (
        <span
          key={`p-${left}`}
          className="pointer-events-none absolute top-1 h-[3px] w-[5px] rounded-full motion-safe:animate-[petalFall_3200ms_linear_infinite]"
          style={{
            left: `${left}%`,
            background: theme.accent,
            opacity: 0.7,
            animationDelay: `${i * 900}ms`,
          }}
        />
      ))}

      {/* chama-máscara */}
      <span
        className="relative grid h-[28px] w-[28px] origin-top place-items-center motion-safe:animate-[puppetSway_var(--sway)_ease-in-out_infinite]"
        style={{ ["--sway" as string]: `${swayMs}ms` }}
      >
        <img
          src={theme.art}
          alt=""
          draggable={false}
          className="h-[27px] w-[27px] object-contain motion-safe:animate-[puppetBreath_2400ms_ease-in-out_infinite]"
          style={{
            filter: `drop-shadow(0 0 ${5 + intensity * 7}px ${theme.color}cc) drop-shadow(0 0 2px ${theme.accent}aa)`,
          }}
        />
      </span>
    </span>
  );
}
