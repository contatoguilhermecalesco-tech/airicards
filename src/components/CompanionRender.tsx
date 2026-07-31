import type { CompanionProfile } from "@/lib/companion-assets";

/**
 * Renders a companion character. When `frames` are provided, plays a real
 * frame-by-frame sequence (kneeling → rising → standing → sword-draw → back to rest)
 * with near-step transitions, plus an optional violet slash burst on the final pose.
 * Single-frame companions fall back to the classic idle float.
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

  // Map each frame index to a dedicated keyframe utility so the sequence keeps
  // hard timing (real animation, not a crossfade). Supports up to 5 frames.
  const frameClass = [
    "companion-seq-0",
    "companion-seq-1",
    "companion-seq-2",
    "companion-seq-3",
    "companion-seq-4",
  ];

  return (
    <div className="relative h-full w-full">
      {frames.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={i === 0 ? companion.name : ""}
          aria-hidden={i !== 0}
          className={`${frameClass[i] ?? "companion-seq-0"} absolute inset-0 h-full w-full object-contain`}
          style={{ filter: `drop-shadow(0 8px 20px ${companion.glow}8c)` }}
          loading="lazy"
        />
      ))}
      {companion.flash && (
        <span
          aria-hidden
          className="companion-slash-flash pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 55% 45%, ${companion.glow}e6, ${companion.glow}66 30%, transparent 65%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
