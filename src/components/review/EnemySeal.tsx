// Selo inimigo — cosmético do slot `enemy_seal`.
// Marca temática que aparece sobre a carta inimiga durante a revisão.
import type { EnemySealTheme } from "@/lib/eclipse-cosmetics";

export function EnemySealSigil({ theme }: { theme: EnemySealTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 grid place-items-center">
      <svg
        viewBox="0 0 200 200"
        className="h-[260px] w-[260px] opacity-[0.22] motion-safe:animate-[sealSpin_28000ms_linear_infinite]"
        style={{ filter: `drop-shadow(0 0 12px ${theme.color})` }}
      >
        <circle cx="100" cy="100" r="86" fill="none" stroke={theme.color} strokeWidth="1.2" />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={theme.color}
          strokeWidth="0.8"
          strokeDasharray="6 10"
        />
        <circle cx="100" cy="100" r="46" fill="none" stroke={theme.color} strokeWidth="1.6" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 46}
              y1={100 + Math.sin(a) * 46}
              x2={100 + Math.cos(a) * 86}
              y2={100 + Math.sin(a) * 86}
              stroke={theme.color}
              strokeWidth="0.9"
            />
          );
        })}
        <path
          d="M100 60 L124 100 L100 140 L76 100 Z"
          fill="none"
          stroke={theme.color}
          strokeWidth="1.6"
        />
      </svg>
    </div>
  );
}

export function EnemySealStamp({
  theme,
  tone,
}: {
  theme: EnemySealTheme;
  tone: "hit" | "miss";
}) {
  const label = tone === "hit" ? theme.hitLabel : theme.missLabel;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
    >
      <div
        className="motion-safe:animate-[sealStamp_760ms_cubic-bezier(0.2,0.9,0.2,1)_forwards] rounded-xl border-2 px-6 py-2 text-[15px] font-black uppercase tracking-[0.32em]"
        style={{
          color: tone === "hit" ? "#ffe6c7" : theme.color,
          borderColor: tone === "hit" ? "#ffe6c7" : theme.color,
          background: `${theme.accent}cc`,
          boxShadow: `0 0 40px ${theme.color}66`,
          textShadow: `0 0 18px ${theme.color}`,
        }}
      >
        {label}
      </div>
    </div>
  );
}
