import React from "react";

/** Custom Arlys crystal icon — faceted diamond with inner sparkle */
export function ArlysIcon({ className, strokeWidth: _sw }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="arlys-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="45%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="arlys-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Diamond body */}
      <path
        d="M12 2.5 L20.5 9.2 L12 21.5 L3.5 9.2 Z"
        fill="url(#arlys-body)"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Facet lines */}
      <path
        d="M3.5 9.2 H20.5 M12 2.5 L8.5 9.2 L12 21.5 M12 2.5 L15.5 9.2 L12 21.5"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Highlight */}
      <path d="M12 3.4 L15 9 L12 9 Z" fill="url(#arlys-shine)" />
      {/* Sparkle */}
      <circle cx="9.2" cy="6.2" r="0.7" fill="#ffffff" opacity="0.95" />
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
      className="group relative flex items-center gap-2 overflow-hidden rounded-xl px-2.5 py-2 transition"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
        border: `1px solid ${accent ? `${color}55` : "rgba(255,255,255,0.06)"}`,
        boxShadow: accent
          ? `inset 0 0 0 1px ${color}10, 0 6px 18px -12px ${color}80`
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Ambient glow */}
      <span
        className="pointer-events-none absolute -left-4 -top-4 h-14 w-14 rounded-full opacity-40 blur-2xl transition group-hover:opacity-60"
        style={{ background: color }}
        aria-hidden
      />
      <span
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{
          background: `radial-gradient(120% 120% at 30% 20%, ${color}40 0%, ${color}18 55%, transparent 100%)`,
          border: `1px solid ${color}35`,
          color,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 10px -6px ${color}90`,
        }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <div className="relative min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.09em] text-white/55">
          {label}
        </p>
        <p className="truncate text-[13px] font-semibold leading-tight text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
