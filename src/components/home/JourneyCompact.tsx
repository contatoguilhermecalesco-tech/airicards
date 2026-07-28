// Card compacto da Jornada do Primeiro Bundle na Home. Ao clicar, abre um
// modal com o detalhe completo (reutilizando FirstBundleJourney).
import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { useJourney, journeyTotals } from "@/lib/daily-challenges";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FirstBundleJourney } from "@/components/home/FirstBundleJourney";

export function JourneyCompact() {
  const journey = useJourney();
  const [open, setOpen] = useState(false);

  if (!journey.loaded || journey.hasFirstBundle) return null;

  const totals = journeyTotals();
  const percent = Math.round((totals.earned / Math.max(1, totals.total)) * 100);

  return (
    <>
      <section
        className="animate-fade-in mt-6 lg:col-span-8 lg:col-start-1 lg:row-start-3 lg:mt-0"
        style={{ animationDelay: "90ms", animationFillMode: "backwards" }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] backdrop-blur-md transition hover:border-white/[0.12] hover:bg-white/[0.035]"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
            <Sparkles className="h-4 w-4 text-violet-200/90" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                Jornada
              </span>
              <span className="text-[10px] text-white/35">
                {totals.completed}/{totals.count}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">
              Provações do primeiro bundle
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400/80 to-violet-300/80 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[11px] text-white/50">até</span>
            <span className="text-sm font-semibold text-white/85">
              {totals.total} ✦
            </span>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70"
            strokeWidth={2.25}
          />
        </button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden border-white/10 bg-transparent p-0 shadow-2xl">
          <DialogTitle className="sr-only">Jornada do primeiro bundle</DialogTitle>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <FirstBundleJourney />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
