// Splash de vitória em duelo — cosmético do slot `victory_splash`.
import { useEffect, useState } from "react";
import type { VictorySplashTheme } from "@/lib/eclipse-cosmetics";

export function VictorySplash({
  theme,
  onDone,
}: {
  theme: VictorySplashTheme;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-hidden"
      onClick={() => {
        setVisible(false);
        onDone?.();
      }}
      role="presentation"
    >
      <div
        aria-hidden
        className="absolute inset-0 motion-safe:animate-[fade-in_400ms_ease-out]"
        style={{
          background: `radial-gradient(80% 60% at 50% 45%, ${theme.color}33, ${theme.accent}f2 60%, #05030a 100%)`,
        }}
      />

      {theme.art && (
        <>
          <img
            aria-hidden
            src={theme.art}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover opacity-80 motion-safe:animate-[victorySplashZoom_5200ms_ease-out_forwards]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${theme.accent}66 0%, transparent 28%, ${theme.accent}cc 78%, #05030a 100%)`,
            }}
          />
        </>
      )}

      {/* Raios */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 motion-safe:animate-[victoryRays_5200ms_linear_infinite]"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 45%, ${theme.color}22 0deg 4deg, transparent 4deg 14deg)`,
          maskImage: "radial-gradient(closest-side, black, transparent 78%)",
          WebkitMaskImage: "radial-gradient(closest-side, black, transparent 78%)",
        }}
      />

      {/* Partículas subindo */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute bottom-0 h-1.5 w-1.5 rounded-full motion-safe:animate-[emberRise_3600ms_linear_infinite]"
          style={{
            left: `${(i * 5.4 + 4) % 100}%`,
            background: theme.color,
            boxShadow: `0 0 10px ${theme.color}`,
            animationDelay: `${(i % 6) * 420}ms`,
            opacity: 0.7,
          }}
        />
      ))}

      <div className="relative px-6 text-center">
        <p
          className="motion-safe:animate-[victoryTitle_900ms_cubic-bezier(0.2,0.9,0.2,1)] text-[13vw] font-black uppercase leading-none tracking-[0.12em] sm:text-[72px]"
          style={{
            color: "#fff",
            textShadow: `0 0 30px ${theme.color}, 0 0 80px ${theme.color}66`,
          }}
        >
          {theme.headline}
        </p>
        <p
          className="mt-4 text-[13px] font-semibold uppercase tracking-[0.28em] motion-safe:animate-fade-in"
          style={{ color: theme.color, animationDelay: "500ms", animationFillMode: "backwards" }}
        >
          {theme.subline}
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/40">
          toque para continuar
        </p>
      </div>
    </div>
  );
}
