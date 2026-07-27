import type { CompanionProfile } from "@/lib/companion-assets";

/**
 * Renders a companion character with multi-frame pose animation when available.
 * Igris cycles through: idle stance → reverent bow → sword-draw with violet slash burst.
 * Single-frame companions (Raposa Guardiã) fall back to the classic idle float.
 */
export function CompanionRender({ companion }: { companion: CompanionProfile }) {
  const frames = companion.frames && companion.frames.length > 1 ? companion.frames : null;

  if (!frames) {
    return (
      <img
        src={companion.src}
        alt={companion.name}
        className="companion-idle relative h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(192,132,252,0.55)]"
        loading="lazy"
      />
    );
  }

  const frameClass = ["companion-frame-a", "companion-frame-b", "companion-frame-c"];
  return (
    <div className="relative h-full w-full">
      {frames.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={i === 0 ? companion.name : ""}
          aria-hidden={i !== 0}
          className={`${frameClass[i] ?? "companion-frame-a"} companion-idle absolute inset-0 h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(168,85,247,0.55)]`}
          loading="lazy"
        />
      ))}
      {companion.flash && (
        <span
          aria-hidden
          className="companion-slash-flash pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 55% 40%, rgba(216,180,254,0.85), rgba(168,85,247,0.35) 30%, transparent 65%)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
