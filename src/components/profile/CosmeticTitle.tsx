// Título animado — cosmético do slot `title`.
import type { TitleTheme } from "@/lib/eclipse-cosmetics";

export function CosmeticTitle({ theme }: { theme: TitleTheme }) {
  return (
    <span
      className="inline-block bg-clip-text text-[12px] font-bold uppercase tracking-[0.18em] text-transparent motion-safe:animate-[titleShift_5200ms_linear_infinite]"
      style={{
        backgroundImage: theme.gradient,
        backgroundSize: "220% 100%",
      }}
      title={theme.name}
    >
      {theme.text}
    </span>
  );
}
