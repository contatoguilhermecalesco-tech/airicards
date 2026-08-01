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
// A marionete reage ao estado da streak:
//  • empty/ashes → cinza, pendurada e sem forças (fios bambos)
//  • risk        → tremor nervoso, fios se rompendo, piscadas
//  • alive       → balanço vivo, pétalas, brasas e coroa de fios em streaks altas
function MarionetteFlame({
  theme,
  intensity,
  state,
  streak,
}: {
  theme: StreakFlameTheme;
  intensity: number;
  state: FlameState;
  streak: number;
}) {
  const dead = state === "ashes" || state === "empty";
  const risk = state === "risk";
  const alive = state === "alive";

  // Tiers de intensidade só valem para a chama viva.
  const tier = !alive ? 0 : streak >= 30 ? 3 : streak >= 14 ? 2 : streak >= 5 ? 1 : 0;

  const color = dead ? "#8d93a1" : theme.color;
  const accent = dead ? "#b9bec9" : theme.accent;

  // Quanto maior a streak, mais rápido e amplo o balanço.
  const swayMs = dead ? 5200 : risk ? 900 : 3400 - intensity * 1400;
  const breathMs = dead ? 4200 : risk ? 1100 : 2400 - intensity * 800;

  const swayAnim = dead
    ? "motion-safe:animate-[puppetSlump_var(--sway)_ease-in-out_infinite]"
    : risk
      ? "motion-safe:animate-[maskShiver_var(--sway)_ease-in-out_infinite]"
      : "motion-safe:animate-[puppetSway_var(--sway)_ease-in-out_infinite]";

  const breathAnim = dead
    ? "motion-safe:animate-[puppetSlumpBreath_var(--breath)_ease-in-out_infinite]"
    : risk
      ? "motion-safe:animate-[maskShiverBreath_var(--breath)_ease-in-out_infinite]"
      : "motion-safe:animate-[puppetBreath_var(--breath)_ease-in-out_infinite]";

  const threadAnim = dead
    ? "motion-safe:animate-[threadSlack_4200ms_ease-in-out_infinite]"
    : risk
      ? "motion-safe:animate-[threadSnap_1600ms_ease-in-out_infinite]"
      : "motion-safe:animate-[threadPull_2200ms_ease-in-out_infinite]";

  const petals = tier >= 3 ? [16, 40, 62, 84] : tier >= 2 ? [22, 62, 82] : tier >= 1 ? [30, 70] : [];
  const glow = dead ? 2 : risk ? 4 : 5 + intensity * 9;

  return (
    <span aria-hidden className="relative grid h-full w-full place-items-center">
      {/* coroa de fios girando (só em streak lendária) */}
      {tier >= 3 && (
        <span
          className="pointer-events-none absolute h-9 w-9 rounded-full border border-dashed motion-safe:animate-[threadCrown_9000ms_linear_infinite]"
          style={{ borderColor: `${accent}55` }}
        />
      )}

      {/* fios de comando */}
      {[30, 50, 70].map((left, i) => (
        <span
          key={left}
          className={`pointer-events-none absolute top-0 w-px ${threadAnim}`}
          style={{
            left: `${left}%`,
            height: dead ? "9px" : "14px",
            background: `linear-gradient(to bottom, ${accent}${dead ? "66" : "cc"}, transparent)`,
            animationDelay: `${i * (risk ? 180 : 320)}ms`,
          }}
        />
      ))}

      {/* pulsos de porcelana — mais rápidos conforme a streak sobe */}
      {!dead && (
        <span
          className="pointer-events-none absolute h-7 w-7 rounded-full border motion-safe:animate-[porcelainRing_var(--ring)_ease-out_infinite]"
          style={{
            borderColor: `${color}${risk ? "44" : "66"}`,
            ["--ring" as string]: `${risk ? 1400 : 2800 - intensity * 900}ms`,
          }}
        />
      )}

      {/* flare pulsante de streak alta */}
      {tier >= 2 && (
        <span
          className="pointer-events-none absolute h-8 w-8 rounded-full motion-safe:animate-[marionetteFlare_1800ms_ease-in-out_infinite]"
          style={{ background: `radial-gradient(closest-side, ${color}55, transparent 70%)` }}
        />
      )}

      {/* pétalas caindo (quantidade cresce com a streak) */}
      {petals.map((left, i) => (
        <span
          key={`p-${left}`}
          className="pointer-events-none absolute top-1 h-[3px] w-[5px] rounded-full motion-safe:animate-[petalFall_var(--fall)_linear_infinite]"
          style={{
            left: `${left}%`,
            background: accent,
            opacity: 0.55 + intensity * 0.35,
            animationDelay: `${i * 700}ms`,
            ["--fall" as string]: `${3200 - intensity * 900}ms`,
          }}
        />
      ))}

      {/* cinzas caindo quando a chama morre */}
      {dead &&
        [34, 66].map((left, i) => (
          <span
            key={`a-${left}`}
            className="pointer-events-none absolute top-2 h-[2px] w-[2px] rounded-full motion-safe:animate-[petalFall_5200ms_linear_infinite]"
            style={{
              left: `${left}%`,
              background: "#9aa1ad",
              opacity: 0.35,
              animationDelay: `${i * 1800}ms`,
            }}
          />
        ))}

      {/* chama-máscara */}
      <span
        className={`relative grid h-[28px] w-[28px] origin-top place-items-center ${swayAnim}`}
        style={{ ["--sway" as string]: `${swayMs}ms` }}
      >
        <img
          src={theme.art}
          alt=""
          draggable={false}
          className={`h-[27px] w-[27px] object-contain ${breathAnim}`}
          style={{
            ["--breath" as string]: `${breathMs}ms`,
            opacity: dead ? 0.55 : 1,
            filter: dead
              ? "grayscale(1) brightness(0.6)"
              : `drop-shadow(0 0 ${glow}px ${color}cc) drop-shadow(0 0 2px ${accent}aa)`,
          }}
        />
      </span>
    </span>
  );
}

