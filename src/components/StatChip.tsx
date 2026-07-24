import React from "react";

/** Custom Arlys crystal — V-facet diamond, matches the profile chip system */
export function ArlysIcon({ className, strokeWidth: _sw }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="arlys-outer" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="arlys-core" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Outer diamond silhouette */}
      <path
        d="M12 2 L4.5 12 L12 22 L19.5 12 Z"
        fill="url(#arlys-outer)"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Inner V-facet core */}
      <path d="M12 2 L9 12 L12 22 L15 12 Z" fill="url(#arlys-core)" />
      {/* Top specular highlight */}
      <path d="M12 3.2 L10.2 11 L12 11 Z" fill="#ffffff" fillOpacity="0.55" />
    </svg>
  );
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export function StatChip({
  icon: Icon,
  label,
  value,
  color,
  accent,
}: {
  icon: IconType;
  label: string;
  value: string;
  color: string;
  /** Optional highlight ring — used for premium chips like Arlys */
  accent?: boolean;
}) {
  return (
    <div
      className="group relative flex flex-col gap-2 rounded-xl p-1.5 shadow-xl transition-colors"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${accent ? `${color}44` : "rgba(255,255,255,0.10)"}`,
      }}
    >
      {/* Icon tile */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}33 0%, ${color}14 100%)`,
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.10)",
        }}
      >
        {/* Ambient inner glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 blur-md"
          style={{ background: `${color}1a` }}
        />
        <Icon
          className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-105"
          strokeWidth={2}
          // @ts-expect-error — allow inline style for filter/color
          style={{ color, filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </div>

      {/* Text */}
      <div className="space-y-0.5 px-0.5">
        <p
          className="truncate text-[8px] font-bold uppercase leading-none tracking-widest"
          style={{ color: `${color}cc` }}
        >
          {label}
        </p>
        <p className="truncate text-[13px] font-extrabold leading-none text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
