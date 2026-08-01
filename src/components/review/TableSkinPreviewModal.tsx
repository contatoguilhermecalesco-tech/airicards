import { useEffect, useState } from "react";
import { X, Eye } from "lucide-react";
import type { TableSkin } from "@/lib/table-skins";
import { TableSkinAmbient, TableSkinFlash } from "@/components/review/TableSkinAmbient";
import { TableSkinCardLayer } from "@/components/review/TableSkinCardLayer";
import { TableSkinImpact } from "@/components/review/TableSkinImpact";

/**
 * Prévia da Mesa de Revisão: mostra o ambiente, a carta e o feedback de
 * acerto/erro sem precisar entrar numa sessão real.
 */
export function TableSkinPreviewModal({
  skin,
  open,
  onClose,
}: {
  skin: TableSkin;
  open: boolean;
  onClose: () => void;
}) {
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const [seed, setSeed] = useState(0);

  function simulate(tone: "hit" | "miss") {
    setSeed((s) => s + 1);
    setFlash(tone);
  }

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Fechar prévia"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-background shadow-2xl">
        {/* Palco da prévia */}
        <div className="relative h-[380px] overflow-hidden">
          <div className="absolute inset-0 scale-100">
            <TableSkinAmbient skin={skin} />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 p-8 text-center">
              <TableSkinCardLayer skin={skin} />
              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                  Prévia
                </p>
                <p className="mt-3 text-xl font-semibold leading-snug text-white">
                  it must've felt like a knife in your heart
                </p>
                <p className="mt-3 text-[13px] text-white/55">
                  Digite a tradução…
                </p>
              </div>
            </div>
          </div>
          {flash && (
            <>
              <TableSkinFlash skin={skin} tone={flash} />
              <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute left-1/2 top-1/2 h-screen w-screen -translate-x-1/2 -translate-y-1/2 scale-[0.34]">
                <TableSkinImpact skin={skin} tone={flash} seed={seed} />
              </div></div>
            </>
          )}
        </div>

        {/* Controles */}
        <div className="relative z-20 border-t border-white/10 bg-background/95 p-4">
          <p className="text-sm font-semibold text-foreground">{skin.name}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{skin.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => simulate("hit")}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
            >
              Simular acerto
            </button>
            <button
              onClick={() => simulate("miss")}
              className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[12px] font-semibold text-red-200 transition hover:bg-red-400/20"
            >
              Simular erro
            </button>
            <button
              onClick={onClose}
              className="ml-auto rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-foreground/80 transition hover:bg-white/[0.1]"
            >
              Fechar
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-30 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/** Botão compacto "Ver prévia" para usar nos cards de mesa. */
export function TableSkinPreviewButton({ skin }: { skin: TableSkin }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/[0.1]"
      >
        <Eye className="h-3 w-3" strokeWidth={2.5} />
        Ver prévia
      </button>
      <TableSkinPreviewModal skin={skin} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
