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
  render,
}: {
  icon?: IconType;
  label: string;
  value: string;
  color: string;
  /** Optional highlight ring — used for premium chips like Arlys */
  accent?: boolean;
  /** Optional custom visual (e.g. a RankEmblem SVG) rendered inside the icon tile */
  render?: React.ReactNode;
}) {
  return (
    <div
      className="group relative flex flex-col gap-1.5 rounded-xl p-2 shadow-lg transition-colors"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${accent ? `${color}44` : "rgba(255,255,255,0.10)"}`,
      }}
    >
      {/* Icon tile — compact, fixed height */}
      <div
        className="relative flex h-11 w-full items-center justify-center overflow-hidden rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${color}2e 0%, ${color}10 100%)`,
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.10)",
        }}
      >
        {/* Ambient inner glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 blur-md"
          style={{ background: `${color}1a` }}
        />
        {render ? (
          <div className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {render}
          </div>
        ) : Icon ? (
          <Icon
            className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:scale-105"
            strokeWidth={2}
            // @ts-expect-error — allow inline style for filter/color
            style={{ color, filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        ) : null}
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
