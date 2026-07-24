// Renders a per-aura animated ring around a circular avatar/child.
// Dispatches on AuraProfile.kind to produce distinct visuals for each aura
// sold in the shop (nebula, phoenix, void, solar, glacier, bloom, hologram,
// neon, abyss, cosmic, plus the classic spin/hueshift ones).
import type { AuraProfile } from "@/lib/aura";

type Props = {
  size: number;
  profile: AuraProfile | null;
  children: React.ReactNode;
};

export function AuraRing({ size, profile, children }: Props) {
  if (!profile) {
    return (
      <span
        aria-hidden
        className="relative inline-grid shrink-0 place-items-center"
        style={{ width: size, height: size }}
      >
        {children}
      </span>
    );
  }

  const ring = profile.ring;
  const sec = profile.secondary ?? profile.ring;
  const speedClass =
    profile.speed === "fast"
      ? "aura-spin-fast"
      : profile.speed === "slow"
        ? "aura-spin-slow"
        : "cosmetic-ring-spin";

  return (
    <span
      aria-hidden
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      {/* Ambient soft halo */}
      <span
        className="cosmetic-glow-pulse pointer-events-none absolute -inset-1 rounded-full"
        style={{
          background: `radial-gradient(circle, ${ring}55, transparent 65%)`,
          filter: "blur(6px)",
        }}
      />

      {/* Kind-specific rings */}
      {profile.kind === "spin" && (
        <span
          className={`${speedClass} absolute inset-0 rounded-full`}
          style={{
            background: `conic-gradient(from 0deg, ${ring}, transparent 35%, ${ring} 65%, transparent 100%)`,
            filter: "blur(0.4px)",
          }}
        />
      )}

      {profile.kind === "dual" && (
        <>
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 40%, ${ring} 80%, transparent 100%)`,
            }}
          />
          <span
            className="aura-spin-reverse absolute inset-[3px] rounded-full"
            style={{
              background: `conic-gradient(from 180deg, ${sec}, transparent 45%, ${sec} 90%, transparent 100%)`,
              opacity: 0.85,
            }}
          />
        </>
      )}

      {profile.kind === "hueshift" && (
        <span
          className="aura-hueshift absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${ring}, ${sec}, #f472b6, #22d3ee, ${ring})`,
          }}
        />
      )}

      {profile.kind === "flicker" && (
        <>
          <span
            className="aura-flicker absolute -inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ring}dd, ${sec}66 45%, transparent 70%)`,
              filter: "blur(3px)",
            }}
          />
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 30%, ${sec} 60%, transparent 100%)`,
            }}
          />
        </>
      )}

      {profile.kind === "pulseRay" && (
        <>
          <span
            className="aura-ray absolute -inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle, transparent 40%, ${ring}66 55%, transparent 72%)`,
              filter: "blur(1px)",
            }}
          />
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, ${sec}, ${ring}, ${sec}, ${ring})`,
              opacity: 0.9,
            }}
          />
        </>
      )}

      {profile.kind === "crystal" && (
        <>
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 25%, ${sec} 50%, transparent 75%, ${ring} 100%)`,
            }}
          />
          <span
            className="aura-crystal absolute -inset-0.5 rounded-full"
            style={{
              boxShadow: `0 0 12px ${ring}88, inset 0 0 8px ${sec}66`,
            }}
          />
        </>
      )}

      {profile.kind === "sparkle" && (
        <>
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 55%, ${ring} 100%)`,
            }}
          />
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="aura-orbit pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: sec,
                boxShadow: `0 0 6px ${sec}`,
                animationDelay: `${i * -1}s`,
                ["--r" as string]: `${size / 2}px`,
              }}
            />
          ))}
        </>
      )}

      {profile.kind === "glitch" && (
        <>
          <span
            className={`${speedClass} aura-glitch absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 45%, ${sec} 90%, transparent 100%)`,
              mixBlendMode: "screen",
            }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 10px ${ring}, 0 0 18px ${sec}88`,
            }}
          />
        </>
      )}

      {profile.kind === "cosmic" && (
        <>
          <span
            className={`${speedClass} absolute inset-0 rounded-full`}
            style={{
              background: `conic-gradient(from 0deg, ${ring}, ${sec}, #f472b6, ${ring})`,
            }}
          />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="aura-orbit-slow pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{
                boxShadow: `0 0 6px #fff`,
                animationDelay: `${i * -2}s`,
                ["--r" as string]: `${size / 2 + 2}px`,
              }}
            />
          ))}
        </>
      )}

      {children}
    </span>
  );
}
